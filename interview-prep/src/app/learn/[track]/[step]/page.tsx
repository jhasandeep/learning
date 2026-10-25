import { ChevronLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LearnText } from '@/components/learn/learn-text'
import { highlight } from '@/components/notes/highlight'
import { Inline } from '@/components/notes/inline'
import { LEARN_BY_ID, LEARN_TRACKS, learnKey } from '@/data/learn'
import { QUESTION_SETS_BY_ID } from '@/data/questions'
import '../../../notes/notes.css'
import { StepPlayer } from './step-player'

export function generateStaticParams() {
  return LEARN_TRACKS.flatMap((t) => t.steps.map((s) => ({ track: t.id, step: s.id })))
}

export async function generateMetadata({ params }: PageProps<'/learn/[track]/[step]'>): Promise<Metadata> {
  const { track, step } = await params
  const t = LEARN_BY_ID[track]
  const s = t?.steps.find((x) => x.id === step)
  const meta = QUESTION_SETS_BY_ID[track]
  return s && meta ? { title: `${s.title} · Learn ${meta.title}`, description: s.task.replace(/[`*=]/g, '') } : { title: 'Learn' }
}

/** Shiki language for a track's editor language. */
const SHIKI: Record<string, string> = { javascript: 'jsx', jsx: 'jsx', typescript: 'tsx', tsx: 'tsx', html: 'html', css: 'css', sql: 'sql', text: 'bash' }

export default async function Page({ params }: PageProps<'/learn/[track]/[step]'>) {
  const { track: trackId, step: stepId } = await params
  const track = LEARN_BY_ID[trackId]
  const meta = QUESTION_SETS_BY_ID[trackId]
  const index = track?.steps.findIndex((s) => s.id === stepId) ?? -1
  if (!track || !meta || index < 0) notFound()
  const step = track.steps[index]
  const kind = step.kind ?? track.kind
  const lang = step.lang ?? track.lang
  const prev = track.steps[index - 1]
  const next = track.steps[index + 1]

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <Link href="/learn" className="inline-flex items-center gap-1 text-muted hover:text-text"><ChevronLeft size={16} /> Learn</Link>
        <span className="text-muted">/</span>
        <Link href={`/learn/${trackId}`} className="text-muted hover:text-text">{meta.title}</Link>
        <span className="text-muted">/</span>
        <span className="font-medium">{step.title}</span>
      </div>
      <StepPlayer
        key={learnKey(trackId, step.id)}
        stepKey={learnKey(trackId, step.id)}
        track={{ id: trackId, title: meta.title, color: meta.color, badge: meta.badge }}
        index={index}
        total={track.steps.length}
        steps={track.steps.map((s) => ({ id: s.id, key: learnKey(trackId, s.id), title: s.title }))}
        prevId={prev?.id}
        nextId={next?.id}
        title={step.title}
        lesson={<LearnText text={step.learn} lang={SHIKI[lang] ?? 'jsx'} />}
        task={<Inline text={step.task} />}
        hints={step.hints.map((h, i) => <Inline key={i} text={h} />)}
        solutionHtml={await highlight(step.solution.replace(/\n$/, ''), SHIKI[lang] ?? 'jsx')}
        checks={kind === 'testing' ? [] : step.tests.map(([name]) => name)}
        input={{ kind, tests: step.tests, setup: step.setup, typescript: track.typescript, jsx: track.jsx }}
        starter={step.starter}
        solution={step.solution}
        lang={lang}
      />
    </div>
  )
}
