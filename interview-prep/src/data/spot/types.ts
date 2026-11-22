// "Find the mistake" bug hunts, one set per technology (same ids as the
// question sets). Each snippet has exactly one wrong line: the player clicks
// it, then sees the fix and why. Text fields support the notes mini-markup.

export type SpotDifficulty = 'Easy' | 'Medium' | 'Hard'

export interface SpotBug {
  /** kebab-case, unique within its set. */
  id: string
  title: string
  /** What the code should do, and what goes wrong. */
  task: string
  /** Shiki language: html, css, javascript, typescript, jsx, tsx, sql, bash, docker, yaml or text. */
  lang: string
  code: string
  /** 1-based number of the line with the mistake (where a missing line belongs, if one is missing). */
  line: number
  /** Other lines that are part of the same mistake and also count as a correct pick. */
  also?: number[]
  /** Simple fixes: the corrected text, which replaces `line` (keep its indentation; may be several lines). */
  fix?: string
  /** Fixes that touch more than one line: the whole corrected snippet. */
  fixed?: string
  explain: string
  difficulty: SpotDifficulty
}

export interface SpotSet {
  id: string
  bugs: SpotBug[]
}

/** The corrected snippet. */
export function fixedCode(b: SpotBug): string {
  if (b.fixed !== undefined) return b.fixed
  const lines = b.code.split('\n')
  lines.splice(b.line - 1, 1, b.fix ?? lines[b.line - 1])
  return lines.join('\n')
}
