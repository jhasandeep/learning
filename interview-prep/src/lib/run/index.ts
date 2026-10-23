import type { Language, ServerLang } from '@/data/languages'
import type { RunResult } from '@/lib/exec/types'
import type { MongoCheckResult, RunHandlers, RunSummary } from './protocol'
import { runR, stopR } from './r'
import { runWandbox, WANDBOX_LANGUAGE } from './wandbox'
import { WorkerRunner } from './worker-runner'

// One entry point for the compiler UI: picks the right engine per language.

const js = new WorkerRunner(() => new Worker(new URL('./js.worker.ts', import.meta.url), { type: 'module' }), 5_000)
// Python's worker is a static file in public/runners (see the note there).
const PYTHON_WORKER = '/runners/python-worker.mjs'
const python = new WorkerRunner(() => new Worker(PYTHON_WORKER, { type: 'module' }), 15_000)
const sql = new WorkerRunner(() => new Worker(new URL('./sql.worker.ts', import.meta.url), { type: 'module' }), 10_000)

const mongo = new WorkerRunner(() => new Worker(new URL('./mongo.worker.ts', import.meta.url), { type: 'module' }), 10_000)
// Challenge checks get their own worker so a runaway answer cannot kill the playground's database.
const mongoCheck = new WorkerRunner(() => new Worker(new URL('./mongo.worker.ts', import.meta.url), { type: 'module' }), 10_000)

let serverAbort: AbortController | null = null

async function transpileTs(code: string): Promise<string> {
  const { transform } = await import('sucrase')
  return transform(code, { transforms: ['typescript'], disableESTransforms: true }).code
}

interface ServerStatus { configured: boolean; backend?: string }
let serverStatus: Promise<ServerStatus> | null = null

/** What /api/run is set up with (Piston, Judge0, local...). Asked once per page load. */
function getServerStatus(signal: AbortSignal): Promise<ServerStatus> {
  serverStatus ??= fetch('/api/run', { signal })
    .then((r) => r.json() as Promise<ServerStatus>)
    .catch(() => {
      serverStatus = null // maybe just offline: ask again next time
      return { configured: false }
    })
  return serverStatus
}

/**
 * Compiled languages. A real runner you set up (Piston or Judge0, via RUNNER_BACKEND) is used first because it is the
 * fastest. Without one, the public Wandbox API is called straight from the browser; the dev-only "local" runner
 * (no sandbox) is just the last resort.
 */
async function runCompiled(language: ServerLang, code: string, stdin: string, handlers: RunHandlers): Promise<RunSummary> {
  serverAbort = new AbortController()
  const signal = serverAbort.signal
  try {
    const server = await getServerStatus(signal)
    if (server.configured && server.backend !== 'local') return await runOnServer(language, code, stdin, handlers, signal)
    let reason = `${language} needs a server runner, and none is configured. See the README section “Running compiled languages”.`
    if (WANDBOX_LANGUAGE[language]) {
      const online = await runWandbox(language, code, stdin, handlers, signal)
      if ('summary' in online) return online.summary
      reason = online.unavailable
    }
    if (server.configured) return await runOnServer(language, code, stdin, handlers, signal)
    handlers.onOutput('system', `${reason}\nNo server runner is configured either, so this language cannot run right now. Check your connection and try again.\n`)
    return { exitCode: null, ms: 0, signal: null }
  } finally {
    serverAbort = null
  }
}

async function runOnServer(language: ServerLang, code: string, stdin: string, handlers: RunHandlers, abort: AbortSignal): Promise<RunSummary> {
  handlers.onLoading?.('Compiling and running on the server…')
  try {
    const res = await fetch('/api/run', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ language, code, stdin }),
      signal: abort,
    })
    const data = (await res.json()) as RunResult & { error?: string }
    if (!res.ok || data.error) {
      handlers.onOutput('system', `${data.error ?? `Server error (HTTP ${res.status})`}\n`)
      return { exitCode: null, ms: 0, signal: null }
    }
    if (data.compileOutput) handlers.onOutput('stderr', data.compileOutput.endsWith('\n') ? data.compileOutput : `${data.compileOutput}\n`)
    if (data.stdout) handlers.onOutput('stdout', data.stdout)
    if (data.stderr) handlers.onOutput('stderr', data.stderr)
    return { exitCode: data.exitCode, ms: data.timeMs, signal: data.signal === 'TIMEOUT' ? 'TIMEOUT' : null }
  } catch (err) {
    if (abort.aborted) return { exitCode: null, ms: 0, signal: 'STOPPED' }
    handlers.onOutput('system', `Could not reach the code runner: ${err instanceof Error ? err.message : String(err)}\n`)
    return { exitCode: null, ms: 0, signal: null }
  }
}

export async function runCode(lang: Language, code: string, stdin: string, handlers: RunHandlers): Promise<RunSummary> {
  switch (lang.runtime) {
    case 'javascript':
      return js.run({ code, stdin }, handlers)
    case 'typescript': {
      let compiled: string
      try {
        compiled = await transpileTs(code)
      } catch (err) {
        handlers.onOutput('stderr', `TypeScript: ${err instanceof Error ? err.message : String(err)}\n`)
        return { exitCode: 1, ms: 0, signal: null }
      }
      return js.run({ code: compiled, stdin }, handlers)
    }
    case 'python':
      return python.run({ code, stdin }, handlers)
    case 'sql':
      return sql.run({ code, stdin: '' }, handlers)
    case 'mongodb':
      return mongo.run({ code, stdin: '' }, handlers)
    case 'r':
      return runR(code, handlers)
    case 'web':
      throw new Error('HTML runs in the preview iframe, not through runCode')
    default:
      return runCompiled(lang.runtime, code, stdin, handlers)
  }
}

export function resetSqlDatabase(handlers: RunHandlers): Promise<RunSummary> {
  return sql.run({ code: '', stdin: '', action: 'reset' }, handlers)
}

export function resetMongoDatabase(handlers: RunHandlers): Promise<RunSummary> {
  return mongo.run({ code: '', stdin: '', action: 'reset' }, handlers)
}

/** Runs the learner's MongoDB code against a lesson's reference solution. */
export async function checkMongo(code: string, challenge: { solution: string; verify?: string; ordered?: boolean }): Promise<MongoCheckResult> {
  let result: MongoCheckResult = { pass: false, detail: 'The check did not finish.' }
  const summary = await mongoCheck.run({ code, stdin: '', action: 'check', payload: JSON.stringify(challenge) }, { onOutput: () => {}, onCheck: (r) => { result = r } })
  if (summary.signal === 'TIMEOUT') return { pass: false, detail: 'Your code took too long (is there an infinite loop?).' }
  return result
}

export function stopAll() {
  js.stop()
  mongo.stop()
  python.stop()
  sql.stop()
  stopR()
  serverAbort?.abort()
}
