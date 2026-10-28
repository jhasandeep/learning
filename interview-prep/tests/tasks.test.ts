import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { NOTE_TOPICS_BY_ID } from '@/data/notes'
import { SAMPLE_DB } from '@/lib/run/sample-db'
import { TASK_PATHS } from '@/data/tasks'
import type { RunTask, SqlTask, Task } from '@/data/tasks/types'
import { checkChallenge } from '@/lib/run/mongo-engine'
import { buildProgram } from '@/lib/task-runner'
import { evalRules, harnessLabels, parseHarness, sqlMatches } from '@/lib/tasks'

// The tasks are checked like the Bug Hunt levels: the reference solution must pass
// every requirement and the starter code must not, so no task is trivial or broken.

const require = createRequire(import.meta.url)
const hasPython = spawnSync('python3', ['--version']).status === 0

async function runJs(task: RunTask, code: string): Promise<string> {
  let program = buildProgram(task.language, code, task.harness)
  if (task.language === 'typescript') {
    const { transform } = await import('sucrase')
    program = transform(program, { transforms: ['typescript'], disableESTransforms: true }).code
  }
  const out: string[] = []
  const log = (...a: unknown[]) => out.push(a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '))
  const fakeConsole = { log, info: log, warn: log, error: log, debug: log }
  try {
    await new Function('console', 'require', `return (async () => {\n${program}\n})()`)(fakeConsole, require)
  } catch (e) {
    out.push(`ERROR: ${e instanceof Error ? e.message : String(e)}`)
  }
  return out.join('\n')
}

function runPython(task: RunTask, code: string): string {
  const res = spawnSync('python3', ['-I', '-c', buildProgram('python', code, task.harness)], { encoding: 'utf8', timeout: 15_000 })
  return `${res.stdout}${res.stderr ? `\nERROR: ${res.stderr}` : ''}`
}

async function runSql(task: SqlTask, code: string) {
  const initSqlJs = (await import('sql.js')).default
  const SQL = await initSqlJs({ locateFile: (f: string) => path.join('node_modules/sql.js/dist', f) })
  const db = new SQL.Database()
  db.exec(SAMPLE_DB)
  const lastTable = (src: string) => {
    let last: { columns: string[]; rows: (string | number | null)[][] } | undefined
    for (const stmt of db.iterateStatements(src)) {
      const columns = stmt.getColumnNames()
      if (columns.length > 0) {
        const rows: (string | number | null)[][] = []
        while (stmt.step()) rows.push(stmt.get() as (string | number | null)[])
        last = { columns, rows }
      } else stmt.step()
      stmt.free()
    }
    return last
  }
  try {
    let last = lastTable(code)
    if (task.after) last = lastTable(task.after)
    return sqlMatches(last, task.expect)
  } catch (e) {
    return [{ label: 'runs', pass: false, detail: String(e) }]
  }
}

async function results(task: Task, code: string) {
  switch (task.kind) {
    case 'rules': return evalRules(code, task.rules, task.language)
    case 'sql': return runSql(task, code)
    case 'mongo': {
      const r = await checkChallenge(code, { solution: task.solution, verify: task.verify, ordered: task.ordered })
      return [{ label: 'matches', pass: r.pass, detail: r.detail }]
    }
    case 'run': {
      if (task.language === 'python' && !hasPython) return null
      const out = task.language === 'python' ? runPython(task, code) : await runJs(task, code)
      return [...parseHarness(out, harnessLabels(task.harness)).items.map((i) => ({ ...i, detail: i.detail ?? out.slice(0, 300) })), ...evalRules(code, task.rules ?? [], task.language)]
    }
  }
}

describe('task paths', () => {
  it('has a path for every notes topic', () => {
    expect(TASK_PATHS.map((p) => p.id).sort()).toEqual(Object.keys(NOTE_TOPICS_BY_ID).sort())
  })

  for (const p of TASK_PATHS) {
    describe(p.id, () => {
      it('has 4 to 6 well-formed tasks with unique ids', () => {
        expect(p.tasks.length).toBeGreaterThanOrEqual(4)
        expect(p.tasks.length).toBeLessThanOrEqual(6)
        expect(new Set(p.tasks.map((t) => t.id)).size).toBe(p.tasks.length)
        for (const t of p.tasks) {
          expect(t.steps.length, t.id).toBeGreaterThanOrEqual(2)
          expect(t.hints.length, t.id).toBeGreaterThanOrEqual(2)
          expect(t.learned.length, t.id).toBeGreaterThan(20)
          expect(t.starter.trim().length, t.id).toBeGreaterThan(10)
          // the mini-markup must stay balanced
          for (const text of [t.goal, t.learned, ...t.steps, ...t.hints]) {
            expect((text.match(/`/g) ?? []).length % 2, `${t.id}: ${text}`).toBe(0)
            expect((text.match(/\*\*/g) ?? []).length % 2, `${t.id}: ${text}`).toBe(0)
          }
        }
      })

      for (const t of p.tasks) {
        it(`${t.id}: the solution passes every check and the starter does not`, async () => {
          const good = await results(t, t.solution)
          if (good === null) return // python3 not installed here
          expect(good.length, 'has requirements').toBeGreaterThan(0)
          expect(good.filter((i) => !i.pass).map((i) => `${i.label} ${i.detail ?? ''}`), 'solution failures').toEqual([])
          const bad = await results(t, t.starter)
          expect(bad!.some((i) => !i.pass), 'starter should not already pass').toBe(true)
        }, 30_000)
      }
    })
  }
})
