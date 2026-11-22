import { LANGUAGES } from '@/data/languages'
import type { CheckItem, Task } from '@/data/tasks/types'
import { evalRules, harnessLabels, JS_PRELUDE, parseHarness, PY_PRELUDE, sqlMatches } from './tasks'

/** The requirement list shown before the first check. */
export function taskRequirements(task: Task): string[] {
  switch (task.kind) {
    case 'run': return [...harnessLabels(task.harness), ...(task.rules ?? []).map((r) => r.label)]
    case 'rules': return task.rules.map((r) => r.label)
    case 'sql': return ['Your query returns a result', ...(task.expect.columns ? [`Columns are ${task.expect.columns.join(', ')}`] : []), `Returns the right ${task.expect.rows.length} row${task.expect.rows.length === 1 ? '' : 's'}${task.expect.ordered ? ' in the right order' : ''}`]
    case 'mongo': return ['Your answer gives the same result as the expected solution']
  }
}

/** The program that is actually run for a "run" task: your code, then the checks. */
export function buildProgram(language: 'javascript' | 'typescript' | 'python', code: string, harness: string): string {
  return `${code}\n${language === 'python' ? PY_PRELUDE : JS_PRELUDE}\n${harness}\n`
}

/** Checks a task in the browser. Used by the workspace page. */
export async function checkTask(task: Task, code: string): Promise<{ items: CheckItem[]; output: string }> {
  if (task.kind === 'rules') return { items: evalRules(code, task.rules, task.language), output: '' }

  const { runCode, resetSqlDatabase, checkMongo } = await import('./run')

  if (task.kind === 'mongo') {
    const res = await checkMongo(code, { solution: task.solution, verify: task.verify, ordered: task.ordered })
    return { items: [{ label: 'Your answer gives the same result as the expected solution', pass: res.pass, detail: res.pass ? undefined : res.detail }], output: '' }
  }

  const lang = LANGUAGES.find((l) => l.id === task.language)
  if (!lang) return { items: [], output: `Unknown language ${task.language}` }

  if (task.kind === 'sql') {
    let last: { columns: string[]; rows: (string | number | null)[][] } | undefined
    let err = ''
    const grab = (c: string) => runCode(lang, c, '', {
      onOutput: (stream, text) => { if (stream === 'stderr' || stream === 'system') err += text },
      onSql: (found) => {
        for (const it of found) {
          if (it.kind === 'table') last = { columns: it.table.columns, rows: it.table.rows }
          else if (/error/i.test(it.text)) err += `${it.text}\n`
        }
      },
    })
    await resetSqlDatabase({ onOutput: () => {} })
    await grab(code)
    if (task.after && !err) {
      last = undefined
      await grab(task.after)
    }
    const items = sqlMatches(last, task.expect)
    return { items, output: err.trim() }
  }

  let stdout = ''
  let stderr = ''
  await runCode(lang, buildProgram(task.language, code, task.harness), '', {
    onOutput: (stream, text) => { if (stream === 'stderr' || stream === 'system') stderr += text; else stdout += text },
  })
  const { items: ran, rest } = parseHarness(stdout, harnessLabels(task.harness))
  const items = [...ran, ...evalRules(code, task.rules ?? [], task.language)]
  return { items, output: [rest, stderr.trim()].filter(Boolean).join('\n') }
}
