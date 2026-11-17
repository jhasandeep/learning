import type { SdLesson, SdModule } from './types'
import { fundamentals } from './fundamentals'

export type { Arch, ArchFrame, SdLesson, SdModule } from './types'

export const SD_MODULES: SdModule[] = [fundamentals]
export const SD_MODULES_BY_ID: Record<string, SdModule> = Object.fromEntries(SD_MODULES.map((m) => [m.id, m]))
export const SD_LESSONS: { module: SdModule; lesson: SdLesson }[] = SD_MODULES.flatMap((module) => module.lessons.map((lesson) => ({ module, lesson })))

export function sdNeighbours(moduleId: string, lessonId: string) {
  const i = SD_LESSONS.findIndex((x) => x.module.id === moduleId && x.lesson.id === lessonId)
  return { prev: SD_LESSONS[i - 1], next: SD_LESSONS[i + 1] }
}
