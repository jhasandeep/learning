import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import type { Lang, Lesson } from '@/data/dsa/types'
import { buildHarness, practiceSolution } from '@/lib/dsa'
import { harnessLabels, parseHarness, JS_PRELUDE, PY_PRELUDE } from '@/lib/tasks'

// Every lesson is run for real: each build step and the practice solution must pass the lesson's tests
// (unless the step is a marked trap), and the starter code must not.

const hasPython = spawnSync('python3', ['--version']).status === 0

function runJs(code: string, harness: string): string {
  const out: string[] = []
  const log = (...a: unknown[]) => out.push(a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '))
  const fake = { log, info: log, warn: log, error: log, debug: log }
  try {
    new Function('console', `${code}\n${JS_PRELUDE}\n${harness}\n`)(fake)
  } catch (e) {
    out.push(`ERROR: ${e instanceof Error ? e.message : String(e)}`)
  }
  return out.join('\n')
}

function runPy(code: string, harness: string): string {
  const res = spawnSync('python3', ['-I', '-c', `${code}\n${PY_PRELUDE}\n${harness}\n`], { encoding: 'utf8', timeout: 15_000 })
  return `${res.stdout}${res.stderr ? `\nERROR: ${res.stderr}` : ''}`
}

export function results(lang: Lang, lesson: Lesson, code: string, only?: number[]) {
  const harness = buildHarness(lang, lesson.practice, only)
  const stdout = lang === 'python' ? runPy(code, harness) : runJs(code, harness)
  return parseHarness(stdout, harnessLabels(harness))
}

export const langs: Lang[] = hasPython ? ['javascript', 'python'] : ['javascript']


type LessonLike = Pick<Lesson, 'id' | 'steps' | 'practice' | 'mistakes' | 'recap'> & { dryRun?: Lesson['dryRun'] }

/** Runs every step and the practice solution of each lesson in every language. */
export function testLessons(label: string, items: { module: string; lesson: LessonLike }[], extra?: (lesson: LessonLike) => void) {
  describe(label, () => {
    it('has unique lesson ids', () => {
      const ids = items.map((x) => `${x.module}/${x.lesson.id}`)
      expect(new Set(ids).size).toBe(ids.length)
    })

    for (const { module, lesson } of items) {
      describe(`${module}/${lesson.id}`, () => {
        it('is complete', () => {
          expect(lesson.steps.length).toBeGreaterThanOrEqual(1)
          expect(lesson.steps[lesson.steps.length - 1].buggy).toBeFalsy()
          expect(lesson.practice.cases.length).toBeGreaterThanOrEqual(5)
          expect(lesson.practice.hints.length).toBeGreaterThanOrEqual(2)
          expect(lesson.mistakes.length).toBeGreaterThanOrEqual(2)
          for (const l of ['python', 'javascript'] as Lang[]) {
            const symbol = (lesson.practice.symbol ?? lesson.practice.fn)[l]
            expect(lesson.practice.starter[l]).toContain(symbol)
            expect(lesson.steps[lesson.steps.length - 1].code[l]).toContain(symbol)
          }
          extra?.(lesson)
        })

        for (const lang of langs) {
          lesson.steps.forEach((step, i) => {
            it(`${lang}: step ${i + 1} "${step.title}" ${step.buggy ? 'fails on purpose' : 'works'}`, () => {
              const { items: found, rest } = results(lang, lesson as Lesson, step.code[lang], step.only)
              if (step.buggy) expect(found.some((x) => !x.pass)).toBe(true)
              else {
                expect(rest).not.toMatch(/ERROR/)
                expect(found.filter((x) => !x.pass), rest).toEqual([])
              }
            })
          })

          it(`${lang}: the practice solution passes every case`, () => {
            const { items: found, rest } = results(lang, lesson as Lesson, practiceSolution(lesson)[lang])
            expect(found.filter((x) => !x.pass), rest).toEqual([])
          })

          it(`${lang}: the starter does not already pass`, () => {
            const { items: found } = results(lang, lesson as Lesson, lesson.practice.starter[lang])
            expect(found.some((x) => !x.pass)).toBe(true)
          })
        }
      })
    }
  })
}
