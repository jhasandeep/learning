'use client'

import { ArrowRight, ChevronLeft, Keyboard as KeyboardIcon, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { fingerHint, Hands, Keyboard, target as keyTarget } from '@/components/typing/keyboard'
import { keyLabel, Stars, StatsBar, weakKeys } from '@/components/typing/stats-bar'
import { TypingArea } from '@/components/typing/typing-area'
import { useToast } from '@/components/toast'
import { Button, buttonClass } from '@/components/ui'
import { CHAR_KEY, FINGERS, type Lesson } from '@/data/typing'
import { recordTypingLesson, useProgress } from '@/lib/progress'
import { backspace, createSession, isDone, lessonText, starsFor, stats, typeChar, type Session } from '@/lib/typing'

export function LessonPlayer({ lesson, number, total, next, snippets }: { lesson: Lesson; number: number; total: number; next?: string; snippets: Record<string, string[]> }) {
  const p = useProgress()
  const toast = useToast()
  const [seed, setSeed] = useState(1)
  const text = useMemo(() => lessonText(lesson, seed, snippets), [lesson, seed, snippets])
  const [session, setSession] = useState<Session>(() => createSession(text, lesson.kind === 'code'))
  const [now, setNow] = useState(0)
  const saved = useRef(false)
  const done = isDone(session)
  const best = p.typing.lessons[lesson.id]

  // Live numbers refresh while typing.
  useEffect(() => {
    if (session.startedAt === null || done) return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [session.startedAt, done])

  const st = stats(session, done ? session.endedAt! : now || session.startedAt || 0)
  const stars = done ? starsFor(st) : 0

  useEffect(() => {
    if (!done || saved.current) return
    saved.current = true
    const xp = recordTypingLesson(lesson.id, { stars, wpm: st.wpm, accuracy: st.accuracy }, session.keys)
    if (xp) toast(`Lesson complete · +${xp} XP`, 'good')
  }, [done, stars, st.wpm, st.accuracy, lesson.id, session.keys, toast])

  const restart = () => {
    const nextSeed = seed + 1
    setSeed(nextSeed)
    setSession(createSession(lessonText(lesson, nextSeed, snippets), lesson.kind === 'code'))
    saved.current = false
  }

  const nextChar = done ? null : session.target[session.typed.length]
  const t = keyTarget(nextChar)
  const progress = Math.round((session.typed.length / session.target.length) * 100)
  const weak = weakKeys(session.keys, 2, 4)

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link href="/typing" className="inline-flex items-center gap-1 text-muted hover:text-text"><ChevronLeft size={16} /> Typing</Link>
        <span className="text-muted">/</span>
        <span className="font-medium">Lesson {number} of {total}</span>
        {best && <span className="ml-auto flex items-center gap-1 text-xs text-muted">Best: <Stars n={best.stars} size={13} /> {best.wpm} WPM</span>}
      </div>

      <header className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
        <p className="text-sm font-medium text-accent">{lesson.track}</p>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">{lesson.title}</h1>
        <p className="mt-1 text-sm text-muted">{lesson.tip}</p>
        {lesson.newKeys.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {lesson.newKeys.map((k) => {
              const entry = CHAR_KEY[k]
              const finger = entry ? FINGERS[entry.key.finger] : null
              return (
                <span key={k} className="flex items-center gap-2 rounded-xl border border-line bg-surface-2/60 py-1 pl-1 pr-3 text-xs">
                  <kbd className="grid h-8 min-w-8 place-items-center rounded-lg px-1.5 font-mono text-sm font-semibold text-white" style={{ background: finger?.color ?? 'var(--accent)' }}>{k === 'Shift' ? '⇧' : k}</kbd>
                  {finger ? finger.name : 'Opposite pinky'}
                </span>
              )
            })}
          </div>
        )}
      </header>

      {!done ? (
        <>
          <StatsBar items={[
            { label: 'WPM', value: String(session.startedAt ? st.wpm : 0) },
            { label: 'Accuracy', value: `${st.accuracy}%`, tone: st.accuracy >= 95 ? 'good' : st.accuracy >= 85 ? 'warn' : 'bad' },
            { label: 'Progress', value: `${progress}%` },
          ]} />
          <div className="rounded-3xl border border-line bg-surface p-4 sm:p-6">
            <TypingArea compact={lesson.kind === 'code'} target={session.target} typed={session.typed} lines={lesson.kind === 'code' ? 6 : 3}
              onChar={(ch) => setSession((s) => typeChar(s, ch, Date.now()))}
              onBack={(word) => setSession((s) => backspace(s, word))} />
          </div>
          <div className="space-y-3">
            <Keyboard next={nextChar} />
            <Hands finger={t.finger} />
            <p className="text-center text-xs text-muted" aria-live="polite">{fingerHint(nextChar)}</p>
          </div>
        </>
      ) : (
        <section className="animate-pop rounded-3xl border border-line bg-surface p-6 text-center sm:p-8" aria-live="polite">
          <Stars n={stars} size={40} className="justify-center" />
          <h2 className="mt-3 text-2xl font-semibold">{stars === 3 ? 'Perfect!' : stars === 2 ? 'Great job!' : stars === 1 ? 'Lesson passed' : 'Keep practising'}</h2>
          <p className="mt-1 text-sm text-muted">{stars < 3 ? (st.accuracy < 94 ? 'Slow down a little: accuracy builds speed.' : 'Accurate! Now push the speed a bit.') : 'Fast and accurate.'}</p>
          <div className="mx-auto mt-5 max-w-lg">
            <StatsBar items={[
              { label: 'WPM', value: String(st.wpm), tone: 'good' },
              { label: 'Accuracy', value: `${st.accuracy}%`, tone: st.accuracy >= 95 ? 'good' : st.accuracy >= 85 ? 'warn' : 'bad' },
              { label: 'Time', value: `${Math.round(st.seconds)}s` },
            ]} />
          </div>
          {weak.length > 0 && (
            <p className="mt-4 text-sm text-muted">
              Practise: {weak.map((w) => <kbd key={w.key} className="mx-0.5 rounded-md border border-bad/40 bg-bad/10 px-1.5 py-0.5 font-mono text-xs text-bad">{keyLabel(w.key)}</kbd>)}
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={restart}><RotateCcw size={15} /> Try again</Button>
            {next ? (
              <Link href={`/typing/lesson/${next}`} className={buttonClass('primary')}>Next lesson <ArrowRight size={15} /></Link>
            ) : (
              <Link href="/typing/test" className={buttonClass('primary')}><KeyboardIcon size={15} /> Take a typing test</Link>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
