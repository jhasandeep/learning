import { ChevronLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { TechTile } from '@/components/tech-icon'
import { MISTAKES_BY_ID, MISTAKE_SETS, mistakeKey } from '@/data/mistakes'
import { QUESTION_SETS_BY_ID } from '@/data/questions'
import { MistakeList } from './mistake-list'

export function generateStaticParams() {
  return MISTAKE_SETS.map((s) => ({ set: s.id }))
}

export async function generateMetadata({ params }: PageProps<'/mistakes/[set]'>): Promise<Metadata> {
  const { set } = await params
  const s = MISTAKES_BY_ID[set]
  return s ? { title: `${s.title} mistakes`, description: `Fix broken ${s.title} code or write it from scratch.` } : { title: 'Mistakes' }
}

export default async function Page({ params }: PageProps<'/mistakes/[set]'>) {
  const { set: id } = await params
  const set = MISTAKES_BY_ID[id]
  const meta = QUESTION_SETS_BY_ID[id]
  if (!set || !meta) notFound()

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-2 text-sm">
        <Link href="/mistakes" className="inline-flex items-center gap-1 text-muted hover:text-text"><ChevronLeft size={16} /> Mistakes</Link>
        <span className="text-muted">/</span>
        <span className="font-medium">{set.title}</span>
      </div>
      <header className="mb-6 flex items-center gap-4">
        <TechTile id={id} color={meta.color} size={56} fallback={meta.badge} className="shadow-sm" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{set.title} mistakes</h1>
          <p className="mt-1 text-sm text-muted">{set.items.length} programs. Fix the broken code, then write the same program from scratch.</p>
        </div>
      </header>
      <MistakeList set={id} color={meta.color} items={set.items.map((i) => ({ id: i.id, key: mistakeKey(id, i.id), title: i.title, task: i.task, difficulty: i.difficulty }))} />
    </div>
  )
}
