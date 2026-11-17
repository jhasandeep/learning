import { easy } from './easy'
import { foundations } from './foundations'
import type { DsaModule, Lesson } from './types'

export type { BuildStep, Case, DryRun, DsaModule, Frame, Lang, Lesson, Practice } from './types'

/** The course, easiest module first. */
export const DSA_MODULES: DsaModule[] = [foundations, easy]

export const DSA_MODULES_BY_ID: Record<string, DsaModule> = Object.fromEntries(DSA_MODULES.map((m) => [m.id, m]))

/** Every lesson in course order, with where it lives. */
export const ALL_LESSONS: { module: DsaModule; lesson: Lesson; index: number }[] = DSA_MODULES.flatMap((module) => module.lessons.map((lesson) => ({ module, lesson, index: 0 }))).map((x, i) => ({ ...x, index: i }))

/** The lesson before and after this one in the course (crossing module boundaries). */
export function neighbours(moduleId: string, lessonId: string): { prev?: { module: DsaModule; lesson: Lesson }; next?: { module: DsaModule; lesson: Lesson } } {
  const i = ALL_LESSONS.findIndex((x) => x.module.id === moduleId && x.lesson.id === lessonId)
  return { prev: ALL_LESSONS[i - 1], next: ALL_LESSONS[i + 1] }
}
