import { afterEach, describe, expect, it, vi } from 'vitest'
import { LANGUAGES } from '@/data/languages'
import { pickCompiler, resetWandboxCache, runWandbox, WANDBOX_LANGUAGE, type WandboxCompiler } from '@/lib/run/wandbox'
import type { Stream } from '@/lib/run/protocol'

const LIST: WandboxCompiler[] = [
  { name: 'gcc-head', language: 'C++', version: 'HEAD' },
  { name: 'clang-18.1.0', language: 'C++', version: '18.1.0' },
  { name: 'gcc-13.2.0', language: 'C++', version: '13.2.0' },
  { name: 'gcc-9.5.0', language: 'C++', version: '9.5.0' },
  { name: 'gcc-13.2.0-c', language: 'C', version: '13.2.0' },
  { name: 'openjdk-jdk-21+35', language: 'Java', version: 'jdk-21+35' },
  { name: 'openjdk-jdk-8u392', language: 'Java', version: 'jdk-8u392' },
  { name: 'go-1.22.0', language: 'Go', version: '1.22.0' },
  { name: 'go-1.9.7', language: 'Go', version: '1.9.7' },
  { name: 'ruby-head', language: 'Ruby', version: 'HEAD' },
]

describe('pickCompiler', () => {
  it('chooses the newest release of the preferred family, ignoring head builds', () => {
    expect(pickCompiler(LIST, 'cpp')).toBe('gcc-13.2.0')
    expect(pickCompiler(LIST, 'c')).toBe('gcc-13.2.0-c')
    expect(pickCompiler(LIST, 'java')).toBe('openjdk-jdk-21+35')
    expect(pickCompiler(LIST, 'go')).toBe('go-1.22.0') // 1.22 > 1.9 numerically
  })

  it('falls back to a head build when nothing else exists, and null when the language is missing', () => {
    expect(pickCompiler(LIST, 'ruby')).toBe('ruby-head')
    expect(pickCompiler(LIST, 'rust')).toBeNull()
    expect(pickCompiler(LIST, 'kotlin')).toBeNull() // not offered at all
  })

  it('only maps languages that exist in the registry as server languages', () => {
    const server = new Set(LANGUAGES.filter((l) => l.engine === 'server').map((l) => l.runtime))
    for (const k of Object.keys(WANDBOX_LANGUAGE)) expect(server.has(k as never), k).toBe(true)
  })
})

function collect() {
  const out: [Stream, string][] = []
  return { out, handlers: { onOutput: (s: Stream, t: string) => out.push([s, t]) } }
}

function mockFetch(compile: unknown, init: { list?: unknown; status?: number } = {}) {
  const calls: { url: string; body?: unknown }[] = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, opts?: { body?: string }) => {
    calls.push({ url, body: opts?.body ? JSON.parse(opts.body) : undefined })
    if (url.endsWith('/list.json')) return new Response(JSON.stringify(init.list ?? LIST))
    return new Response(JSON.stringify(compile), { status: init.status ?? 200 })
  }))
  return calls
}

describe('runWandbox', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    resetWandboxCache()
  })

  it('posts the code and stdin, then streams stdout', async () => {
    const calls = mockFetch({ status: '0', program_output: 'Hello, Ada!\n', program_error: '' })
    const { out, handlers } = collect()
    const r = await runWandbox('cpp', 'int main(){}', 'Ada', handlers, new AbortController().signal)
    expect(r).toMatchObject({ summary: { exitCode: 0, signal: null } })
    expect(out).toEqual([['stdout', 'Hello, Ada!\n']])
    expect(calls.at(-1)).toMatchObject({ url: 'https://wandbox.org/api/compile.json', body: { compiler: 'gcc-13.2.0', code: 'int main(){}', stdin: 'Ada', save: false } })
  })

  it('reports compile errors on stderr with a non-zero exit code', async () => {
    mockFetch({ status: '1', compiler_error: "main.cpp:1:1: error: 'x' was not declared" })
    const { out, handlers } = collect()
    const r = await runWandbox('cpp', 'x', '', handlers, new AbortController().signal)
    expect(r).toMatchObject({ summary: { exitCode: 1 } })
    expect(out[0][0]).toBe('stderr')
    expect(out[0][1].endsWith('\n')).toBe(true)
  })

  it('treats a killed program as a time-out', async () => {
    mockFetch({ signal: 'Killed', program_output: 'partial' })
    const { handlers } = collect()
    expect(await runWandbox('java', 'class Main{}', '', handlers, new AbortController().signal)).toMatchObject({ summary: { exitCode: null, signal: 'TIMEOUT' } })
  })

  it('says it is unavailable (so the caller can fall back) when offline, blocked or the language is missing', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    const { handlers } = collect()
    const offline = await runWandbox('go', 'x', '', handlers, new AbortController().signal)
    expect(offline).toMatchObject({ unavailable: expect.stringContaining('Could not reach Wandbox') })
    resetWandboxCache()
    mockFetch({}, { status: 500 })
    expect(await runWandbox('go', 'x', '', handlers, new AbortController().signal)).toMatchObject({ unavailable: expect.stringContaining('HTTP 500') })
    resetWandboxCache()
    mockFetch({}, { list: [] })
    expect(await runWandbox('go', 'x', '', handlers, new AbortController().signal)).toMatchObject({ unavailable: expect.stringContaining('no Go compiler') })
  })

  it('reports Stopped when aborted', async () => {
    const ctl = new AbortController()
    vi.stubGlobal('fetch', vi.fn(async () => { ctl.abort(); throw new DOMException('aborted', 'AbortError') }))
    const { handlers } = collect()
    expect(await runWandbox('go', 'x', '', handlers, ctl.signal)).toMatchObject({ summary: { signal: 'STOPPED' } })
  })
})
