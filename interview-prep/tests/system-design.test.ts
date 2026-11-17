import { expect } from 'vitest'
import { SD_LESSONS } from '@/data/system-design'
import { testLessons } from './lesson-runner'

testLessons('System design course data', SD_LESSONS.map((x) => ({ module: x.module.id, lesson: x.lesson })))

import { describe, it } from 'vitest'

describe('System design lesson content', () => {
  for (const { module, lesson } of SD_LESSONS) {
    it(`${module.id}/${lesson.id} has diagrams, examples and a quiz`, () => {
      expect(lesson.how.frames.length).toBeGreaterThanOrEqual(4)
      const names = new Set(lesson.how.nodes.map((n) => n.id))
      for (const e of lesson.how.edges) {
        expect(names.has(e.from), `edge from ${e.from}`).toBe(true)
        expect(names.has(e.to), `edge to ${e.to}`).toBe(true)
      }
      for (const f of lesson.how.frames) {
        for (const id of [...(f.active ?? []), ...(f.bad ?? []), ...Object.keys(f.badges ?? {})]) expect(names.has(id), `frame node ${id}`).toBe(true)
        for (const [a, b] of f.flow ?? []) expect(lesson.how.edges.some((e) => (e.from === a && e.to === b) || (e.from === b && e.to === a)), `flow ${a}->${b}`).toBe(true)
      }
      expect(lesson.realWorld.length).toBeGreaterThanOrEqual(3)
      expect(lesson.quiz.length).toBeGreaterThanOrEqual(3)
      for (const q of lesson.quiz) expect(q.answer).toBeLessThan(q.options.length)
      expect(lesson.interview.length).toBeGreaterThanOrEqual(2)
    })
  }
})
