// Most-asked interview questions, one set per technology. Text fields support
// the notes mini-markup: `code`, **bold** and ==highlight==. Answers are
// paragraphs separated by a blank line; lines starting with "- " are bullets.

export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export interface Question {
  /** kebab-case, unique within its set (used in URLs: /questions/<set>#<id>). */
  id: string
  q: string
  a: string
  difficulty: Difficulty
  /** How often it comes up: 3 = in almost every interview for this tech, 2 = often, 1 = sometimes. */
  freq: 1 | 2 | 3
  tags: string[]
  /** `run`: opens in the online compiler (javascript, typescript, sql, python only). */
  code?: { lang: string; code: string; run?: boolean }
  /** The follow-up an interviewer usually asks next. */
  followUp?: string
}

export interface QuestionSet {
  id: string
  title: string
  questions: Question[]
}
