import { ALGORITHMS_BY_ID } from '@/data/algorithms'
import bank from '@/data/endless-bank.json'
import type { Playable } from './level'
import { applyMutation, CATEGORY_INFO, type BugCategory } from './mutate'

interface BankEntry {
  algo: string
  op: string
  category: BugCategory
  start: number
  end: number
  replacement: string
  line: number
  hangs: boolean
}

const BANK = bank as BankEntry[]

export const ENDLESS_COUNT = BANK.length
export const BUG_CATEGORY_COUNT = new Set(BANK.map((b) => b.category)).size

// Fixed shuffle so consecutive levels jump between algorithms, while level N
// is the same bug for everyone (shareable links).
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const ORDER = (() => {
  const idx = BANK.map((_, i) => i)
  const rand = mulberry32(2026)
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return idx
})()

export function isValidEndlessLevel(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && n <= ENDLESS_COUNT
}

/** First unsolved level at or after `from`, wrapping around. */
export function nextUnsolved(solved: Record<string, unknown>, from = 1): number {
  const start = isValidEndlessLevel(from) ? from : 1
  for (let i = 0; i < ENDLESS_COUNT; i++) {
    const n = ((start - 1 + i) % ENDLESS_COUNT) + 1
    if (!solved[n]) return n
  }
  return start
}

export function getEndlessLevel(n: number): Playable {
  if (!isValidEndlessLevel(n)) throw new Error(`No endless level ${n}`)
  const entry = BANK[ORDER[n - 1]]
  const algo = ALGORITHMS_BY_ID[entry.algo]
  const info = CATEGORY_INFO[entry.category]
  const original = algo.code.slice(entry.start, entry.end)
  return {
    key: `endless-${n}`,
    kind: 'endless',
    title: algo.title,
    topic: algo.topic,
    difficulty: algo.difficulty,
    description: algo.description,
    fnName: algo.fnName,
    buggy: applyMutation(algo.code, entry),
    solution: algo.code,
    tests: algo.tests,
    hints: [
      info.hint + (entry.hangs ? ' (Careful: this bug can make the code loop forever.)' : ''),
      `The bug is on line ${entry.line}.`,
      `On line ${entry.line}, \`${entry.replacement}\` should be \`${original}\`.`,
    ],
    explanation: `${info.label} bug on line ${entry.line}: the correct code uses \`${original}\`, the injected bug changed it to \`${entry.replacement}\`. ${algo.description}`,
    bugs: 1,
    bugLabel: info.label,
  }
}
