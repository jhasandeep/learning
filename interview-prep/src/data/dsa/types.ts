// The DSA course: every lesson teaches one problem step by step in Python and JavaScript, from the
// plain brute-force idea to the best solution, then lets you code it in the browser.
// Text fields support the notes mini-markup (`code`, **bold**, ==highlight==).

export type Lang = 'python' | 'javascript'
export type Both<T = string> = Record<Lang, T>

/** One test for the practice function. Values are language-neutral JSON: `null` means "nothing" (None / null). */
export interface Case {
  label: string
  args: unknown[]
  expected: unknown
}

/** One frame of the dry run: what has happened so far, shown as boxes, pointers and variables. */
export interface Frame {
  caption: string
  /** Variables and their current values. */
  vars?: [string, string][]
  /** The main array or string, drawn as boxes. */
  array?: { label?: string; cells: (string | number)[]; /** pointer name → index */ pointers?: Record<string, number>; /** indexes to highlight */ marks?: number[] }
  /** A second structure (a hash map, a stack, the answer being built), drawn as chips. */
  extra?: { label: string; items: string[] }
}

export interface DryRun {
  title: string
  /** What we run it on, e.g. `nums = [3, 1, 4, 2]`. */
  input: string
  frames: Frame[]
}

/** One stage of building the solution. */
export interface BuildStep {
  title: string
  /** How good this stage is: shown as a coloured tag. */
  tag: 'idea' | 'slow' | 'better' | 'best'
  /** The thinking behind this stage, in plain words. */
  idea: string
  /** What the code does, in order. Applies to both languages. */
  walk: string[]
  code: Both
  time: string
  space: string
  /** One line: the honest verdict, e.g. "Works, but slow for big inputs". */
  verdict?: string
  /** A deliberate trap: this code looks right but fails some inputs, and the lesson explains why. */
  buggy?: boolean
}

export interface Practice {
  /** The function name in each language. */
  fn: Both
  starter: Both
  cases: Case[]
  /** Compare lists without caring about order. */
  unordered?: boolean
  hints: string[]
  /** Defaults to the code of the last build step. */
  solution?: Both
}

export interface Lesson {
  id: string
  title: string
  /** The pattern or idea this lesson is about, e.g. "Hash map". */
  topic: string
  /** One line for the lesson list. */
  blurb: string
  analogy: { emoji: string; title: string; text: string }
  problem: { statement: string; examples: { input: string; output: string; why?: string }[]; constraints?: string[] }
  steps: BuildStep[]
  dryRun: DryRun
  practice: Practice
  mistakes: string[]
  /** Small changes to try next. */
  variants: string[]
  /** One sentence to remember. */
  recap: string
}

export interface DsaModule {
  id: string
  title: string
  level: 'Foundations' | 'Easy' | 'Patterns' | 'Medium' | 'Hard'
  blurb: string
  color: string
  lessons: Lesson[]
}
