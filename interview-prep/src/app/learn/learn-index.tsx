'use client'

import { ArrowRight, CircleCheck, GraduationCap, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { TechTile } from '@/components/tech-icon'
import { ProgressBar, buttonClass } from '@/components/ui'
import type { QuestionCategory } from '@/data/questions'
import { useProgress } from '@/lib/progress'

export interface TrackCard {
  id: string
  title: string
  category: QuestionCategory
  color: string
  badge: string
  intro: string
  steps: { id: string; key: string; title: string }[]
}

export function LearnIndex({ cards, categories }: { cards: TrackCard[]; categories: QuestionCategory[] }) {
  const p = useProgress()
  const total = cards.reduce((n, c) => n + c.steps.length, 0)
  const done = cards.reduce((n, c) => n + c.steps.filter((s) => p.learn[s.key]).length, 0)
  // Continue where you left off: the most recently completed step's track, at its next step.
  const latest = Object.entries(p.learn).sort((a, b) => b[1].at.localeCompare(a[1].at))[0]?.[0]
  const resumeTrack = latest ? cards.find((c) => latest.startsWith(`${c.id}/`)) : undefined
  const resumeStep = resumeTrack?.steps.find((s) => !p.learn[s.key])

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 size-80 rounded-full bg-good/10 blur-3xl" aria-hidden />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-good"><GraduationCap size={16} /> Learn by doing</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Learn to code, step by step</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              {total} short coding steps across {cards.length} technologies. Each one explains one idea, gives you a small task and starter code,
              and checks your answer instantly in the browser. Stuck? Open a hint, or look at the solution.
            </p>
            {resumeTrack && resumeStep && (
              <Link href={`/learn/${resumeTrack.id}/${resumeStep.id}`} className={`${buttonClass('primary')} mt-5`}>
                Continue {resumeTrack.title}: {resumeStep.title} <ArrowRight size={16} />
              </Link>
            )}
          </div>
          <div className="min-w-56 rounded-2xl border border-line bg-surface-2/60 p-4">
            <p className="flex items-center gap-2 text-sm font-medium"><Sparkles size={16} className="text-good" /> Steps completed</p>
            <p className="mt-2 text-2xl font-semibold">{done}<span className="text-base font-normal text-muted"> / {total}</span></p>
            <ProgressBar value={total ? done / total : 0} className="mt-2" color="var(--good)" />
          </div>
        </div>
      </header>

      {categories.map((cat) => {
        const list = cards.filter((c) => c.category === cat)
        if (!list.length) return null
        return (
          <section key={cat} aria-labelledby={`lc-${cat}`}>
            <h2 id={`lc-${cat}`} className="mb-3 font-semibold">{cat}</h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((c) => {
                const n = c.steps.filter((s) => p.learn[s.key]).length
                const next = c.steps.find((s) => !p.learn[s.key])
                return (
                  <li key={c.id}>
                    <Link href={`/learn/${c.id}`} className="lang-card group flex h-full flex-col rounded-2xl border border-line bg-surface p-4 transition hover:-translate-y-0.5" style={{ '--lang': c.color } as React.CSSProperties}>
                      <div className="relative flex items-start gap-3">
                        <TechTile id={c.id} color={c.color} size={46} fallback={c.badge} className="transition group-hover:scale-105" />
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">{c.title}</span>
                          <span className="mt-0.5 block text-xs text-muted">{c.steps.length} steps</span>
                        </span>
                        {n === c.steps.length ? <CircleCheck size={18} className="mt-1 shrink-0 text-good" /> : <ArrowRight size={16} className="mt-1 shrink-0 transition group-hover:translate-x-0.5" style={{ color: c.color }} />}
                      </div>
                      <p className="relative mt-3 line-clamp-2 text-xs text-muted">{c.intro}</p>
                      <div className="relative mt-auto pt-4">
                        <ProgressBar value={n / c.steps.length} color={c.color} />
                        <p className="mt-2 truncate text-[11px] text-muted">
                          {n === c.steps.length ? <span className="text-good">Track complete</span> : n ? <>{n}/{c.steps.length} · next: {next?.title}</> : <>Start: {c.steps[0].title}</>}
                        </p>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
