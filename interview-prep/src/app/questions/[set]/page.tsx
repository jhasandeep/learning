import { BookOpen, ChevronLeft, Download, Flame, Layers, MessageCircleQuestion, PenTool } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CodeBlock } from '@/components/notes/blocks'
import { Inline } from '@/components/notes/inline'
import { Answer } from '@/components/questions/answer'
import { buttonClass } from '@/components/ui'
import { BOARDS_BY_ID } from '@/data/boards'
import { DECKS } from '@/data/decks'
import { QUESTION_SETS, QUESTION_SETS_BY_ID, questionKey, questionText, type Question, type QuestionTech } from '@/data/questions'
import { QuestionBrowser, type QuestionItem } from '../question-browser'
import '../../notes/notes.css'
import '../questions.css'

/** The cross-technology page: every question marked as asked in almost every interview. */
const TOP = 'top'

export function generateStaticParams() {
  return [{ set: TOP }, ...QUESTION_SETS.map((s) => ({ set: s.id }))]
}

export async function generateMetadata({ params }: PageProps<'/questions/[set]'>): Promise<Metadata> {
  const { set } = await params
  if (set === TOP) return { title: 'Top interview questions', description: 'The interview questions asked most, across every full-stack technology.' }
  const s = QUESTION_SETS_BY_ID[set]
  return s ? { title: `${s.title} interview questions`, description: `The ${s.questions.length} most asked ${s.title} interview questions, with answers, code and follow-ups.` } : { title: 'Interview questions' }
}

function Body({ q }: { q: Question }) {
  return (
    <div className="space-y-4 text-[15px]">
      <Answer text={q.a} />
      {q.code && <CodeBlock block={{ type: 'code', lang: q.code.lang, code: q.code.code, run: q.code.run, title: 'Example' }} />}
      {q.followUp && (
        <p className="flex gap-2 rounded-xl border border-violet/30 bg-violet/5 px-3.5 py-2.5 text-sm">
          <MessageCircleQuestion size={16} className="mt-0.5 shrink-0 text-violet" />
          <span><span className="font-medium text-violet">Likely follow-up:</span> <Inline text={q.followUp} /></span>
        </p>
      )}
    </div>
  )
}

const item = (set: QuestionTech, q: Question, cross: boolean): QuestionItem => ({
  key: questionKey(set.id, q),
  anchor: cross ? `${set.id}-${q.id}` : q.id,
  q: q.q,
  difficulty: q.difficulty,
  freq: q.freq,
  tags: q.tags,
  search: questionText(q) + (cross ? ` ${set.title.toLowerCase()}` : ''),
  set: cross ? { title: set.title, color: set.color, badge: set.badge } : undefined,
  title: <Inline text={q.q} />,
  body: <Body q={q} />,
})

export default async function Page({ params }: PageProps<'/questions/[set]'>) {
  const { set: id } = await params
  const cross = id === TOP
  const set = QUESTION_SETS_BY_ID[id]
  if (!cross && !set) notFound()

  const items = cross
    ? QUESTION_SETS.flatMap((s) => s.questions.filter((q) => q.freq === 3).map((q) => item(s, q, true)))
    : set.questions.map((q) => item(set, q, false))
  const count = (d: string) => items.filter((it) => it.difficulty === d).length
  const deck = set?.notesId && DECKS.some((d) => d.id === set.notesId) ? set.notesId : undefined
  const board = set && BOARDS_BY_ID[set.id] ? set.id : undefined

  return (
    <div className="mx-auto max-w-4xl">
      <div className="no-print mb-4 flex items-center gap-2 text-sm">
        <Link href="/questions" className="inline-flex items-center gap-1 text-muted hover:text-text"><ChevronLeft size={16} /> Interview questions</Link>
        <span className="text-muted">/</span>
        <span className="font-medium">{cross ? 'Top questions' : set.title}</span>
      </div>

      <header className="q-head relative mb-6 overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full blur-3xl" style={{ background: `color-mix(in srgb, ${cross ? '#f97316' : set.color} 14%, transparent)` }} aria-hidden />
        <div className="relative flex items-start gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl font-mono text-sm font-bold" style={cross ? { color: '#ea580c', background: '#fff7ed' } : { color: set.color, background: `color-mix(in srgb, ${set.color} 13%, transparent)` }}>
            {cross ? <Flame size={26} className="fill-orange-400" /> : set.badge}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium" style={{ color: cross ? '#ea580c' : set.color }}>{cross ? 'Across every technology' : `${set.category} · most asked`}</p>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight sm:text-3xl">{cross ? 'Top interview questions' : `${set.title} interview questions`}</h1>
            <p className="mt-2 text-sm text-muted">
              {items.length} questions{cross ? ' that come up in almost every interview' : ''} · {count('Easy')} easy · {count('Medium')} medium · {count('Hard')} hard.
              {' '}Open one to see the answer, a code example and the likely follow-up, then mark it as known or to review.
            </p>
            <div className="no-print mt-4 flex flex-wrap gap-2">
              <a href={`/notes/questions/${id}.pdf`} download className={buttonClass('secondary', 'sm')} title="Every question with its answer, as an A4 PDF"><Download size={14} /> PDF</a>
              {!cross && <>
                {set.notesId && <Link href={`/notes/${set.notesId}`} className={buttonClass('secondary', 'sm')}><BookOpen size={14} /> Notes</Link>}
                {deck && <Link href={`/flashcards/${deck}`} className={buttonClass('secondary', 'sm')}><Layers size={14} /> Flashcards</Link>}
                {board && <Link href={`/board/${board}`} className={buttonClass('secondary', 'sm')}><PenTool size={14} /> Whiteboard</Link>}
              </>}
            </div>
          </div>
        </div>
      </header>

      <QuestionBrowser items={items} />
    </div>
  )
}
