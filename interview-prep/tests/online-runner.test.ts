import { execFileSync, execSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LANGUAGES, type ServerLang } from '@/data/languages'
import { ONLINE, prepareSource, publicBackend } from '@/lib/exec/public'

type Call = { url: string; body?: Record<string, unknown> }

/** A fake fetch that records calls and answers from `reply`. */
function fakeFetch(reply: (call: Call) => Response) {
  const calls: Call[] = []
  const impl = (async (url: string, init?: RequestInit) => {
    const call = { url, body: init?.body ? JSON.parse(String(init.body)) : undefined }
    calls.push(call)
    return reply(call)
  }) as unknown as typeof fetch
  return { calls, impl }
}

const has = (cmd: string) => {
  try {
    execSync(`command -v ${cmd}`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

describe('online runner', () => {
  it('covers every server language', () => {
    for (const l of LANGUAGES.filter((x) => x.engine === 'server')) expect(ONLINE[l.runtime as ServerLang], l.id).toBeDefined()
  })

  it('sends code and stdin to Wandbox and maps the output', async () => {
    const f = fakeFetch(() => Response.json({ status: '0', program_output: 'Hello, Ada!\n', program_error: '' }))
    const r = await publicBackend(f.impl).run({ language: 'go', code: 'package main', stdin: 'Ada\n' })
    expect(f.calls[0].url).toBe('https://wandbox.org/api/compile.json')
    expect(f.calls[0].body).toMatchObject({ compiler: ONLINE.go.compiler, code: 'package main', stdin: 'Ada\n', save: false })
    expect(r).toMatchObject({ stdout: 'Hello, Ada!\n', stderr: '', compileOutput: '', exitCode: 0 })
    expect(r.backend).toContain('wandbox')
  })

  it('reports compile errors from Wandbox as compiler output', async () => {
    const f = fakeFetch(() => Response.json({ status: '1', compiler_error: 'prog.c:1: error: expected ;' }))
    const r = await publicBackend(f.impl).run({ language: 'c', code: 'int main( {', stdin: '' })
    expect(r.compileOutput).toContain('error')
    expect(r.stdout).toBe('')
    expect(r.exitCode).toBe(1)
  })

  it('falls back to the newest compiler when Wandbox retires a version', async () => {
    const f = fakeFetch(({ url, body }) => {
      if (url.endsWith('/list.json')) return Response.json([{ name: 'rust-head', language: 'Rust' }, { name: 'rust-1.99.0', language: 'Rust' }, { name: 'go-1.30', language: 'Go' }])
      return body?.compiler === 'rust-1.99.0' ? Response.json({ status: '0', program_output: 'ok\n' }) : new Response('compiler not found', { status: 400 })
    })
    const backend = publicBackend(f.impl)
    const r = await backend.run({ language: 'rust', code: 'fn main(){}', stdin: '' })
    expect(r.stdout).toBe('ok\n')
    expect(r.backend).toContain('rust-1.99.0')
    // The new name is remembered: the next run goes straight to it.
    await backend.run({ language: 'rust', code: 'fn main(){}', stdin: '' })
    expect(f.calls.at(-1)!.body!.compiler).toBe('rust-1.99.0')
  })

  it('runs Kotlin and Dart on Compiler Explorer', async () => {
    const f = fakeFetch(() => Response.json({ code: 0, didExecute: true, stdout: [{ text: 'Hello, Ada!' }], stderr: [], buildResult: { code: 0, stdout: [], stderr: [] } }))
    const r = await publicBackend(f.impl).run({ language: 'kotlin', code: 'fun main() {}', stdin: 'Ada' })
    expect(f.calls[0].url).toBe(`https://godbolt.org/api/compiler/${ONLINE.kotlin.compiler}/compile`)
    expect(f.calls[0].body).toMatchObject({ source: 'fun main() {}', options: { executeParameters: { stdin: 'Ada' }, filters: { execute: true }, compilerOptions: { executorRequest: true } } })
    expect(r).toMatchObject({ stdout: 'Hello, Ada!\n', exitCode: 0, compileOutput: '' })
  })

  it('reports Compiler Explorer build failures', async () => {
    const f = fakeFetch(() => Response.json({ code: -1, didExecute: false, stdout: [], stderr: [], buildResult: { code: 1, stdout: [], stderr: [{ text: 'main.dart:1: Error: Expected ;' }] } }))
    const r = await publicBackend(f.impl).run({ language: 'dart', code: 'void main() { print(1) }', stdin: '' })
    expect(r.compileOutput).toContain('Expected ;')
    expect(r.exitCode).toBe(1)
  })
})

describe('preparing Java and Scala for Wandbox', () => {
  it('adds a `prog` launcher that calls the class with main', () => {
    const out = prepareSource('java', 'import java.util.*;\n\npublic class Helper {}\npublic class Main {\n  public static void main(String[] args) {}\n}\n')
    expect(out).not.toMatch(/^public class/m)
    expect(out).toContain('class prog')
    expect(out).toContain('Main.main(args)')
    expect(prepareSource('java', 'class prog { public static void main(String[] a) {} }')).toBe('class prog { public static void main(String[] a) {} }')
  })

  it('adds a launcher for a Scala object or an @main method', () => {
    expect(prepareSource('scala', 'object Main {\n  def main(args: Array[String]): Unit = println(1)\n}')).toContain('Main.main(args)')
    expect(prepareSource('scala', '@main def hello() = println(1)')).toContain('hello()')
  })

  it('leaves other languages alone', () => {
    expect(prepareSource('cpp', 'int main(){}')).toBe('int main(){}')
  })

  it.skipIf(!has('javac'))('compiles the Java starter template as prog.java and runs `java prog`', () => {
    const dir = mkdtempSync(join(tmpdir(), 'wandbox-java-'))
    try {
      const java = LANGUAGES.find((l) => l.id === 'java')!
      writeFileSync(join(dir, 'prog.java'), prepareSource('java', java.template.replace('class Main', 'public class Main')))
      try {
        execFileSync('javac', ['prog.java'], { cwd: dir, stdio: 'pipe' })
      } catch (e) {
        throw new Error(String((e as { stderr?: Buffer }).stderr ?? e))
      }
      expect(execFileSync('java', ['prog'], { cwd: dir, input: 'Ada\n' }).toString()).toContain('Hello, Ada!')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }, 60_000)
})
