import vm from 'node:vm'
import { describe, expect, it } from 'vitest'
import { ALGORITHMS } from '@/data/algorithms'
import { CAMPAIGN } from '@/data/campaign'
import { DECKS } from '@/data/decks'
import { ENDLESS_COUNT, getEndlessLevel } from '@/lib/endless'
import { compile, runCases, type TestCase } from '@/lib/testing'

// Mirrors the browser worker, with a timeout so buggy code that loops
// forever counts as failing instead of hanging the test run.
function outcome(code: string, fnName: string, tests: TestCase[], timeout = 500): 'pass' | 'fail' | 'timeout' {
  const fn = compile(code, fnName)
  try {
    const results = vm.runInNewContext('runCases(fn, tests)', { runCases, fn, tests }, { timeout })
    return results.every((r: { passed: boolean }) => r.passed) ? 'pass' : 'fail'
  } catch (e) {
    if ((e as { code?: string }).code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') return 'timeout'
    throw e
  }
}

describe('campaign levels', () => {
  it('have unique ids', () => {
    expect(new Set(CAMPAIGN.map((l) => l.id)).size).toBe(CAMPAIGN.length)
  })

  for (const level of CAMPAIGN) {
    it(`${level.id}: solution passes, buggy version fails`, () => {
      expect(outcome(level.solution, level.fnName, level.tests)).toBe('pass')
      expect(outcome(level.buggy, level.fnName, level.tests)).not.toBe('pass')
    })
  }
})

describe('algorithm library', () => {
  for (const algo of ALGORITHMS) {
    it(`${algo.id}: reference solution passes`, () => {
      expect(outcome(algo.code, algo.fnName, algo.tests)).toBe('pass')
    })
  }
})

describe('endless levels', () => {
  it('has a non-trivial bank', () => {
    expect(ENDLESS_COUNT).toBeGreaterThan(100)
  })

  it('every level has a real bug and keeps the original solution', () => {
    for (let n = 1; n <= ENDLESS_COUNT; n++) {
      const level = getEndlessLevel(n)
      expect(level.buggy).not.toBe(level.solution)
      expect(outcome(level.buggy, level.fnName, level.tests, 100), `level ${n}`).not.toBe('pass')
    }
  }, 30_000)

  it('maps level numbers to distinct bugs', () => {
    const seen = new Set<string>()
    for (let n = 1; n <= ENDLESS_COUNT; n++) seen.add(getEndlessLevel(n).buggy)
    expect(seen.size).toBe(ENDLESS_COUNT)
  })

  it('rejects out-of-range levels', () => {
    expect(() => getEndlessLevel(0)).toThrow()
    expect(() => getEndlessLevel(ENDLESS_COUNT + 1)).toThrow()
  })
})

describe('flashcard decks', () => {
  it('have unique card ids and non-empty text', () => {
    const ids = DECKS.flatMap((d) => d.cards.map((c) => c.id))
    expect(new Set(ids).size).toBe(ids.length)
    for (const d of DECKS) for (const c of d.cards) expect(c.q.length && c.a.length).toBeTruthy()
  })
})
