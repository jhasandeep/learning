'use client'

import {
  ArrowRight, CircleCheck, CircleX, Clock, Eye, Lightbulb, Play, RotateCcw, Sparkles, Terminal, ListChecks, ChevronLeft,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Playable } from '@/lib/level'
import { runTests } from '@/lib/runner'
import { formatValue, type RunOutcome } from '@/lib/testing'
import { DiffView } from './diff-view'
import { RUN_EVENT } from './editor-events'
import { useToast } from './toast'
import { Button, buttonClass, cx, DifficultyBadge, formatMs, Kbd, Pill } from './ui'

const CodeEditor = dynamic(() => import('./code-editor'), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-muted">Loading editor…</div>,
})

export interface SolveResult { gain: number; note?: string }

interface Props {
  level: Playable
  label: string
  backHref: string
  backLabel: string
  nextHref?: string
  headerExtra?: ReactNode
  /** Called once per visit, the first time all tests pass. */
  onSolve: (hints: number, revealed: boolean, ms: number) => SolveResult
}

const draftKey = (key: string) => `prep-arena:draft:${key}`

function readDraft(level: Playable): string {
  if (typeof window === 'undefined') return level.buggy
  try {
    return localStorage.getItem(draftKey(level.key)) ?? level.buggy
  } catch {
    return level.buggy
  }
}

export function PlayScreen({ level, label, backHref, backLabel, nextHref, headerExtra, onSolve }: Props) {
  const toast = useToast()
  const router = useRouter()
  const [code, setCode] = useState(() => readDraft(level))
  const [outcome, setOutcome] = useState<RunOutcome | null>(null)
  const [running, setRunning] = useState(false)
  const [tab, setTab] = useState<'tests' | 'console'>('tests')
  // Small screens show one pane at a time; large screens show both side by side.
  const [pane, setPane] = useState<'problem' | 'code'>('problem')
  const [hints, setHints] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [confirmReveal, setConfirmReveal] = useState(false)
  const [solved, setSolved] = useState<(SolveResult & { ms: number }) | null>(null)
  const [showModal, setShowModal] = useState(false)
  const startRef = useRef(0)

  useEffect(() => {
    startRef.current = Date.now()
  }, [])

  // Save work in progress so a refresh never loses it.
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        if (code === level.buggy) localStorage.removeItem(draftKey(level.key))
        else localStorage.setItem(draftKey(level.key), code)
      } catch {}
    }, 400)
    return () => clearTimeout(t)
  }, [code, level.buggy, level.key])

  const run = useCallback(async () => {
    if (running) return
    setRunning(true)
    setPane('code')
    const result = await runTests(code, level.fnName, level.tests)
    setRunning(false)
    setOutcome(result)
    if (result.kind === 'ok') {
      const failed = result.results.filter((r) => !r.passed).length
      if (failed === 0) {
        if (!solved) {
          const ms = Date.now() - startRef.current
          const res = onSolve(hints, revealed, ms)
          setSolved({ ...res, ms })
          setShowModal(true)
          try { localStorage.removeItem(draftKey(level.key)) } catch {}
        } else {
          toast('All tests still pass ✓', 'good')
        }
      } else {
        setTab('tests')
        toast(`${failed} of ${result.results.length} tests failing`, 'bad')
      }
    } else {
      setTab(result.kind === 'compile-error' ? 'console' : 'tests')
    }
  }, [running, code, level, solved, onSolve, hints, revealed, toast])

  const showHint = useCallback(() => {
    setHints((h) => Math.min(level.hints.length, h + 1))
  }, [level.hints.length])

  const reset = useCallback(() => {
    setCode(level.buggy)
    setOutcome(null)
    toast('Code reset to the original buggy version')
  }, [level.buggy, toast])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // The editor handles its own Ctrl+Enter (and marks the event handled).
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !e.defaultPrevented) { e.preventDefault(); run() }
      if (e.altKey && e.code === 'KeyH') { e.preventDefault(); showHint() }
      if (e.altKey && e.code === 'KeyR') { e.preventDefault(); reset() }
    }
    const onRunEvent = () => run()
    window.addEventListener('keydown', onKey)
    window.addEventListener(RUN_EVENT, onRunEvent)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener(RUN_EVENT, onRunEvent)
    }
  }, [run, showHint, reset])

  const passed = outcome?.kind === 'ok' ? outcome.results.filter((r) => r.passed).length : 0

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-muted hover:text-text">
          <ChevronLeft size={16} /> {backLabel}
        </Link>
        <span className="text-sm text-muted">/</span>
        <span className="text-sm font-medium">{label}</span>
        <div className="ml-auto flex items-center gap-2">{headerExtra}</div>
      </div>

      <div className="sticky top-14 z-20 -mx-4 mb-4 flex gap-1 border-b border-line bg-bg/90 px-4 py-2 backdrop-blur lg:hidden" role="tablist" aria-label="Panes">
        {(['problem', 'code'] as const).map((v) => (
          <button
            key={v} type="button" role="tab" aria-selected={pane === v} onClick={() => setPane(v)}
            className={cx('flex-1 rounded-lg py-2 text-sm font-medium capitalize', pane === v ? 'bg-surface-2 text-text' : 'text-muted')}
          >
            {v === 'problem' ? 'Problem' : `Code${outcome?.kind === 'ok' ? ` · ${passed}/${outcome.results.length}` : ''}`}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(320px,440px)_1fr]">
        {/* -------- problem panel -------- */}
        <section className={cx('space-y-4 lg:block lg:max-h-[calc(100dvh-8.5rem)] lg:overflow-y-auto lg:pr-1', pane === 'problem' ? 'block' : 'hidden')} aria-label="Problem">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <DifficultyBadge difficulty={level.difficulty} />
              <Pill>{level.topic}</Pill>
              {level.bugLabel && <Pill>{level.bugLabel} bug</Pill>}
              <Pill className={level.bugs > 1 ? 'border-bad/40 text-bad' : ''}>{level.bugs} bug{level.bugs > 1 ? 's' : ''}</Pill>
            </div>
            <h1 className="text-xl font-semibold tracking-tight">{level.title}</h1>
            {level.story && <p className="mt-3 rounded-lg border-l-2 border-warn bg-warn/5 px-3 py-2 text-sm text-muted">{level.story}</p>}
            <p className="mt-3 text-sm leading-relaxed">{level.description}</p>
            <p className="mt-3 text-xs text-muted">
              Fix the code so every test passes. Keep the function name <code className="rounded bg-surface-2 px-1 font-mono text-text">{level.fnName}</code>.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><ListChecks size={16} className="text-accent" /> Test cases</h2>
            <ul className="space-y-1.5 font-mono text-xs">
              {level.tests.map((t, i) => {
                const r = outcome?.kind === 'ok' ? outcome.results[i] : undefined
                return (
                  <li key={i} className="flex items-start gap-2 rounded-lg bg-surface-2/60 px-2.5 py-1.5">
                    <span className="mt-0.5">
                      {r ? (r.passed ? <CircleCheck size={14} className="text-good" /> : <CircleX size={14} className="text-bad" />) : <span className="inline-block size-3.5 rounded-full border border-line-strong" />}
                    </span>
                    <span className="min-w-0 break-all">
                      {level.fnName}({t.args.map(formatValue).join(', ')}) <span className="text-muted">→</span> {formatValue(t.expected)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold"><Lightbulb size={16} className="text-warn" /> Hints</h2>
              <span className="text-xs text-muted">each hint costs XP</span>
            </div>
            {hints === 0 && <p className="mb-3 text-sm text-muted">Stuck? Hints go from a nudge to the exact fix.</p>}
            <ol className="mb-3 space-y-2">
              {level.hints.slice(0, hints).map((h, i) => (
                <li key={i} className="animate-pop rounded-lg border border-warn/20 bg-warn/5 px-3 py-2 text-sm">
                  <span className="mr-2 font-semibold text-warn">{i + 1}.</span>
                  <InlineCode text={h} />
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={showHint} disabled={hints >= level.hints.length}>
                <Lightbulb size={14} /> {hints >= level.hints.length ? 'No more hints' : `Show hint ${hints + 1} of ${level.hints.length}`}
              </Button>
              {!revealed && (confirmReveal ? (
                <Button size="sm" variant="danger" onClick={() => { setRevealed(true); setConfirmReveal(false) }}>
                  <Eye size={14} /> Reveal fix (0 XP)
                </Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setConfirmReveal(true)}>
                  <Eye size={14} /> Give up & show fix
                </Button>
              ))}
            </div>
            {revealed && (
              <div className="animate-pop mt-4 space-y-3">
                <p className="text-sm"><InlineCode text={level.explanation} /></p>
                <DiffView before={level.buggy} after={level.solution} />
                <Button size="sm" onClick={() => { setCode(level.solution); setPane('code') }}>Load the fix into the editor</Button>
              </div>
            )}
          </div>
          <Button variant="primary" className="w-full lg:hidden" onClick={() => setPane('code')}>
            Open the code <ArrowRight size={16} />
          </Button>
        </section>

        {/* -------- editor + results -------- */}
        <section className={cx('min-w-0 flex-col gap-4 lg:flex', pane === 'code' ? 'flex' : 'hidden')} aria-label="Editor">
          <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
              <span className="flex items-center gap-2 px-1 font-mono text-xs text-muted">
                <span className="size-2 rounded-full bg-warn" /> solution.js
              </span>
              <div className="ml-auto flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={reset} title="Reset (Alt+R)"><RotateCcw size={14} /> <span className="hidden sm:inline">Reset</span></Button>
                <Button size="sm" variant="primary" onClick={run} disabled={running} title="Run tests (Ctrl+Enter)">
                  <Play size={14} /> {running ? 'Running…' : 'Run tests'}
                  <span className="hidden gap-0.5 opacity-70 sm:flex"><Kbd>Ctrl</Kbd><Kbd>↵</Kbd></span>
                </Button>
              </div>
            </div>
            <div className="h-[360px] lg:h-[calc(100dvh-26rem)] lg:min-h-[320px]">
              <CodeEditor value={code} onChange={setCode} />
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface">
            <div className="flex items-center gap-1 border-b border-line px-2 pt-2" role="tablist">
              {(['tests', 'console'] as const).map((t) => (
                <button
                  key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                  className={cx('flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-sm', tab === t ? 'border-b-2 border-accent text-text' : 'text-muted hover:text-text')}
                >
                  {t === 'tests' ? <ListChecks size={14} /> : <Terminal size={14} />}
                  {t === 'tests' ? 'Results' : 'Console'}
                  {t === 'console' && outcome && outcome.logs.length > 0 && <span className="rounded bg-surface-2 px-1.5 text-xs">{outcome.logs.length}</span>}
                </button>
              ))}
              {outcome?.kind === 'ok' && (
                <span className={cx('ml-auto mr-2 text-sm font-medium', passed === outcome.results.length ? 'text-good' : 'text-bad')}>
                  {passed}/{outcome.results.length} passed · {outcome.ms}ms
                </span>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto p-3" role="tabpanel">
              {tab === 'tests' ? <Results outcome={outcome} fnName={level.fnName} /> : <Console outcome={outcome} />}
            </div>
          </div>
        </section>
      </div>

      {showModal && solved && (
        <SuccessModal
          level={level}
          result={solved}
          hints={hints}
          revealed={revealed}
          nextHref={nextHref}
          backHref={backHref}
          onClose={() => setShowModal(false)}
          onNext={() => nextHref && router.push(nextHref)}
        />
      )}
    </div>
  )
}

/** Renders `backtick` spans in hint/explanation text as code. */
function InlineCode({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/).map((part, i) =>
        part.startsWith('`') ? (
          <code key={i} className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.85em] text-accent">{part.slice(1, -1)}</code>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

function Results({ outcome, fnName }: { outcome: RunOutcome | null; fnName: string }) {
  if (!outcome) {
    return <p className="px-1 py-4 text-center text-sm text-muted">Run the tests to see results. Your code runs in a sandboxed worker in your browser.</p>
  }
  if (outcome.kind === 'timeout') {
    return (
      <div className="rounded-lg border border-bad/30 bg-bad/10 p-3 text-sm text-bad">
        <b>Timed out after 2 seconds.</b> The code is probably stuck in an infinite loop — check that every loop moves towards its exit condition.
      </div>
    )
  }
  if (outcome.kind === 'compile-error') {
    return <div className="rounded-lg border border-bad/30 bg-bad/10 p-3 font-mono text-sm text-bad">{outcome.message}</div>
  }
  return (
    <ul className="space-y-2">
      {outcome.results.map((r) => (
        <li key={r.index} className={cx('rounded-lg border px-3 py-2 font-mono text-xs', r.passed ? 'border-good/25 bg-good/5' : 'border-bad/30 bg-bad/5')}>
          <div className="flex items-center gap-2">
            {r.passed ? <CircleCheck size={14} className="text-good" /> : <CircleX size={14} className="text-bad" />}
            <span className="break-all">{fnName}({r.args})</span>
          </div>
          {!r.passed && (
            <div className="mt-1.5 grid gap-0.5 pl-6">
              <span><span className="text-muted">expected </span>{r.expected}</span>
              <span className="text-bad"><span className="text-muted">received </span>{r.error ?? r.actual}</span>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

function Console({ outcome }: { outcome: RunOutcome | null }) {
  if (outcome?.kind === 'compile-error') {
    return <div className="font-mono text-sm text-bad">{outcome.message}</div>
  }
  if (!outcome || outcome.logs.length === 0) {
    return <p className="px-1 py-4 text-center text-sm text-muted">Add <code className="font-mono">console.log()</code> to your code to debug — output shows up here.</p>
  }
  return (
    <pre className="space-y-1 font-mono text-xs">
      {outcome.logs.map((l, i) => <div key={i} className="border-b border-line/50 pb-1">{l}</div>)}
    </pre>
  )
}

function Confetti() {
  const colors = ['var(--accent)', 'var(--good)', 'var(--warn)', 'var(--violet)', 'var(--bad)']
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: 28 }, (_, i) => (
        <span
          key={i}
          className="absolute top-0 block h-2.5 w-1.5 rounded-sm"
          style={{
            left: `${(i * 37) % 100}%`,
            background: colors[i % colors.length],
            animation: `confetti-fall ${1.4 + (i % 5) * 0.25}s ease-in ${(i % 7) * 0.08}s both`,
          }}
        />
      ))}
    </div>
  )
}

function SuccessModal({ level, result, hints, revealed, nextHref, backHref, onClose, onNext }: {
  level: Playable; result: SolveResult & { ms: number }; hints: number; revealed: boolean
  nextHref?: string; backHref: string; onClose: () => void; onNext: () => void
}) {
  const nextRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    nextRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="solved-title" className="animate-pop relative w-full max-w-2xl overflow-hidden rounded-3xl border border-line-strong bg-surface p-6 shadow-2xl sm:p-8" onMouseDown={(e) => e.stopPropagation()}>
        {!revealed && <Confetti />}
        <div className="relative">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-good/15 text-good"><Sparkles size={24} /></span>
            <div>
              <h2 id="solved-title" className="text-2xl font-semibold tracking-tight">{revealed ? 'Solved with the fix revealed' : 'Bug squashed!'}</h2>
              <p className="text-sm text-muted">{level.title}</p>
            </div>
          </div>
          <div className="mb-5 grid grid-cols-3 gap-3 text-center">
            <Stat label="XP earned" value={`+${result.gain}`} tone="text-accent" />
            <Stat label="Time" value={formatMs(result.ms)} icon={<Clock size={14} />} />
            <Stat label="Hints used" value={String(hints)} />
          </div>
          {result.note && <p className="mb-4 rounded-lg bg-surface-2 px-3 py-2 text-sm">{result.note}</p>}
          <h3 className="mb-2 text-sm font-semibold">Why it was broken</h3>
          <p className="mb-3 text-sm leading-relaxed text-muted"><InlineCode text={level.explanation} /></p>
          <DiffView before={level.buggy} after={level.solution} />
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Link href={backHref} className={buttonClass('ghost')}>Back to list</Link>
            <Button onClick={onClose}>Keep exploring</Button>
            {nextHref && (
              <Button ref={nextRef} variant="primary" onClick={onNext}>Next level <ArrowRight size={16} /></Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, tone, icon }: { label: string; value: string; tone?: string; icon?: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/60 px-3 py-3">
      <div className={cx('flex items-center justify-center gap-1 text-xl font-semibold', tone)}>{icon}{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  )
}
