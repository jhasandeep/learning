// Multiple-choice quizzes, one set per technology (same ids as the question
// sets). Text fields support the notes mini-markup: `code`, **bold**, ==highlight==.

export type McqDifficulty = 'Easy' | 'Medium' | 'Hard'

export interface Mcq {
  /** kebab-case, unique within its set. */
  id: string
  q: string
  /** Optional snippet the question is about. */
  code?: { lang: string; code: string }
  /** The FIRST choice is the correct one; the quiz shuffles them. 3 to 4 choices. */
  choices: string[]
  /** Why the answer is right (and the others wrong). */
  explain: string
  difficulty: McqDifficulty
}

export interface McqSet {
  id: string
  questions: Mcq[]
}
