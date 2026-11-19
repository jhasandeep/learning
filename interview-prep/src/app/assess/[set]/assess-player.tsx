'use client'

import { ArrowLeft, ArrowRight, Check, CircleCheck, CircleX, Flag, GraduationCap, RotateCcw, Timer, Trophy, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Inline } from '@/components/notes/inline'
import { buttonClass, cx, ProgressBar, Ring } from '@/components/ui'
import type { Difficulty, Letter } from '@/data/assess'
import { recordMcqAnswer, recordQuiz, useProgress } from '@/lib/progress'

export interface AssessItem {
  key: string
  topic: string
  difficulty: Difficulty
  question: string
  codeHtml?: string
  options: Record<Letter, string>
  correct: Letter
  explanation: string
  seconds: number
}

interface Meta {
  id: string
  title: string
  color: string
  blurb: string
  topics: string[]
}

const LETTERS: Letter[] = ['A', 'B', 'C', 'D']
const DIFF_STYLE: Record<Difficulty, string> = { easy: 'text-good', medium: 'text-warn', hard: 'text-bad' }
const QUICK = 15

function shuffle<T>(list: T[]): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const clock = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`

type Picks = (Letter | null)[]
type Stage =
  | { kind: 'intro' }
  | { kind: 'practice'; items: AssessItem[]; i: number; picks: Picks }
  | { kind: 'test'; items: AssessItem[]; i: number; picks: Picks; flags: boolean[]; deadline: number; total: number }
  | { kind: 'done'; items: AssessItem[]; picks: Picks; mode: 'practice' | 'test'; usedSeconds: number; limitSeconds: number }

function Options({ item, picked, reveal, onPick }: { item: AssessItem; picked: Letter | null; reveal: boolean; onPick: (l: Letter) => void }) {
  return (
    <ul className="mt-5 grid gap-2.5" role="list">
      {LETTERS.map((l) => {
        const isAnswer = l === item.correct
        const isPicked = l === picked
        return (
          <li key={l}>
            <button
              type="button"
              onClick={() => onPick(l)}
              disabled={reveal}
              aria-pressed={isPicked}
              className={cx(
                'flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-[15px] transition disabled:cursor-default',
                !reveal && !isPicked && 'border-line hover:-translate-y-px hover:border-line-strong hover:bg-surface-2/60',
                !reveal && isPicked && 'border-accent bg-accent/10',
                reveal && isAnswer && 'border-good/60 bg-good/10',
                reveal && isPicked && !isAnswer && 'border-bad/60 bg-bad/10',
                reveal && !isAnswer && !isPicked && 'border-line opacity-60',
              )}
            >
              <span className={cx('grid size-6 shrink-0 place-items-center rounded-md border text-xs font-semibold', reveal && isAnswer ? 'border-good bg-good text-white' : reveal && isPicked ? 'border-bad bg-bad text-white' : isPicked ? 'border-accent bg-accent text-accent-ink' : 'border-line-strong text-muted')}>
                {reveal && isAnswer ? <Check size={14} /> : reveal && isPicked ? <X size={14} /> : l}
              </span>
              <span className="min-w-0 flex-1 leading-snug"><Inline text={item.options[l]} /></span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function Stem({ item, n, total }: { item: AssessItem; n: number; total: number }) {
  return (
    <>
      <p className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-medium text-muted">Question {n} of {total}</span>
        <span className="text-muted">·</span>
        <span className="text-muted">{item.topic}</span>
        <span className={cx('font-medium capitalize', DIFF_STYLE[item.difficulty])}>{item.difficulty}</span>
      </p>
      <h2 className="mt-2 whitespace-pre-line text-lg font-semibold leading-snug sm:text-xl"><Inline text={item.question} /></h2>
      {item.codeHtml && <div className="note-box note-codecard note-pre mt-4" dangerouslySetInnerHTML={{ __html: item.codeHtml }} />}
    </>
  )
}

export function AssessPlayer({ items, meta }: { items: AssessItem[]; meta: Meta }) {
  const p = useProgress()
  const [stage, setStage] = useState<Stage>({ kind: 'intro' })
  const [gained, setGained] = useState(0)
  const [now, setNow] = useState(0)
  const submitRef = useRef<() => void>(() => {})

  const startPractice = (pool: AssessItem[], size: number) => {
    const chosen = shuffle(pool).slice(0, size)
    setGained(0)
    setStage({ kind: 'practice', items: chosen, i: 0, picks: chosen.map(() => null) })
  }

  const startTest = (size: number) => {
    const chosen = shuffle(items).slice(0, size)
    const total = chosen.reduce((n, q) => n + q.seconds, 0)
    const start = Date.now()
    setGained(0)
    setNow(start)
    setStage({ kind: 'test', items: chosen, i: 0, picks: chosen.map(() => null), flags: chosen.map(() => false), deadline: start + total * 1000, total })
  }

  // The mock test: submit, count the score and save it.
  const submitTest = () => {
    if (stage.kind !== 'test') return
    const used = Math.min(stage.total, stage.total - Math.round((stage.deadline - Date.now()) / 1000))
    let xp = 0
    stage.items.forEach((q, j) => { xp += recordMcqAnswer(q.key, stage.picks[j] === q.correct) })
    const score = stage.items.filter((q, j) => stage.picks[j] === q.correct).length
    if (stage.items.length === items.length) recordQuiz(`assess-${meta.id}`, score, stage.items.length)
    setGained(xp)
    setStage({ kind: 'done', items: stage.items, picks: stage.picks, mode: 'test', usedSeconds: used, limitSeconds: stage.total })
  }

  useEffect(() => {
    submitRef.current = submitTest
  })

  // The countdown: submits by itself when the time is up.
  useEffect(() => {
    if (stage.kind !== 'test') return
    const id = setInterval(() => {
      setNow(Date.now())
      if (Date.now() >= stage.deadline) submitRef.current()
    }, 500)
    return () => clearInterval(id)
  }, [stage])

  const pickPractice = (l: Letter) => {
    if (stage.kind !== 'practice' || stage.picks[stage.i] !== null) return
    const item = stage.items[stage.i]
    const gain = recordMcqAnswer(item.key, l === item.correct)
    setGained((g) => g + gain)
    setStage({ ...stage, picks: stage.picks.map((x, j) => (j === stage.i ? l : x)) })
  }

  const nextPractice = () => {
    if (stage.kind !== 'practice' || stage.picks[stage.i] === null) return
    if (stage.i + 1 < stage.items.length) return setStage({ ...stage, i: stage.i + 1 })
    const score = stage.items.filter((q, j) => stage.picks[j] === q.correct).length
    if (stage.items.length === items.length) recordQuiz(`assess-${meta.id}`, score, stage.items.length)
    setStage({ kind: 'done', items: stage.items, picks: stage.picks, mode: 'practice', usedSeconds: 0, limitSeconds: 0 })
  }

  useEffect(() => {
    if (stage.kind !== 'practice') return
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || (e.target as HTMLElement).closest('input, textarea')) return
      const idx = '1234'.indexOf(e.key) >= 0 ? '1234'.indexOf(e.key) : 'abcd'.indexOf(e.key.toLowerCase())
      if (idx >= 0 && e.key.length === 1) pickPractice(LETTERS[idx])
      else if (e.key === 'Enter' || e.key === 'ArrowRight') nextPractice()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // ---- intro ----
  if (stage.kind === 'intro') {
    const right = items.filter((it) => p.mcq[it.key]).length
    const best = p.quizzes[`assess-${meta.id}`]
    const unanswered = items.filter((it) => !p.mcq[it.key])
    const quick = Math.min(QUICK, items.length)
    const average = items.reduce((s, q) => s + q.seconds, 0) / items.length
    const minutes = (n: number) => Math.max(1, Math.round((average * n) / 60))
    return (
      <section className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full blur-3xl" style={{ background: `color-mix(in srgb, ${meta.color} 14%, transparent)` }} aria-hidden />
        <div className="relative">
          <p className="flex items-center gap-1.5 text-sm font-medium" style={{ color: meta.color }}><GraduationCap size={15} /> Company assessment</p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight sm:text-3xl">{meta.title}</h1>
          <p className="mt-2 text-sm text-muted">{meta.blurb}</p>
          <p className="mt-2 text-sm text-muted">{items.length} questions · {right} answered correctly so far{best ? ` · best full run ${best.score}/${best.total}` : ''}.</p>
          <ul className="mt-3 flex flex-wrap gap-1.5">{meta.topics.map((t) => <li key={t} className="rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-xs text-muted">{t}</li>)}</ul>
        </div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface-2/50 p-4">
            <p className="font-semibold">Practice</p>
            <p className="mt-1 text-sm text-muted">See at once whether each answer is right, with the explanation. No timer.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className={buttonClass('primary')} onClick={() => startPractice(items, items.length)}>All {items.length} <ArrowRight size={16} /></button>
              {unanswered.length > 0 && unanswered.length < items.length && <button type="button" className={buttonClass('secondary')} onClick={() => startPractice(unanswered, unanswered.length)}>Only the {unanswered.length} not yet right</button>}
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-surface-2/50 p-4">
            <p className="flex items-center gap-1.5 font-semibold"><Timer size={16} className="text-warn" /> Mock test</p>
            <p className="mt-1 text-sm text-muted">Timed like the real thing. Answers and explanations appear only after you submit.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className={buttonClass('primary')} onClick={() => startTest(quick)}>{quick} questions · about {minutes(quick)} min</button>
              {items.length > quick && <button type="button" className={buttonClass('secondary')} onClick={() => startTest(items.length)}>All {items.length} · about {minutes(items.length)} min</button>}
            </div>
          </div>
        </div>
        <p className="relative mt-4 text-xs text-muted">Practice keys: A–D or 1–4 to answer, Enter for the next question.</p>
      </section>
    )
  }

  // ---- mock test ----
  if (stage.kind === 'test') {
    const item = stage.items[stage.i]
    const left = Math.round((stage.deadline - now) / 1000)
    const answered = stage.picks.filter(Boolean).length
    const low = left <= 60
    const go = (i: number) => setStage({ ...stage, i })
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-medium">{answered}<span className="text-muted"> / {stage.items.length} answered</span></span>
          <ProgressBar value={answered / stage.items.length} className="min-w-24 flex-1" color={meta.color} />
          <span className={cx('inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-sm tabular-nums', low ? 'border-bad/50 bg-bad/10 text-bad' : 'border-line bg-surface')} role="timer" aria-label="Time left"><Timer size={14} /> {clock(left)}</span>
        </div>

        <nav aria-label="Questions" className="flex flex-wrap gap-1.5">
          {stage.items.map((q, j) => (
            <button
              key={q.key}
              type="button"
              onClick={() => go(j)}
              aria-label={`Question ${j + 1}${stage.picks[j] ? ', answered' : ''}${stage.flags[j] ? ', flagged' : ''}`}
              aria-current={j === stage.i}
              className={cx('relative grid size-8 place-items-center rounded-md border text-xs font-medium transition', j === stage.i ? 'border-accent bg-accent text-accent-ink' : stage.picks[j] ? 'border-line-strong bg-surface-2' : 'border-line text-muted hover:border-line-strong')}
            >
              {j + 1}
              {stage.flags[j] && <Flag size={9} className="absolute -right-1 -top-1 fill-warn text-warn" />}
            </button>
          ))}
        </nav>

        <section className="rounded-3xl border border-line bg-surface p-5 sm:p-7">
          <Stem item={item} n={stage.i + 1} total={stage.items.length} />
          <Options item={item} picked={stage.picks[stage.i]} reveal={false} onPick={(l) => setStage({ ...stage, picks: stage.picks.map((x, j) => (j === stage.i ? (x === l ? null : l) : x)) })} />
          <p className="mt-3 text-xs text-muted">Click your answer again to clear it.</p>
        </section>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={buttonClass('secondary')} onClick={() => go(stage.i - 1)} disabled={stage.i === 0}><ArrowLeft size={16} /> Previous</button>
          <button type="button" className={buttonClass('ghost')} onClick={() => setStage({ ...stage, flags: stage.flags.map((f, j) => (j === stage.i ? !f : f)) })}><Flag size={15} className={stage.flags[stage.i] ? 'fill-warn text-warn' : ''} /> {stage.flags[stage.i] ? 'Unflag' : 'Flag for review'}</button>
          <button type="button" className={buttonClass('secondary')} onClick={() => go(stage.i + 1)} disabled={stage.i + 1 === stage.items.length}>Next <ArrowRight size={16} /></button>
          <button
            type="button"
            className={cx(buttonClass('primary'), 'ml-auto')}
            onClick={() => {
              const open = stage.items.length - answered
              if (open === 0 || window.confirm(`${open} question${open === 1 ? ' is' : 's are'} still unanswered. Submit anyway?`)) submitTest()
            }}
          >
            Submit test
          </button>
        </div>
      </div>
    )
  }

  // ---- practice ----
  if (stage.kind === 'practice') {
    const item = stage.items[stage.i]
    const picked = stage.picks[stage.i]
    const answered = picked !== null
    const score = stage.items.filter((q, j) => stage.picks[j] === q.correct).length
    const last = stage.i + 1 === stage.items.length
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-sm">
          <span className="shrink-0 font-medium">Question {stage.i + 1} <span className="text-muted">of {stage.items.length}</span></span>
          <ProgressBar value={(stage.i + (answered ? 1 : 0)) / stage.items.length} className="flex-1" color={meta.color} />
          <span className="shrink-0 tabular-nums text-muted"><span className="text-good">{score}</span> correct</span>
        </div>
        <section className="rounded-3xl border border-line bg-surface p-5 sm:p-7">
          <Stem item={item} n={stage.i + 1} total={stage.items.length} />
          <Options item={item} picked={picked} reveal={answered} onPick={pickPractice} />
          {answered && (
            <div className={cx('mt-5 rounded-xl border px-4 py-3 text-sm', picked === item.correct ? 'border-good/40 bg-good/5' : 'border-bad/40 bg-bad/5')} role="status">
              <p className={cx('flex items-center gap-1.5 font-semibold', picked === item.correct ? 'text-good' : 'text-bad')}>
                {picked === item.correct ? <><CircleCheck size={16} /> Correct</> : <><CircleX size={16} /> Not quite: the answer is {item.correct}</>}
              </p>
              <p className="mt-1 leading-relaxed"><Inline text={item.explanation} /></p>
            </div>
          )}
        </section>
        <div className="flex justify-end">
          <button type="button" className={buttonClass('primary')} onClick={nextPractice} disabled={!answered}>{last ? 'See results' : 'Next question'} <ArrowRight size={16} /></button>
        </div>
      </div>
    )
  }

  // ---- results ----
  const total = stage.items.length
  const score = stage.items.filter((q, j) => stage.picks[j] === q.correct).length
  const skipped = stage.picks.filter((x) => x === null).length
  const pct = score / total
  const missed = stage.items.map((q, j) => ({ q, j })).filter(({ q, j }) => stage.picks[j] !== q.correct)
  const byTopic = new Map<string, { right: number; all: number }>()
  stage.items.forEach((q, j) => {
    const t = byTopic.get(q.topic) ?? { right: 0, all: 0 }
    t.all++
    if (stage.picks[j] === q.correct) t.right++
    byTopic.set(q.topic, t)
  })
  return (
    <div className="space-y-5">
      <section className="flex flex-col items-center gap-4 rounded-3xl border border-line bg-surface p-6 text-center sm:flex-row sm:text-left">
        <Ring value={pct} size={96} stroke={9} color={pct >= 0.8 ? 'var(--good)' : pct >= 0.5 ? 'var(--warn)' : 'var(--bad)'}>
          <span className="text-lg">{score}/{total}</span>
        </Ring>
        <div className="flex-1">
          <h1 className="flex items-center justify-center gap-2 text-2xl font-semibold sm:justify-start">
            {pct === 1 && <Trophy size={22} className="text-warn" />}
            {pct === 1 ? 'Perfect score!' : pct >= 0.8 ? 'Great work' : pct >= 0.5 ? 'Good effort' : 'Keep practising'}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {Math.round(pct * 100)}% correct{stage.mode === 'test' ? ` · ${clock(stage.usedSeconds)} of ${clock(stage.limitSeconds)} used${skipped ? ` · ${skipped} unanswered` : ''}` : ''}{gained ? ` · +${gained} XP for new correct answers` : ''}.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            {missed.length > 0 && <button type="button" className={buttonClass('primary')} onClick={() => startPractice(missed.map((m) => m.q), missed.length)}><RotateCcw size={15} /> Practise the {missed.length} missed</button>}
            <button type="button" className={buttonClass(missed.length ? 'secondary' : 'primary')} onClick={() => setStage({ kind: 'intro' })}>New attempt</button>
            <Link href="/assess" className={buttonClass('ghost')}>All assessments</Link>
          </div>
        </div>
      </section>

      {byTopic.size > 1 && (
        <section className="rounded-2xl border border-line bg-surface p-4">
          <h2 className="font-semibold">By topic</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {[...byTopic].map(([topic, t]) => (
              <li key={topic} className="text-sm">
                <div className="flex justify-between"><span>{topic}</span><span className="tabular-nums text-muted">{t.right}/{t.all}</span></div>
                <ProgressBar value={t.right / t.all} className="mt-1" color={t.right === t.all ? 'var(--good)' : t.right / t.all >= 0.5 ? 'var(--warn)' : 'var(--bad)'} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {missed.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">{stage.mode === 'test' ? 'Review: what you missed or skipped' : 'What you missed'}</h2>
          <ol className="space-y-3">
            {missed.map(({ q, j }) => (
              <li key={q.key} className="rounded-2xl border border-line bg-surface p-4">
                <p className="mb-1 text-xs text-muted">{q.topic}</p>
                <p className="whitespace-pre-line font-medium"><Inline text={q.question} /></p>
                {q.codeHtml && <div className="note-box note-codecard note-pre mt-3" dangerouslySetInnerHTML={{ __html: q.codeHtml }} />}
                <p className="mt-2 flex gap-2 text-sm text-bad"><X size={16} className="mt-0.5 shrink-0" /> <span>{stage.picks[j] ? <>You chose {stage.picks[j]}: <Inline text={q.options[stage.picks[j] as Letter]} /></> : 'Not answered'}</span></p>
                <p className="mt-1 flex gap-2 text-sm text-good"><Check size={16} className="mt-0.5 shrink-0" /> <span>Answer {q.correct}: <Inline text={q.options[q.correct]} /></span></p>
                <p className="mt-2 text-sm text-muted"><Inline text={q.explanation} /></p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
