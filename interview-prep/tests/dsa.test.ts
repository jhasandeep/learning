import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { ALL_LESSONS } from '@/data/dsa'
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

function results(lang: Lang, lesson: Lesson, code: string) {
  const harness = buildHarness(lang, lesson.practice)
  const stdout = lang === 'python' ? runPy(code, harness) : runJs(code, harness)
  return parseHarness(stdout, harnessLabels(harness))
}

const langs: Lang[] = hasPython ? ['javascript', 'python'] : ['javascript']

describe('DSA course data', () => {
  it('has unique lesson ids and the same function name in every step', () => {
    const ids = ALL_LESSONS.map((x) => `${x.module.id}/${x.lesson.id}`)
    expect(new Set(ids).size).toBe(ids.length)
  })

  for (const { module, lesson } of ALL_LESSONS) {
    describe(`${module.id}/${lesson.id}`, () => {
      it('is complete', () => {
        expect(lesson.steps.length).toBeGreaterThanOrEqual(1)
        expect(lesson.steps[lesson.steps.length - 1].buggy).toBeFalsy()
        expect(lesson.dryRun.frames.length).toBeGreaterThanOrEqual(4)
        expect(lesson.practice.cases.length).toBeGreaterThanOrEqual(5)
        expect(lesson.practice.hints.length).toBeGreaterThanOrEqual(2)
        expect(lesson.mistakes.length).toBeGreaterThanOrEqual(2)
        for (const l of ['python', 'javascript'] as Lang[]) {
          const fn = lesson.practice.fn[l]
          expect(lesson.practice.starter[l]).toContain(fn)
          for (const s of lesson.steps) expect(s.code[l]).toContain(fn)
        }
      })

      for (const lang of langs) {
        lesson.steps.forEach((step, i) => {
          it(`${lang}: step ${i + 1} "${step.title}" ${step.buggy ? 'fails on purpose' : 'passes every case'}`, () => {
            const { items, rest } = results(lang, lesson, step.code[lang])
            if (step.buggy) expect(items.some((x) => !x.pass)).toBe(true)
            else expect(items.filter((x) => !x.pass), rest).toEqual([])
          })
        })

        it(`${lang}: the practice solution passes every case`, () => {
          const { items, rest } = results(lang, lesson, practiceSolution(lesson)[lang])
          expect(items.filter((x) => !x.pass), rest).toEqual([])
        })

        it(`${lang}: the starter does not already pass`, () => {
          const { items } = results(lang, lesson, lesson.practice.starter[lang])
          expect(items.some((x) => !x.pass)).toBe(true)
        })
      }
    })
  }
})
