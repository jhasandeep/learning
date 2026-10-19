'use client'

import { Check, ChevronDown, ChevronLeft, ChevronRight, ChevronsDownUp, ChevronsUpDown, Flame, GraduationCap, Link2, Printer, RotateCcw, Search, Shuffle, X } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { TechIcon } from '@/components/tech-icon'
import { useToast } from '@/components/toast'
import { Button, cx } from '@/components/ui'
import type { Difficulty } from '@/data/questions/types'
import { setQuestionStatus, useProgress, type QuestionStatus } from '@/lib/progress'

export interface QuestionItem {
  /** progress key: "<set>/<question id>" */
  key: string
  /** DOM id / URL hash */
  anchor: string
  q: string
  difficulty: Difficulty
  freq: 1 | 2 | 3
  tags: string[]
  search: string
  /** Shown on the cross-technology page. */
  set?: { id: string; title: string; color: string; badge: string }
  /** Server-rendered question title (inline markup) and answer. */
  title: ReactNode
  body: ReactNode
}

type StatusFilter = 'all' | 'new' | 'review' | 'known'

const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard']
const DIFF_STYLE: Record<Difficulty, string> = {
  Easy: 'border-good/30 bg-good/10 text-good',
  Medium: 'border-warn/30 bg-warn/10 text-warn',
  Hard: 'border-bad/30 bg-bad/10 text-bad',
}
const FREQ_LABEL = { 3: 'Asked in almost every interview', 2: 'Asked often', 1: 'Asked sometimes' } as const

export function Freq({ n }: { n: 1 | 2 | 3 }) {
  return (
    <span className="inline-flex items-center" title={FREQ_LABEL[n]} aria-label={FREQ_LABEL[n]}>
      {[1, 2, 3].map((i) => <Flame key={i} size={13} className={i <= n ? 'fill-orange-400 text-orange-500' : 'text-line-strong'} />)}
    </span>
  )
}

function DiffPill({ d }: { d: Difficulty }) {
  return <span className={cx('rounded-full border px-2 py-0.5 text-[11px] font-medium', DIFF_STYLE[d])}>{d}</span>
}

export function QuestionBrowser({ items }: { items: QuestionItem[] }) {
  const p = useProgress()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty | 'All'>('All')
  const [mostAsked, setMostAsked] = useState(false)
  const [status, setStatus] = useState<StatusFilter>('all')
  const [open, setOpen] = useState<Set<string>>(() => new Set())
  const [practice, setPractice] = useState<{ order: string[]; at: number; revealed: boolean } | null>(null)

  const words = useMemo(() => query.toLowerCase().split(/\s+/).filter(Boolean), [query])
  const shown = useMemo(
    () => items.filter((it) => {
      const st = p.questions[it.key]
      return (
        words.every((w) => it.search.includes(w)) &&
        (difficulty === 'All' || it.difficulty === difficulty) &&
        (!mostAsked || it.freq === 3) &&
        (status === 'all' || (status === 'new' ? !st : st === status))
      )
    }),
    [items, words, difficulty, mostAsked, status, p.questions],
  )
  const known = items.filter((it) => p.questions[it.key] === 'known').length
  const review = items.filter((it) => p.questions[it.key] === 'review').length

  // Open a question linked by its #anchor (on load and when the hash changes).
  useEffect(() => {
    const openHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1))
      if (!id || !items.some((it) => it.anchor === id)) return
      setOpen((o) => new Set(o).add(id))
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }))
    }
    const frame = requestAnimationFrame(openHash)
    window.addEventListener('hashchange', openHash)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('hashchange', openHash)
    }
  }, [items])

  const toggle = (anchor: string) => setOpen((o) => {
    const next = new Set(o)
    if (next.has(anchor)) next.delete(anchor)
    else next.add(anchor)
    return next
  })

  const mark = (key: string, s: QuestionStatus) => {
    const xp = setQuestionStatus(key, s)
    if (xp) toast(`Marked as known · +${xp} XP`, 'good')
  }

  const copyLink = async (anchor: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#${anchor}`)
      toast('Link copied', 'info')
    } catch {}
  }

  const startPractice = (shuffle: boolean) => {
    const order = shown.map((it) => it.anchor)
    if (shuffle) {
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[order[i], order[j]] = [order[j], order[i]]
      }
    }
    if (order.length) setPractice({ order, at: 0, revealed: false })
  }

  const chip = (active: boolean) => cx('h-8 rounded-lg border px-3 text-xs font-medium transition', active ? 'border-accent/50 bg-accent/10 text-accent' : 'border-line bg-surface text-muted hover:border-line-strong hover:text-text')

  return (
    <div>
      {/* toolbar */}
      <div className="no-print z-20 mb-5 space-y-2.5 rounded-2xl border border-line bg-surface/90 p-3 shadow-sm backdrop-blur md:sticky md:top-16">
        <div className="flex items-center gap-2">
          <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-bg px-3 focus-within:border-accent">
            <Search size={16} className="shrink-0 text-muted" />
            <label htmlFor="q-search" className="sr-only">Search questions</label>
            <input id="q-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search questions and answers…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="text-muted hover:text-text"><X size={14} /></button>}
          </div>
          <Button variant="primary" onClick={() => startPractice(false)} disabled={!shown.length} title="One question at a time: answer it in your head, then reveal"><GraduationCap size={16} /> Practice</Button>
          <button type="button" onClick={() => startPractice(true)} disabled={!shown.length} className="grid size-10 shrink-0 place-items-center rounded-xl border border-line text-muted hover:border-line-strong hover:text-text disabled:opacity-40" title="Practice in random order" aria-label="Practice in random order"><Shuffle size={15} /></button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1" role="group" aria-label="Difficulty">
            {(['All', ...DIFFICULTIES] as const).map((d) => <button key={d} type="button" aria-pressed={difficulty === d} onClick={() => setDifficulty(d)} className={chip(difficulty === d)}>{d}</button>)}
          </div>
          <button type="button" aria-pressed={mostAsked} onClick={() => setMostAsked((m) => !m)} className={cx(chip(mostAsked), 'inline-flex items-center gap-1')}>
            <Flame size={13} className={mostAsked ? 'fill-orange-400 text-orange-500' : ''} /> Most asked
          </button>
          <label className="sr-only" htmlFor="q-status">Status</label>
          <select id="q-status" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className="h-8 rounded-lg border border-line bg-surface px-2 text-xs text-muted outline-none focus:border-accent">
            <option value="all">All ({items.length})</option>
            <option value="new">Not started ({items.length - known - review})</option>
            <option value="review">To review ({review})</option>
            <option value="known">Known ({known})</option>
          </select>
          <span className="ml-auto flex items-center gap-1">
            <span className="hidden px-1 text-xs text-muted lg:inline" aria-live="polite">{shown.length}/{items.length} · <span className="text-good">{known} known</span> · <span className="text-warn">{review} review</span></span>
            <button type="button" onClick={() => setOpen(open.size ? new Set() : new Set(shown.map((it) => it.anchor)))} className={cx(chip(false), 'inline-flex items-center gap-1')} title={open.size ? 'Collapse all answers' : 'Expand all answers'} aria-label={open.size ? 'Collapse all answers' : 'Expand all answers'}>
              {open.size ? <ChevronsDownUp size={13} /> : <ChevronsUpDown size={13} />} <span className="hidden sm:inline">{open.size ? 'Collapse' : 'Expand'}</span>
            </button>
            <button type="button" onClick={() => window.print()} className={cx(chip(false), 'inline-flex items-center gap-1')} title="Print or save as PDF (answers included)" aria-label="Print or save as PDF"><Printer size={13} /> <span className="hidden sm:inline">PDF</span></button>
          </span>
        </div>
        <p className="text-xs text-muted lg:hidden" aria-live="polite">
          Showing {shown.length} of {items.length} · <span className="text-good">{known} known</span> · <span className="text-warn">{review} to review</span>
        </p>
      </div>

      {/* list */}
      <ol className="space-y-3">
        {items.map((it, i) => {
          const visible = shown.includes(it)
          const isOpen = open.has(it.anchor)
          const st = p.questions[it.key]
          return (
            <li key={it.key} id={it.anchor} className={cx('q-card scroll-mt-44 rounded-2xl border bg-surface transition', !visible && 'hidden', st === 'known' ? 'border-good/40' : st === 'review' ? 'border-warn/40' : 'border-line', isOpen && 'shadow-lg shadow-black/5')}>
              <button type="button" onClick={() => toggle(it.anchor)} aria-expanded={isOpen} className="flex w-full items-start gap-3 p-4 text-left sm:gap-4 sm:p-5">
                <span className={cx('grid size-8 shrink-0 place-items-center rounded-lg font-mono text-xs font-semibold', st === 'known' ? 'bg-good text-white' : st === 'review' ? 'bg-warn/20 text-warn' : 'bg-surface-2 text-muted')}>
                  {st === 'known' ? <Check size={15} /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium leading-snug sm:text-[17px]">{it.title}</span>
                  <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                    {it.set && <span className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-2/60 px-1.5 py-0.5 text-[11px] font-medium text-text"><TechIcon id={it.set.id} size={13} color={it.set.color} />{it.set.title}</span>}
                    <DiffPill d={it.difficulty} />
                    <Freq n={it.freq} />
                    {it.tags.map((t) => <span key={t} className="hidden sm:inline">#{t}</span>)}
                  </span>
                </span>
                <ChevronDown size={18} className={cx('mt-1 shrink-0 text-muted transition', isOpen && 'rotate-180')} aria-hidden />
              </button>
              <div className={cx('q-body border-t border-line px-4 pb-5 pt-4 sm:px-5 sm:pl-[4.25rem]', !isOpen && 'hidden')}>
                {it.body}
                <div className="no-print mt-5 flex flex-wrap items-center gap-2">
                  <Button size="sm" variant={st === 'known' ? 'secondary' : 'primary'} onClick={() => mark(it.key, 'known')} className={cx(st === 'known' && 'text-good')} aria-pressed={st === 'known'}><Check size={14} /> {st === 'known' ? 'Known' : 'I know this'}</Button>
                  <Button size="sm" variant="secondary" onClick={() => mark(it.key, 'review')} className={cx(st === 'review' && 'border-warn/50 text-warn')} aria-pressed={st === 'review'}><RotateCcw size={14} /> Review later</Button>
                  <button type="button" onClick={() => copyLink(it.anchor)} className="ml-auto inline-flex items-center gap-1 text-xs text-muted hover:text-text"><Link2 size={13} /> Copy link</button>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
      {shown.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">
          No questions match these filters.{' '}
          <button type="button" className="font-medium text-accent" onClick={() => { setQuery(''); setDifficulty('All'); setMostAsked(false); setStatus('all') }}>Clear filters</button>
        </div>
      )}

      {practice && <Practice items={items} state={practice} setState={setPractice} mark={mark} status={p.questions} />}
    </div>
  )
}

function Practice({ items, state, setState, mark, status }: {
  items: QuestionItem[]
  state: { order: string[]; at: number; revealed: boolean }
  setState: (s: { order: string[]; at: number; revealed: boolean } | null) => void
  mark: (key: string, s: QuestionStatus) => void
  status: Record<string, QuestionStatus>
}) {
  const item = items.find((it) => it.anchor === state.order[state.at])!
  const last = state.at === state.order.length - 1
  const go = (at: number) => setState({ ...state, at, revealed: false })
  const answer = (s: QuestionStatus) => {
    mark(item.key, s)
    if (last) setState(null)
    else go(state.at + 1)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setState(null)
      else if (e.key === ' ' && !state.revealed) { e.preventDefault(); setState({ ...state, revealed: true }) }
      else if (e.key === 'ArrowRight' && !last) go(state.at + 1)
      else if (e.key === 'ArrowLeft' && state.at > 0) go(state.at - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="no-print fixed inset-0 z-50 grid place-items-center bg-black/50 p-3 backdrop-blur-sm sm:p-6" onMouseDown={() => setState(null)}>
      <div role="dialog" aria-modal="true" aria-label="Practice" className="animate-pop flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-line-strong bg-surface shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-line px-5 py-3 text-sm">
          <GraduationCap size={16} className="text-accent" />
          <span className="font-medium">Practice</span>
          <span className="text-muted">{state.at + 1} / {state.order.length}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${((state.at + 1) / state.order.length) * 100}%` }} /></div>
          <button type="button" onClick={() => setState(null)} aria-label="Close practice" className="text-muted hover:text-text"><X size={18} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted">
            {item.set && <span className="inline-flex items-center gap-1.5 font-medium text-text"><TechIcon id={item.set.id} size={16} color={item.set.color} />{item.set.title}</span>}
            <DiffPill d={item.difficulty} />
            <Freq n={item.freq} />
            {status[item.key] && <span className={status[item.key] === 'known' ? 'text-good' : 'text-warn'}>· {status[item.key] === 'known' ? 'known' : 'to review'}</span>}
          </div>
          <h2 className="text-xl font-semibold leading-snug sm:text-2xl">{item.title}</h2>
          {state.revealed ? (
            <div className="mt-6 border-t border-line pt-5">{item.body}</div>
          ) : (
            <div className="mt-8 grid place-items-center rounded-2xl border border-dashed border-line py-10 text-center">
              <p className="text-sm text-muted">Say your answer out loud first, the way you would in the interview.</p>
              <Button className="mt-4" variant="primary" onClick={() => setState({ ...state, revealed: true })}>Reveal answer <span className="opacity-70">(Space)</span></Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 border-t border-line px-5 py-3">
          <button type="button" onClick={() => go(state.at - 1)} disabled={state.at === 0} className="inline-flex h-9 items-center rounded-lg border border-line px-2 text-muted hover:text-text disabled:opacity-40" aria-label="Previous question"><ChevronLeft size={16} /></button>
          <button type="button" onClick={() => go(state.at + 1)} disabled={last} className="inline-flex h-9 items-center rounded-lg border border-line px-2 text-muted hover:text-text disabled:opacity-40" aria-label="Skip to next question"><ChevronRight size={16} /></button>
          <div className="ml-auto flex gap-2">
            <Button variant="secondary" onClick={() => answer('review')} disabled={!state.revealed}><RotateCcw size={14} /> Review later</Button>
            <Button variant="primary" onClick={() => answer('known')} disabled={!state.revealed}><Check size={14} /> I knew it</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
