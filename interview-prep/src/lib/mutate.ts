// Bug injection for Endless mode. Each operator finds sites in correct code
// and swaps in a realistic mistake. scripts/build-bank.ts keeps only the
// mutants that compile and fail at least one test.

export type BugCategory =
  | 'off-by-one'
  | 'comparison'
  | 'logic'
  | 'initial-value'
  | 'arithmetic'
  | 'wrong-function'
  | 'return-value'

export interface Operator {
  id: string
  category: BugCategory
  pattern: RegExp
  replace: string
}

export const CATEGORY_INFO: Record<BugCategory, { label: string; hint: string }> = {
  'off-by-one': { label: 'Off-by-one', hint: 'Something is off by exactly one: a + 1 / - 1, or a ++ / -- going the wrong way.' },
  comparison: { label: 'Comparison', hint: 'A comparison operator is wrong: think < vs <=, > vs >=, or the direction of the check.' },
  logic: { label: 'Logic', hint: 'A boolean check is inverted or uses the wrong connective (=== vs !==, && vs ||).' },
  'initial-value': { label: 'Initial value', hint: 'A variable starts with the wrong value.' },
  arithmetic: { label: 'Arithmetic', hint: 'An update adds where it should subtract (or the other way round).' },
  'wrong-function': { label: 'Wrong function', hint: 'A built-in function is swapped for its opposite.' },
  'return-value': { label: 'Return value', hint: 'The function returns the wrong boolean somewhere.' },
}

export const OPERATORS: Operator[] = [
  { id: 'lt-to-lte', category: 'comparison', pattern: /(?<![<=!])<(?![=<])/g, replace: '<=' },
  { id: 'lte-to-lt', category: 'comparison', pattern: /<=/g, replace: '<' },
  { id: 'gt-to-gte', category: 'comparison', pattern: /(?<![=>-])>(?![=>])/g, replace: '>=' },
  { id: 'gte-to-gt', category: 'comparison', pattern: /(?<![=>])>=/g, replace: '>' },
  { id: 'lt-to-gt', category: 'comparison', pattern: /(?<![<=!])<(?![=<])/g, replace: '>' },
  { id: 'gt-to-lt', category: 'comparison', pattern: /(?<![=>-])>(?![=>])/g, replace: '<' },
  { id: 'eq-to-neq', category: 'logic', pattern: /===/g, replace: '!==' },
  { id: 'neq-to-eq', category: 'logic', pattern: /!==/g, replace: '===' },
  { id: 'and-to-or', category: 'logic', pattern: /&&/g, replace: '||' },
  { id: 'or-to-and', category: 'logic', pattern: /\|\|/g, replace: '&&' },
  { id: 'plus-one', category: 'off-by-one', pattern: /\+ 1\b/g, replace: '- 1' },
  { id: 'minus-one', category: 'off-by-one', pattern: /- 1\b/g, replace: '+ 1' },
  { id: 'inc-to-dec', category: 'off-by-one', pattern: /\+\+/g, replace: '--' },
  { id: 'dec-to-inc', category: 'off-by-one', pattern: /--/g, replace: '++' },
  { id: 'zero-to-one', category: 'initial-value', pattern: /(?<=\w = )0(?=;)/g, replace: '1' },
  { id: 'add-to-sub', category: 'arithmetic', pattern: /\+=/g, replace: '-=' },
  { id: 'sub-to-add', category: 'arithmetic', pattern: /-=/g, replace: '+=' },
  { id: 'max-to-min', category: 'wrong-function', pattern: /Math\.max/g, replace: 'Math.min' },
  { id: 'min-to-max', category: 'wrong-function', pattern: /Math\.min/g, replace: 'Math.max' },
  { id: 'true-to-false', category: 'return-value', pattern: /return true/g, replace: 'return false' },
  { id: 'false-to-true', category: 'return-value', pattern: /return false/g, replace: 'return true' },
]

export const OPERATORS_BY_ID = Object.fromEntries(OPERATORS.map((o) => [o.id, o]))

export interface Mutation {
  op: string
  start: number
  end: number
  replacement: string
}

/** Every place each operator could apply, in a stable order. */
export function findMutations(code: string): Mutation[] {
  const out: Mutation[] = []
  for (const op of OPERATORS) {
    for (const m of code.matchAll(op.pattern)) {
      out.push({ op: op.id, start: m.index, end: m.index + m[0].length, replacement: op.replace })
    }
  }
  return out
}

export function applyMutation(code: string, m: Mutation): string {
  return code.slice(0, m.start) + m.replacement + code.slice(m.end)
}

/** 1-based line number of a character offset. */
export function lineOf(code: string, offset: number): number {
  return code.slice(0, offset).split('\n').length
}
