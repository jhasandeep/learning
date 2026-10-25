import type { StepInput, StepOutcome } from './harness'

// Client side of the Learn checks: one worker, restarted after a timeout.
// HTML and CSS steps never run the learner's code (the page is only parsed,
// with scripts inert), so they are checked here with the browser's DOMParser.
const TIMEOUT_MS = 6000

let worker: Worker | null = null
let nextId = 1

export async function checkStep(input: StepInput): Promise<StepOutcome> {
  if (input.kind === 'html' || input.kind === 'css') {
    const { runStep } = await import('./harness')
    return runStep(input, {
      parseHTML: (html) => ({ document: new DOMParser().parseFromString(html, 'text/html') }),
      sql: () => Promise.reject(new Error('No SQL here')),
    })
  }
  worker ??= new Worker(new URL('./learn.worker.ts', import.meta.url), { type: 'module' })
  const w = worker
  const id = nextId++
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      w.terminate()
      if (worker === w) worker = null
      resolve({ results: [], logs: [], error: `Your code ran for more than ${TIMEOUT_MS / 1000} seconds and was stopped. Look for an infinite loop.` })
    }, TIMEOUT_MS)
    const onMessage = (e: MessageEvent<{ id: number; outcome: StepOutcome }>) => {
      if (e.data.id !== id) return
      clearTimeout(timer)
      w.removeEventListener('message', onMessage)
      resolve(e.data.outcome)
    }
    w.addEventListener('message', onMessage)
    w.postMessage({ id, input })
  })
}
