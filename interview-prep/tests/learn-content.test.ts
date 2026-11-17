import { readdirSync } from 'node:fs'
import { parseHTML } from 'linkedom'
import initSqlJs from 'sql.js'
import { describe, expect, it } from 'vitest'
import { LEARN_TRACKS } from '@/data/learn'
import { QUESTION_SETS } from '@/data/questions'
import { runStep, type HarnessEnv } from '@/lib/learn/harness'

const env: HarnessEnv = { parseHTML: (h) => parseHTML(h) as unknown as { document: Document }, sql: () => initSqlJs() as never }
const files = readdirSync('src/data/learn').filter((f) => f.endsWith('.ts') && f !== 'index.ts' && f !== 'types.ts').map((f) => f.replace(/\.ts$/, '')).sort()
const prose = (t: string) => t.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]+`/g, '')

describe('learn tracks', () => {
  it('has one track per technology, and registers every file', () => {
    expect(LEARN_TRACKS.map((t) => t.id).sort()).toEqual(QUESTION_SETS.map((s) => s.id).sort())
    expect(LEARN_TRACKS.map((t) => t.id).sort()).toEqual(files)
  })

  for (const track of LEARN_TRACKS) {
    describe(track.id, () => {
      it('is well formed', () => {
        expect(track.steps.length).toBeGreaterThanOrEqual(8)
        const ids = track.steps.map((s) => s.id)
        expect(new Set(ids).size, 'unique ids').toBe(ids.length)
        for (const s of track.steps) {
          expect(s.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
          expect(s.hints.length, `${s.id}: hints`).toBeGreaterThanOrEqual(2)
          if ((s.kind ?? track.kind) !== 'testing') expect(s.tests.length, `${s.id}: checks`).toBeGreaterThanOrEqual(2)
          expect(s.solution, `${s.id}: solution differs from starter`).not.toBe(s.starter)
          for (const t of [s.title, s.learn, s.task, ...s.hints]) {
            expect((t.replace(/```[\s\S]*?```/g, '').match(/`/g) ?? []).length % 2, `${s.id}: backticks in ${t.slice(0, 40)}`).toBe(0)
            expect((prose(t).match(/==/g) ?? []).length % 2, `${s.id}: ==`).toBe(0)
          }
        }
      })

      for (const s of track.steps) {
        const input = (code: string) => ({ kind: s.kind ?? track.kind, code, tests: s.tests, setup: s.setup, typescript: track.typescript, jsx: track.jsx })
        it(`${s.id}: the solution passes every check`, async () => {
          const o = await runStep(input(s.solution), env)
          expect(o.error, 'runs without error').toBeUndefined()
          expect(o.results.filter((r) => !r.pass).map((r) => `${r.name}: ${r.message}`)).toEqual([])
          expect(o.results.length).toBeGreaterThan(0)
        })
        it(`${s.id}: the starter does not pass yet`, async () => {
          const o = await runStep(input(s.starter), env)
          expect(Boolean(o.error) || o.results.some((r) => !r.pass), 'some check fails on the starter').toBe(true)
        })
      }
    })
  }
})
