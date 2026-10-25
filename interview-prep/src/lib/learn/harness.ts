// Runs a Learn step: the learner's code plus the step's checks, in one of a few
// environments. Pure JavaScript with injected dependencies (an HTML parser and
// sql.js), so it runs the same in the browser's worker and in the test suite.

import { transform } from 'sucrase'
import type { LearnKind } from '@/data/learn/types'
import { deepEqual, expect, fn, show } from './expect'
import { createDb } from './shims/mongo'
import React, * as ReactShim from './shims/react'
import { EventEmitter, express, memoryFs, nextServer, request } from './shims/server'

export interface CheckResult { name: string; pass: boolean; message?: string }
export interface StepOutcome {
  results: CheckResult[]
  logs: string[]
  /** The code could not run at all (syntax error, crash at the top level). */
  error?: string
  /** A query's result, for SQL steps. */
  table?: { columns: string[]; values: unknown[][] }
}

export interface StepInput {
  kind: LearnKind
  code: string
  tests: [string, string][]
  setup?: string
  /** For `js` steps: compile TypeScript and/or JSX. */
  typescript?: boolean
  jsx?: boolean
}

type SqlStatic = { Database: new () => SqlDb }
interface SqlDb { exec(sql: string): { columns: string[]; values: unknown[][] }[]; close(): void }

export interface HarnessEnv {
  parseHTML: (html: string) => { document: Document }
  sql: () => Promise<SqlStatic>
}

const TEST_TIMEOUT_MS = 1500
const MAX_LOGS = 200

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as new (...args: string[]) => (...a: unknown[]) => Promise<unknown>

function compileJs(code: string, typescript = false, jsx = false): string {
  const transforms: ('typescript' | 'jsx' | 'imports')[] = ['imports']
  if (typescript) transforms.push('typescript')
  if (jsx) transforms.push('jsx')
  return transform(code, { transforms, jsxRuntime: 'classic', production: true, disableESTransforms: true }).code
}

const errorText = (e: unknown) => (e instanceof Error ? `${e.name === 'Error' || e.name === 'AssertionError' ? '' : `${e.name}: `}${e.message}` : String(e))

function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  return Promise.race([
    p.finally(() => clearTimeout(timer)),
    new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(`${what} took too long (a promise that never settles, or a request with no response?)`)), ms) }),
  ])
}

/** Splits a Dockerfile into instructions (continuation lines joined, comments dropped). */
export function dockerInstructions(text: string): { op: string; args: string }[] {
  return text.replace(/\\\r?\n/g, ' ').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => {
    const [op, ...rest] = l.split(/\s+/)
    return { op: op.toUpperCase(), args: rest.join(' ') }
  })
}

/** The declarations of a stylesheet: [{ selector, props: { name: value } }], in order. */
export function cssRules(css: string): { selector: string; props: Record<string, string>; media?: string }[] {
  const out: { selector: string; props: Record<string, string>; media?: string }[] = []
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const re = /([^{}]+)\{([^{}]*)\}|@media([^{]+)\{((?:[^{}]*\{[^{}]*\})*)\s*\}/g
  const parse = (block: string, media?: string) => {
    let m: RegExpExecArray | null
    const inner = /([^{}]+)\{([^{}]*)\}/g
    while ((m = inner.exec(block))) add(m[1], m[2], media)
  }
  const add = (sel: string, body: string, media?: string) => {
    const props: Record<string, string> = {}
    for (const decl of body.split(';')) {
      const i = decl.indexOf(':')
      if (i > 0) props[decl.slice(0, i).trim().toLowerCase()] = decl.slice(i + 1).trim().replace(/\s+/g, ' ')
    }
    for (const s of sel.split(',')) out.push({ selector: s.trim().replace(/\s+/g, ' '), props, media: media?.trim().replace(/\s+/g, ' ') })
  }
  let m: RegExpExecArray | null
  while ((m = re.exec(src))) {
    if (m[3] !== undefined) parse(m[4], m[3])
    else if (!m[1].trim().startsWith('@')) add(m[1], m[2])
  }
  return out
}

/** The last value a stylesheet declares for `prop` on exactly `selector` (outside media queries unless given). */
export function cssValue(css: string, selector: string, prop: string, media?: string): string | undefined {
  const sel = selector.trim().replace(/\s+/g, ' ')
  const want = media?.replace(/\s+/g, ' ').trim()
  let value: string | undefined
  for (const r of cssRules(css)) if (r.selector === sel && (want ? r.media?.includes(want) : !r.media) && prop in r.props) value = r.props[prop]
  return value
}

export async function runStep(input: StepInput, env: HarnessEnv): Promise<StepOutcome> {
  const logs: string[] = []
  const log = (...parts: unknown[]) => {
    if (logs.length < MAX_LOGS) logs.push(parts.map((p) => (typeof p === 'string' ? p : show(p))).join(' '))
  }
  const fakeConsole = { log, info: log, warn: log, error: log, table: log, debug: log }
  const registered: { name: string; body: () => Promise<unknown> }[] = []

  // Globals every check can use.
  const base: Record<string, unknown> = { expect, fn, deepEqual, console: fakeConsole, code: input.code }
  const testsSource = input.tests.map(([name], i) => `__test(${JSON.stringify(name)}, async () => {\n${input.tests[i][1]}\n})`).join('\n')

  const runRegistered = async (): Promise<CheckResult[]> => {
    const results: CheckResult[] = []
    for (const t of registered) {
      try {
        await withTimeout(Promise.resolve().then(t.body), TEST_TIMEOUT_MS, 'This check')
        results.push({ name: t.name, pass: true })
      } catch (e) {
        results.push({ name: t.name, pass: false, message: errorText(e) })
      }
    }
    return results
  }
  const __test = (name: string, body: () => Promise<unknown>) => registered.push({ name, body })

  /** Runs `source` with `scope` as variables; the checks are appended so they see the learner's declarations. */
  const evaluate = async (source: string, scope: Record<string, unknown>) => {
    const names = Object.keys(scope)
    // Checks may use JSX or TypeScript too (no imports, so no module transform).
    const checks = input.kind === 'js' && (input.jsx || input.typescript)
      ? transform(testsSource, { transforms: [...(input.typescript ? ['typescript' as const] : []), ...(input.jsx ? ['jsx' as const] : [])], jsxRuntime: 'classic', production: true, disableESTransforms: true }).code
      : testsSource
    const f = new AsyncFunction(...names, '__test', `${source}\n;${checks}`)
    await f(...names.map((n) => scope[n]), __test)
  }

  try {
    switch (input.kind) {
      case 'js': {
        const fs = memoryFs({})
        const modules: Record<string, unknown> = {
          events: { EventEmitter, default: EventEmitter }, 'node:events': { EventEmitter, default: EventEmitter },
          'fs/promises': fs, 'node:fs/promises': fs,
          express: Object.assign(express, { default: express }),
          react: { ...ReactShim, default: React }, 'next/server': nextServer,
        }
        const mod = { exports: {} as Record<string, unknown> }
        const require = (name: string) => {
          if (name in modules) return modules[name]
          throw new Error(`Cannot find module '${name}' (only ${Object.keys(modules).filter((m) => !m.startsWith('node:')).join(', ')} are available here)`)
        }
        let source: string
        try {
          const setup = input.setup ? compileJs(input.setup, true, true) : ''
          source = `${setup}\n;${compileJs(input.code, input.typescript, input.jsx)}`
        } catch (e) {
          return { results: [], logs, error: `SyntaxError: ${errorText(e).replace(/^SyntaxError: /, '')}` }
        }
        const scope = {
          ...base, module: mod, exports: mod.exports, require, React,
          render: ReactShim.render, request, createDb, files: fs.files, EventEmitter,
        }
        try {
          await withTimeout(evaluate(source, scope), TEST_TIMEOUT_MS * 2, 'Your code')
        } catch (e) {
          return { results: [], logs, error: errorText(e) }
        }
        return { results: await runRegistered(), logs }
      }

      case 'html':
      case 'css': {
        const html = input.kind === 'html' ? input.code : (input.setup ?? '')
        const stylesheet = input.kind === 'css' ? input.code : [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n')
        const { document } = env.parseHTML(html)
        const scope = {
          ...base, document,
          $: (s: string) => document.querySelector(s),
          $$: (s: string) => [...document.querySelectorAll(s)],
          css: (selector: string, prop: string, media?: string) => cssValue(stylesheet, selector, prop, media),
          rules: () => cssRules(stylesheet),
          stylesheet,
        }
        await evaluate('', scope)
        return { results: await runRegistered(), logs }
      }

      case 'sql': {
        const SQL = await env.sql()
        const fresh = () => {
          const db = new SQL.Database()
          if (input.setup) db.exec(input.setup)
          return db
        }
        const db = fresh()
        let last: { columns: string[]; values: unknown[][] } | undefined
        try {
          const out = db.exec(input.code)
          last = out.at(-1)
        } catch (e) {
          db.close()
          return { results: [], logs, error: `SQL error: ${errorText(e)}` }
        }
        const run = (sql: string, d: SqlDb) => {
          const r = d.exec(sql).at(-1)
          return { columns: r?.columns ?? [], rows: r?.values ?? [] }
        }
        const scope = {
          ...base,
          result: { columns: last?.columns ?? [], rows: last?.values ?? [] },
          /** Runs SQL on the learner's database (after their code). */
          query: (sql: string) => run(sql, db),
          /** Runs SQL on a fresh copy of the starting data. */
          reference: (sql: string) => {
            const d = fresh()
            try {
              return run(sql, d)
            } finally {
              d.close()
            }
          },
        }
        await evaluate('', scope)
        const results = await runRegistered()
        db.close()
        return { results, logs, table: last ? { columns: last.columns, values: last.values.slice(0, 50) } : undefined }
      }

      case 'testing': {
        // The learner writes tests; they must pass on the correct code and catch every bug.
        let spec: { name: string; correct: unknown; bugs: Record<string, unknown> }
        try {
          spec = new Function('fn', `return (${input.setup})`)(fn)
        } catch (e) {
          return { results: [], logs, error: `Lesson setup error: ${errorText(e)}` }
        }
        let compiled: string
        try {
          compiled = compileJs(input.code)
        } catch (e) {
          return { results: [], logs, error: `SyntaxError: ${errorText(e).replace(/^SyntaxError: /, '')}` }
        }
        const runSuite = async (impl: unknown) => {
          const suite: { name: string; body: () => unknown }[] = []
          const test = (name: string, body: () => unknown) => suite.push({ name, body })
          const describe = (_n: string, body: () => void) => body()
          const f = new AsyncFunction(spec.name, 'test', 'it', 'describe', 'expect', 'fn', 'vi', 'console', compiled)
          await f(impl, test, test, describe, expect, fn, { fn }, fakeConsole)
          const failures: string[] = []
          for (const t of suite) {
            try {
              await withTimeout(Promise.resolve().then(t.body), TEST_TIMEOUT_MS, `Test "${t.name}"`)
            } catch (e) {
              failures.push(`${t.name}: ${errorText(e)}`)
            }
          }
          return { count: suite.length, failures }
        }
        let good: Awaited<ReturnType<typeof runSuite>>
        try {
          good = await runSuite(spec.correct)
        } catch (e) {
          return { results: [], logs, error: errorText(e) }
        }
        const results: CheckResult[] = [
          { name: 'You wrote at least one test', pass: good.count > 0, message: good.count ? undefined : 'Call test("…", () => { … }) at least once.' },
          { name: 'Your tests pass on the correct code', pass: good.count > 0 && good.failures.length === 0, message: good.failures.length ? `A test fails on correct code. ${good.failures[0]}` : undefined },
        ]
        for (const [bug, impl] of Object.entries(spec.bugs)) {
          let caught = false
          try {
            caught = (await runSuite(impl)).failures.length > 0
          } catch {
            caught = true
          }
          results.push({ name: `Catches the bug: ${bug}`, pass: good.count > 0 && caught, message: caught ? undefined : 'Every test still passes with this bug. Add an assertion that would notice it.' })
        }
        return { results, logs }
      }

      case 'text': {
        const lines = input.code.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
        const scope = { ...base, lines, instructions: dockerInstructions(input.code), text: input.code }
        await evaluate('', scope)
        return { results: await runRegistered(), logs }
      }
    }
  } catch (e) {
    return { results: [], logs, error: errorText(e) }
  }
}
