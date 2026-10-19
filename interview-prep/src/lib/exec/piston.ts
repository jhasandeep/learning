import type { ServerLang } from '@/data/languages'
import { FILE_NAMES, LIMITS, truncate, type Backend, type RunResult } from './types'

// Piston (https://github.com/engineer-man/piston): an open-source sandboxed
// code runner you can self-host with Docker. PISTON_URL points at it.
export const PISTON_LANG: Record<ServerLang, string> = {
  c: 'c', cpp: 'c++', java: 'java', kotlin: 'kotlin', csharp: 'csharp', go: 'go',
  rust: 'rust', scala: 'scala', dart: 'dart', ruby: 'ruby', php: 'php', swift: 'swift',
}

interface PistonStage { stdout: string; stderr: string; code: number | null; signal: string | null; output?: string }
interface PistonResponse { run?: PistonStage; compile?: PistonStage; message?: string }

export function pistonBackend(baseUrl: string, fetchImpl: typeof fetch = fetch): Backend {
  const url = `${baseUrl.replace(/\/$/, '')}/api/v2/execute`
  return {
    name: 'piston',
    async run({ language, code, stdin }) {
      const start = Date.now()
      const res = await fetchImpl(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          language: PISTON_LANG[language],
          version: '*',
          files: [{ name: FILE_NAMES[language], content: code }],
          stdin,
          compile_timeout: LIMITS.compileTimeoutMs,
          run_timeout: LIMITS.runTimeoutMs,
        }),
      })
      const data = (await res.json()) as PistonResponse
      if (!res.ok || !data.run) throw new Error(data.message ?? `Piston returned HTTP ${res.status}`)
      const compileFailed = data.compile && data.compile.code !== 0
      const result: RunResult = {
        compileOutput: truncate(compileFailed ? `${data.compile!.stderr}${data.compile!.stdout}` : ''),
        stdout: truncate(data.run.stdout),
        stderr: truncate(data.run.stderr),
        exitCode: compileFailed ? data.compile!.code : data.run.code,
        signal: data.run.signal,
        timeMs: Date.now() - start,
        backend: 'piston',
      }
      return result
    },
  }
}
