import type { Language, ServerLang } from '@/data/languages'
import type { RunResult } from '@/lib/exec/types'
import type { RunHandlers, RunSummary } from './protocol'
import { runR, stopR } from './r'
import { WorkerRunner } from './worker-runner'

// One entry point for the compiler UI: picks the right engine per language.

const js = new WorkerRunner(() => new Worker(new URL('./js.worker.ts', import.meta.url), { type: 'module' }), 5_000)
// Python's worker is a static file in public/runners (see the note there).
const PYTHON_WORKER = '/runners/python-worker.mjs'
const python = new WorkerRunner(() => new Worker(PYTHON_WORKER, { type: 'module' }), 15_000)
const sql = new WorkerRunner(() => new Worker(new URL('./sql.worker.ts', import.meta.url), { type: 'module' }), 10_000)

let serverAbort: AbortController | null = null

async function transpileTs(code: string): Promise<string> {
  const { transform } = await import('sucrase')
  return transform(code, { transforms: ['typescript'], disableESTransforms: true }).code
}

/** Shows a runner's result in the output panel. */
function report(data: RunResult, handlers: RunHandlers): RunSummary {
  if (data.compileOutput) handlers.onOutput('stderr', data.compileOutput.endsWith('\n') ? data.compileOutput : `${data.compileOutput}\n`)
  if (data.stdout) handlers.onOutput('stdout', data.stdout)
  if (data.stderr) handlers.onOutput('stderr', data.stderr)
  return { exitCode: data.exitCode, ms: data.timeMs, signal: data.signal === 'TIMEOUT' ? 'TIMEOUT' : null }
}

/**
 * No usable /api/run (a static host, or the server is down): call the free
 * online compilers straight from the browser instead.
 */
async function runInBrowserOnline(language: ServerLang, code: string, stdin: string, handlers: RunHandlers, signal: AbortSignal): Promise<RunSummary> {
  handlers.onLoading?.('Compiling and running online…')
  const { publicBackend, ONLINE_SERVICE } = await import('@/lib/exec/public')
  const backend = publicBackend((input, init) => fetch(input, { ...init, signal }))
  try {
    return report(await backend.run({ language, code, stdin }), handlers)
  } catch (err) {
    if (signal.aborted) return { exitCode: null, ms: 0, signal: 'STOPPED' }
    handlers.onOutput('system', `Could not reach the online compiler (${ONLINE_SERVICE[language]}): ${err instanceof Error ? err.message : String(err)}. Check your internet connection, or set up your own runner (Piston or Judge0, see the README).\n`)
    return { exitCode: null, ms: 0, signal: null }
  }
}

async function runOnServer(language: ServerLang, code: string, stdin: string, handlers: RunHandlers): Promise<RunSummary> {
  const abort = new AbortController()
  serverAbort = abort
  handlers.onLoading?.('Compiling and running…')
  try {
    let res: Response
    let data: (RunResult & { error?: string }) | null = null
    try {
      res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ language, code, stdin }),
        signal: abort.signal,
      })
      data = res.headers.get('content-type')?.includes('json') ? await res.json() : null
    } catch {
      if (abort.signal.aborted) return { exitCode: null, ms: 0, signal: 'STOPPED' }
      return await runInBrowserOnline(language, code, stdin, handlers, abort.signal)
    }
    // No API route here (a static host answers 404/405, or HTML instead of JSON), or the
    // server could not reach its runner (502): the browser calls the online compilers itself.
    if (!data || res.status === 404 || res.status === 405 || res.status === 502) return await runInBrowserOnline(language, code, stdin, handlers, abort.signal)
    if (!res.ok || data.error) {
      handlers.onOutput('system', `${data.error ?? `Server error (HTTP ${res.status})`}\n`)
      return { exitCode: null, ms: 0, signal: null }
    }
    return report(data, handlers)
  } finally {
    if (serverAbort === abort) serverAbort = null
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
    case 'r':
      return runR(code, handlers)
    case 'web':
      throw new Error('HTML runs in the preview iframe, not through runCode')
    default:
      return runOnServer(lang.runtime, code, stdin, handlers)
  }
}

export function resetSqlDatabase(handlers: RunHandlers): Promise<RunSummary> {
  return sql.run({ code: '', stdin: '', action: 'reset' }, handlers)
}

export function stopAll() {
  js.stop()
  python.stop()
  sql.stop()
  stopR()
  serverAbort?.abort()
}
