'use client'

import { ArrowRight, Brain, Check, ChevronLeft, Copy, Eye, Keyboard as KeyboardIcon, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Inline } from '@/components/notes/inline'
import { TechIcon } from '@/components/tech-icon'
import { useToast } from '@/components/toast'
import { Keyboard } from '@/components/typing/keyboard'
import { StatsBar } from '@/components/typing/stats-bar'
import { TypingArea } from '@/components/typing/typing-area'
import { Button, buttonClass, cx } from '@/components/ui'
import type { SyntaxSet } from '@/data/syntax'
import { recordSnippet, useProgress } from '@/lib/progress'
import { backspace, createSession, isDone, stats, typeChar, type Session } from '@/lib/typing'

type Mode = 'copy' | 'memory'
const PEEK_MS = 1500
const MEMORY_ACCURACY = 90

export function SyntaxPractice({ set, look, next }: { set: SyntaxSet; look: { icon: string; color: string }; next?: { id: string; title: string } }) {
  const p = useProgress()
  const toast = useToast()
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>('copy')
  const [session, setSession] = useState<Session>(() => createSession(set.snippets[0].code, true))
  const [now, setNow] = useState(0)
  const [peeking, setPeeking] = useState(false)
  const [peeks, setPeeks] = useState(0)
  const [showKeyboard, setShowKeyboard] = useState(false)
  const saved = useRef(false)
  const snippet = set.snippets[index]
  const key = `${set.id}/${snippet.id}`
  const rec = p.typing.snippets[key]
  const done = isDone(session)
  const memorisedCount = set.snippets.filter((s) => p.typing.snippets[`${set.id}/${s.id}`]?.memorised).length

  const start = useCallback((i: number, m: Mode) => {
    setIndex(i)
    setMode(m)
    setSession(createSession(set.snippets[i].code, true))
    setPeeks(0)
    setPeeking(false)
    saved.current = false
  }, [set])

  useEffect(() => {
    if (session.startedAt === null || done) return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [session.startedAt, done])

  const st = stats(session, done ? session.endedAt! : now || session.startedAt || 0)
  const memorised = mode === 'memory' && st.accuracy >= MEMORY_ACCURACY && peeks <= 1

  useEffect(() => {
    if (!done || saved.current) return
    saved.current = true
    const xp = recordSnippet(key, { wpm: st.wpm, accuracy: st.accuracy, memorised }, session.keys)
    if (xp) toast(memorised ? `Written from memory · +${xp} XP` : `Snippet typed · +${xp} XP`, 'good')
  }, [done, key, st.wpm, st.accuracy, memorised, session.keys, toast])

  // When finished: Enter types it again, M switches to memory mode, N goes to the next snippet.
  useEffect(() => {
    if (!done) return
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      const action = k === 'enter' ? () => start(index, mode) : k === 'm' ? () => start(index, 'memory') : k === 'n' && index < set.snippets.length - 1 ? () => start(index + 1, 'copy') : null
      if (!action) return
      // Capture phase + stop: the shortcut key must not also be typed into the new run.
      e.preventDefault()
      e.stopPropagation()
      action()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [done, index, mode, start, set.snippets.length])

  const peek = () => {
    setPeeks((n) => n + 1)
    setPeeking(true)
    window.setTimeout(() => setPeeking(false), PEEK_MS)
  }

  const reps = rec?.reps ?? 0
  const nextChar = done ? null : session.target[session.typed.length]

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link href="/typing#syntax" className="inline-flex items-center gap-1 text-muted hover:text-text"><ChevronLeft size={16} /> Typing</Link>
        <span className="text-muted">/</span>
        <span className="inline-flex items-center gap-1.5 font-medium"><TechIcon id={look.icon} size={16} color={look.color} /> {set.title} syntax</span>
        <span className="ml-auto text-xs text-muted">{memorisedCount}/{set.snippets.length} memorised</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        {/* snippet list */}
        <nav aria-label="Snippets" className="lg:sticky lg:top-20 lg:self-start">
          <label htmlFor="snippet-pick" className="sr-only">Snippet</label>
          <select id="snippet-pick" value={index} onChange={(e) => start(Number(e.target.value), 'copy')} className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm lg:hidden">
            {set.snippets.map((s, i) => <option key={s.id} value={i}>{i + 1}. {s.title}</option>)}
          </select>
          <ol className="hidden space-y-1 lg:block">
            {set.snippets.map((s, i) => {
              const r = p.typing.snippets[`${set.id}/${s.id}`]
              return (
                <li key={s.id}>
                  <button type="button" onClick={() => start(i, 'copy')} aria-current={i === index ? 'true' : undefined} className={cx('flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition', i === index ? 'bg-surface font-medium shadow-sm ring-1 ring-line' : 'text-muted hover:bg-surface-2 hover:text-text')}>
                    <span className={cx('grid size-5 shrink-0 place-items-center rounded-md text-[10px] font-bold', r?.memorised ? 'bg-good text-white' : r ? 'bg-accent/15 text-accent' : 'bg-surface-2 text-muted')}>{r?.memorised ? <Check size={12} /> : i + 1}</span>
                    <span className="min-w-0 flex-1 truncate">{s.title}</span>
                    {r && <span className="shrink-0 text-[10px] tabular-nums text-muted">{r.reps}×</span>}
                  </button>
                </li>
              )
            })}
          </ol>
          {next && <Link href={`/typing/syntax/${next.id}`} className="mt-3 hidden items-center gap-1 px-2.5 text-xs font-medium text-accent lg:inline-flex">Next: {next.title} <ArrowRight size={13} /></Link>}
        </nav>

        <div className="min-w-0 space-y-4">
          <header className="rounded-3xl border border-line bg-surface p-5">
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold tracking-tight">{snippet.title}</h1>
                <p className="mt-1 text-sm text-muted"><Inline text={snippet.note} /></p>
              </div>
              <div className="flex rounded-xl border border-line bg-surface-2/60 p-1" role="group" aria-label="Practice mode">
                {([['copy', Copy, 'Copy'], ['memory', Brain, 'Memory']] as const).map(([m, Icon, label]) => (
                  <button key={m} type="button" aria-pressed={mode === m} onClick={() => start(index, m)} className={cx('inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition', mode === m ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text')}>
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              <span>Typed <b className="text-text">{reps}×</b></span>
              {rec && <span>Best <b className="text-text">{rec.bestWpm} WPM</b> · {rec.bestAccuracy}%</span>}
              <span className={rec?.memorised ? 'font-medium text-good' : ''}>{rec?.memorised ? 'Memorised ✓' : mode === 'memory' ? `Memory: ${MEMORY_ACCURACY}%+ accuracy, at most 1 peek` : reps >= 2 ? 'Ready? Try it from memory' : 'Type it a few times, then try Memory mode'}</span>
            </p>
          </header>

          {!done ? (
            <>
              <StatsBar items={[
                { label: 'WPM', value: String(session.startedAt ? st.wpm : 0) },
                { label: 'Accuracy', value: `${st.accuracy}%`, tone: st.accuracy >= 95 ? 'good' : st.accuracy >= 85 ? 'warn' : 'bad' },
                { label: 'Progress', value: `${Math.round((session.typed.length / session.target.length) * 100)}%` },
              ]} />
              <div className="relative rounded-3xl border border-line bg-surface p-4 sm:p-6" style={{ borderColor: mode === 'memory' ? `color-mix(in srgb, ${look.color} 40%, var(--line))` : undefined }}>
                {mode === 'memory' && (
                  <div className="mb-3 flex items-center justify-between gap-2 text-xs text-muted">
                    <span className="flex items-center gap-1.5"><Brain size={14} style={{ color: look.color }} /> Write it from memory. A wrong key shows the right character in red.</span>
                    <Button size="sm" variant="secondary" onClick={peek} onMouseDown={(e) => e.preventDefault() /* keep focus in the typing area */} disabled={peeking}><Eye size={14} /> Peek{peeks ? ` (${peeks})` : ''}</Button>
                  </div>
                )}
                <TypingArea compact target={session.target} typed={session.typed} lines={Math.min(18, session.target.split('\n').length + 1)} mask={mode === 'memory' && !peeking}
                  onChar={(ch) => setSession((s) => typeChar(s, ch, Date.now()))}
                  onBack={(word) => setSession((s) => backspace(s, word))} />
                <p className="mt-3 text-center text-[11px] text-muted">Indentation after Enter is typed for you · Ctrl+Backspace deletes a word</p>
              </div>
              <label className="flex items-center justify-center gap-1.5 text-xs text-muted"><input type="checkbox" checked={showKeyboard} onChange={(e) => setShowKeyboard(e.target.checked)} className="accent-[var(--accent)]" /> <KeyboardIcon size={13} /> Show keyboard</label>
              {showKeyboard && <Keyboard next={nextChar} />}
            </>
          ) : (
            <section className="animate-pop rounded-3xl border border-line bg-surface p-6 text-center" aria-live="polite">
              <p className={cx('mx-auto grid size-14 place-items-center rounded-2xl', memorised ? 'bg-good text-white' : 'bg-accent/15 text-accent')}>{memorised ? <Brain size={28} /> : <Check size={28} />}</p>
              <h2 className="mt-3 text-xl font-semibold">{memorised ? 'You wrote it from memory!' : mode === 'memory' ? 'Almost: try it again from memory' : `Typed ${reps}×`}</h2>
              <p className="mt-1 text-sm text-muted">{mode === 'copy' ? (reps >= 2 ? 'Now try it without looking: switch to Memory mode.' : 'Type it again to build the habit.') : memorised ? 'Come back tomorrow and do it once more to keep it.' : `You need ${MEMORY_ACCURACY}% accuracy with at most one peek.`}</p>
              <div className="mx-auto mt-4 max-w-md">
                <StatsBar items={[
                  { label: 'WPM', value: String(st.wpm), tone: 'good' },
                  { label: 'Accuracy', value: `${st.accuracy}%`, tone: st.accuracy >= 95 ? 'good' : st.accuracy >= 85 ? 'warn' : 'bad' },
                  ...(mode === 'memory' ? [{ label: 'Peeks', value: String(peeks), tone: peeks <= 1 ? ('good' as const) : ('bad' as const) }] : []),
                ]} />
              </div>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Button variant="secondary" onClick={() => start(index, mode)}><RotateCcw size={15} /> Again <span className="opacity-60">(Enter)</span></Button>
                {mode === 'copy' && <Button variant="secondary" onClick={() => start(index, 'memory')}><Brain size={15} /> From memory <span className="opacity-60">(M)</span></Button>}
                {index < set.snippets.length - 1 ? (
                  <Button variant="primary" onClick={() => start(index + 1, 'copy')}>Next snippet <span className="opacity-70">(N)</span> <ArrowRight size={15} /></Button>
                ) : next ? (
                  <Link href={`/typing/syntax/${next.id}`} className={buttonClass('primary')}>{next.title} syntax <ArrowRight size={15} /></Link>
                ) : null}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
