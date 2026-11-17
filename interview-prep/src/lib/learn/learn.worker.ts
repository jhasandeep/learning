/// <reference lib="webworker" />
import initSqlJs from 'sql.js'
import { runStep, type HarnessEnv, type StepInput } from './harness'

// Runs Learn checks off the main thread: no access to the page, and an
// infinite loop is stopped by terminating this worker (see run.ts).
// HTML and CSS steps run on the main thread instead (they need DOMParser).

const env: HarnessEnv = {
  parseHTML: () => {
    throw new Error('HTML steps run on the main thread')
  },
  sql: (() => {
    let p: ReturnType<typeof initSqlJs> | null = null
    return () => (p ??= initSqlJs({ locateFile: (file: string) => `/vendor/sqljs/${file}` }))
  })(),
}

self.onmessage = async (e: MessageEvent<{ id: number; input: StepInput }>) => {
  const { id, input } = e.data
  const outcome = await runStep(input, env)
  self.postMessage({ id, outcome })
}
