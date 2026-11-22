'use client'

import { ArrowRight, Bug, CircleCheck, Eye, Lightbulb, MousePointerClick, RotateCcw, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { DiffView } from '@/components/diff-view'
import { Inline } from '@/components/notes/inline'
import { TechTile } from '@/components/tech-icon'
import { useToast } from '@/components/toast'
import { buttonClass, cx, ProgressBar } from '@/components/ui'
import type { SpotDifficulty } from '@/data/spot'
import { readProgress, recordSpot, spotXp, useProgress } from '@/lib/progress'

export interface SpotItem {
  key: string
  id: string
  title: string
  task: string
  /** Highlighted HTML, one string per line. */
  lines: string[]
  plain: string[]
  /** 1-based lines that count as finding the mistake. */
  targets: number[]
  fixed: string
  explain: string
  difficulty: SpotDifficulty
  /** A design doc rather than code. */
  design: boolean
}

interface Attempt { wrong: number[]; found: boolean; revealed: boolean; hint: boolean }

const FRESH: Attempt = { wrong: [], found: false, revealed: false, hint: false }
const HINT_AFTER = 2
const DIFF_STYLE: Record<SpotDifficulty, string> = { Easy: 'text-good bg-good/10 border-good/30', Medium: 'text-warn bg-warn/10 border-warn/30', Hard: 'text-bad bg-bad/10 border-bad/30' }

export function SpotPlayer({ items, meta }: { items: SpotItem[]; meta: { id: string; title: string; color: string; badge: string } }) {
  const p = useProgress()
  const toast = useToast()
  const [index, setIndex] = useState(0)
  const [attempts, setAttempts] = useState<Record<string, Attempt>>({})
  const [shake, setShake] = useState<number | null>(null)
  const top = useRef<HTMLDivElement>(null)

  // Open on the first mistake not found yet (progress is only known after hydration).
  useEffect(() => {
    const saved = readProgress().spot
    const first = items.findIndex((it) => !saved[it.key])
    // eslint-disable-next-line react-hooks/set-state-in-effect -- progress lives in localStorage, read once after mount
    if (first > 0) setIndex(first)
  }, [items])

  const item = items[index]
  const a = attempts[item.id] ?? FRESH
  const done = a.found || a.revealed
  const solved = items.filter((it) => p.spot[it.key]).length
  const hintRange = (() => {
    const t = item.targets[0]
    const from = Math.max(1, t - 1)
    return { from, to: Math.min(item.lines.length, from + 2) }
  })()

  const update = (patch: Partial<Attempt>) => setAttempts((all) => ({ ...all, [item.id]: { ...a, ...patch } }))

  const choose = (line: number) => {
    if (done || a.wrong.includes(line)) return
    if (item.targets.includes(line)) {
      update({ found: true })
      const gain = recordSpot(item.key, a.wrong.length, false)
      toast(gain ? `Found it! +${gain} XP` : 'Found it!', 'good')
    } else {
      update({ wrong: [...a.wrong, line] })
      setShake(line)
      window.setTimeout(() => setShake(null), 400)
    }
  }

  const reveal = () => {
    update({ revealed: true })
    recordSpot(item.key, a.wrong.length, true)
  }

  const go = (i: number) => {
    setIndex(i)
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const next = items.findIndex((it, i) => i > index && !p.spot[it.key])
  const nextIndex = next >= 0 ? next : index + 1 < items.length ? index + 1 : -1

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="min-w-0 space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-center gap-3">
            <TechTile id={meta.id} color={meta.color} size={42} fallback={meta.badge} />
            <div className="min-w-0">
              <p className="text-xs font-medium" style={{ color: meta.color }}>Find the mistake</p>
              <h1 className="font-semibold leading-tight">{meta.title}</h1>
            </div>
          </div>
          <ProgressBar value={solved / items.length} className="mt-4" color={meta.color} />
          <p className="mt-2 text-xs text-muted">{solved}/{items.length} found</p>
        </div>
        <ol className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {items.map((it, i) => {
            const r = p.spot[it.key]
            return (
              <li key={it.id} className="shrink-0 lg:shrink">
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-current={i === index ? 'step' : undefined}
                  className={cx(
                    'flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm transition',
                    i === index ? 'border-accent/60 bg-accent/5' : 'border-line bg-surface hover:border-line-strong',
                  )}
                >
                  <span className={cx('grid size-6 shrink-0 place-items-center rounded-lg text-xs font-semibold', r ? (r.revealed ? 'bg-warn/15 text-warn' : 'bg-good/15 text-good') : 'bg-surface-2 text-muted')}>
                    {r ? (r.revealed ? <Eye size={13} /> : <CircleCheck size={14} />) : i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{it.title}</span>
                </button>
              </li>
            )
          })}
        </ol>
      </aside>

      <section ref={top} className="min-w-0 scroll-mt-20 space-y-4">
        <div className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
          <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="inline-flex items-center gap-1 font-medium" style={{ color: meta.color }}><Bug size={13} /> Bug {index + 1} of {items.length}</span>
            <span className={cx('rounded-full border px-2 py-0.5 font-medium', DIFF_STYLE[item.difficulty])}>{item.difficulty}</span>
            {p.spot[item.key] && !done && <span>· found before</span>}
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">{item.title}</h2>
          <p className="mt-2 text-[15px] leading-relaxed"><Inline text={item.task} /></p>
          <p className="mt-3 text-sm text-muted">
            <MousePointerClick size={15} className="mr-1.5 inline align-[-3px] text-accent" />
            {item.design ? 'Click the decision that is wrong.' : 'Click the line with the mistake.'}
            {!done && <span> {spotXp(a.wrong.length, false)} XP if this is your first find.</span>}
          </p>
        </div>

        <div className="note-codecard overflow-hidden rounded-2xl" style={{ borderLeftColor: meta.color }}>
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs text-white/60">
            <span>{item.design ? 'Design' : 'Code'}</span>
            {a.wrong.length > 0 && !done && <span className="text-rose-300">{a.wrong.length} wrong {a.wrong.length === 1 ? 'guess' : 'guesses'}</span>}
          </div>
          <div className="overflow-x-auto py-2 font-mono text-[13px] leading-6" role="list" aria-label="Code lines">
            {item.lines.map((html, i) => {
              const n = i + 1
              const isTarget = item.targets.includes(n)
              const wrong = a.wrong.includes(n)
              const inHint = a.hint && !done && n >= hintRange.from && n <= hintRange.to
              const blank = !item.plain[i].trim()
              return (
                <button
                  key={i}
                  type="button"
                  role="listitem"
                  onClick={() => !blank && choose(n)}
                  disabled={done || blank || wrong}
                  aria-label={`Line ${n}: ${item.plain[i].trim() || 'blank'}`}
                  className={cx(
                    'group flex w-full min-w-max items-stretch text-left transition-colors',
                    !done && !blank && !wrong && 'cursor-pointer hover:bg-white/10',
                    done && isTarget && 'bg-emerald-400/20',
                    wrong && 'bg-rose-500/20',
                    inHint && !wrong && 'bg-amber-300/10',
                    shake === n && 'spot-shake',
                  )}
                >
                  <span className={cx('w-11 shrink-0 select-none border-r pr-3 text-right', done && isTarget ? 'border-emerald-400 text-emerald-300' : wrong ? 'border-rose-400 text-rose-300' : inHint ? 'border-amber-300/60 text-amber-200' : 'border-transparent text-white/30')}>
                    {wrong ? <X size={12} className="ml-auto inline" /> : n}
                  </span>
                  <span className={cx('whitespace-pre pl-4 pr-6', item.design && 'whitespace-pre-wrap font-sans text-[14px]')} dangerouslySetInnerHTML={{ __html: html || ' ' }} />
                </button>
              )
            })}
          </div>
        </div>

        {!done && (
          <div className="flex flex-wrap items-center gap-2">
            {a.wrong.length >= HINT_AFTER && !a.hint && (
              <button type="button" className={buttonClass('secondary', 'sm')} onClick={() => update({ hint: true })}><Lightbulb size={14} /> Hint</button>
            )}
            {a.hint && <span className="text-sm text-warn">The mistake is in lines {hintRange.from}–{hintRange.to}.</span>}
            {a.wrong.length >= 1 && (
              <button type="button" className={cx(buttonClass('ghost', 'sm'), 'ml-auto')} onClick={reveal}><Eye size={14} /> Show the answer</button>
            )}
          </div>
        )}

        {done && (
          <div className="space-y-4 rounded-3xl border border-line bg-surface p-5 sm:p-6" role="status">
            <p className={cx('flex items-center gap-2 font-semibold', a.found ? 'text-good' : 'text-warn')}>
              {a.found ? <><CircleCheck size={18} /> {a.wrong.length === 0 ? 'Spotted it first time!' : `Found it after ${a.wrong.length} wrong ${a.wrong.length === 1 ? 'guess' : 'guesses'}.`}</> : <><Eye size={18} /> Here is the mistake.</>}
            </p>
            <p className="leading-relaxed"><Inline text={item.explain} /></p>
            <div>
              <p className="mb-2 text-sm font-medium text-muted">The fix</p>
              <DiffView before={item.plain.join('\n')} after={item.fixed} />
            </div>
            <div className="flex flex-wrap gap-2">
              {nextIndex >= 0 ? (
                <button type="button" className={buttonClass('primary')} onClick={() => go(nextIndex)}>Next bug <ArrowRight size={16} /></button>
              ) : (
                <Link href="/campaign#technology" className={buttonClass('primary')}>Pick another technology <ArrowRight size={16} /></Link>
              )}
              <button type="button" className={buttonClass('secondary')} onClick={() => setAttempts((all) => ({ ...all, [item.id]: FRESH }))}><RotateCcw size={15} /> Try again</button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
