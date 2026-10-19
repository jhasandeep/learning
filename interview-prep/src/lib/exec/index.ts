import { judge0Backend } from './judge0'
import { localBackend } from './local'
import { pistonBackend } from './piston'
import type { Backend } from './types'

export type BackendStatus = { ok: true; backend: Backend } | { ok: false; reason: string }

/**
 * Chooses how server languages run, from environment variables:
 *   RUNNER_BACKEND=piston  + PISTON_URL=http://localhost:2000
 *   RUNNER_BACKEND=judge0  + JUDGE0_URL=…  (+ JUDGE0_KEY for RapidAPI / auth)
 *   RUNNER_BACKEND=local   — dev only; installed compilers, no sandbox
 * Without RUNNER_BACKEND it picks Piston or Judge0 if their URL is set, and
 * falls back to `local` only in development.
 */
export function getBackend(env: NodeJS.ProcessEnv = process.env): BackendStatus {
  const choice = env.RUNNER_BACKEND ?? (env.PISTON_URL ? 'piston' : env.JUDGE0_URL ? 'judge0' : env.NODE_ENV === 'production' ? '' : 'local')

  switch (choice) {
    case 'piston':
      return env.PISTON_URL ? { ok: true, backend: pistonBackend(env.PISTON_URL) } : { ok: false, reason: 'RUNNER_BACKEND=piston needs PISTON_URL.' }
    case 'judge0':
      return env.JUDGE0_URL ? { ok: true, backend: judge0Backend(env.JUDGE0_URL, env.JUDGE0_KEY) } : { ok: false, reason: 'RUNNER_BACKEND=judge0 needs JUDGE0_URL.' }
    case 'local':
      if (env.NODE_ENV === 'production' && env.ALLOW_UNSAFE_LOCAL_RUNNER !== '1') {
        return { ok: false, reason: 'The local runner has no sandbox and is disabled in production. Configure Piston or Judge0.' }
      }
      return { ok: true, backend: localBackend() }
    case '':
      return { ok: false, reason: 'No code runner is configured. Set PISTON_URL (self-hosted Piston) or JUDGE0_URL to run compiled languages.' }
    default:
      return { ok: false, reason: `Unknown RUNNER_BACKEND "${choice}".` }
  }
}

// Small in-memory limiter: enough to stop one tab hammering the runner.
// Per server instance; put a shared limiter (e.g. Redis) in front at scale.
const WINDOW_MS = 60_000
const MAX_RUNS = 30
const hits = new Map<string, number[]>()

export function allowRun(key: string, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_RUNS) {
    hits.set(key, recent)
    return false
  }
  recent.push(now)
  hits.set(key, recent)
  if (hits.size > 10_000) hits.clear()
  return true
}
