// Task-based learning: every technology has a short path of hands-on tasks.
// A task gives a goal, starter code and a checklist of requirements; "Check my work"
// ticks each requirement that is met. Text fields support the notes mini-markup
// (`code`, **bold**, ==highlight==).

/** A static check on the code you wrote (for technologies that cannot run in the browser). */
export interface Rule {
  /** The requirement as the learner sees it, e.g. "Uses a <label> for each input". */
  label: string
  /** Must match somewhere in the code (tested without comments). */
  match: RegExp
  /** How many matches are needed (default 1). */
  min?: number
  /** Passes only when the pattern is NOT found. */
  absent?: boolean
  /** Shown when this requirement fails. */
  hint?: string
}

interface Base {
  id: string
  title: string
  /** One line: what you will build or fix. */
  goal: string
  /** Numbered instructions, small and concrete. */
  steps: string[]
  starter: string
  /** Progressive hints, vague to specific. */
  hints: string[]
  /** A complete answer, shown on request and used by the tests. */
  solution: string
  /** One sentence on what this task teaches. */
  learned: string
}

/** Your code runs in the browser, then `harness` calls check(label, () => boolean) for each requirement. */
export interface RunTask extends Base {
  kind: 'run'
  language: 'javascript' | 'typescript' | 'python'
  harness: string
  /** Extra static requirements, e.g. "uses reduce" or "declares an interface". */
  rules?: Rule[]
}

/** Your SQL runs on the sample database; the last result must equal `expect`. */
export interface SqlTask extends Base {
  kind: 'sql'
  language: 'sql'
  expect: { columns?: string[]; rows: (string | number | null)[][]; ordered?: boolean }
  /** A query run after yours, to prove an INSERT / UPDATE / DELETE worked. Its result is compared instead. */
  after?: string
}

/** A MongoDB task, checked the same way as the playground lessons. */
export interface MongoTask extends Base {
  kind: 'mongo'
  language: 'mongodb'
  verify?: string
  ordered?: boolean
}

/** Static checks on the code. */
export interface RuleTask extends Base {
  kind: 'rules'
  language: string
  rules: Rule[]
}

export type Task = RunTask | SqlTask | MongoTask | RuleTask

export interface TaskPath {
  /** Same id as the notes topic, so logo and colour are shared. */
  id: string
  title: string
  blurb: string
  tasks: Task[]
}

export interface CheckItem {
  label: string
  pass: boolean
  /** Why it failed, when known. */
  detail?: string
}
