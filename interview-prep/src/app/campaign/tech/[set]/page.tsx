import { ChevronLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { highlightLines } from '@/components/notes/highlight'
import { QUESTION_SETS_BY_ID } from '@/data/questions'
import { fixedCode, SPOT_BY_ID, SPOT_SETS, spotKey } from '@/data/spot'
import '../../../notes/notes.css'
import { SpotPlayer, type SpotItem } from './spot-player'

export function generateStaticParams() {
  return SPOT_SETS.map((s) => ({ set: s.id }))
}

export async function generateMetadata({ params }: PageProps<'/campaign/tech/[set]'>): Promise<Metadata> {
  const { set } = await params
  const s = QUESTION_SETS_BY_ID[set]
  return s && SPOT_BY_ID[set] ? { title: `${s.title}: find the mistake`, description: `Spot the bug in ${SPOT_BY_ID[set].bugs.length} ${s.title} snippets.` } : { title: 'Find the mistake' }
}

export default async function Page({ params }: PageProps<'/campaign/tech/[set]'>) {
  const { set: id } = await params
  const spot = SPOT_BY_ID[id]
  const meta = QUESTION_SETS_BY_ID[id]
  if (!spot || !meta) notFound()

  const items: SpotItem[] = await Promise.all(spot.bugs.map(async (b) => ({
    key: spotKey(id, b.id),
    id: b.id,
    title: b.title,
    task: b.task,
    lines: await highlightLines(b.code, b.lang),
    plain: b.code.split('\n'),
    targets: [b.line, ...(b.also ?? [])],
    fixed: fixedCode(b),
    explain: b.explain,
    difficulty: b.difficulty,
    design: b.lang === 'text',
  })))

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex items-center gap-2 text-sm">
        <Link href="/campaign#technology" className="inline-flex items-center gap-1 text-muted hover:text-text"><ChevronLeft size={16} /> Bug Hunt</Link>
        <span className="text-muted">/</span>
        <span className="font-medium">{meta.title}</span>
      </div>
      <SpotPlayer items={items} meta={{ id, title: meta.title, color: meta.color, badge: meta.badge }} />
    </div>
  )
}
