'use client'

import { ArrowRight, ListChecks, Shuffle, Trophy } from 'lucide-react'
import Link from 'next/link'
import { TechTile } from '@/components/tech-icon'
import { ProgressBar } from '@/components/ui'
import type { QuestionCategory } from '@/data/questions'
import { useProgress } from '@/lib/progress'

export interface QuizCard {
  id: string
  title: string
  category: QuestionCategory
  color: string
  badge: string
  keys: string[]
}

export function QuizIndex({ cards, categories }: { cards: QuizCard[]; categories: QuestionCategory[] }) {
  const p = useProgress()
  const total = cards.reduce((n, c) => n + c.keys.length, 0)
  const correct = cards.reduce((n, c) => n + c.keys.filter((k) => p.mcq[k]).length, 0)

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 size-80 rounded-full bg-violet/10 blur-3xl" aria-hidden />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-violet"><ListChecks size={15} /> Multiple choice</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Quiz yourself on every technology</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              {total} multiple-choice questions across {cards.length} technologies. Pick an answer to see straight away whether it is right, and why.
              Choices are shuffled every time, so you learn the idea, not the position. Press 1–4 to answer and Enter to go on.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link href="/quiz/mixed" className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-white shadow-[0_10px_30px_-12px_var(--accent)] hover:opacity-90">
                <Shuffle size={16} /> Mixed quiz: 15 from everything
              </Link>
              {p.quizzes.mixed && <span className="text-sm text-muted">Best: {p.quizzes.mixed.score}/{p.quizzes.mixed.total}</span>}
            </div>
          </div>
          <div className="min-w-56 rounded-2xl border border-line bg-surface-2/60 p-4">
            <p className="flex items-center gap-2 text-sm font-medium"><Trophy size={16} className="text-warn" /> Answered correctly</p>
            <p className="mt-2 text-2xl font-semibold">{correct}<span className="text-base font-normal text-muted"> / {total}</span></p>
            <ProgressBar value={total ? correct / total : 0} className="mt-2" color="var(--violet)" />
          </div>
        </div>
      </header>

      {categories.map((cat) => {
        const list = cards.filter((c) => c.category === cat)
        if (list.length === 0) return null
        return (
          <section key={cat} aria-labelledby={`mc-${cat}`}>
            <h2 id={`mc-${cat}`} className="mb-3 font-semibold">{cat}</h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((c) => {
                const right = c.keys.filter((k) => p.mcq[k]).length
                const best = p.quizzes[c.id]
                return (
                  <li key={c.id}>
                    <Link href={`/quiz/${c.id}`} className="lang-card group flex h-full flex-col rounded-2xl border border-line bg-surface p-4 transition hover:-translate-y-0.5" style={{ '--lang': c.color } as React.CSSProperties}>
                      <div className="relative flex items-start gap-3">
                        <TechTile id={c.id} color={c.color} size={46} fallback={c.badge} className="transition group-hover:scale-105" />
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">{c.title}</span>
                          <span className="mt-0.5 block text-xs text-muted">{c.keys.length} questions{best ? ` · best ${best.score}/${best.total}` : ''}</span>
                        </span>
                        <ArrowRight size={16} className="mt-1 shrink-0 transition group-hover:translate-x-0.5" style={{ color: c.color }} />
                      </div>
                      <div className="relative mt-auto pt-4">
                        <ProgressBar value={right / c.keys.length} color={c.color} />
                        <p className="mt-2 text-[11px] text-muted">{right ? <span className="text-good">{right} answered correctly</span> : 'Not started'}</p>
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
