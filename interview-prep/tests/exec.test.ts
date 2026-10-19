import { execSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { LANGUAGES, type ServerLang } from '@/data/languages'
import { allowRun, getBackend } from '@/lib/exec'
import { judge0Backend, pickLanguageId } from '@/lib/exec/judge0'
import { localBackend } from '@/lib/exec/local'
import { pistonBackend } from '@/lib/exec/piston'

const has = (cmd: string) => {
  try {
    execSync(`command -v ${cmd}`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

// Toolchains that exist on this machine get a real end-to-end run of the
// starter template, with stdin, through the local backend.
const LOCAL_TOOL: Partial<Record<ServerLang, string>> = { c: 'gcc', cpp: 'g++', java: 'javac', go: 'go', rust: 'rustc', ruby: 'ruby', php: 'php' }

describe('local backend runs the starter templates', () => {
  const local = localBackend()
  for (const lang of LANGUAGES.filter((l) => l.engine === 'server')) {
    const tool = LOCAL_TOOL[lang.runtime as ServerLang]
    it.skipIf(!tool || !has(tool))(`${lang.name}`, async () => {
      const r = await local.run({ language: lang.runtime as ServerLang, code: lang.template, stdin: 'Sandeep\n' })
      expect(r.compileOutput).toBe('')
      expect(r.stdout).toContain('Hello, Sandeep!')
      expect(r.exitCode).toBe(0)
    }, 120_000)
  }

  it.skipIf(!has('gcc'))('reports compile errors', async () => {
    const r = await local.run({ language: 'c', code: 'int main( { return 0 }', stdin: '' })
    expect(r.compileOutput).toMatch(/error/)
    expect(r.exitCode).not.toBe(0)
  }, 60_000)

  it.skipIf(!has('gcc'))('kills infinite loops', async () => {
    const r = await local.run({ language: 'c', code: 'int main(void){ for(;;); }', stdin: '' })
    expect(r.signal).toBe('TIMEOUT')
  }, 60_000)

  it.skipIf(!has('ruby'))('reports runtime errors on stderr with a non-zero exit code', async () => {
    const r = await local.run({ language: 'ruby', code: 'raise "boom"', stdin: '' })
    expect(r.stderr).toContain('boom')
    expect(r.exitCode).not.toBe(0)
  }, 60_000)
})

describe('piston backend', () => {
  it('sends the right request and maps a compile error', async () => {
    let sent: { url: string; body: Record<string, unknown> } | null = null
    const fakeFetch = (async (url: string, init: RequestInit) => {
      sent = { url, body: JSON.parse(String(init.body)) }
      return Response.json({ compile: { stdout: '', stderr: 'main.cpp:1: error', code: 1, signal: null }, run: { stdout: '', stderr: '', code: null, signal: null } })
    }) as unknown as typeof fetch
    const r = await pistonBackend('http://piston:2000/', fakeFetch).run({ language: 'cpp', code: 'x', stdin: 'in' })
    expect(sent!.url).toBe('http://piston:2000/api/v2/execute')
    expect(sent!.body).toMatchObject({ language: 'c++', version: '*', stdin: 'in', files: [{ name: 'main.cpp', content: 'x' }] })
    expect(r.compileOutput).toContain('error')
    expect(r.exitCode).toBe(1)
  })

  it('maps a successful run', async () => {
    const fakeFetch = (async () => Response.json({ run: { stdout: 'hi\n', stderr: '', code: 0, signal: null } })) as unknown as typeof fetch
    const r = await pistonBackend('http://p', fakeFetch).run({ language: 'go', code: '', stdin: '' })
    expect(r).toMatchObject({ stdout: 'hi\n', exitCode: 0, compileOutput: '', backend: 'piston' })
  })
})

describe('judge0 backend', () => {
  const languages = [
    { id: 48, name: 'C (GCC 7.4.0)' }, { id: 50, name: 'C (GCC 9.2.0)' }, { id: 75, name: 'C (Clang 7.0.1)' },
    { id: 54, name: 'C++ (GCC 9.2.0)' }, { id: 51, name: 'C# (Mono 6.6.0.161)' }, { id: 62, name: 'Java (OpenJDK 13.0.1)' },
    { id: 90, name: 'Dart (2.19.2)' }, { id: 83, name: 'Swift (5.2.3)' },
  ]

  it('picks the newest matching runtime by name', () => {
    expect(pickLanguageId(languages, 'c')).toBe(50)
    expect(pickLanguageId(languages, 'cpp')).toBe(54)
    expect(pickLanguageId(languages, 'csharp')).toBe(51)
    expect(pickLanguageId(languages, 'dart')).toBe(90)
    expect(pickLanguageId(languages, 'kotlin')).toBeUndefined()
  })

  it('base64-encodes the submission and decodes the result', async () => {
    const calls: { url: string; init?: RequestInit }[] = []
    const fakeFetch = (async (url: string, init?: RequestInit) => {
      calls.push({ url, init })
      if (url.endsWith('/languages')) return Response.json(languages)
      return Response.json({
        stdout: Buffer.from('Hello, Sandeep!\n').toString('base64'), stderr: null, compile_output: null, message: null,
        exit_code: 0, exit_signal: null, status: { id: 3, description: 'Accepted' }, time: '0.012',
      })
    }) as unknown as typeof fetch
    const r = await judge0Backend('https://judge0-ce.p.rapidapi.com', 'KEY', fakeFetch).run({ language: 'java', code: 'class Main{}', stdin: 'Sandeep' })
    const submit = calls.find((c) => c.url.includes('/submissions'))!
    const body = JSON.parse(String(submit.init!.body))
    expect(body.language_id).toBe(62)
    expect(Buffer.from(body.source_code, 'base64').toString()).toBe('class Main{}')
    expect((submit.init!.headers as Record<string, string>)['X-RapidAPI-Key']).toBe('KEY')
    expect(r).toMatchObject({ stdout: 'Hello, Sandeep!\n', exitCode: 0, timeMs: 12, backend: 'judge0' })
  })
})

describe('backend selection', () => {
  it('prefers explicit config and refuses the unsandboxed runner in production', () => {
    expect(getBackend({ NODE_ENV: 'production', PISTON_URL: 'http://p' } as NodeJS.ProcessEnv)).toMatchObject({ ok: true })
    expect(getBackend({ NODE_ENV: 'production' } as NodeJS.ProcessEnv)).toMatchObject({ ok: false })
    expect(getBackend({ NODE_ENV: 'production', RUNNER_BACKEND: 'local' } as NodeJS.ProcessEnv)).toMatchObject({ ok: false })
    expect(getBackend({ NODE_ENV: 'development' } as NodeJS.ProcessEnv)).toMatchObject({ ok: true })
  })

  it('rate-limits a single client', () => {
    const t = 1_000_000
    for (let i = 0; i < 30; i++) expect(allowRun('ip-test', t + i)).toBe(true)
    expect(allowRun('ip-test', t + 31)).toBe(false)
    expect(allowRun('ip-test', t + 61_000)).toBe(true)
  })
})
