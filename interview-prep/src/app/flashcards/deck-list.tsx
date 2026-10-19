'use client'

import { ArrowRight, Brain, Search } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Card, cx, ProgressBar } from '@/components/ui'
import { ALL_CARDS, DECKS, DECKS_BY_ID } from '@/data/decks'
import { useProgress } from '@/lib/progress'
import { isDue } from '@/lib/srs'
import { useToday } from '@/lib/today'

export function DeckList() {
  const p = useProgress()
  const [query, setQuery] = useState('')
  const today = useToday()

  const results = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    if (!words.length) return []
    return ALL_CARDS.filter((c) => words.every((w) => `${c.q} ${c.a}`.toLowerCase().includes(w))).slice(0, 20)
  }, [query])

  const totalDue = ALL_CARDS.filter((c) => isDue(p.cards[c.id], today)).length

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <p className="text-sm font-medium text-violet">Flashcards</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Remember answers for the long run</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Spaced repetition: cards you know come back later (1 → 2 → 4 → 8 → 16 → 32 days), cards you miss come back today.
          {totalDue > 0 ? ` You have ${totalDue} card${totalDue === 1 ? '' : 's'} due.` : ' Nothing is due right now — learn some new cards.'}
        </p>
        <div className="mt-5 flex h-11 max-w-xl items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 focus-within:border-accent">
          <Search size={16} className="text-muted" />
          <label htmlFor="card-search" className="sr-only">Search all questions</label>
          <input id="card-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search all questions and answers…" className="flex-1 bg-transparent text-sm outline-none" />
        </div>
      </header>

      {query && (
        <section aria-label="Search results" className="space-y-2">
          <p className="text-sm text-muted">{results.length === 0 ? 'No matching cards.' : `${results.length} matching card${results.length === 1 ? '' : 's'}`}</p>
          {results.map((c) => (
            <details key={c.id} className="group rounded-xl border border-line bg-surface px-4 py-3">
              <summary className="cursor-pointer list-none text-sm font-medium">
                <span className="mr-2 text-xs text-muted">{DECKS_BY_ID[c.deckId].title}</span>{c.q}
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted">{c.a}</p>
            </details>
          ))}
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {DECKS.map((d) => {
          const due = d.cards.filter((c) => isDue(p.cards[c.id], today)).length
          const fresh = d.cards.filter((c) => !p.cards[c.id]).length
          const mastered = d.cards.filter((c) => (p.cards[c.id]?.box ?? 0) >= 4).length
          const color = d.color
          return (
            <Card key={d.id} className="group flex flex-col p-5 transition hover:border-line-strong">
              <div className="flex items-start gap-3">
                <span className="grid size-10 place-items-center rounded-xl" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>
                  <Brain size={20} />
                </span>
                <div className="flex-1">
                  <h2 className="font-semibold">{d.title}</h2>
                  <p className="text-sm text-muted">{d.description}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-4 text-sm">
                <span><b className={cx(due > 0 && 'text-bad')}>{due}</b> <span className="text-muted">due</span></span>
                <span><b>{fresh}</b> <span className="text-muted">new</span></span>
                <span><b className="text-good">{mastered}</b> <span className="text-muted">mastered</span></span>
              </div>
              <ProgressBar value={mastered / d.cards.length} className="mt-3" color={color} />
              <div className="mt-4 flex items-center gap-3">
                <Link href={`/flashcards/${d.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color }}>
                  {due + fresh > 0 ? `Study ${Math.min(due + Math.min(fresh, 10), d.cards.length)} cards` : 'Review anyway'} <ArrowRight size={14} />
                </Link>
                <Link href={`/flashcards/${d.id}#all`} className="text-sm text-muted hover:text-text">Browse all {d.cards.length}</Link>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
