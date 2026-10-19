/// <reference lib="webworker" />
import { compile, runCases, type RunOutcome, type TestCase } from './testing'

interface RunRequest { id: number; code: string; fnName: string; tests: TestCase[] }

const MAX_LOGS = 200

self.onmessage = (event: MessageEvent<RunRequest>) => {
  const { id, code, fnName, tests } = event.data
  const logs: string[] = []
  const capture = (...parts: unknown[]) => {
    if (logs.length < MAX_LOGS) {
      logs.push(parts.map((p) => (typeof p === 'string' ? p : safeStringify(p))).join(' '))
    }
  }
  console.log = capture
  console.info = capture
  console.warn = capture
  console.error = capture

  let outcome: RunOutcome
  try {
    const fn = compile(code, fnName)
    const start = performance.now()
    const results = runCases(fn, tests)
    outcome = { kind: 'ok', results, logs, ms: Math.round(performance.now() - start) }
  } catch (e) {
    outcome = { kind: 'compile-error', message: e instanceof Error ? `${e.name}: ${e.message}` : String(e), logs }
  }
  self.postMessage({ id, outcome })
}

function safeStringify(v: unknown): string {
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}
