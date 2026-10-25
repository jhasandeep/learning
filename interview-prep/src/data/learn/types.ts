// Learn: step-by-step coding lessons, one track per technology (same ids as
// the question sets). Text fields support the notes mini-markup: `code`,
// **bold** and ==highlight==; `learn` paragraphs are separated by blank lines.

/**
 * How a step is checked (see src/lib/learn/harness.ts):
 * - js: JavaScript (optionally TypeScript / JSX). Checks see the learner's
 *   declarations, plus `expect`, `fn`, `render` (mini React), `request(app)`
 *   (mini Express), `createDb` (mini MongoDB) and `module.exports`.
 * - html: the code is a page; checks get `document`, `$`, `$$` and `css(selector, prop)`.
 * - css: the code is a stylesheet for the step's `setup` page; same helpers.
 * - sql: SQLite; `setup` creates the data. Checks get `result`, `query(sql)` and `reference(sql)`.
 * - testing: the learner writes tests; `setup` is `{ name, correct, bugs }`. Generated checks.
 * - text: commands or a Dockerfile; checks get `lines`, `instructions` and `text`.
 */
export type LearnKind = 'js' | 'html' | 'css' | 'sql' | 'testing' | 'text'

export interface LearnStep {
  /** kebab-case, unique within the track (used in URLs). */
  id: string
  title: string
  /** The idea, explained briefly. Paragraphs separated by blank lines; "- " lines are bullets. */
  learn: string
  /** What to do in this step. */
  task: string
  starter: string
  solution: string
  /** [label shown to the learner, check code]. A check passes unless it throws. */
  tests: [string, string][]
  /** From a nudge to nearly the answer. */
  hints: string[]
  setup?: string
  /** Overrides the track's kind for this step. */
  kind?: LearnKind
  /** Overrides the track's editor language for this step. */
  lang?: string
}

export interface LearnTrack {
  id: string
  /** One or two sentences: what you can do after this track. */
  intro: string
  kind: LearnKind
  /** Editor language (code-editor ids: javascript, typescript, html, css, sql, …). */
  lang: string
  typescript?: boolean
  jsx?: boolean
  steps: LearnStep[]
}
