import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LESSONS, LESSONS_BY_ID } from '@/data/typing'
import { codeSnippets } from '@/lib/typing-snippets'
import { LessonPlayer } from './lesson-player'

export function generateStaticParams() {
  return LESSONS.map((l) => ({ id: l.id }))
}

export async function generateMetadata({ params }: PageProps<'/typing/lesson/[id]'>): Promise<Metadata> {
  const l = LESSONS_BY_ID[(await params).id]
  return l ? { title: `${l.title} · typing lesson`, description: l.tip } : { title: 'Typing lesson' }
}

export default async function Page({ params }: PageProps<'/typing/lesson/[id]'>) {
  const lesson = LESSONS_BY_ID[(await params).id]
  if (!lesson) notFound()
  const i = LESSONS.indexOf(lesson)
  // Only code lessons need snippets, and only their own language.
  const snippets = lesson.kind === 'code' && lesson.lang ? { [lesson.lang]: codeSnippets()[lesson.lang] } : {}
  return <LessonPlayer key={lesson.id} lesson={lesson} number={i + 1} total={LESSONS.length} next={LESSONS[i + 1]?.id} snippets={snippets} />
}
