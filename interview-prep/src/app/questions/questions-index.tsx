'use client'

import { ArrowRight, Flame, GraduationCap, MessageCircleQuestion } from 'lucide-react'
import Link from 'next/link'
import { ProgressBar } from '@/components/ui'
import type { QuestionCategory } from '@/data/questions'
import { useProgress } from '@/lib/progress'

export interface SetCard {
  id: string
  title: string
  category: QuestionCategory
  color: string
  badge: string
  keys: string[]
  easy: number
  medium: number
  hard: number
  top: number
  preview: string[]
}

export function QuestionsIndex({ sets, categories }: { sets: SetCard[]; categories: QuestionCategory[] }) {
  const p = useProgress()
  const total = sets.reduce((n, s) => n + s.keys.length, 0)
  const top = sets.reduce((n, s) => n + s.top, 0)
  const known = sets.reduce((n, s) => n + s.keys.filter((k) => p.questions[k] === 'known').length, 0)

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 size-80 rounded-full bg-orange-400/10 blur-3xl" aria-hidden />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-orange-600"><MessageCircleQuestion size={15} /> Interview questions</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">The most asked questions, for every technology</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              {total} questions across {sets.length} technologies, each with a clear answer, code you can run, and the follow-up interviewers usually ask next.
              The flames show how often a question comes up. Mark each one as known or to review, or drill them in practice mode.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link href="/questions/top" className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-white shadow-[0_10px_30px_-12px_var(--accent)] hover:opacity-90">
                <Flame size={16} className="fill-orange-300 text-orange-200" /> Top {top} across all technologies
              </Link>
            </div>
          </div>
          <div className="min-w-56 rounded-2xl border border-line bg-surface-2/60 p-4">
            <p className="flex items-center gap-2 text-sm font-medium"><GraduationCap size={16} className="text-good" /> Your progress</p>
            <p className="mt-2 text-2xl font-semibold">{known}<span className="text-base font-normal text-muted"> / {total} known</span></p>
            <ProgressBar value={total ? known / total : 0} className="mt-2" color="var(--good)" />
          </div>
        </div>
      </header>

      {categories.map((cat) => {
        const list = sets.filter((s) => s.category === cat)
        if (list.length === 0) return null
        return (
          <section key={cat} aria-labelledby={`qc-${cat}`}>
            <h2 id={`qc-${cat}`} className="mb-3 font-semibold">{cat}</h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((s) => {
                const k = s.keys.filter((key) => p.questions[key] === 'known').length
                const r = s.keys.filter((key) => p.questions[key] === 'review').length
                const n = s.keys.length
                return (
                  <li key={s.id}>
                    <Link href={`/questions/${s.id}`} className="lang-card group flex h-full flex-col rounded-2xl border border-line bg-surface p-4 transition hover:-translate-y-0.5" style={{ '--lang': s.color } as React.CSSProperties}>
                      <div className="relative flex items-start gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl font-mono text-xs font-bold" style={{ color: s.color, background: `color-mix(in srgb, ${s.color} 13%, transparent)` }}>{s.badge}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">{s.title}</span>
                          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                            {n} questions · <Flame size={12} className="fill-orange-400 text-orange-500" /> {s.top} most asked
                          </span>
                        </span>
                        <ArrowRight size={16} className="mt-1 shrink-0 text-muted transition group-hover:translate-x-0.5" style={{ color: s.color }} />
                      </div>
                      <ul className="relative mt-3 space-y-1 text-xs text-muted">
                        {s.preview.map((q) => <li key={q} className="truncate">· {q}</li>)}
                      </ul>
                      <div className="relative mt-auto pt-4">
                        <div className="flex h-1.5 overflow-hidden rounded-full bg-surface-2" title={`${s.easy} easy · ${s.medium} medium · ${s.hard} hard`}>
                          <span className="bg-good" style={{ width: `${(s.easy / n) * 100}%` }} />
                          <span className="bg-warn" style={{ width: `${(s.medium / n) * 100}%` }} />
                          <span className="bg-bad" style={{ width: `${(s.hard / n) * 100}%` }} />
                        </div>
                        <p className="mt-2 flex justify-between text-[11px] text-muted">
                          <span>{s.easy} easy · {s.medium} medium · {s.hard} hard</span>
                          <span>{k ? <span className="text-good">{k} known</span> : null}{k && r ? ' · ' : ''}{r ? <span className="text-warn">{r} review</span> : null}</span>
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
