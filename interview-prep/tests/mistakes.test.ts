import { readdirSync } from 'node:fs'
import { parseHTML } from 'linkedom'
import initSqlJs from 'sql.js'
import { describe, expect, it } from 'vitest'
import { MISTAKE_SETS, OUTPUT_CHECK, itemChecks } from '@/data/mistakes'
import { QUESTION_SETS_BY_ID } from '@/data/questions'
import { runStep, type HarnessEnv } from '@/lib/learn/harness'

const env: HarnessEnv = { parseHTML: (h) => parseHTML(h) as unknown as { document: Document }, sql: () => initSqlJs() as never }
const files = readdirSync('src/data/mistakes').filter((f) => f.endsWith('.ts') && !['index.ts', 'types.ts'].includes(f)).map((f) => f.replace(/\.ts$/, '')).sort()
const prose = (t: string) => t.replace(/`[^`\n]+`/g, '')

describe('mistakes', () => {
  it('registers every set file and uses a known technology id', () => {
    expect(MISTAKE_SETS.map((s) => s.id).sort()).toEqual(files)
    for (const s of MISTAKE_SETS) expect(QUESTION_SETS_BY_ID[s.id], s.id).toBeTruthy()
  })

  for (const set of MISTAKE_SETS) {
    describe(set.id, () => {
      it('is well formed', () => {
        expect(set.items.length).toBeGreaterThanOrEqual(4)
        const ids = set.items.map((i) => i.id)
        expect(new Set(ids).size, 'unique ids').toBe(ids.length)
        for (const i of set.items) {
          expect(i.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
          expect(i.hints.length, `${i.id}: hints`).toBeGreaterThanOrEqual(2)
          expect(i.tests.length, `${i.id}: checks`).toBeGreaterThanOrEqual(1)
          expect(i.broken, `${i.id}: broken differs from solution`).not.toBe(i.solution)
          for (const t of [i.title, i.task, i.explain, ...i.hints]) {
            expect((t.match(/`/g) ?? []).length % 2, `${i.id}: backticks in ${t.slice(0, 40)}`).toBe(0)
            expect((prose(t).match(/==/g) ?? []).length % 2, `${i.id}: ==`).toBe(0)
            expect((prose(t).match(/\*\*/g) ?? []).length % 2, `${i.id}: **`).toBe(0)
          }
        }
      })

      for (const i of set.items) {
        const run = (code: string) => runStep({ kind: set.kind, code, tests: itemChecks(i), setup: i.setup, jsx: set.jsx, typescript: set.typescript }, env)
        it(`${i.id}: the solution passes every check`, async () => {
          const o = await run(i.solution)
          expect(o.error, 'runs without error').toBeUndefined()
          expect(o.results.filter((r) => !r.pass).map((r) => `${r.name}: ${r.message}`)).toEqual([])
          expect(o.results.filter((r) => r.name !== OUTPUT_CHECK).length).toBeGreaterThan(0)
          if (i.requests || i.demo) {
            expect(o.logs.length, 'prints an output').toBeGreaterThan(0)
            expect(o.logs.join('\n')).not.toMatch(/Error:/)
          }
        })
        it(`${i.id}: the broken code fails`, async () => {
          const o = await run(i.broken)
          expect(Boolean(o.error) || o.results.some((r) => r.name !== OUTPUT_CHECK && !r.pass), 'a check fails').toBe(true)
        })
      }
    })
  }
})
