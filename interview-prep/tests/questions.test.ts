import { execFileSync } from 'node:child_process'
import vm from 'node:vm'
import initSqlJs from 'sql.js'
import { transform } from 'sucrase'
import { describe, expect, it } from 'vitest'
import type { Question, QuestionSet } from '@/data/questions/types'

// Every set file in src/data/questions (so a new file is checked as soon as it exists).
const modules = import.meta.glob<Record<string, unknown>>('../src/data/questions/*.ts', { eager: true })
const SETS = Object.entries(modules).flatMap(([file, mod]) =>
  Object.values(mod)
    .filter((v): v is QuestionSet => Boolean(v && typeof v === 'object' && 'questions' in v && Array.isArray((v as QuestionSet).questions)))
    .map((set) => ({ file: file.split('/').pop()!.replace(/\.ts$/, ''), set })),
)

const RUNNABLE = new Set(['javascript', 'typescript', 'sql', 'python'])
const hasPython = (() => {
  try {
    execFileSync('python3', ['--version'])
    return true
  } catch {
    return false
  }
})()

/** Prose with `code` spans removed, so operators like == inside code don't count as markup. */
const prose = (t: string) => t.replace(/`[^`\n]+`/g, '')

async function runJs(code: string): Promise<string[]> {
  const logs: string[] = []
  const log = (...a: unknown[]) => logs.push(a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x) ?? String(x))).join(' '))
  const context = vm.createContext({ console: { log, error: log, warn: log, info: log, table: log }, setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask, structuredClone, Promise, Date, Map, Set, WeakMap, Symbol, Math, JSON, Error, TypeError })
  await vm.runInContext(`(async () => {\n${code}\n})()`, context, { timeout: 3000 })
  await new Promise((r) => setTimeout(r, 300))
  return logs
}

describe('question sets', () => {
  it('found the sets', () => {
    expect(SETS.length).toBeGreaterThan(0)
    expect(new Set(SETS.map((s) => s.set.id)).size).toBe(SETS.length)
  })

  for (const { file, set } of SETS) {
    describe(set.id, () => {
      it('is well formed', () => {
        expect(set.id, 'set id matches the file name').toBe(file)
        expect(set.questions.length).toBeGreaterThanOrEqual(20)
        const ids = set.questions.map((q) => q.id)
        expect(new Set(ids).size, 'unique ids').toBe(ids.length)
        expect(new Set(set.questions.map((q) => q.q)).size, 'no duplicate questions').toBe(ids.length)
        expect(set.questions.filter((q) => q.freq === 3).length, 'at least 5 most-asked').toBeGreaterThanOrEqual(5)
        expect(new Set(set.questions.map((q) => q.difficulty)).size, 'mixed difficulty').toBeGreaterThanOrEqual(2)
        for (const q of set.questions) {
          expect(q.id, q.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
          expect(['Easy', 'Medium', 'Hard']).toContain(q.difficulty)
          expect([1, 2, 3]).toContain(q.freq)
          expect(q.tags.length, `${q.id} tags`).toBeGreaterThan(0)
          expect(q.a.length, `${q.id} answer`).toBeGreaterThan(80)
          if (q.code?.run) expect(RUNNABLE.has(q.code.lang), `${q.id}: ${q.code.lang} is not runnable`).toBe(true)
        }
      })

      it('uses balanced markup', () => {
        for (const q of set.questions) {
          for (const text of [q.q, q.a, q.followUp ?? '']) {
            expect((text.match(/`/g) ?? []).length % 2, `${q.id}: backticks`).toBe(0)
            expect((prose(text).match(/\*\*/g) ?? []).length % 2, `${q.id}: **`).toBe(0)
            expect((prose(text).match(/==/g) ?? []).length % 2, `${q.id}: ==`).toBe(0)
          }
        }
      })

      const runnable = set.questions.filter((q): q is Question & { code: NonNullable<Question['code']> } => Boolean(q.code?.run))
      for (const q of runnable) {
        it(`${q.id}: code runs`, async () => {
          const { lang, code } = q.code
          if (lang === 'javascript' || lang === 'typescript') {
            const js = lang === 'typescript' ? transform(code, { transforms: ['typescript'], disableESTransforms: true }).code : code
            expect((await runJs(js)).length, 'prints something').toBeGreaterThan(0)
          } else if (lang === 'sql') {
            const SQL = await initSqlJs()
            const db = new SQL.Database()
            expect(() => db.exec(code)).not.toThrow()
            db.close()
          } else if (lang === 'python' && hasPython) {
            expect(execFileSync('python3', ['-I', '-c', code], { timeout: 5000 }).toString().length).toBeGreaterThan(0)
          }
        })
      }
    })
  }
})
