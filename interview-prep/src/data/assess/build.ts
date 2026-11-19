import type { AssessMcq, Difficulty, Letter } from './types'

const LETTERS: Letter[] = ['A', 'B', 'C', 'D']

// The right answer's slot in each group of four questions. Every letter appears once per group, so the answers
// spread evenly across A to D, and no two groups use the same order twice in a row.
const SLOTS = [
  [2, 0, 3, 1],
  [1, 3, 0, 2],
  [3, 1, 2, 0],
  [0, 2, 1, 3],
]

export interface RawMcq {
  id: string
  topic: string
  difficulty: Difficulty
  q: string
  code?: { lang: string; code: string }
  /** The right answer. */
  right: string
  /** Three plausible wrong answers, based on common misconceptions. */
  wrong: [string, string, string]
  explain: string
  seconds: number
  tags: string[]
}

/** Turns authored questions into the schema, placing each right answer so the letters are evenly used. */
export function buildMcqs(raw: RawMcq[]): AssessMcq[] {
  return raw.map((r, i) => {
    const slot = SLOTS[Math.floor(i / 4) % SLOTS.length][i % 4]
    const texts = [...r.wrong]
    texts.splice(slot, 0, r.right)
    return {
      id: r.id,
      type: 'mcq',
      topic: r.topic,
      difficulty: r.difficulty,
      question: r.q,
      code: r.code,
      options: { A: texts[0], B: texts[1], C: texts[2], D: texts[3] },
      correct: LETTERS[slot],
      explanation: r.explain,
      estimated_time_seconds: r.seconds,
      tags: r.tags,
    }
  })
}
