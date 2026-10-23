import type { ServerLang } from '@/data/languages'
import type { RunHandlers, RunSummary } from './protocol'

// Frontend-only runner for the compiled languages: the page calls the public
// Wandbox API (https://wandbox.org, CORS-enabled, no key) straight from the
// browser, so no backend is needed. If it is unreachable the compiler falls
// back to the server runner (/api/run) when one is configured.

const API = 'https://wandbox.org/api'

/** Our language → the language name Wandbox uses in its compiler list. */
export const WANDBOX_LANGUAGE: Partial<Record<ServerLang, string>> = {
  c: 'C', cpp: 'C++', java: 'Java', csharp: 'C#', go: 'Go', rust: 'Rust', ruby: 'Ruby', php: 'PHP', swift: 'Swift', scala: 'Scala',
}

/** Compiler families to prefer when a language has several (gcc over clang, OpenJDK over others). */
const PREFERRED: Partial<Record<ServerLang, RegExp>> = { c: /^gcc/, cpp: /^gcc/, java: /^openjdk/ }

export interface WandboxCompiler { name: string; language: string; version: string }

interface WandboxResponse {
  status?: string
  signal?: string
  compiler_error?: string
  program_output?: string
  program_error?: string
}

const versionParts = (v: string) => (v.match(/\d+/g) ?? []).map(Number)

function compareVersions(a: string, b: string): number {
  const x = versionParts(a)
  const y = versionParts(b)
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0)
    if (d !== 0) return d
  }
  return 0
}

/** The newest released (not "head") compiler Wandbox offers for a language. */
export function pickCompiler(list: WandboxCompiler[], lang: ServerLang): string | null {
  const language = WANDBOX_LANGUAGE[lang]
  if (!language) return null
  const all = list.filter((c) => c.language === language)
  const released = all.filter((c) => !/head|trunk|nightly/i.test(`${c.name} ${c.version}`))
  const pool = released.length > 0 ? released : all
  const preferred = pool.filter((c) => PREFERRED[lang]?.test(c.name))
  const best = (preferred.length > 0 ? preferred : pool).sort((a, b) => compareVersions(b.version, a.version))[0]
  return best?.name ?? null
}

let compilers: Promise<WandboxCompiler[]> | null = null

function loadCompilers(signal: AbortSignal): Promise<WandboxCompiler[]> {
  compilers ??= fetch(`${API}/list.json`, { signal })
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r.json() as Promise<WandboxCompiler[]>
    })
    .catch((err) => {
      compilers = null // try again next time
      throw err
    })
  return compilers
}

/** For tests: forget the cached compiler list. */
export function resetWandboxCache() {
  compilers = null
}

const nl = (s: string) => (s.endsWith('\n') ? s : `${s}\n`)

/**
 * Runs code on Wandbox. Returns null when the online compiler cannot be used
 * (offline, blocked, or the language is missing), with `unavailable` saying why,
 * so the caller can fall back to the server runner.
 */
export async function runWandbox(
  lang: ServerLang,
  code: string,
  stdin: string,
  handlers: RunHandlers,
  signal: AbortSignal,
): Promise<{ summary: RunSummary } | { unavailable: string }> {
  handlers.onLoading?.('Compiling and running on Wandbox…')
  const started = performance.now()
  try {
    const compiler = pickCompiler(await loadCompilers(signal), lang)
    if (!compiler) return { unavailable: `Wandbox has no ${WANDBOX_LANGUAGE[lang] ?? lang} compiler.` }
    const res = await fetch(`${API}/compile.json`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ compiler, code, stdin, save: false }),
      signal,
    })
    if (!res.ok) return { unavailable: `Wandbox answered HTTP ${res.status}.` }
    const data = (await res.json()) as WandboxResponse
    if (data.compiler_error) handlers.onOutput('stderr', nl(data.compiler_error))
    if (data.program_output) handlers.onOutput('stdout', data.program_output)
    if (data.program_error) handlers.onOutput('stderr', data.program_error)
    const ms = Math.round(performance.now() - started)
    if (data.signal) {
      handlers.onOutput('system', `\nThe program was stopped (${data.signal}). It may have run too long or used too much memory.\n`)
      return { summary: { exitCode: null, ms, signal: 'TIMEOUT' } }
    }
    const exit = Number(data.status ?? 0)
    return { summary: { exitCode: Number.isFinite(exit) ? exit : 1, ms, signal: null } }
  } catch (err) {
    if (signal.aborted) return { summary: { exitCode: null, ms: 0, signal: 'STOPPED' } }
    return { unavailable: `Could not reach Wandbox (${err instanceof Error ? err.message : String(err)}).` }
  }
}
