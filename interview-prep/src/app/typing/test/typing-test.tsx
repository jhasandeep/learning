'use client'

import { ChevronLeft, RotateCcw, Trophy } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { fingerHint, Keyboard } from '@/components/typing/keyboard'
import { keyLabel, StatsBar, weakKeys } from '@/components/typing/stats-bar'
import { TypingArea } from '@/components/typing/typing-area'
import { useToast } from '@/components/toast'
import { Button, cx } from '@/components/ui'
import { recordTypingTest, useProgress } from '@/lib/progress'
import { backspace, createSession, extend, finish, rng, stats, testWords, typeChar, type Session } from '@/lib/typing'

/** Seconds, or 'auto': a passage sized to your recent speed (about a minute), no time limit. */
type Duration = number | 'auto'
const DURATIONS: Duration[] = [15, 30, 60, 120, 300, 600, 'auto']
const AUTO_SECONDS = 60
const fmtTime = (sec: number) => (sec < 60 ? `${sec}s` : `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`)
const durationLabel = (d: Duration) => (d === 'auto' ? 'Auto' : d < 60 ? `${d}s` : `${d / 60}m`)
const MODES = [
  { id: 'words', label: 'Words' },
  { id: 'punctuation', label: 'Punctuation' },
  { id: 'numbers', label: 'Numbers' },
  { id: 'code', label: 'Code' },
] as const
type Mode = (typeof MODES)[number]['id']

export function TypingTest({ code }: { code: { id: string; title: string; snippets: string[] }[] }) {
  const p = useProgress()
  const toast = useToast()
  const [duration, setDuration] = useState<Duration>(30)
  const [codeSet, setCodeSet] = useState('all')
  const [mode, setMode] = useState<Mode>('words')
  const [showKeyboard, setShowKeyboard] = useState(true)
  const gen = useRef(rng(1))
  const [session, setSession] = useState<Session>(() => createSession(testWords('words', rng(1), 60)))
  const [now, setNow] = useState(0)
  const [samples, setSamples] = useState<{ s: number; wpm: number; raw: number; errors: number }[]>([])
  const saved = useRef(false)
  const lastWrong = useRef(0)
  const sampled = useRef(0) // seconds already sampled for the chart

  const pool = useCallback((set: string) => (set === 'all' ? code.flatMap((c) => c.snippets) : code.find((c) => c.id === set)?.snippets ?? []), [code])
  const more = useCallback((m: Mode, count: number, set = codeSet) => {
    const r = gen.current
    if (m === 'code') return r.shuffle(pool(set)).slice(0, 3).join('\n\n')
    return testWords(m, r, count)
  }, [pool, codeSet])

  // Auto: about a minute of text at your recent average speed (30 WPM until you have tests).
  const recentWpm = (() => {
    const last = p.typing.tests.slice(0, 5)
    return last.length ? last.reduce((sum, t) => sum + t.wpm, 0) / last.length : 30
  })()
  const autoText = useCallback((m: Mode, set = codeSet) => {
    const chars = Math.round((recentWpm * 5 * AUTO_SECONDS) / 60)
    if (m !== 'code') return testWords(m, gen.current, Math.min(150, Math.max(25, Math.round(chars / 5))))
    const snippets = gen.current.shuffle(pool(set))
    const picked: string[] = []
    for (const sn of snippets) {
      picked.push(sn)
      if (picked.join('\n\n').length >= chars) break
    }
    return picked.join('\n\n')
  }, [recentWpm, pool, codeSet])

  const reset = useCallback((m: Mode = mode, d: Duration = duration, seed = Date.now(), set = codeSet) => {
    gen.current = rng(seed)
    setSession(createSession(d === 'auto' ? autoText(m, set) : more(m, 60, set), m === 'code'))
    setCodeSet(set)
    setSamples([])
    setNow(0)
    saved.current = false
    lastWrong.current = 0
    sampled.current = 0
    setDuration(d)
    setMode(m)
  }, [mode, duration, more, autoText, codeSet])

  const started = session.startedAt !== null
  const done = session.endedAt !== null
  const elapsed = started ? ((done ? session.endedAt! : now || session.startedAt!) - session.startedAt!) / 1000 : 0
  const auto = duration === 'auto'
  const left = auto ? 0 : Math.max(0, Math.ceil(duration - elapsed))

  // The clock reads the latest session through a ref, so the interval isn't reset on every key.
  const latest = useRef(session)
  useEffect(() => {
    latest.current = session
  }, [session])

  // Clock: sample the speed every second and stop at the time limit.
  useEffect(() => {
    if (!started || done) return
    const id = window.setInterval(() => {
      const t = Date.now()
      const s = latest.current
      if (s.startedAt === null || s.endedAt !== null) return
      setNow(t)
      const secs = (t - s.startedAt) / 1000
      const sec = Math.floor(secs)
      if (sec >= 1 && sampled.current < sec) {
        sampled.current = sec
        const st = stats(s, t)
        const errors = s.wrong - lastWrong.current
        lastWrong.current = s.wrong
        setSamples((prev) => [...prev, { s: sec, wpm: st.wpm, raw: st.raw, errors }])
      }
      if (typeof duration === 'number' && secs >= duration) setSession((cur) => finish(cur, cur.startedAt! + duration * 1000))
    }, 200)
    return () => window.clearInterval(id)
  }, [started, done, duration])

  /** Type a key, topping up the text when the caret gets close to the end. */
  const type = (ch: string) => {
    let s = typeChar(session, ch, Date.now())
    if (!auto && s.endedAt === null && s.target.length - s.typed.length < 120) s = extend(s, (mode === 'code' ? '\n\n' : ' ') + more(mode, 30))
    setSession(s)
  }

  const st = stats(session, done ? session.endedAt! : now || session.startedAt || 0)
  const modeId = `test:${auto ? 'auto' : `${duration}s`}:${mode}`
  const previousBest = p.typing.tests.filter((t) => t.mode === modeId).reduce((m, t) => Math.max(m, t.wpm), 0)

  useEffect(() => {
    if (!done || saved.current) return
    saved.current = true
    const xp = recordTypingTest({ wpm: st.wpm, raw: st.raw, accuracy: st.accuracy, seconds: Math.round(st.seconds), mode: modeId }, session.keys)
    if (xp) toast(`Test saved · +${xp} XP`, 'good')
  }, [done, st.wpm, st.raw, st.accuracy, st.seconds, modeId, session.keys, toast])

  // Esc or Tab restarts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || (e.key === 'Tab' && done)) {
        e.preventDefault()
        reset()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [done, reset])

  const chip = (active: boolean) => cx('h-8 rounded-lg px-3 text-xs font-medium transition', active ? 'bg-accent text-white' : 'text-muted hover:bg-surface-2 hover:text-text')
  const nextChar = done ? null : session.target[session.typed.length]
  const isBest = done && st.wpm > previousBest && st.accuracy >= 80
  const weak = weakKeys(session.keys, 3, 5)

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/typing" className="inline-flex items-center gap-1 text-muted hover:text-text"><ChevronLeft size={16} /> Typing</Link>
        <span className="text-muted">/</span>
        <span className="font-medium">Typing test</span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <div className="flex rounded-xl border border-line bg-surface p-1" role="group" aria-label="Duration">
          {DURATIONS.map((d) => <button key={d} type="button" aria-pressed={duration === d} className={chip(duration === d)} onClick={() => reset(mode, d)} title={d === 'auto' ? `About a minute of text at your recent speed (${Math.round(recentWpm)} WPM); finish the passage to end` : undefined}>{durationLabel(d)}</button>)}
        </div>
        <div className="flex rounded-xl border border-line bg-surface p-1" role="group" aria-label="Text">
          {MODES.map((m) => <button key={m.id} type="button" aria-pressed={mode === m.id} className={chip(mode === m.id)} onClick={() => reset(m.id)}>{m.label}</button>)}
        </div>
        {mode === 'code' && (
          <select aria-label="Code from" value={codeSet} onChange={(e) => reset('code', duration, Date.now(), e.target.value)} className="h-10 rounded-xl border border-line bg-surface px-2 text-xs text-text outline-none focus:border-accent">
            <option value="all">All technologies</option>
            {code.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        )}
        <label className="flex items-center gap-1.5 text-xs text-muted"><input type="checkbox" checked={showKeyboard} onChange={(e) => setShowKeyboard(e.target.checked)} className="accent-[var(--accent)]" /> Keyboard</label>
      </div>

      {!done ? (
        <>
          <StatsBar items={[
            auto
              ? { label: `Time · ${Math.round((session.typed.length / session.target.length) * 100)}% done`, value: fmtTime(Math.floor(elapsed)) }
              : { label: 'Time left', value: fmtTime(left), tone: left <= 5 && started ? 'bad' : undefined },
            { label: 'WPM', value: String(started ? st.wpm : 0) },
            { label: 'Accuracy', value: `${st.accuracy}%`, tone: st.accuracy >= 95 ? 'good' : st.accuracy >= 85 ? 'warn' : 'bad' },
          ]} />
          <div className="rounded-3xl border border-line bg-surface p-4 sm:p-6">
            <TypingArea compact={mode === 'code'} target={session.target} typed={session.typed} lines={mode === 'code' ? 8 : 3}
              onChar={type}
              onBack={(word) => setSession((s) => backspace(s, word))} />
            <p className="mt-3 text-center text-xs text-muted">{started ? 'Esc restarts' : 'The timer starts with your first key · Esc restarts'}</p>
          </div>
          {showKeyboard && (
            <div className="space-y-2">
              <Keyboard next={nextChar} />
              <p className="text-center text-xs text-muted">{fingerHint(nextChar)}</p>
            </div>
          )}
        </>
      ) : (
        <section className="animate-pop space-y-5 rounded-3xl border border-line bg-surface p-5 sm:p-8" aria-live="polite">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted">{auto ? `Auto · ${fmtTime(Math.round(st.seconds))}` : durationLabel(duration)} · {MODES.find((m) => m.id === mode)?.label}</p>
              <p className="font-mono text-6xl font-semibold tabular-nums text-accent">{st.wpm}<span className="ml-2 text-xl text-muted">WPM</span></p>
              {isBest && <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-warn"><Trophy size={15} /> New personal best{previousBest ? ` (was ${previousBest})` : ''}</p>}
            </div>
            <Button variant="primary" onClick={() => reset()}><RotateCcw size={15} /> Try again <span className="opacity-70">(Tab)</span></Button>
          </div>
          <StatsBar items={[
            { label: 'Accuracy', value: `${st.accuracy}%`, tone: st.accuracy >= 95 ? 'good' : st.accuracy >= 85 ? 'warn' : 'bad' },
            { label: 'Raw WPM', value: String(st.raw) },
            { label: 'Correct chars', value: String(st.correct), tone: 'good' },
            { label: 'Errors', value: String(session.wrong), tone: session.wrong ? 'bad' : undefined },
          ]} />
          <SpeedChart samples={samples} />
          <div>
            <p className="mb-2 text-sm font-medium">Keys you missed {weak.length ? '' : '(none, nice!)'}</p>
            {weak.length > 0 && <p className="mb-3 flex flex-wrap gap-1.5">{weak.map((w) => <span key={w.key} className="rounded-lg border border-bad/30 bg-bad/10 px-2 py-0.5 font-mono text-xs text-bad">{keyLabel(w.key)} · {w.misses}/{w.total}</span>)}</p>}
            <Keyboard heat={session.keys} />
          </div>
        </section>
      )}
    </div>
  )
}

/** WPM per second as a line, with error marks along the bottom. */
function SpeedChart({ samples }: { samples: { s: number; wpm: number; raw: number; errors: number }[] }) {
  if (samples.length < 2) return null
  const W = 720
  const H = 180
  const pad = { l: 34, r: 10, t: 12, b: 24 }
  const maxS = samples[samples.length - 1].s
  const maxV = Math.max(20, ...samples.map((x) => x.raw)) * 1.1
  const x = (s: number) => pad.l + ((s - 1) / Math.max(1, maxS - 1)) * (W - pad.l - pad.r)
  const y = (v: number) => pad.t + (1 - v / maxV) * (H - pad.t - pad.b)
  const line = (key: 'wpm' | 'raw') => samples.map((p, i) => `${i ? 'L' : 'M'} ${x(p.s).toFixed(1)} ${y(p[key]).toFixed(1)}`).join(' ')
  const ticks = [0, 0.5, 1].map((f) => Math.round(maxV * f / 10) * 10)
  return (
    <figure>
      <figcaption className="mb-1 flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-accent" /> WPM</span>
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-muted/50" /> Raw</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-bad" /> Errors</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Words per minute over the test">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeDasharray="3 4" />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">{t}</text>
          </g>
        ))}
        <path d={line('raw')} fill="none" stroke="var(--muted)" strokeOpacity="0.45" strokeWidth="2" />
        <path d={line('wpm')} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" />
        {samples.filter((p) => p.errors > 0).map((p) => <circle key={p.s} cx={x(p.s)} cy={H - pad.b + 10} r={2.5 + Math.min(3, p.errors)} fill="var(--bad)" fillOpacity="0.8" />)}
        <text x={W - pad.r} y={H - 2} textAnchor="end" fontSize="11" fill="var(--muted)">{fmtTime(maxS)}</text>
      </svg>
    </figure>
  )
}
