'use client'

import { ArrowRight, Binary, CircleCheck, Layers3, Lightbulb, Timer } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { TechTile } from '@/components/tech-icon'
import { DifficultyBadge, Pill, ProgressBar, buttonClass, cx, formatMs } from '@/components/ui'
import type { Difficulty } from '@/data/algorithms'
import { CAMPAIGN } from '@/data/campaign'
import type { QuestionCategory } from '@/data/questions'
import { useProgress } from '@/lib/progress'

const FILTERS: ('all' | Difficulty | 'todo')[] = ['all', 'todo', 'easy', 'medium', 'hard']

/** A technology's "find the mistake" set, as a card. */
export interface TechHunt {
  id: string
  title: string
  category: QuestionCategory
  color: string
  badge: string
  keys: string[]
  preview: string[]
}

type Tab = 'dsa' | 'technology'

export function CampaignList({ techs, categories }: { techs: TechHunt[]; categories: QuestionCategory[] }) {
  const p = useProgress()
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all')
  const [tab, setTab] = useState<Tab>('dsa')

  // The tab lives in the URL hash (#technology), so links and Back keep it.
  useEffect(() => {
    const sync = () => setTab(window.location.hash === '#technology' ? 'technology' : 'dsa')
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])
  const choose = (t: Tab) => {
    setTab(t)
    history.replaceState(null, '', t === 'technology' ? '#technology' : window.location.pathname)
  }
  const found = techs.reduce((n, t) => n + t.keys.filter((k) => p.spot[k]).length, 0)
  const totalBugs = techs.reduce((n, t) => n + t.keys.length, 0)
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
          {tab === 'dsa' ? (
            <p className="mt-2 max-w-xl text-sm text-muted">
              {CAMPAIGN.length} hand-made levels in teaching order — from your first off-by-one to a two-bug boss. Each one teaches a pattern from the DSA notes.
            </p>
          ) : (
            <p className="mt-2 max-w-xl text-sm text-muted">
              Find the mistake in real snippets for every technology: {totalBugs} bugs across {techs.length} technologies. Click the wrong line, then see the fix and why.
            </p>
          )}
          <div className="mt-4 flex items-center gap-3">
            {tab === 'dsa' ? <>
              <ProgressBar value={solved / CAMPAIGN.length} className="w-48" />
              <span className="text-sm text-muted">{solved}/{CAMPAIGN.length} fixed</span>
            </> : <>
              <ProgressBar value={totalBugs ? found / totalBugs : 0} className="w-48" />
              <span className="text-sm text-muted">{found}/{totalBugs} found</span>
            </>}
          </div>
        </div>
        {tab === 'technology' ? null : next ? (
          <Link href={`/campaign/${next.id}`} className={buttonClass('primary')}>
            {solved === 0 ? 'Start level 1' : 'Continue'} <ArrowRight size={16} />
          </Link>
        ) : (
          <span className="rounded-full border border-good/40 bg-good/10 px-3 py-1.5 text-sm text-good">Campaign cleared 🎉</span>
        )}
      </header>

      <div className="mb-6 inline-flex rounded-xl border border-line bg-surface p-1" role="tablist" aria-label="Bug hunt mode">
        {([['dsa', 'DSA campaign', Binary], ['technology', 'By technology', Layers3]] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => choose(id)}
            className={cx('inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition', tab === id ? 'bg-accent text-accent-ink shadow-sm' : 'text-muted hover:text-text')}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'technology' ? <TechGrid techs={techs} categories={categories} spot={p.spot} /> : <>
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
      </>}
    </div>
  )
}

function TechGrid({ techs, categories, spot }: { techs: TechHunt[]; categories: QuestionCategory[]; spot: Record<string, unknown> }) {
  return (
    <div className="space-y-8">
      {categories.map((cat) => {
        const list = techs.filter((t) => t.category === cat)
        if (list.length === 0) return null
        return (
          <section key={cat} aria-labelledby={`bh-${cat}`}>
            <h2 id={`bh-${cat}`} className="mb-3 font-semibold">{cat}</h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((t) => {
                const n = t.keys.filter((k) => spot[k]).length
                return (
                  <li key={t.id}>
                    <Link href={`/campaign/tech/${t.id}`} className="lang-card group flex h-full flex-col rounded-2xl border border-line bg-surface p-4 transition hover:-translate-y-0.5" style={{ '--lang': t.color } as React.CSSProperties}>
                      <div className="relative flex items-start gap-3">
                        <TechTile id={t.id} color={t.color} size={46} fallback={t.badge} className="transition group-hover:scale-105" />
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">{t.title}</span>
                          <span className="mt-0.5 block text-xs text-muted">{t.keys.length} mistakes to find</span>
                        </span>
                        {n === t.keys.length ? <CircleCheck size={18} className="mt-1 shrink-0 text-good" /> : <ArrowRight size={16} className="mt-1 shrink-0 transition group-hover:translate-x-0.5" style={{ color: t.color }} />}
                      </div>
                      <ul className="relative mt-3 space-y-1 text-xs text-muted">
                        {t.preview.map((x) => <li key={x} className="truncate">· {x}</li>)}
                      </ul>
                      <div className="relative mt-auto pt-4">
                        <ProgressBar value={n / t.keys.length} color={t.color} />
                        <p className="mt-2 text-[11px] text-muted">{n ? <span className="text-good">{n}/{t.keys.length} found</span> : 'Not started'}</p>
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
