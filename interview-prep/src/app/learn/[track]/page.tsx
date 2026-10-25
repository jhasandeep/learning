import { ChevronLeft, ListChecks, MessageCircleQuestion } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { TechTile } from '@/components/tech-icon'
import { buttonClass } from '@/components/ui'
import { LEARN_BY_ID, LEARN_TRACKS, learnKey } from '@/data/learn'
import { QUESTION_SETS_BY_ID } from '@/data/questions'
import { TrackSteps } from './track-steps'

export function generateStaticParams() {
  return LEARN_TRACKS.map((t) => ({ track: t.id }))
}

export async function generateMetadata({ params }: PageProps<'/learn/[track]'>): Promise<Metadata> {
  const { track } = await params
  const meta = QUESTION_SETS_BY_ID[track]
  return meta && LEARN_BY_ID[track] ? { title: `Learn ${meta.title}`, description: LEARN_BY_ID[track].intro } : { title: 'Learn' }
}

export default async function Page({ params }: PageProps<'/learn/[track]'>) {
  const { track: id } = await params
  const track = LEARN_BY_ID[id]
  const meta = QUESTION_SETS_BY_ID[id]
  if (!track || !meta) notFound()

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-2 text-sm">
        <Link href="/learn" className="inline-flex items-center gap-1 text-muted hover:text-text"><ChevronLeft size={16} /> Learn</Link>
        <span className="text-muted">/</span>
        <span className="font-medium">{meta.title}</span>
      </div>

      <header className="relative mb-6 overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full blur-3xl" style={{ background: `color-mix(in srgb, ${meta.color} 14%, transparent)` }} aria-hidden />
        <div className="relative flex items-start gap-4">
          <TechTile id={id} color={meta.color} size={56} fallback={meta.badge} className="shadow-sm" />
          <div className="min-w-0">
            <p className="text-sm font-medium" style={{ color: meta.color }}>{meta.category} · {track.steps.length} steps</p>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight sm:text-3xl">Learn {meta.title}</h1>
            <p className="mt-2 text-sm text-muted">{track.intro}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/quiz/${id}`} className={buttonClass('secondary', 'sm')}><ListChecks size={14} /> Quiz</Link>
              <Link href={`/questions/${id}`} className={buttonClass('secondary', 'sm')}><MessageCircleQuestion size={14} /> Interview questions</Link>
            </div>
          </div>
        </div>
      </header>

      <TrackSteps track={id} color={meta.color} steps={track.steps.map((s) => ({ id: s.id, key: learnKey(id, s.id), title: s.title, task: s.task }))} />
    </div>
  )
}
