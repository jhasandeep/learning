import { readdirSync } from 'node:fs'
import vm from 'node:vm'
import initSqlJs from 'sql.js'
import { transform } from 'sucrase'
import { describe, expect, it } from 'vitest'
import { MCQ_SETS } from '@/data/mcq'
import { QUESTION_SETS } from '@/data/questions'
import { fixedCode, SPOT_SETS, type SpotBug } from '@/data/spot'
import { diffLines } from '@/lib/diff'
import { readProgress, recordMcqAnswer, recordQuiz, recordSpot, spotXp } from '@/lib/progress'

const files = (dir: string) => readdirSync(dir).filter((f) => f.endsWith('.ts') && f !== 'index.ts' && f !== 'types.ts').map((f) => f.replace(/\.ts$/, '')).sort()
const prose = (t: string) => t.replace(/`[^`\n]+`/g, '')
const balanced = (text: string, label: string) => {
  expect((text.match(/`/g) ?? []).length % 2, `${label}: backticks`).toBe(0)
  expect((prose(text).match(/\*\*/g) ?? []).length % 2, `${label}: **`).toBe(0)
  expect((prose(text).match(/==/g) ?? []).length % 2, `${label}: ==`).toBe(0)
}
const JS_LANGS: Record<string, ('typescript' | 'jsx')[]> = { javascript: [], jsx: ['jsx'], typescript: ['typescript'], tsx: ['typescript', 'jsx'] }
/** Throws if the snippet is not valid syntax (types and JSX are compiled away, then parsed). */
const parse = (code: string, lang: string) => {
  const js = transform(code, { transforms: JS_LANGS[lang], disableESTransforms: true, production: true }).code
  // Wrap in an async function so top-level await parses; drop imports and the `export` keyword first.
  const body = js.replace(/^\s*import\b[^\n]*$/gm, '').replace(/^(\s*)export\s+(default\s+)?/gm, '$1')
  new vm.Script(`(async () => {\n${body}\n})`)
}

describe('multiple-choice quizzes', () => {
  it('has one set per technology, and registers every file', () => {
    expect(MCQ_SETS.map((s) => s.id).sort()).toEqual(QUESTION_SETS.map((s) => s.id).sort())
    expect(MCQ_SETS.map((s) => s.id).sort()).toEqual(files('src/data/mcq'))
  })

  for (const set of MCQ_SETS) {
    describe(set.id, () => {
      it('is well formed', () => {
        expect(set.questions.length).toBeGreaterThanOrEqual(10)
        const ids = set.questions.map((q) => q.id)
        expect(new Set(ids).size, 'unique ids').toBe(ids.length)
        expect(new Set(set.questions.map((q) => q.q)).size, 'unique questions').toBe(ids.length)
        expect(new Set(set.questions.map((q) => q.difficulty)).size, 'mixed difficulty').toBeGreaterThanOrEqual(2)
        for (const q of set.questions) {
          expect(q.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
          expect(q.choices.length, `${q.id}: 3–4 choices`).toBeGreaterThanOrEqual(3)
          expect(q.choices.length, `${q.id}: 3–4 choices`).toBeLessThanOrEqual(4)
          expect(new Set(q.choices.map((c) => c.trim().toLowerCase())).size, `${q.id}: distinct choices`).toBe(q.choices.length)
          expect(q.choices.every((c) => c.trim().length > 0), `${q.id}: empty choice`).toBe(true)
          expect(q.explain.length, `${q.id}: explanation`).toBeGreaterThan(20)
          for (const t of [q.q, q.explain, ...q.choices]) balanced(t, q.id)
        }
      })

      it('does not give answers away by length', () => {
        // The correct choice is written first; it should not usually be the longest (or shortest) one.
        const longest = set.questions.filter((q) => q.choices[0].length > Math.max(...q.choices.slice(1).map((c) => c.length))).length
        const shortest = set.questions.filter((q) => q.choices[0].length < Math.min(...q.choices.slice(1).map((c) => c.length))).length
        expect(longest, 'correct answer is the longest').toBeLessThanOrEqual(set.questions.length / 2)
        expect(shortest, 'correct answer is the shortest').toBeLessThanOrEqual(set.questions.length / 2)
      })

      it('has snippets that parse', () => {
        for (const q of set.questions) if (q.code && JS_LANGS[q.code.lang]) expect(() => parse(q.code!.code, q.code!.lang), q.id).not.toThrow()
      })
    })
  }
})

/** 1-based lines of `before` that the fix deletes, or next to where it inserts. */
function touchedLines(before: string, after: string): Set<number> {
  const touched = new Set<number>()
  let line = 0
  for (const d of diffLines(before, after)) {
    if (d.type === 'same') line++
    else if (d.type === 'del') touched.add(++line)
    else {
      touched.add(line)
      touched.add(line + 1)
    }
  }
  return touched
}

describe('find the mistake', () => {
  it('has one set per technology, and registers every file', () => {
    expect(SPOT_SETS.map((s) => s.id).sort()).toEqual(QUESTION_SETS.map((s) => s.id).sort())
    expect(SPOT_SETS.map((s) => s.id).sort()).toEqual(files('src/data/spot'))
  })

  for (const set of SPOT_SETS) {
    describe(set.id, () => {
      it('is well formed', () => {
        expect(set.bugs.length).toBeGreaterThanOrEqual(5)
        const ids = set.bugs.map((b) => b.id)
        expect(new Set(ids).size, 'unique ids').toBe(ids.length)
        expect(new Set(set.bugs.map((b) => b.difficulty)).size, 'mixed difficulty').toBeGreaterThanOrEqual(2)
        for (const b of set.bugs) {
          const lines = b.code.split('\n')
          expect(b.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
          expect((b.fix === undefined) !== (b.fixed === undefined), `${b.id}: exactly one of fix / fixed`).toBe(true)
          for (const n of [b.line, ...(b.also ?? [])]) {
            expect(n, `${b.id}: line ${n} in range`).toBeGreaterThanOrEqual(1)
            expect(n, `${b.id}: line ${n} in range`).toBeLessThanOrEqual(lines.length)
            expect(lines[n - 1].trim(), `${b.id}: line ${n} is blank`).not.toBe('')
          }
          expect(fixedCode(b), `${b.id}: the fix changes something`).not.toBe(b.code)
          expect(touchedLines(b.code, fixedCode(b)).has(b.line), `${b.id}: the fix touches line ${b.line}`).toBe(true)
          for (const t of [b.title, b.task, b.explain]) balanced(t, b.id)
        }
      })

      const code = set.bugs.filter((b) => JS_LANGS[b.lang])
      if (code.length) {
        it('has buggy and fixed code that parses', () => {
          for (const b of code) {
            expect(() => parse(b.code, b.lang), `${b.id} (buggy)`).not.toThrow()
            expect(() => parse(fixedCode(b), b.lang), `${b.id} (fixed)`).not.toThrow()
          }
        })
      }

      const sql = set.bugs.filter((b) => b.lang === 'sql')
      if (sql.length) {
        it('has fixed SQL that is valid syntax', async () => {
          const SQL = await initSqlJs()
          const db = new SQL.Database()
          for (const b of sql) {
            // No tables exist, so "no such table" is fine; a syntax error is not.
            try {
              db.exec(fixedCode(b))
            } catch (e) {
              expect(String(e), b.id).not.toMatch(/syntax error/i)
            }
          }
          db.close()
        })
      }
    })
  }

  // Run the algorithm bugs: the fix must pass, and the bug must really fail.
  const run = (b: SpotBug, source: string, call: string) => vm.runInNewContext(`${source}\n;JSON.stringify(${call})`, { Map, Math, JSON }, { timeout: 2000 })
  const CHECKS: Record<string, [string, unknown]> = {
    'dsa/binary-search': ['search([1, 3, 5, 7], 7)', 3],
    'dsa/two-sum': ['twoSum([3, 2, 4], 6)', [1, 2]],
    'dsa/parentheses': ['isValid("((")', false],
    'dsa/sliding-window': ['longest("abba")', 2],
    'dsa/reverse-list': ['(() => { let h = null; for (const v of [3, 2, 1]) h = { v, next: h }; const out = []; for (let n = reverse(h); n; n = n.next) out.push(n.v); return out })()', [3, 2, 1]],
    'javascript/sort-numbers': ['topScores([5, 100, 20])', [100, 20, 5]],
  }
  for (const [key, [call, want]] of Object.entries(CHECKS)) {
    it(`${key}: the fix works and the bug is real`, () => {
      const [setId, id] = key.split('/')
      const b = SPOT_SETS.find((s) => s.id === setId)!.bugs.find((x) => x.id === id)!
      const quiet = (s: string) => s.replace(/console\.log\([^\n]*\)/g, '')
      expect(JSON.parse(run(b, quiet(fixedCode(b)), call))).toEqual(want)
      expect(JSON.parse(run(b, quiet(b.code), call))).not.toEqual(want)
    })
  }
})

describe('quiz and bug-hunt progress', () => {
  it('pays MCQ XP once per question, and only for a correct answer', () => {
    expect(recordMcqAnswer('t/q1', false)).toBe(0)
    expect(recordMcqAnswer('t/q1', true)).toBe(2)
    expect(recordMcqAnswer('t/q1', true)).toBe(0)
    expect(readProgress().mcq['t/q1']).toBeTruthy()
  })

  it('keeps the best quiz by percentage', () => {
    expect(recordQuiz('t', 6, 10)).toBe(true)
    expect(recordQuiz('t', 5, 10)).toBe(false)
    expect(recordQuiz('t', 9, 10)).toBe(true)
    expect(readProgress().quizzes.t).toMatchObject({ score: 9, total: 10 })
  })

  it('pays find-the-mistake XP by misses, once', () => {
    expect([spotXp(0, false), spotXp(1, false), spotXp(4, false), spotXp(0, true)]).toEqual([15, 10, 5, 0])
    expect(recordSpot('t/b1', 1, false)).toBe(10)
    expect(recordSpot('t/b1', 0, false)).toBe(0)
    expect(recordSpot('t/b2', 3, true)).toBe(0)
    expect(readProgress().spot['t/b2']).toMatchObject({ revealed: true, misses: 3 })
  })
})
