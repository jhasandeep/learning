import type { CheckItem, Rule } from '@/data/tasks/types'

// Pure helpers for task checking: they run in the browser and in the tests.

/** Removes comments so a pattern is not "found" inside one. Good enough for a learning check. */
export function stripComments(code: string, language = 'text'): string {
  if (language === 'html') return code.replace(/<!--[\s\S]*?-->/g, '')
  if (language === 'css') return code.replace(/\/\*[\s\S]*?\*\//g, '')
  if (['javascript', 'typescript', 'jsx', 'tsx'].includes(language)) {
    return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'`\\])\/\/.*$/gm, '$1')
  }
  // python, yaml, Dockerfile, shell, git commands: `#` starts a comment
  return code.replace(/(^|\s)#.*$/gm, '$1')
}

export function evalRules(code: string, rules: Rule[], language = 'text'): CheckItem[] {
  const clean = stripComments(code, language)
  return rules.map((r) => {
    const flags = r.match.flags.includes('g') ? r.match.flags : `${r.match.flags}g`
    const count = (clean.match(new RegExp(r.match.source, flags)) ?? []).length
    const pass = r.absent ? count === 0 : count >= (r.min ?? 1)
    return { label: r.label, pass, detail: pass ? undefined : r.hint }
  })
}

/** Lines printed by a task harness look like `PASS|label` or `FAIL|label|why`. */
export function parseHarness(stdout: string, expectedLabels: string[]): { items: CheckItem[]; rest: string } {
  const seen = new Map<string, CheckItem>()
  const rest: string[] = []
  for (const line of stdout.split('\n')) {
    const m = /^(PASS|FAIL)\|([^|]*)(?:\|(.*))?$/.exec(line)
    if (m) seen.set(m[2], { label: m[2], pass: m[1] === 'PASS', detail: m[3] || undefined })
    else rest.push(line)
  }
  const items = expectedLabels.map((l) => seen.get(l) ?? { label: l, pass: false, detail: 'Not reached: fix the error above first.' })
  return { items, rest: rest.join('\n').trim() }
}

/** The labels a run-task harness reports, in order (read from its check('…') calls). */
export function harnessLabels(harness: string): string[] {
  return [...harness.matchAll(/check(?:Async)?\(\s*(['"`])((?:\\.|(?!\1).)*)\1/g)].map((m) => m[2].replace(/\\(['"`])/g, '$1'))
}

export const JS_PRELUDE = `
async function checkAsync(label, fn) {
  try {
    const r = await fn();
    console.log(r === false ? 'FAIL|' + label : 'PASS|' + label);
  } catch (e) {
    console.log('FAIL|' + label + '|' + (e && e.message ? e.message : e));
  }
}
function check(label, fn) {
  try {
    const r = fn();
    console.log(r === false ? 'FAIL|' + label : 'PASS|' + label);
  } catch (e) {
    console.log('FAIL|' + label + '|' + (e && e.message ? e.message : e));
  }
}
`

export const PY_PRELUDE = `
def check(label, fn):
    try:
        r = fn()
        print(("FAIL|" if r is False else "PASS|") + label)
    except Exception as e:
        print("FAIL|" + label + "|" + str(e))
`

/** Rows from a SQL result compared with the expected rows (numbers and numeric strings compare equal). */
export function sqlMatches(
  actual: { columns: string[]; rows: (string | number | null)[][] } | undefined,
  expect: { columns?: string[]; rows: (string | number | null)[][]; ordered?: boolean },
): CheckItem[] {
  if (!actual) return [{ label: 'Your query returns a result', pass: false, detail: 'Run a SELECT that returns rows.' }]
  const norm = (v: unknown) => (v === null ? 'NULL' : String(v))
  const key = (row: unknown[]) => row.map(norm).join('\u0001')
  const items: CheckItem[] = [{ label: 'Your query returns a result', pass: true }]
  if (expect.columns) {
    const same = expect.columns.length === actual.columns.length && expect.columns.every((c, i) => c.toLowerCase() === actual.columns[i]?.toLowerCase())
    items.push({ label: `Columns are ${expect.columns.join(', ')}`, pass: same, detail: same ? undefined : `You returned: ${actual.columns.join(', ') || '(none)'}` })
  }
  const want = expect.rows.map(key)
  const got = actual.rows.map(key)
  const rowsOk = expect.ordered ? want.length === got.length && want.every((k, i) => k === got[i]) : want.length === got.length && [...want].sort().join('\n') === [...got].sort().join('\n')
  items.push({
    label: `Returns the right ${expect.rows.length} row${expect.rows.length === 1 ? '' : 's'}${expect.ordered ? ' in the right order' : ''}`,
    pass: rowsOk,
    detail: rowsOk ? undefined : `You returned ${actual.rows.length} row${actual.rows.length === 1 ? '' : 's'}.`,
  })
  return items
}

/** RegExp values cannot cross from a server page to a client component, so they travel as `{ __re: [source, flags] }`. */
export function toWire<T>(value: T): T {
  const walk = (v: unknown): unknown => {
    if (v instanceof RegExp) return { __re: [v.source, v.flags] }
    if (Array.isArray(v)) return v.map(walk)
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]))
    return v
  }
  return walk(value) as T
}

export function fromWire<T>(value: T): T {
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk)
    if (v && typeof v === 'object') {
      const re = (v as { __re?: [string, string] }).__re
      if (re) return new RegExp(re[0], re[1])
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]))
    }
    return v
  }
  return walk(value) as T
}
