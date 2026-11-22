import { ChevronLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { highlight } from '@/components/notes/highlight'
import { ASSESS_BY_ID, ASSESS_SETS, assessKey } from '@/data/assess'
import '../../notes/notes.css'
import { AssessPlayer, type AssessItem } from './assess-player'

export function generateStaticParams() {
  return ASSESS_SETS.map((s) => ({ set: s.id }))
}

export async function generateMetadata({ params }: PageProps<'/assess/[set]'>): Promise<Metadata> {
  const { set } = await params
  const s = ASSESS_BY_ID[set]
  return s ? { title: `${s.title} MCQ practice`, description: `${s.questions.length} ${s.title} multiple-choice questions with explanations, in practice and timed mock-test modes.` } : { title: 'Assessment' }
}

export default async function Page({ params }: PageProps<'/assess/[set]'>) {
  const { set: id } = await params
  const set = ASSESS_BY_ID[id]
  if (!set) notFound()
  const items: AssessItem[] = await Promise.all(set.questions.map(async (q) => ({
    key: assessKey(set.id, q.id),
    topic: q.topic,
    difficulty: q.difficulty,
    question: q.question,
    codeHtml: q.code ? await highlight(q.code.code, q.code.lang) : undefined,
    options: q.options,
    correct: q.correct,
    explanation: q.explanation,
    seconds: q.estimated_time_seconds,
  })))
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-2 text-sm">
        <Link href="/assess" className="inline-flex items-center gap-1 text-muted hover:text-text"><ChevronLeft size={16} /> Company prep</Link>
        <span className="text-muted">/</span>
        <span className="font-medium">{set.title}</span>
      </div>
      <AssessPlayer items={items} meta={{ id: set.id, title: set.title, color: set.color, blurb: set.blurb, topics: set.topics }} />
    </div>
  )
}
