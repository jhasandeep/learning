import type { Both, BuildStep, Case, Practice } from '../dsa/types'

// Company assessment practice: multiple-choice sets (MERN stack and aptitude) and coding questions.
// Text fields support the notes mini-markup (`code`, **bold**, ==highlight==).

export type Difficulty = 'easy' | 'medium' | 'hard'
export type Letter = 'A' | 'B' | 'C' | 'D'

/** One multiple-choice question. The shape follows the assessment-authoring schema, so generated JSON can be dropped in. */
export interface AssessMcq {
  id: string
  type: 'mcq'
  topic: string
  difficulty: Difficulty
  /** Question text; may contain a short code snippet written with the notes markup. */
  question: string
  code?: { lang: string; code: string }
  options: Record<Letter, string>
  correct: Letter
  explanation: string
  estimated_time_seconds: number
  tags: string[]
}

export interface AssessSet {
  id: string
  title: string
  /** Which area of the section it belongs to. */
  group: 'mern' | 'aptitude'
  blurb: string
  color: string
  /** Names the topics, for the intro screen. */
  topics: string[]
  questions: AssessMcq[]
}

/** A hands-on coding question: runs in the browser against visible and hidden tests. */
export interface CodingQuestion {
  id: string
  title: string
  topic: string
  difficulty: Difficulty
  estimated_time_minutes: number
  blurb: string
  statement: string
  input_format: string
  output_format: string
  constraints: string[]
  examples: { input: string; output: string; explanation: string }[]
  /** `cases` start with the visible samples, followed by the hidden tests. */
  practice: Practice
  /** How many of the practice cases are shown as samples (the rest are hidden edge cases). */
  visible: number
  /** One step holding the reference solution. */
  steps: [BuildStep]
  complexity: { time: string; space: string }
  mistakes: string[]
  recap: string
  tags: string[]
}

export type { Both, Case }
