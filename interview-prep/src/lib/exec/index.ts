import { judge0Backend } from './judge0'
import { localBackend } from './local'
import { pistonBackend } from './piston'
import { publicBackend } from './public'
import type { Backend } from './types'

export type BackendStatus = { ok: true; backend: Backend } | { ok: false; reason: string }

/**
 * Chooses how server languages run, from environment variables:
 *   RUNNER_BACKEND=online  — free public services (Wandbox, Compiler Explorer); no setup
 *   RUNNER_BACKEND=piston  + PISTON_URL=http://localhost:2000
 *   RUNNER_BACKEND=judge0  + JUDGE0_URL=…  (+ JUDGE0_KEY for RapidAPI / auth)
 *   RUNNER_BACKEND=local   — dev only; installed compilers, no sandbox
 *   RUNNER_BACKEND=none    — compiled languages off
 * Without RUNNER_BACKEND it picks Piston or Judge0 if their URL is set, and
 * otherwise the online services.
 */
let online: ReturnType<typeof publicBackend> | undefined

export function getBackend(env: NodeJS.ProcessEnv = process.env): BackendStatus {
  const choice = env.RUNNER_BACKEND ?? (env.PISTON_URL ? 'piston' : env.JUDGE0_URL ? 'judge0' : 'online')

  switch (choice) {
    case 'online':
      online ??= publicBackend()
      return { ok: true, backend: online }
    case 'piston':
      return env.PISTON_URL ? { ok: true, backend: pistonBackend(env.PISTON_URL) } : { ok: false, reason: 'RUNNER_BACKEND=piston needs PISTON_URL.' }
    case 'judge0':
      return env.JUDGE0_URL ? { ok: true, backend: judge0Backend(env.JUDGE0_URL, env.JUDGE0_KEY) } : { ok: false, reason: 'RUNNER_BACKEND=judge0 needs JUDGE0_URL.' }
    case 'local':
      if (env.NODE_ENV === 'production' && env.ALLOW_UNSAFE_LOCAL_RUNNER !== '1') {
        return { ok: false, reason: 'The local runner has no sandbox and is disabled in production. Configure Piston or Judge0.' }
      }
      return { ok: true, backend: localBackend() }
    case 'none':
      return { ok: false, reason: 'Compiled languages are turned off on this server (RUNNER_BACKEND=none).' }
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
