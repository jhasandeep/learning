import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { highlight } from '@/components/notes/highlight'
import { ALL_LESSONS, DSA_MODULES_BY_ID, neighbours } from '@/data/dsa'
import type { Both } from '@/data/dsa/types'
import { practiceSolution } from '@/lib/dsa'
import { LessonView, type LessonHtml } from './lesson-view'

export function generateStaticParams() {
  return ALL_LESSONS.map((x) => ({ module: x.module.id, lesson: x.lesson.id }))
}

export async function generateMetadata({ params }: PageProps<'/dsa/[module]/[lesson]'>): Promise<Metadata> {
  const { module, lesson } = await params
  const l = DSA_MODULES_BY_ID[module]?.lessons.find((x) => x.id === lesson)
  return { title: l ? `${l.title}: DSA lesson in Python and JavaScript` : 'DSA lesson', description: l ? `${l.blurb} Step by step from the simple idea to the best solution, with a dry run and a coding exercise.` : undefined }
}

const hl = async (code: Both): Promise<Both> => ({ python: await highlight(code.python, 'python'), javascript: await highlight(code.javascript, 'javascript') })

export default async function Page({ params }: PageProps<'/dsa/[module]/[lesson]'>) {
  const { module, lesson: lessonId } = await params
  const mod = DSA_MODULES_BY_ID[module]
  const index = mod ? mod.lessons.findIndex((l) => l.id === lessonId) : -1
  if (!mod || index === -1) notFound()
  const lesson = mod.lessons[index]
  const { prev, next } = neighbours(mod.id, lesson.id)
  const html: LessonHtml = { steps: await Promise.all(lesson.steps.map((s) => hl(s.code))), solution: await hl(practiceSolution(lesson)) }
  return (
    <LessonView
      key={`${mod.id}/${lesson.id}`}
      module={{ id: mod.id, title: mod.title, color: mod.color, count: mod.lessons.length }}
      index={index}
      lesson={lesson}
      html={html}
      prev={prev ? { href: `/dsa/${prev.module.id}/${prev.lesson.id}`, title: prev.lesson.title } : undefined}
      next={next ? { href: `/dsa/${next.module.id}/${next.lesson.id}`, title: next.lesson.title } : undefined}
    />
  )
}
