import type { Difficulty } from '@/data/algorithms'
import type { TestCase } from './testing'

/** Everything the play screen needs, whether the level is hand-made or generated. */
export interface Playable {
  key: string
  kind: 'campaign' | 'endless'
  title: string
  topic: string
  difficulty: Difficulty
  story?: string
  description: string
  fnName: string
  buggy: string
  solution: string
  tests: TestCase[]
  hints: string[]
  explanation: string
  bugs: number
  bugLabel?: string
}
