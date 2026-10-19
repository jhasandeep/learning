'use client'

import { ArrowRight, Code2, Gauge, GraduationCap, Keyboard as KeyboardIcon, Lock, Star, Target, Timer } from 'lucide-react'
import Link from 'next/link'
import { Keyboard } from '@/components/typing/keyboard'
import { keyLabel, Stars, weakKeys } from '@/components/typing/stats-bar'
import { buttonClass, cx } from '@/components/ui'
import { CHAR_KEY, FINGERS, LESSONS, type Lesson } from '@/data/typing'
import { useProgress } from '@/lib/progress'

const TRACKS: { id: Lesson['track']; icon: typeof KeyboardIcon; text: string }[] = [
  { id: 'Beginner', icon: GraduationCap, text: 'Touch typing from the home row out, two new keys at a time.' },
  { id: 'Intermediate', icon: Target, text: 'Capitals, punctuation, numbers, common words and full sentences.' },
  { id: 'Code', icon: Code2, text: 'Brackets, operators and symbols, then real JavaScript, Python and SQL.' },
]

export function TypingHub() {
  const p = useProgress()
  const t = p.typing
  const best = t.tests.reduce((m, x) => Math.max(m, x.wpm), 0)
  const recent = t.tests.slice(0, 10)
  const avg = recent.length ? Math.round(recent.reduce((s, x) => s + x.wpm, 0) / recent.length) : 0
  const lessonsDone = LESSONS.filter((l) => (t.lessons[l.id]?.stars ?? 0) > 0).length
  const stars = LESSONS.reduce((s, l) => s + (t.lessons[l.id]?.stars ?? 0), 0)
  const next = LESSONS.find((l) => !t.lessons[l.id]?.stars) ?? LESSONS[0]
  const weak = weakKeys(t.keys, 10, 6)
  const hasKeys = Object.keys(t.keys).length > 0

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-accent/10 blur-3xl" aria-hidden />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-accent"><KeyboardIcon size={15} /> Typing</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Type faster, from the home row to real code</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              {LESSONS.length} lessons with an on-screen keyboard that shows which key and which finger come next, timed tests with a speed chart, and a heatmap of the keys you miss.
              The Code track uses snippets from your notes.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href={`/typing/lesson/${next.id}`} className={buttonClass('primary')}>{lessonsDone ? 'Continue' : 'Start'}: {next.title} <ArrowRight size={15} /></Link>
              <Link href="/typing/test" className={buttonClass('secondary')}><Timer size={15} /> Typing test</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-2">
            <Stat icon={<Gauge size={15} />} label="Best WPM" value={best || '–'} />
            <Stat icon={<Timer size={15} />} label="Avg (last 10)" value={avg || '–'} />
            <Stat icon={<GraduationCap size={15} />} label="Lessons" value={`${lessonsDone}/${LESSONS.length}`} />
            <Stat icon={<Star size={15} />} label="Stars" value={`${stars}/${LESSONS.length * 3}`} />
          </div>
        </div>
      </header>

      {TRACKS.map((track) => {
        const list = LESSONS.filter((l) => l.track === track.id)
        return (
          <section key={track.id} aria-labelledby={`track-${track.id}`}>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 id={`track-${track.id}`} className="flex items-center gap-2 font-semibold"><track.icon size={17} className="text-accent" /> {track.id}</h2>
                <p className="text-sm text-muted">{track.text}</p>
              </div>
              <span className="text-xs text-muted">{list.filter((l) => t.lessons[l.id]?.stars).length}/{list.length} done</span>
            </div>
            <ol className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {list.map((l) => {
                const r = t.lessons[l.id]
                const n = LESSONS.indexOf(l) + 1
                const isNext = l.id === next.id
                return (
                  <li key={l.id}>
                    <Link href={`/typing/lesson/${l.id}`} className={cx('group flex h-full flex-col rounded-2xl border bg-surface p-3.5 transition hover:-translate-y-0.5 hover:border-line-strong', isNext ? 'border-accent/60 shadow-[0_8px_24px_-12px_var(--accent)]' : 'border-line')}>
                      <div className="flex items-center gap-2">
                        <span className={cx('grid size-7 shrink-0 place-items-center rounded-lg font-mono text-xs font-semibold', r?.stars ? 'bg-good/15 text-good' : isNext ? 'bg-accent text-white' : 'bg-surface-2 text-muted')}>{n}</span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium group-hover:underline">{l.title}</span>
                      </div>
                      <div className="mt-2.5 flex min-h-7 flex-wrap gap-1">
                        {l.newKeys.slice(0, 8).map((k) => {
                          const finger = CHAR_KEY[k]?.key.finger
                          return <kbd key={k} className="grid h-6 min-w-6 place-items-center rounded-md border px-1 font-mono text-[11px]" style={finger ? { borderColor: FINGERS[finger].color, color: FINGERS[finger].color } : undefined}>{k === 'Shift' ? '⇧ Shift' : k}</kbd>
                        })}
                        {l.newKeys.length === 0 && <span className="text-[11px] text-muted">{l.kind === 'code' ? `Real ${l.lang} code` : l.kind === 'sentences' ? 'Sentences' : 'Words'}</span>}
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-3 text-xs text-muted">
                        <Stars n={r?.stars ?? 0} size={13} />
                        <span>{r ? `${r.wpm} WPM · ${r.accuracy}%` : isNext ? 'Up next' : ''}</span>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl border border-line bg-surface p-5">
          <h2 className="font-semibold">Your weakest keys</h2>
          <p className="mb-3 text-sm text-muted">{hasKeys ? 'Redder keys are missed more often, across all lessons and tests.' : 'Finish a lesson or a test to see which keys slow you down.'}</p>
          {weak.length > 0 && (
            <p className="mb-3 flex flex-wrap gap-1.5">
              {weak.map((w) => <span key={w.key} className="rounded-lg border border-bad/30 bg-bad/10 px-2 py-0.5 font-mono text-xs text-bad">{keyLabel(w.key)} · {Math.round(w.rate * 100)}% missed</span>)}
            </p>
          )}
          <Keyboard heat={t.keys} />
        </div>
        <div className="rounded-3xl border border-line bg-surface p-5">
          <h2 className="font-semibold">Recent tests</h2>
          {t.tests.length === 0 ? (
            <div className="mt-6 grid place-items-center gap-3 text-center text-sm text-muted">
              <Lock size={20} />
              <p>No tests yet.</p>
              <Link href="/typing/test" className={buttonClass('secondary', 'sm')}><Timer size={14} /> Take your first test</Link>
            </div>
          ) : (
            <>
              <Trend values={t.tests.slice(0, 20).map((x) => x.wpm).reverse()} />
              <ul className="mt-3 divide-y divide-line text-sm">
                {t.tests.slice(0, 6).map((x) => (
                  <li key={x.at} className="flex items-center gap-3 py-2">
                    <span className="w-14 font-mono font-semibold tabular-nums">{x.wpm}<span className="text-xs font-normal text-muted"> wpm</span></span>
                    <span className="flex-1 text-xs text-muted">{x.mode.replace('test:', '').replace(':', ' · ')}</span>
                    <span className={cx('text-xs', x.accuracy >= 95 ? 'text-good' : 'text-muted')}>{x.accuracy}%</span>
                    <span className="w-16 text-right text-xs text-muted">{new Date(x.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface-2/50 px-4 py-3">
      <p className="flex items-center gap-1.5 text-xs text-muted">{icon} {label}</p>
      <p className="mt-0.5 font-mono text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}

/** A small WPM sparkline, oldest to newest. */
function Trend({ values }: { values: number[] }) {
  if (values.length < 2) return null
  const W = 300
  const H = 60
  const max = Math.max(...values) * 1.1
  const min = Math.min(...values) * 0.9
  const pt = (v: number, i: number) => `${(i / (values.length - 1)) * W},${H - ((v - min) / Math.max(1, max - min)) * H}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 h-16 w-full" role="img" aria-label={`WPM trend over your last ${values.length} tests`} preserveAspectRatio="none">
      <polyline points={values.map(pt).join(' ')} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
