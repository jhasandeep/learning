import { spawn } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ServerLang } from '@/data/languages'
import { FILE_NAMES, LIMITS, truncate, type Backend, type RunResult } from './types'

// DEVELOPMENT ONLY. Runs code with the compilers installed on this machine,
// with time and output limits but NO sandbox: the code can read files and use
// the network as the server user. Never enable on a public deployment — use
// Piston or Judge0 there. getBackend() refuses it in production.

interface Recipe {
  compile?: string[]
  run: string[]
}

const RECIPES: Record<ServerLang, Recipe> = {
  c: { compile: ['gcc', '-O2', '-std=c17', 'main.c', '-o', 'main', '-lm'], run: ['./main'] },
  cpp: { compile: ['g++', '-O2', '-std=c++17', 'main.cpp', '-o', 'main'], run: ['./main'] },
  java: { compile: ['javac', 'Main.java'], run: ['java', '-Xss64m', 'Main'] },
  kotlin: { compile: ['kotlinc', 'Main.kt', '-include-runtime', '-d', 'main.jar'], run: ['java', '-jar', 'main.jar'] },
  csharp: { compile: ['mcs', '-out:main.exe', 'Main.cs'], run: ['mono', 'main.exe'] },
  go: { compile: ['go', 'build', '-o', 'main', 'main.go'], run: ['./main'] },
  rust: { compile: ['rustc', '-O', '--edition', '2021', 'main.rs', '-o', 'main'], run: ['./main'] },
  scala: { compile: ['scalac', 'Main.scala'], run: ['scala', 'Main'] },
  dart: { run: ['dart', 'run', 'main.dart'] },
  ruby: { run: ['ruby', 'main.rb'] },
  php: { run: ['php', 'main.php'] },
  swift: { compile: ['swiftc', '-O', 'main.swift', '-o', 'main'], run: ['./main'] },
}

interface ProcResult { stdout: string; stderr: string; code: number | null; signal: string | null; missing: boolean }

function exec(cmd: string[], cwd: string, input: string, timeoutMs: number): Promise<ProcResult> {
  return new Promise((resolve) => {
    const child = spawn(cmd[0], cmd.slice(1), {
      cwd,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PATH: process.env.PATH ?? '/usr/bin:/bin',
        HOME: cwd,
        GOCACHE: join(tmpdir(), 'preparena-go-cache'),
        GOPATH: join(tmpdir(), 'preparena-go-path'),
        // rustup keeps its toolchain settings under the real home directory
        RUSTUP_HOME: process.env.RUSTUP_HOME ?? join(homedir(), '.rustup'),
        CARGO_HOME: process.env.CARGO_HOME ?? join(homedir(), '.cargo'),
        LANG: 'C.UTF-8',
      },
    })
    let stdout = ''
    let stderr = ''
    let killed: string | null = null
    const cap = (cur: string, chunk: Buffer) => (cur.length > LIMITS.maxOutputBytes * 2 ? cur : cur + chunk.toString('utf8'))
    child.stdout.on('data', (c: Buffer) => { stdout = cap(stdout, c) })
    child.stderr.on('data', (c: Buffer) => { stderr = cap(stderr, c) })
    const timer = setTimeout(() => {
      killed = 'TIMEOUT'
      child.kill('SIGKILL')
    }, timeoutMs)
    child.on('error', (err: NodeJS.ErrnoException) => {
      clearTimeout(timer)
      resolve({ stdout, stderr: err.code === 'ENOENT' ? `${cmd[0]}: not installed on this server` : String(err), code: null, signal: null, missing: err.code === 'ENOENT' })
    })
    child.on('close', (code, signal) => {
      clearTimeout(timer)
      resolve({ stdout, stderr, code, signal: killed ?? signal, missing: false })
    })
    child.stdin.on('error', () => {}) // program exited before reading all input
    child.stdin.end(input)
  })
}

export function localBackend(): Backend {
  return {
    name: 'local',
    async run({ language, code, stdin }): Promise<RunResult> {
      const recipe = RECIPES[language]
      const dir = await mkdtemp(join(tmpdir(), 'preparena-run-'))
      const start = Date.now()
      try {
        await writeFile(join(dir, FILE_NAMES[language]), code)
        if (recipe.compile) {
          const c = await exec(recipe.compile, dir, '', LIMITS.compileTimeoutMs)
          if (c.code !== 0) {
            return {
              compileOutput: truncate(c.signal === 'TIMEOUT' ? 'Compilation timed out.' : `${c.stderr}${c.stdout}`),
              stdout: '', stderr: '', exitCode: c.code, signal: c.signal, timeMs: Date.now() - start, backend: 'local',
            }
          }
        }
        const r = await exec(recipe.run, dir, stdin, LIMITS.runTimeoutMs)
        return {
          compileOutput: '',
          stdout: truncate(r.stdout),
          stderr: truncate(r.stderr),
          exitCode: r.code,
          signal: r.signal,
          timeMs: Date.now() - start,
          backend: 'local',
        }
      } finally {
        await rm(dir, { recursive: true, force: true })
      }
    },
  }
}
