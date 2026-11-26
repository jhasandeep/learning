/// <reference lib="webworker" />
import { inspect } from './inspect'
import type { Stream, WorkerEvent, WorkerRequest } from './protocol'

const post = (id: number, ev: WorkerEvent) => self.postMessage({ ...ev, id })

// The real timer functions, kept before a run swaps in the tracked versions.
const real = {
  setTimeout: self.setTimeout.bind(self),
  setInterval: self.setInterval.bind(self),
  clearTimeout: self.clearTimeout.bind(self),
  clearInterval: self.clearInterval.bind(self),
  fetch: self.fetch.bind(self),
}
const tick = () => new Promise<void>((resolve) => real.setTimeout(resolve, 0))

const describe = (err: unknown) => (err instanceof Error ? `${err.name}: ${err.message}` : inspect(err))

/**
 * Runs the code like Node does: the program only ends once no timers, intervals
 * or requests are left. Without this, "done" was sent right after the top-level
 * code, and everything a setTimeout / setInterval callback printed was lost.
 */
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

  // --- A tiny event loop: count what is still pending ---
  const timeouts = new Set<number>()
  const intervals = new Set<number>()
  let requests = 0
  let crashed = false
  let wake: (() => void) | null = null
  const changed = () => { wake?.(); wake = null }
  const pending = () => timeouts.size + intervals.size + requests

  // Like Node: an uncaught error in a callback or an unhandled rejection ends the program.
  const crash = (err: unknown, prefix = '') => {
    if (crashed) return
    crashed = true
    out('stderr', `${prefix}${describe(err)}\n`)
    for (const t of timeouts) real.clearTimeout(t)
    for (const t of intervals) real.clearInterval(t)
    timeouts.clear()
    intervals.clear()
    changed()
  }
  const call = (fn: unknown, args: unknown[]) => {
    if (crashed) return
    if (typeof fn !== 'function') return crash(new TypeError('The "callback" argument must be of type function'))
    try {
      fn(...args)
    } catch (err) {
      crash(err)
    }
  }

  const timers = {
    setTimeout: (fn: unknown, ms?: number, ...args: unknown[]) => {
      const t = real.setTimeout(() => {
        timeouts.delete(t)
        call(fn, args)
        changed()
      }, ms)
      timeouts.add(t)
      return t
    },
    setInterval: (fn: unknown, ms?: number, ...args: unknown[]) => {
      const t = real.setInterval(() => call(fn, args), ms)
      intervals.add(t)
      return t
    },
    clearTimeout: (t?: number) => {
      if (t === undefined) return
      real.clearTimeout(t)
      if (timeouts.delete(t)) changed()
    },
    clearInterval: (t?: number) => {
      if (t === undefined) return
      real.clearInterval(t)
      if (intervals.delete(t)) changed()
    },
    fetch: (...args: Parameters<typeof fetch>) => {
      requests++
      return real.fetch(...args).finally(() => { requests--; changed() })
    },
  }
  // Node's setImmediate runs after the current I/O; a 0 ms timeout is the closest match here.
  const setImmediate = (fn: unknown, ...args: unknown[]) => timers.setTimeout(fn, 0, ...args)
  const onRejection = (ev: PromiseRejectionEvent) => {
    ev.preventDefault()
    crash(ev.reason, 'Uncaught (in promise) ')
  }

  const g = self as unknown as Record<string, unknown>
  const saved = Object.fromEntries(Object.keys(timers).map((k) => [k, g[k]]))
  Object.assign(g, timers, { setImmediate, clearImmediate: timers.clearTimeout })
  self.addEventListener('unhandledrejection', onRejection)

  post(id, { type: 'started' })
  const start = performance.now()
  try {
    // An async function body allows top-level await in user code.
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
    const fn = new AsyncFunction('console', 'prompt', 'readline', 'alert', code)
    await fn(fakeConsole, prompt, () => prompt(), (m: unknown) => out('stdout', line(m)))
  } catch (err) {
    crash(err)
  }

  // Keep the program alive while timers or requests are pending. A macrotask
  // tick before each check lets promise callbacks schedule new timers first.
  // The browser reports an unhandled rejection a task or two after it happens,
  // so wait two ticks before deciding the program is finished.
  const settle = async () => { await tick(); await tick() }
  await settle()
  while (!crashed && pending() > 0) {
    await new Promise<void>((resolve) => { wake = resolve })
    await settle()
  }

  self.removeEventListener('unhandledrejection', onRejection)
  Object.assign(g, saved)
  delete g.setImmediate
  delete g.clearImmediate
  post(id, { type: 'done', exitCode: crashed ? 1 : 0, ms: Math.round(performance.now() - start) })
}
