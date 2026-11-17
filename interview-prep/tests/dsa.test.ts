import { expect } from 'vitest'
import { ALL_LESSONS } from '@/data/dsa'
import { testLessons } from './lesson-runner'

testLessons('DSA course data', ALL_LESSONS.map((x) => ({ module: x.module.id, lesson: x.lesson })), (lesson) => {
  expect(lesson.dryRun?.frames.length ?? 0).toBeGreaterThanOrEqual(4)
})
