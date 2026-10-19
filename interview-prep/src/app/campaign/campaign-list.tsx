'use client'

import { ArrowRight, CircleCheck, Lightbulb, Timer } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { DifficultyBadge, Pill, ProgressBar, buttonClass, cx, formatMs } from '@/components/ui'
import type { Difficulty } from '@/data/algorithms'
import { CAMPAIGN } from '@/data/campaign'
import { useProgress } from '@/lib/progress'

const FILTERS: ('all' | Difficulty | 'todo')[] = ['all', 'todo', 'easy', 'medium', 'hard']

export function CampaignList() {
  const p = useProgress()
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all')
  const solved = CAMPAIGN.filter((l) => p.campaign[l.id]).length
  const next = CAMPAIGN.find((l) => !p.campaign[l.id])

  const shown = CAMPAIGN.map((l, i) => ({ l, i })).filter(({ l }) =>
    filter === 'all' ? true : filter === 'todo' ? !p.campaign[l.id] : l.difficulty === filter,
  )

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-line bg-surface p-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-accent">Campaign</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Bug Hunt</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            {CAMPAIGN.length} hand-made levels in teaching order — from your first off-by-one to a two-bug boss. Each one teaches a pattern from the DSA notes.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <ProgressBar value={solved / CAMPAIGN.length} className="w-48" />
            <span className="text-sm text-muted">{solved}/{CAMPAIGN.length} fixed</span>
          </div>
        </div>
        {next ? (
          <Link href={`/campaign/${next.id}`} className={buttonClass('primary')}>
            {solved === 0 ? 'Start level 1' : 'Continue'} <ArrowRight size={16} />
          </Link>
        ) : (
          <span className="rounded-full border border-good/40 bg-good/10 px-3 py-1.5 text-sm text-good">Campaign cleared 🎉</span>
        )}
      </header>

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter levels">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={cx('rounded-full border px-3 py-1 text-sm capitalize transition', filter === f ? 'border-accent bg-accent/10 text-accent' : 'border-line text-muted hover:text-text')}
          >
            {f === 'todo' ? 'Not solved' : f}
          </button>
        ))}
      </div>

      <ol className="grid gap-3 sm:grid-cols-2">
        {shown.map(({ l, i }) => {
          const r = p.campaign[l.id]
          return (
            <li key={l.id}>
              <Link
                href={`/campaign/${l.id}`}
                className={cx(
                  'group flex h-full gap-4 rounded-2xl border bg-surface p-4 transition hover:-translate-y-0.5 hover:border-line-strong',
                  r ? 'border-good/30' : next?.id === l.id ? 'border-accent/50 shadow-[0_0_0_1px_var(--accent)]' : 'border-line',
                )}
              >
                <span className={cx('grid size-10 shrink-0 place-items-center rounded-xl text-sm font-semibold', r ? 'bg-good/15 text-good' : 'bg-surface-2 text-muted')}>
                  {r ? <CircleCheck size={18} /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium group-hover:text-accent">{l.title}</span>
                    {l.bugs > 1 && <Pill className="border-bad/40 text-bad">boss · {l.bugs} bugs</Pill>}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-sm text-muted">{l.story}</span>
                  <span className="mt-3 flex flex-wrap items-center gap-2">
                    <DifficultyBadge difficulty={l.difficulty} />
                    <Pill>{l.topic}</Pill>
                    {r && !r.revealed && (
                      <span className="ml-auto flex items-center gap-3 text-xs text-muted">
                        <span className="flex items-center gap-1"><Timer size={12} />{formatMs(r.ms)}</span>
                        <span className="flex items-center gap-1"><Lightbulb size={12} />{r.hints}</span>
                      </span>
                    )}
                    {r?.revealed && <span className="ml-auto text-xs text-muted">fix revealed</span>}
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
      {shown.length === 0 && <p className="py-10 text-center text-muted">No levels match this filter — nice work.</p>}
    </div>
  )
}
