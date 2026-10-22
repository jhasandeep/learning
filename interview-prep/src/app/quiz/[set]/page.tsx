import { ChevronLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { highlight } from '@/components/notes/highlight'
import { MCQ_BY_ID, MCQ_SETS, mcqKey } from '@/data/mcq'
import { QUESTION_SETS_BY_ID } from '@/data/questions'
import '../../notes/notes.css'
import { QuizPlayer, type QuizItem } from './quiz-player'

/** The cross-technology quiz: a random sample from every set. */
const MIXED = 'mixed'

export function generateStaticParams() {
  return [{ set: MIXED }, ...MCQ_SETS.map((s) => ({ set: s.id }))]
}

export async function generateMetadata({ params }: PageProps<'/quiz/[set]'>): Promise<Metadata> {
  const { set } = await params
  if (set === MIXED) return { title: 'Mixed quiz', description: 'Multiple-choice questions from every technology.' }
  const s = QUESTION_SETS_BY_ID[set]
  return s && MCQ_BY_ID[set] ? { title: `${s.title} quiz`, description: `${MCQ_BY_ID[set].questions.length} multiple-choice ${s.title} questions with explanations.` } : { title: 'Quiz' }
}

export default async function Page({ params }: PageProps<'/quiz/[set]'>) {
  const { set: id } = await params
  const mixed = id === MIXED
  if (!mixed && (!MCQ_BY_ID[id] || !QUESTION_SETS_BY_ID[id])) notFound()

  const sets = mixed ? MCQ_SETS : [MCQ_BY_ID[id]]
  const items: QuizItem[] = await Promise.all(sets.flatMap((s) => {
    const meta = QUESTION_SETS_BY_ID[s.id]
    return s.questions.map(async (q) => ({
      key: mcqKey(s.id, q.id),
      set: { id: s.id, title: meta.title, color: meta.color, badge: meta.badge },
      q: q.q,
      codeHtml: q.code ? await highlight(q.code.code, q.code.lang) : undefined,
      choices: q.choices,
      explain: q.explain,
      difficulty: q.difficulty,
    }))
  }))
  const meta = mixed ? { id: MIXED, title: 'Mixed', color: '#7c3aed', badge: 'MIX' } : { id, title: QUESTION_SETS_BY_ID[id].title, color: QUESTION_SETS_BY_ID[id].color, badge: QUESTION_SETS_BY_ID[id].badge }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-2 text-sm">
        <Link href="/quiz" className="inline-flex items-center gap-1 text-muted hover:text-text"><ChevronLeft size={16} /> Quiz</Link>
        <span className="text-muted">/</span>
        <span className="font-medium">{mixed ? 'Mixed quiz' : meta.title}</span>
      </div>
      <QuizPlayer items={items} meta={meta} mixed={mixed} />
    </div>
  )
}
