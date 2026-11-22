/// <reference lib="webworker" />
import { checkChallenge, MongoEngine, type ChallengeSpec } from './mongo-engine'
import type { WorkerEvent, WorkerRequest } from './protocol'

// The MongoDB playground. The in-memory database lives in this worker and keeps
// your changes between runs until you reset it.

const engine = new MongoEngine()

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { id, code, action, payload } = e.data
  const post = (ev: WorkerEvent) => self.postMessage({ ...ev, id })
  post({ type: 'started' })
  const start = performance.now()
  let exitCode = 0

  if (action === 'check') {
    try {
      post({ type: 'check', result: await checkChallenge(code, JSON.parse(payload ?? '{}') as ChallengeSpec) })
    } catch (err) {
      exitCode = 1
      post({ type: 'check', result: { pass: false, detail: `Could not check your code: ${err instanceof Error ? err.message : String(err)}` } })
    }
  } else if (action === 'reset') {
    engine.reset()
    post({ type: 'mongo', steps: [{ code: '', kind: 'info', text: 'Database reset to the sample collections.' }], collections: engine.collections() })
  } else {
    try {
      const report = await engine.run(code)
      if (report.steps.length === 0) report.steps.push({ code: '', kind: 'info', text: 'No statements to run.' })
      exitCode = report.failed ? 1 : 0
      post({ type: 'mongo', steps: report.steps, collections: engine.collections() })
    } catch (err) {
      exitCode = 1
      post({ type: 'output', stream: 'stderr', text: `${err instanceof Error ? err.message : String(err)}\n` })
    }
  }
  post({ type: 'done', exitCode, ms: Math.round(performance.now() - start) })
}
