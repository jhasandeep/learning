import type { RunOutcome, TestCase } from './testing'

// Runs untrusted user code in a Web Worker: no DOM access, and an infinite
// loop is cut off by terminating the worker after TIMEOUT_MS.
const TIMEOUT_MS = 2000

let worker: Worker | null = null
let nextId = 1

function getWorker(): Worker {
  worker ??= new Worker(new URL('./runner.worker.ts', import.meta.url), { type: 'module' })
  return worker
}

export function runTests(code: string, fnName: string, tests: TestCase[]): Promise<RunOutcome> {
  const w = getWorker()
  const id = nextId++
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      w.terminate()
      worker = null
      w.removeEventListener('message', onMessage)
      resolve({ kind: 'timeout', logs: [] })
    }, TIMEOUT_MS)

    function onMessage(e: MessageEvent<{ id: number; outcome: RunOutcome }>) {
      if (e.data.id !== id) return
      clearTimeout(timer)
      w.removeEventListener('message', onMessage)
      resolve(e.data.outcome)
    }

    w.addEventListener('message', onMessage)
    w.postMessage({ id, code, fnName, tests })
  })
}
