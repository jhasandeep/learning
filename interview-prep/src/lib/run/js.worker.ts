/// <reference lib="webworker" />
import { inspect } from './inspect'
import type { Stream, WorkerEvent, WorkerRequest } from './protocol'

const post = (id: number, ev: WorkerEvent) => self.postMessage({ ...ev, id })

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { id, code, stdin } = e.data
  const out = (stream: Stream, text: string) => post(id, { type: 'output', stream, text })
  const lines = stdin === '' ? [] : stdin.replace(/\n$/, '').split('\n')
  let next = 0

  const line = (...args: unknown[]) => `${args.map((a) => inspect(a)).join(' ')}\n`
  const fakeConsole = {
    log: (...a: unknown[]) => out('stdout', line(...a)),
    info: (...a: unknown[]) => out('stdout', line(...a)),
    debug: (...a: unknown[]) => out('stdout', line(...a)),
    warn: (...a: unknown[]) => out('stderr', line(...a)),
    error: (...a: unknown[]) => out('stderr', line(...a)),
    table: (data: unknown) => out('stdout', line(data)),
  }
  // prompt() and readline() read the next line of the stdin box.
  const prompt = (message?: string) => {
    if (message) out('stdout', `${message} `)
    if (next >= lines.length) {
      if (message) out('stdout', '\n')
      return null
    }
    const value = lines[next++]
    out('stdin', `${value}\n`)
    return value
  }

  post(id, { type: 'started' })
  const start = performance.now()
  let exitCode = 0
  try {
    // An async function body allows top-level await in user code.
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
    const fn = new AsyncFunction('console', 'prompt', 'readline', 'alert', code)
    await fn(fakeConsole, prompt, () => prompt(), (m: unknown) => out('stdout', line(m)))
  } catch (err) {
    exitCode = 1
    out('stderr', `${err instanceof Error ? `${err.name}: ${err.message}` : inspect(err)}\n`)
  }
  post(id, { type: 'done', exitCode, ms: Math.round(performance.now() - start) })
}
