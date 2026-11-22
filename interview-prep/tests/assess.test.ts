import { describe, expect, it } from 'vitest'
import { ASSESS_SETS, CODING } from '@/data/assess'
import { testLessons } from './lesson-runner'

describe('assessment multiple-choice sets', () => {
  it('has unique set ids', () => {
    expect(new Set(ASSESS_SETS.map((s) => s.id)).size).toBe(ASSESS_SETS.length)
  })

  for (const set of ASSESS_SETS) {
    describe(set.id, () => {
      it('has unique question ids', () => {
        const ids = set.questions.map((q) => q.id)
        expect(new Set(ids).size).toBe(ids.length)
      })

      it('gives every question four distinct options and one valid answer', () => {
        for (const q of set.questions) {
          const options = Object.values(q.options)
          expect(options, q.id).toHaveLength(4)
          expect(new Set(options.map((o) => o.trim().toLowerCase())).size, `${q.id} options differ`).toBe(4)
          expect(['A', 'B', 'C', 'D'], q.id).toContain(q.correct)
          expect(q.explanation.length, q.id).toBeGreaterThan(30)
          expect(q.question.length, q.id).toBeGreaterThan(10)
          for (const o of options) expect(/all of the above|none of the above/i.test(o), q.id).toBe(false)
        }
      })

      it('spreads the right answers evenly across A to D', () => {
        const counts = { A: 0, B: 0, C: 0, D: 0 }
        for (const q of set.questions) counts[q.correct]++
        const each = set.questions.length / 4
        for (const n of Object.values(counts)) expect(Math.abs(n - each)).toBeLessThanOrEqual(1)
      })

      it('does not make the longest option the answer too often', () => {
        let longest = 0
        for (const q of set.questions) {
          const len = Object.fromEntries(Object.entries(q.options).map(([k, v]) => [k, v.length]))
          const max = Math.max(...Object.values(len))
          const tied = Object.entries(len).filter(([, n]) => n === max).map(([k]) => k)
          if (tied.length === 1 && tied[0] === q.correct) longest++
        }
        expect(longest / set.questions.length).toBeLessThan(0.4)
      })
    })
  }
})

testLessons('assessment coding questions', CODING.map((lesson) => ({ module: 'coding', lesson })), (lesson) => {
  const c = CODING.find((x) => x.id === lesson.id)!
  expect(c.visible).toBeGreaterThanOrEqual(2)
  expect(c.practice.cases.length - c.visible).toBeGreaterThanOrEqual(3)
  expect(c.examples.length).toBeGreaterThanOrEqual(2)
})
