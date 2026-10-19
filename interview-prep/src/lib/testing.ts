// Shared test-running core. Used by the browser worker, the Node bank
// builder (scripts/build-bank.ts) and the unit tests, so "passes" means the
// same thing everywhere.

export interface TestCase {
  args: unknown[]
  expected: unknown
}

export interface CaseResult {
  index: number
  passed: boolean
  args: string
  expected: string
  actual: string
  error?: string
}

export type RunOutcome =
  | { kind: 'ok'; results: CaseResult[]; logs: string[]; ms: number }
  | { kind: 'compile-error'; message: string; logs: string[] }
  | { kind: 'timeout'; logs: string[] }

export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => deepEqual(v, b[i]))
  }
  const ka = Object.keys(a as object)
  const kb = Object.keys(b as object)
  return ka.length === kb.length &&
    ka.every((k) => deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
}

export function formatValue(v: unknown): string {
  if (v === undefined) return 'undefined'
  if (typeof v === 'number' && !Number.isFinite(v)) return String(v)
  if (typeof v === 'string') return JSON.stringify(v)
  try {
    return JSON.stringify(v, (_k, val) => (val === undefined ? '__undef__' : val)).replaceAll('"__undef__"', 'undefined')
  } catch {
    return String(v)
  }
}

/** Compile user code and pull out the function under test. Throws on syntax errors. */
export function compile(code: string, fnName: string): (...args: unknown[]) => unknown {
  const factory = new Function(`"use strict";\n${code}\n;return typeof ${fnName} === "function" ? ${fnName} : undefined;`)
  const fn = factory()
  if (typeof fn !== 'function') throw new Error(`Function "${fnName}" was not found. Keep its name unchanged.`)
  return fn
}

export function runCases(fn: (...args: unknown[]) => unknown, tests: TestCase[]): CaseResult[] {
  return tests.map((t, index) => {
    const args = structuredClone(t.args)
    const shown = t.args.map(formatValue).join(', ')
    try {
      const actual = fn(...args)
      return { index, passed: deepEqual(actual, t.expected), args: shown, expected: formatValue(t.expected), actual: formatValue(actual) }
    } catch (e) {
      const message = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
      return { index, passed: false, args: shown, expected: formatValue(t.expected), actual: 'threw', error: message }
    }
  })
}
