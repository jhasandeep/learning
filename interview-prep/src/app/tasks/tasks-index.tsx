'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { TechTile } from '@/components/tech-icon'
import { useProgress } from '@/lib/progress'

export interface PathCard {
  id: string
  title: string
  blurb: string
  category: string
  color: string
  badge: string
  keys: string[]
  first: string
}

export function TasksIndex({ paths, categories }: { paths: PathCard[]; categories: readonly string[] }) {
  const p = useProgress()
  const doneOf = (c: PathCard) => c.keys.filter((k) => p.tasks[k]).length
  const total = paths.reduce((n, c) => n + c.keys.length, 0)
  const done = paths.reduce((n, c) => n + doneOf(c), 0)

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <header className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <p className="text-sm font-medium text-good">Learn by doing</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Tasks: learn every technology by completing it</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Each technology has a short path of small, real tasks. Read the mission, write the code, press <b>Check my work</b> and watch the checklist tick off.
          Stuck? Open a hint. Every task ends with the one idea it taught you.
        </p>
        <div className="mt-5 flex items-center gap-3">
          <div className="h-2 w-64 max-w-full overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-good transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div>
          <span className="text-sm text-muted">{done} / {total} tasks done</span>
        </div>
      </header>

      {categories.map((cat) => {
        const list = paths.filter((c) => c.category === cat)
        if (!list.length) return null
        return (
          <section key={cat}>
            <h2 className="mb-3 text-lg font-semibold">{cat}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((c) => {
                const d = doneOf(c)
                const complete = d === c.keys.length
                return (
                  <Link key={c.id} href={`/tasks/${c.id}`} className="group flex flex-col rounded-2xl border border-line bg-surface p-4 transition hover:-translate-y-0.5 hover:border-line-strong">
                    <div className="flex items-center gap-3">
                      <TechTile id={c.id} color={c.color} size={44} fallback={c.badge} />
                      <div className="min-w-0">
                        <p className="font-semibold">{c.title}</p>
                        <p className="text-xs text-muted">{c.keys.length} tasks</p>
                      </div>
                    </div>
                    <p className="mt-3 flex-1 text-sm text-muted">{c.blurb}</p>
                    <div className="mt-4">
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full" style={{ width: `${(d / c.keys.length) * 100}%`, background: complete ? 'var(--good)' : c.color }} /></div>
                      <p className="mt-2 flex items-center justify-between text-xs text-muted">
                        <span>{complete ? 'Path complete' : `${d} / ${c.keys.length} done`}</span>
                        <span className="inline-flex items-center gap-1 font-medium text-text group-hover:text-accent">{d === 0 ? 'Start' : complete ? 'Review' : 'Continue'} <ArrowRight size={13} /></span>
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
