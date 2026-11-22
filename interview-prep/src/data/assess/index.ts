import { logicalReasoning, quantitative, verbalAndData } from './aptitude'
import { mern } from './mern'
import type { AssessSet } from './types'

export { CODING, CODING_BY_ID } from './coding'
export type { AssessMcq, AssessSet, CodingQuestion, Difficulty, Letter } from './types'

export const ASSESS_SETS: AssessSet[] = [mern, quantitative, logicalReasoning, verbalAndData]
export const ASSESS_BY_ID: Record<string, AssessSet> = Object.fromEntries(ASSESS_SETS.map((s) => [s.id, s]))

/** Progress key for an answered question: shares the quiz store, so XP and badges just work. */
export const assessKey = (set: string, id: string) => `assess/${set}/${id}`
/** Progress key for a finished coding question: shares the Tasks store. */
export const codingKey = (id: string) => `assess/coding/${id}`
