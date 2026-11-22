// Mistakes: short programs with one syntax or logic mistake. Two ways to
// practise each one: fix the broken code, or write the whole thing from
// scratch (syntax practice). Both are checked by the same checks, run in the
// browser by the Learn engine (src/lib/learn/harness.ts). Text fields support
// the notes mini-markup: `code`, **bold** and ==highlight==.

import type { LearnKind } from '../learn/types'

export type MistakeDifficulty = 'Easy' | 'Medium' | 'Hard'

/** One fake HTTP request for an Express program: [method, url, body?]. */
export type MistakeRequest = [method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string, body?: unknown]

export interface MistakeItem {
  /** kebab-case, unique within its set (used in URLs). */
  id: string
  title: string
  /** What the program should do. */
  task: string
  /** The code with the mistake. */
  broken: string
  /** The correct, complete code. */
  solution: string
  /** [label, check code]. A check passes unless it throws (see LearnStep.tests). */
  tests: [string, string][]
  /** Lines to show after running, e.g. the server's responses. Express items list requests instead. */
  requests?: MistakeRequest[]
  /** Code run after your code whose console.log output is shown as "Output" (any `js` item). */
  demo?: string
  /** Page / database for html, css and sql items. */
  setup?: string
  /** What was wrong and why the fix works. */
  explain: string
  hints: string[]
  difficulty: MistakeDifficulty
}

export interface MistakeSet {
  /** Same id as the question set of the technology. */
  id: string
  title: string
  kind: LearnKind
  /** Editor language. */
  lang: string
  jsx?: boolean
  typescript?: boolean
  items: MistakeItem[]
}

/** The code for the "Output" panel: runs the requests (or the demo) after the program. */
export function demoSource(item: MistakeItem): string {
  const parts: string[] = []
  if (item.requests?.length) {
    parts.push(`const __send = async (m, url, body) => {
  const r = await request(app)[m.toLowerCase()](url, body)
  console.log(m + ' ' + url + (body === undefined ? '' : ' ' + JSON.stringify(body)) + '\\n  -> ' + r.status + ' ' + r.text)
}`)
    for (const [m, url, body] of item.requests) parts.push(`await __send(${JSON.stringify(m)}, ${JSON.stringify(url)}${body === undefined ? '' : `, ${JSON.stringify(body)}`})`)
  }
  if (item.demo) parts.push(item.demo)
  return parts.join('\n')
}

/** Checks for an item plus the hidden "Output" check (always passes; its console.log lines are the output). */
export const OUTPUT_CHECK = '__output'

export function itemChecks(item: MistakeItem): [string, string][] {
  const demo = demoSource(item)
  if (!demo) return item.tests
  const guarded = `try {\n${demo}\n} catch (e) { console.log('Error: ' + (e && e.message ? e.message : e)) }`
  return [...item.tests, [OUTPUT_CHECK, guarded]]
}

/** Starting code for "write it yourself": the task as a comment, nothing else. */
export function blankStart(item: MistakeItem, comment: string): string {
  const lines = item.task.replace(/[`*=]/g, '').split('\n').map((l) => `${comment} ${l}`.trimEnd())
  return `${lines.join('\n')}\n\n`
}
