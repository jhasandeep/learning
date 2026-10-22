'use client'

import { ArrowRight, Check, CircleCheck, CircleX, ListChecks, RotateCcw, Shuffle, Trophy, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Inline } from '@/components/notes/inline'
import { TechTile } from '@/components/tech-icon'
import { buttonClass, cx, ProgressBar, Ring } from '@/components/ui'
import type { McqDifficulty } from '@/data/mcq'
import { recordMcqAnswer, recordQuiz, useProgress } from '@/lib/progress'

export interface QuizItem {
  key: string
  set: { id: string; title: string; color: string; badge: string }
  q: string
  codeHtml?: string
  /** The first choice is correct. */
  choices: string[]
  explain: string
  difficulty: McqDifficulty
}

interface Meta { id: string; title: string; color: string; badge: string }

/** One question as played: choices shuffled, `answer` is the index of the correct one. */
interface Round { item: QuizItem; choices: string[]; answer: number }

const MIXED_SIZE = 15
const SHORT_SIZE = 10
const DIFF_STYLE: Record<McqDifficulty, string> = { Easy: 'text-good', Medium: 'text-warn', Hard: 'text-bad' }

function shuffle<T>(list: T[]): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function makeRounds(items: QuizItem[]): Round[] {
  return shuffle(items).map((item) => {
    const order = shuffle(item.choices.map((_, i) => i))
    return { item, choices: order.map((i) => item.choices[i]), answer: order.indexOf(0) }
  })
}

type Stage = { kind: 'intro' } | { kind: 'play'; rounds: Round[]; i: number; picks: (number | null)[]; full: boolean } | { kind: 'done'; rounds: Round[]; picks: number[]; full: boolean }

export function QuizPlayer({ items, meta, mixed }: { items: QuizItem[]; meta: Meta; mixed: boolean }) {
  const p = useProgress()
  const [stage, setStage] = useState<Stage>({ kind: 'intro' })
  const [gained, setGained] = useState(0)

  const start = (pool: QuizItem[], size: number, full: boolean) => {
    const rounds = makeRounds(pool).slice(0, size)
    setGained(0)
    setStage({ kind: 'play', rounds, i: 0, picks: rounds.map(() => null), full })
  }

  const pick = (choice: number) => {
    if (stage.kind !== 'play' || stage.picks[stage.i] !== null) return
    const round = stage.rounds[stage.i]
    const gain = recordMcqAnswer(round.item.key, choice === round.answer)
    setGained((g) => g + gain)
    setStage({ ...stage, picks: stage.picks.map((x, j) => (j === stage.i ? choice : x)) })
  }

  const next = () => {
    if (stage.kind !== 'play' || stage.picks[stage.i] === null) return
    if (stage.i + 1 < stage.rounds.length) {
      setStage({ ...stage, i: stage.i + 1 })
      return
    }
    const picks = stage.picks as number[]
    const score = stage.rounds.filter((r, j) => picks[j] === r.answer).length
    if (stage.full) recordQuiz(meta.id, score, stage.rounds.length)
    setStage({ kind: 'done', rounds: stage.rounds, picks, full: stage.full })
  }

  // 1–4 (or A–D) answer, Enter / → goes on.
  useEffect(() => {
    if (stage.kind !== 'play') return
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || (e.target as HTMLElement).closest('input, textarea')) return
      const n = '1234'.indexOf(e.key) >= 0 ? '1234'.indexOf(e.key) : 'abcd'.indexOf(e.key.toLowerCase())
      if (n >= 0 && n < stage.rounds[stage.i].choices.length && e.key.length === 1) pick(n)
      else if (e.key === 'Enter' || e.key === 'ArrowRight') next()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (stage.kind === 'intro') {
    const right = items.filter((it) => p.mcq[it.key]).length
    const best = p.quizzes[meta.id]
    const unanswered = items.filter((it) => !p.mcq[it.key])
    return (
      <section className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full blur-3xl" style={{ background: `color-mix(in srgb, ${meta.color} 14%, transparent)` }} aria-hidden />
        <div className="relative flex items-start gap-4">
          {mixed ? (
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-violet/30 bg-violet/10 text-violet"><Shuffle size={26} /></span>
          ) : (
            <TechTile id={meta.id} color={meta.color} size={56} fallback={meta.badge} className="shadow-sm" />
          )}
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-medium" style={{ color: meta.color }}><ListChecks size={15} /> Multiple choice</p>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight sm:text-3xl">{mixed ? 'Mixed quiz' : `${meta.title} quiz`}</h1>
            <p className="mt-2 text-sm text-muted">
              {mixed ? `${MIXED_SIZE} random questions from ${items.length} across every technology.` : `${items.length} questions.`}{' '}
              {right} answered correctly so far{best ? ` · best run ${best.score}/${best.total}` : ''}.
            </p>
          </div>
        </div>
        <div className="relative mt-6 flex flex-wrap gap-2">
          {mixed ? (
            <button type="button" className={buttonClass('primary')} onClick={() => start(items, MIXED_SIZE, true)}>Start {MIXED_SIZE} questions <ArrowRight size={16} /></button>
          ) : (
            <>
              <button type="button" className={buttonClass('primary')} onClick={() => start(items, items.length, true)}>All {items.length} questions <ArrowRight size={16} /></button>
              {items.length > SHORT_SIZE && <button type="button" className={buttonClass('secondary')} onClick={() => start(items, SHORT_SIZE, false)}><Shuffle size={15} /> Quick {SHORT_SIZE}</button>}
            </>
          )}
          {unanswered.length > 0 && unanswered.length < items.length && (
            <button type="button" className={buttonClass('secondary')} onClick={() => start(unanswered, unanswered.length, false)}>Only the {unanswered.length} not yet right</button>
          )}
        </div>
        <p className="relative mt-4 text-xs text-muted">Keys: 1–4 to answer, Enter for the next question.</p>
      </section>
    )
  }

  if (stage.kind === 'done') {
    const score = stage.rounds.filter((r, j) => stage.picks[j] === r.answer).length
    const total = stage.rounds.length
    const pct = score / total
    const missed = stage.rounds.filter((r, j) => stage.picks[j] !== r.answer)
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
              {Math.round(pct * 100)}% correct{gained ? ` · +${gained} XP for new correct answers` : ''}.
              {missed.length ? ' Review what you missed below, then retry just those.' : ''}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              {missed.length > 0 && <button type="button" className={buttonClass('primary')} onClick={() => start(missed.map((r) => r.item), missed.length, false)}><RotateCcw size={15} /> Retry {missed.length} missed</button>}
              <button type="button" className={buttonClass(missed.length ? 'secondary' : 'primary')} onClick={() => setStage({ kind: 'intro' })}><Shuffle size={15} /> New quiz</button>
              <Link href="/quiz" className={buttonClass('ghost')}>All quizzes</Link>
            </div>
          </div>
        </section>

        {missed.length > 0 && (
          <section>
            <h2 className="mb-3 font-semibold">What you missed</h2>
            <ol className="space-y-3">
              {stage.rounds.map((r, j) => stage.picks[j] === r.answer ? null : (
                <li key={r.item.key} className="rounded-2xl border border-line bg-surface p-4">
                  {mixed && <p className="mb-1 text-xs font-medium" style={{ color: r.item.set.color }}>{r.item.set.title}</p>}
                  <p className="font-medium"><Inline text={r.item.q} /></p>
                  <p className="mt-2 flex gap-2 text-sm text-bad"><X size={16} className="mt-0.5 shrink-0" /> <span>You chose: <Inline text={r.choices[stage.picks[j]]} /></span></p>
                  <p className="mt-1 flex gap-2 text-sm text-good"><Check size={16} className="mt-0.5 shrink-0" /> <span>Answer: <Inline text={r.choices[r.answer]} /></span></p>
                  <p className="mt-2 text-sm text-muted"><Inline text={r.item.explain} /></p>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    )
  }

  const round = stage.rounds[stage.i]
  const picked = stage.picks[stage.i]
  const answered = picked !== null
  const score = stage.rounds.filter((r, j) => stage.picks[j] === r.answer).length
  const last = stage.i + 1 === stage.rounds.length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm">
        <span className="shrink-0 font-medium">Question {stage.i + 1} <span className="text-muted">of {stage.rounds.length}</span></span>
        <ProgressBar value={(stage.i + (answered ? 1 : 0)) / stage.rounds.length} className="flex-1" color={meta.color} />
        <span className="shrink-0 tabular-nums text-muted"><span className="text-good">{score}</span> correct</span>
      </div>

      <section className="rounded-3xl border border-line bg-surface p-5 sm:p-7">
        <p className="flex flex-wrap items-center gap-2 text-xs">
          {mixed && <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: round.item.set.color }}><TechTile id={round.item.set.id} color={round.item.set.color} size={20} fallback={round.item.set.badge} />{round.item.set.title}</span>}
          <span className={cx('font-medium', DIFF_STYLE[round.item.difficulty])}>{round.item.difficulty}</span>
          {p.mcq[round.item.key] && !answered && <span className="text-muted">· answered right before</span>}
        </p>
        <h2 className="mt-2 text-lg font-semibold leading-snug sm:text-xl"><Inline text={round.item.q} /></h2>
        {round.item.codeHtml && <div className="note-box note-codecard note-pre mt-4" dangerouslySetInnerHTML={{ __html: round.item.codeHtml }} />}

        <ul className="mt-5 grid gap-2.5" role="list">
          {round.choices.map((c, j) => {
            const isAnswer = j === round.answer
            const isPicked = j === picked
            return (
              <li key={j}>
                <button
                  type="button"
                  onClick={() => pick(j)}
                  disabled={answered}
                  aria-pressed={isPicked}
                  className={cx(
                    'flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-[15px] transition disabled:cursor-default',
                    !answered && 'border-line hover:-translate-y-px hover:border-line-strong hover:bg-surface-2/60',
                    answered && isAnswer && 'border-good/60 bg-good/10',
                    answered && isPicked && !isAnswer && 'border-bad/60 bg-bad/10',
                    answered && !isAnswer && !isPicked && 'border-line opacity-60',
                  )}
                >
                  <span className={cx('grid size-6 shrink-0 place-items-center rounded-md border text-xs font-semibold', answered && isAnswer ? 'border-good bg-good text-white' : answered && isPicked ? 'border-bad bg-bad text-white' : 'border-line-strong text-muted')}>
                    {answered && isAnswer ? <Check size={14} /> : answered && isPicked ? <X size={14} /> : j + 1}
                  </span>
                  <span className="min-w-0 flex-1 leading-snug"><Inline text={c} /></span>
                </button>
              </li>
            )
          })}
        </ul>

        {answered && (
          <div className={cx('mt-5 rounded-xl border px-4 py-3 text-sm', picked === round.answer ? 'border-good/40 bg-good/5' : 'border-bad/40 bg-bad/5')} role="status">
            <p className={cx('flex items-center gap-1.5 font-semibold', picked === round.answer ? 'text-good' : 'text-bad')}>
              {picked === round.answer ? <><CircleCheck size={16} /> Correct</> : <><CircleX size={16} /> Not quite</>}
            </p>
            <p className="mt-1 leading-relaxed"><Inline text={round.item.explain} /></p>
          </div>
        )}
      </section>

      <div className="flex justify-end">
        <button type="button" className={buttonClass('primary')} onClick={next} disabled={!answered}>
          {last ? 'See results' : 'Next question'} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
