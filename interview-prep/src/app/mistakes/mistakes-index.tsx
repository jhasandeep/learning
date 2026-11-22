'use client'

import { ArrowRight, CircleCheck, PencilLine, Wrench } from 'lucide-react'
import Link from 'next/link'
import { TechTile } from '@/components/tech-icon'
import { ProgressBar } from '@/components/ui'
import { useProgress } from '@/lib/progress'

export interface MistakeCard {
  id: string
  title: string
  color: string
  badge: string
  items: { id: string; key: string; title: string }[]
}

export function MistakesIndex({ cards }: { cards: MistakeCard[] }) {
  const p = useProgress()
  const total = cards.reduce((n, c) => n + c.items.length, 0)
  const fixed = cards.reduce((n, c) => n + c.items.filter((i) => p.mistakes[`${i.key}:fix`]).length, 0)
  const written = cards.reduce((n, c) => n + c.items.filter((i) => p.mistakes[`${i.key}:write`]).length, 0)

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 size-80 rounded-full bg-warn/10 blur-3xl" aria-hidden />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-warn"><Wrench size={16} /> Syntax practice</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Mistakes: fix it, then write it</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              {total} short programs, each with one syntax or logic mistake. Choose how to practise:
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li className="flex gap-2"><Wrench size={16} className="mt-0.5 shrink-0 text-warn" /><span><b>Fix it</b>: the code is broken, find the mistake and correct it.</span></li>
              <li className="flex gap-2"><PencilLine size={16} className="mt-0.5 shrink-0 text-accent" /><span><b>Write it</b>: start from an empty editor and type the whole program from memory.</span></li>
            </ul>
            <p className="mt-3 max-w-2xl text-sm text-muted">Your code runs in the browser. Express servers get real requests and you see the response (like <code className="rounded bg-surface-2 px-1">GET / → 200 Hello World</code>); React components are rendered and clicked.</p>
          </div>
          <div className="min-w-56 rounded-2xl border border-line bg-surface-2/60 p-4 text-sm">
            <p className="flex items-center justify-between"><span className="flex items-center gap-2"><Wrench size={15} className="text-warn" /> Fixed</span><b>{fixed} / {total}</b></p>
            <ProgressBar value={total ? fixed / total : 0} className="mt-1.5" color="var(--warn)" />
            <p className="mt-3 flex items-center justify-between"><span className="flex items-center gap-2"><PencilLine size={15} className="text-accent" /> Written</span><b>{written} / {total}</b></p>
            <ProgressBar value={total ? written / total : 0} className="mt-1.5" />
          </div>
        </div>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const f = c.items.filter((i) => p.mistakes[`${i.key}:fix`]).length
          const w = c.items.filter((i) => p.mistakes[`${i.key}:write`]).length
          const done = f === c.items.length && w === c.items.length
          return (
            <li key={c.id}>
              <Link href={`/mistakes/${c.id}`} className="lang-card group flex h-full flex-col rounded-2xl border border-line bg-surface p-4 transition hover:-translate-y-0.5" style={{ '--lang': c.color } as React.CSSProperties}>
                <div className="relative flex items-start gap-3">
                  <TechTile id={c.id} color={c.color} size={46} fallback={c.badge} className="transition group-hover:scale-105" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{c.title}</span>
                    <span className="mt-0.5 block text-xs text-muted">{c.items.length} programs</span>
                  </span>
                  {done ? <CircleCheck size={18} className="mt-1 shrink-0 text-good" /> : <ArrowRight size={16} className="mt-1 shrink-0 transition group-hover:translate-x-0.5" style={{ color: c.color }} />}
                </div>
                <div className="relative mt-auto space-y-1.5 pt-4 text-[11px] text-muted">
                  <p className="flex justify-between"><span>Fixed</span><span>{f}/{c.items.length}</span></p>
                  <ProgressBar value={f / c.items.length} color={c.color} />
                  <p className="flex justify-between"><span>Written</span><span>{w}/{c.items.length}</span></p>
                  <ProgressBar value={w / c.items.length} color={c.color} />
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
