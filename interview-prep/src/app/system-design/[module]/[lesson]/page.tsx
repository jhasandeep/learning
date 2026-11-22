import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { highlight } from '@/components/notes/highlight'
import type { Both } from '@/data/dsa/types'
import { SD_LESSONS, SD_MODULES_BY_ID, sdNeighbours } from '@/data/system-design'
import { practiceSolution } from '@/lib/dsa'
import { SdLessonView, type SdHtml } from './lesson-view'

export function generateStaticParams() {
  return SD_LESSONS.map((x) => ({ module: x.module.id, lesson: x.lesson.id }))
}

export async function generateMetadata({ params }: PageProps<'/system-design/[module]/[lesson]'>): Promise<Metadata> {
  const { module, lesson } = await params
  const l = SD_MODULES_BY_ID[module]?.lessons.find((x) => x.id === lesson)
  return { title: l ? `${l.title}: system design lesson` : 'System design lesson', description: l ? `${l.blurb} With an animated diagram, real-world examples, working code in Python and JavaScript, a simulator and practice.` : undefined }
}

const hl = async (code: Both): Promise<Both> => ({ python: await highlight(code.python, 'python'), javascript: await highlight(code.javascript, 'javascript') })

export default async function Page({ params }: PageProps<'/system-design/[module]/[lesson]'>) {
  const { module, lesson: lessonId } = await params
  const mod = SD_MODULES_BY_ID[module]
  const index = mod ? mod.lessons.findIndex((l) => l.id === lessonId) : -1
  if (!mod || index === -1) notFound()
  const lesson = mod.lessons[index]
  const { prev, next } = sdNeighbours(mod.id, lesson.id)
  const html: SdHtml = { steps: await Promise.all(lesson.steps.map((s) => hl(s.code))), solution: await hl(practiceSolution(lesson)) }
  return (
    <SdLessonView
      key={`${mod.id}/${lesson.id}`}
      module={{ id: mod.id, title: mod.title, color: mod.color, count: mod.lessons.length }}
      index={index}
      lesson={lesson}
      html={html}
      prev={prev ? { href: `/system-design/${prev.module.id}/${prev.lesson.id}`, title: prev.lesson.title } : undefined}
      next={next ? { href: `/system-design/${next.module.id}/${next.lesson.id}`, title: next.lesson.title } : undefined}
    />
  )
}
