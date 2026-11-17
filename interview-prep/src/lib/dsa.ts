import type { RunTask } from '@/data/tasks/types'
import type { Both, Case, Lang, Lesson, Practice } from '@/data/dsa/types'

// Turns a lesson's language-neutral test cases into the checks the in-browser runner understands.

const LANG_ID: Record<Lang, 'python' | 'javascript'> = { python: 'python', javascript: 'javascript' }

function toPy(v: unknown): string {
  if (v === null || v === undefined) return 'None'
  if (v === true) return 'True'
  if (v === false) return 'False'
  if (Array.isArray(v)) return `[${v.map(toPy).join(', ')}]`
  if (typeof v === 'object') return `{${Object.entries(v as Record<string, unknown>).map(([k, x]) => `${JSON.stringify(k)}: ${toPy(x)}`).join(', ')}}`
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'float("inf")'
  return JSON.stringify(v)
}

const toJs = (v: unknown) => JSON.stringify(v === undefined ? null : v)

const PY_HELPERS = `def __n(v):
    if isinstance(v, tuple):
        v = list(v)
    if isinstance(v, list):
        return [__n(x) for x in v]
    if isinstance(v, dict):
        return {k: __n(x) for k, x in v.items()}
    return v

def __u(v):
    return sorted(repr(__n(x)) for x in v)
`

const JS_HELPERS = `const __n = (v) => JSON.stringify(v === undefined ? null : v);
const __u = (v) => JSON.stringify([...v].map((x) => JSON.stringify(x)).sort());
`

function pyCase(fn: string, c: Case, unordered: boolean): string {
  const call = `${fn}(${c.args.map(toPy).join(', ')})`
  const body = unordered ? `__u(${call}) == __u(${toPy(c.expected)})` : `__n(${call}) == ${toPy(c.expected)}`
  return `check(${JSON.stringify(c.label)}, lambda: ${body})`
}

function jsCase(fn: string, c: Case, unordered: boolean): string {
  const call = `${fn}(${c.args.map(toJs).join(', ')})`
  const body = unordered ? `__u(${call}) === __u(${toJs(c.expected)})` : `__n(${call}) === __n(${toJs(c.expected)})`
  return `check(${JSON.stringify(c.label)}, () => ${body})`
}

/** The checks appended after the learner's code. */
export function buildHarness(lang: Lang, p: Practice): string {
  const fn = p.fn[lang]
  const unordered = Boolean(p.unordered)
  if (lang === 'python') return `${PY_HELPERS}\n${p.cases.map((c) => pyCase(fn, c, unordered)).join('\n')}`
  return `${JS_HELPERS}\n${p.cases.map((c) => jsCase(fn, c, unordered)).join('\n')}`
}

/** The lesson's practice as a runnable task for the existing task runner. */
export function practiceTask(lesson: Lesson, lang: Lang): RunTask {
  const p = lesson.practice
  return {
    id: lesson.id,
    kind: 'run',
    title: lesson.title,
    goal: lesson.blurb,
    steps: [],
    starter: p.starter[lang],
    hints: p.hints,
    solution: practiceSolution(lesson)[lang],
    learned: lesson.recap,
    language: LANG_ID[lang],
    harness: buildHarness(lang, p),
  }
}

export function practiceSolution(lesson: Lesson): Both {
  return lesson.practice.solution ?? lesson.steps[lesson.steps.length - 1].code
}

/** Progress key for a lesson (shares the Tasks progress store, so XP and streaks just work). */
export const lessonKey = (moduleId: string, lessonId: string) => `dsa/${moduleId}/${lessonId}`
