import type { ServerLang } from '@/data/languages'
import { truncate, type Backend, type RunResult } from './types'

// The "online" runner: free public compiler services, so compiled languages
// work with no setup. Wandbox (wandbox.org) runs 10 of them; Compiler Explorer
// (godbolt.org) runs Kotlin and Dart, which Wandbox lacks. It uses only fetch,
// so it works from the /api/run route and, when there is no server, straight
// from the browser. Code is sent to those services, so the UI says so.

export const WANDBOX_URL = 'https://wandbox.org/api'
export const GODBOLT_URL = 'https://godbolt.org/api'

type Service = { service: 'wandbox'; compiler: string; language: string; options?: string } | { service: 'godbolt'; compiler: string; language: string }

/** Preferred compilers. If one disappears, the newest compiler for the language is looked up. */
export const ONLINE: Record<ServerLang, Service> = {
  c: { service: 'wandbox', compiler: 'gcc-13.2.0-c', language: 'C' },
  cpp: { service: 'wandbox', compiler: 'gcc-13.2.0', language: 'C++', options: '-std=gnu++20' },
  java: { service: 'wandbox', compiler: 'openjdk-jdk-22+36', language: 'Java' },
  csharp: { service: 'wandbox', compiler: 'dotnetcore-8.0.402', language: 'C#' },
  go: { service: 'wandbox', compiler: 'go-1.23.2', language: 'Go' },
  rust: { service: 'wandbox', compiler: 'rust-1.82.0', language: 'Rust' },
  scala: { service: 'wandbox', compiler: 'scala-3.5.1', language: 'Scala' },
  ruby: { service: 'wandbox', compiler: 'ruby-3.4.9', language: 'Ruby' },
  php: { service: 'wandbox', compiler: 'php-8.3.12', language: 'PHP' },
  swift: { service: 'wandbox', compiler: 'swift-6.0.1', language: 'Swift' },
  kotlin: { service: 'godbolt', compiler: 'kotlinc2220', language: 'kotlin' },
  dart: { service: 'godbolt', compiler: 'dart373', language: 'dart' },
}

/** Which service runs each language, for the UI. */
export const ONLINE_SERVICE = Object.fromEntries(
  Object.entries(ONLINE).map(([k, v]) => [k, v.service === 'wandbox' ? 'Wandbox' : 'Compiler Explorer']),
) as Record<ServerLang, 'Wandbox' | 'Compiler Explorer'>

/**
 * Wandbox compiles Java as `prog.java` and Scala as `prog.scala`, and starts a
 * class called `prog`. So `public` comes off top-level classes (any file name
 * is then fine) and a small `prog` launcher calls the user's own main.
 */
export function prepareSource(language: ServerLang, code: string): string {
  if (language === 'java') {
    if (/\bclass\s+prog\b/.test(blankNonCode(code))) return code
    const src = code.replace(/^(\s*)public\s+((?:final\s+|abstract\s+)*)(class|interface|enum|record)\b/gm, '$1$2$3')
    const main = mainClass(src, /\bclass\s+(\w+)[^{]*\{/g, /\bstatic\s+void\s+main\s*\(/)
    return main ? `${src}\n\nclass prog {\n    public static void main(String[] args) throws Exception {\n        ${main}.main(args);\n    }\n}\n` : src
  }
  if (language === 'scala') {
    if (/\bobject\s+prog\b/.test(blankNonCode(code))) return code
    const obj = mainClass(code, /\bobject\s+(\w+)[^{]*\{/g, /\bdef\s+main\s*\(/)
    if (obj) return `${code}\n\nobject prog {\n  def main(args: Array[String]): Unit = ${obj}.main(args)\n}\n`
    const entry = blankNonCode(code).match(/@main\s+def\s+(\w+)\s*\(\s*\)/)?.[1]
    if (entry) return `${code}\n\nobject prog {\n  def main(args: Array[String]): Unit = ${entry}()\n}\n`
  }
  return code
}

/** Comments and string literals blanked out (same length), so they never look like code. */
const blankNonCode = (code: string) =>
  code.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g, (m) => m.replace(/[^\n]/g, ' '))

/** The name of the first `class`/`object` whose body contains a main method. */
function mainClass(source: string, opener: RegExp, mainRe: RegExp): string | undefined {
  const code = blankNonCode(source)
  const heads = [...code.matchAll(opener)]
  for (let i = 0; i < heads.length; i++) {
    const body = code.slice(heads[i].index, heads[i + 1]?.index ?? code.length)
    if (mainRe.test(body)) return heads[i][1]
  }
  return undefined
}

interface WandboxResult {
  status?: string
  signal?: string
  compiler_output?: string
  compiler_error?: string
  program_output?: string
  program_error?: string
  error?: string
}

interface GodboltLine { text: string }
interface GodboltResult {
  code?: number
  didExecute?: boolean
  timedOut?: boolean
  stdout?: GodboltLine[]
  stderr?: GodboltLine[]
  buildResult?: { code?: number; stdout?: GodboltLine[]; stderr?: GodboltLine[] }
}

const lines = (l?: GodboltLine[]) => (l?.length ? `${l.map((x) => x.text).join('\n')}\n` : '')

export function publicBackend(fetchImpl: typeof fetch = (...a) => fetch(...a)): Backend {
  // Compiler names found by lookup after the preferred one stopped working.
  const resolved = new Map<ServerLang, string>()

  async function newestWandbox(language: string): Promise<string | undefined> {
    const res = await fetchImpl(`${WANDBOX_URL}/list.json`)
    if (!res.ok) return undefined
    const list = (await res.json()) as { name: string; language: string }[]
    // The list is newest first; skip "head" (nightly) builds.
    return list.find((c) => c.language === language && !c.name.includes('head'))?.name
  }

  async function newestGodbolt(language: string): Promise<string | undefined> {
    const res = await fetchImpl(`${GODBOLT_URL}/compilers/${language}?fields=id,semver,supportsExecute`, { headers: { accept: 'application/json' } })
    if (!res.ok) return undefined
    const list = (await res.json()) as { id: string; semver?: string; supportsExecute?: boolean }[]
    const runnable = list.filter((c) => c.supportsExecute !== false && !/dev|trunk|nightly/i.test(c.id))
    const key = (v = '') => v.split('.').map((n) => n.padStart(4, '0')).join('.')
    return runnable.sort((a, b) => key(a.semver).localeCompare(key(b.semver))).at(-1)?.id
  }

  async function wandbox(language: ServerLang, s: Extract<Service, { service: 'wandbox' }>, code: string, stdin: string, compiler: string): Promise<{ res: Response; data: WandboxResult }> {
    const res = await fetchImpl(`${WANDBOX_URL}/compile.json`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ compiler, code: prepareSource(language, code), stdin, options: '', 'compiler-option-raw': s.options ?? '', 'runtime-option-raw': '', save: false }),
    })
    const text = await res.text()
    let data: WandboxResult = {}
    try {
      data = JSON.parse(text) as WandboxResult
    } catch {
      data = { error: text.slice(0, 300) }
    }
    return { res, data }
  }

  async function godbolt(s: Service, code: string, stdin: string, compiler: string) {
    return fetchImpl(`${GODBOLT_URL}/compiler/${encodeURIComponent(compiler)}/compile`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        source: code,
        lang: s.language,
        allowStoreCodeDebug: false,
        options: {
          userArguments: '',
          executeParameters: { args: [], stdin },
          compilerOptions: { executorRequest: true },
          filters: { execute: true },
          tools: [],
          libraries: [],
        },
      }),
    })
  }

  return {
    name: 'online',
    async run({ language, code, stdin }) {
      const s = ONLINE[language]
      const start = Date.now()

      if (s.service === 'wandbox') {
        let compiler = resolved.get(language) ?? s.compiler
        let { res, data } = await wandbox(language, s, code, stdin, compiler)
        if (!res.ok && res.status < 500) {
          // Usually "compiler not found" after Wandbox retired a version.
          const newest = await newestWandbox(s.language)
          if (newest && newest !== compiler) {
            compiler = newest
            resolved.set(language, newest)
            ;({ res, data } = await wandbox(language, s, code, stdin, compiler))
          }
        }
        if (!res.ok) throw new Error(data.error ?? `Wandbox returned HTTP ${res.status}`)
        const exit = data.status === undefined || data.status === '' ? null : Number(data.status)
        const ran = data.program_output !== undefined || data.program_error !== undefined || !data.compiler_error
        const result: RunResult = {
          compileOutput: truncate(ran ? '' : `${data.compiler_error ?? ''}${data.compiler_output ?? ''}`),
          stdout: truncate(data.program_output ?? ''),
          stderr: truncate(`${ran ? data.compiler_error ?? '' : ''}${data.program_error ?? ''}`),
          exitCode: Number.isFinite(exit) ? exit : null,
          signal: data.signal || null,
          timeMs: Date.now() - start,
          backend: `wandbox · ${compiler}`,
        }
        return result
      }

      let compiler = resolved.get(language) ?? s.compiler
      let res = await godbolt(s, code, stdin, compiler)
      if (res.status === 404 || res.status === 400) {
        const newest = await newestGodbolt(s.language)
        if (newest && newest !== compiler) {
          compiler = newest
          resolved.set(language, newest)
          res = await godbolt(s, code, stdin, compiler)
        }
      }
      if (!res.ok) throw new Error(`Compiler Explorer returned HTTP ${res.status}`)
      const data = (await res.json()) as GodboltResult
      const build = data.buildResult
      const buildFailed = Boolean(build && build.code !== 0)
      const result: RunResult = {
        compileOutput: truncate(buildFailed ? `${lines(build?.stderr)}${lines(build?.stdout)}` : ''),
        stdout: truncate(data.didExecute ? lines(data.stdout) : ''),
        stderr: truncate(data.didExecute || buildFailed ? lines(data.stderr) : `${lines(data.stderr)}Compiler Explorer could not run this program.\n`),
        exitCode: buildFailed ? build!.code ?? 1 : data.code ?? null,
        signal: data.timedOut ? 'TIMEOUT' : null,
        timeMs: Date.now() - start,
        backend: `compiler explorer · ${compiler}`,
      }
      return result
    },
  }
}
