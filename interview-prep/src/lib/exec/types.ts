import type { ServerLang } from '@/data/languages'

export interface RunRequest {
  language: ServerLang
  code: string
  stdin: string
}

export interface RunResult {
  /** Compiler output when compilation failed (or printed warnings). */
  compileOutput: string
  stdout: string
  stderr: string
  exitCode: number | null
  /** Set when the process was killed, e.g. 'TIMEOUT' or 'SIGKILL'. */
  signal: string | null
  timeMs: number
  backend: string
}

export interface Backend {
  name: string
  run(req: RunRequest): Promise<RunResult>
}

export const LIMITS = {
  maxCodeBytes: 64 * 1024,
  maxStdinBytes: 64 * 1024,
  maxOutputBytes: 64 * 1024,
  compileTimeoutMs: 20_000,
  runTimeoutMs: 6_000,
}

export function truncate(s: string, max = LIMITS.maxOutputBytes): string {
  return s.length > max ? `${s.slice(0, max)}\n… output truncated at ${Math.round(max / 1024)} KB` : s
}

/** Source file name each toolchain expects. Java/Kotlin/C#/Scala use Main. */
export const FILE_NAMES: Record<ServerLang, string> = {
  c: 'main.c', cpp: 'main.cpp', java: 'Main.java', kotlin: 'Main.kt', csharp: 'Main.cs', go: 'main.go',
  rust: 'main.rs', scala: 'Main.scala', dart: 'main.dart', ruby: 'main.rb', php: 'main.php', swift: 'main.swift',
}
