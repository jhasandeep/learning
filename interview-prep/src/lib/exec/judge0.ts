import type { ServerLang } from '@/data/languages'
import { truncate, type Backend } from './types'

// Judge0 (https://judge0.com): self-hosted CE or the hosted RapidAPI plan.
// Language ids differ between Judge0 versions, so they are looked up by name
// from the instance's /languages list (newest matching version wins).
export const JUDGE0_NAME_PATTERNS: Record<ServerLang, RegExp> = {
  c: /^C \(GCC/,
  cpp: /^C\+\+ \(GCC/,
  java: /^Java \(/,
  kotlin: /^Kotlin/,
  csharp: /^C# \(/,
  go: /^Go \(/,
  rust: /^Rust/,
  scala: /^Scala/,
  dart: /^Dart/,
  ruby: /^Ruby/,
  php: /^PHP/,
  swift: /^Swift/,
}

interface J0Language { id: number; name: string }
interface J0Submission {
  stdout: string | null
  stderr: string | null
  compile_output: string | null
  message: string | null
  exit_code: number | null
  exit_signal: number | null
  status: { id: number; description: string }
  time: string | null
}

const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64')
const unb64 = (s: string | null) => (s ? Buffer.from(s, 'base64').toString('utf8') : '')

/** Pick the highest-versioned language whose name matches. */
export function pickLanguageId(languages: J0Language[], lang: ServerLang): number | undefined {
  const matches = languages.filter((l) => JUDGE0_NAME_PATTERNS[lang].test(l.name))
  const version = (name: string) => (name.match(/\d+(\.\d+)*/)?.[0] ?? '0').split('.').map(Number)
  matches.sort((a, b) => {
    const va = version(a.name)
    const vb = version(b.name)
    for (let i = 0; i < Math.max(va.length, vb.length); i++) {
      if ((va[i] ?? 0) !== (vb[i] ?? 0)) return (vb[i] ?? 0) - (va[i] ?? 0)
    }
    return b.id - a.id
  })
  return matches[0]?.id
}

export function judge0Backend(baseUrl: string, apiKey: string | undefined, fetchImpl: typeof fetch = fetch): Backend {
  const base = baseUrl.replace(/\/$/, '')
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (apiKey) {
    // RapidAPI-hosted Judge0 uses these headers; self-hosted uses X-Auth-Token.
    if (base.includes('rapidapi.com')) {
      headers['X-RapidAPI-Key'] = apiKey
      headers['X-RapidAPI-Host'] = new URL(base).host
    } else {
      headers['X-Auth-Token'] = apiKey
    }
  }
  let languages: Promise<J0Language[]> | null = null

  return {
    name: 'judge0',
    async run({ language, code, stdin }) {
      languages ??= fetchImpl(`${base}/languages`, { headers }).then((r) => {
        if (!r.ok) throw new Error(`Judge0 /languages returned HTTP ${r.status}`)
        return r.json() as Promise<J0Language[]>
      })
      const list = await languages.catch((e) => {
        languages = null
        throw e
      })
      const languageId = pickLanguageId(list, language)
      if (!languageId) throw new Error(`This Judge0 instance has no ${language} runtime`)

      const start = Date.now()
      const res = await fetchImpl(`${base}/submissions?base64_encoded=true&wait=true`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ language_id: languageId, source_code: b64(code), stdin: b64(stdin) }),
      })
      if (!res.ok) throw new Error(`Judge0 returned HTTP ${res.status}`)
      const s = (await res.json()) as J0Submission
      const timedOut = s.status.id === 5 // "Time Limit Exceeded"
      return {
        compileOutput: truncate(unb64(s.compile_output)),
        stdout: truncate(unb64(s.stdout)),
        stderr: truncate(unb64(s.stderr) || (s.status.id > 4 && !s.compile_output ? unb64(s.message) || s.status.description : '')),
        exitCode: s.exit_code,
        signal: timedOut ? 'TIMEOUT' : s.exit_signal ? `signal ${s.exit_signal}` : null,
        timeMs: s.time ? Math.round(Number(s.time) * 1000) : Date.now() - start,
        backend: 'judge0',
      }
    },
  }
}
