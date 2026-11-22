'use client'

import { ArrowRight, Briefcase, Calculator, Code2, Layers, Timer, Trophy } from 'lucide-react'
import Link from 'next/link'
import { cx, ProgressBar } from '@/components/ui'
import { useProgress } from '@/lib/progress'

export interface SetCard {
  id: string
  title: string
  blurb: string
  group: 'mern' | 'aptitude'
  color: string
  topics: string[]
  minutes: number
  keys: string[]
}

export interface CodingCard {
  id: string
  title: string
  topic: string
  blurb: string
  difficulty: 'easy' | 'medium' | 'hard'
  minutes: number
  key: string
  tags: string[]
}

const DIFF = { easy: 'text-good', medium: 'text-warn', hard: 'text-bad' } as const

export function AssessIndex({ sets, coding }: { sets: SetCard[]; coding: CodingCard[] }) {
  const p = useProgress()
  const mcqTotal = sets.reduce((n, s) => n + s.keys.length, 0)
  const mcqRight = sets.reduce((n, s) => n + s.keys.filter((k) => p.mcq[k]).length, 0)
  const codingDone = coding.filter((c) => p.tasks[c.key]).length

  const group = (id: 'mern' | 'aptitude', title: string, icon: React.ReactNode, text: string) => (
    <section aria-labelledby={`as-${id}`}>
      <h2 id={`as-${id}`} className="flex items-center gap-2 font-semibold">{icon} {title}</h2>
      <p className="mt-1 text-sm text-muted">{text}</p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sets.filter((s) => s.group === id).map((s) => {
          const right = s.keys.filter((k) => p.mcq[k]).length
          const best = p.quizzes[`assess-${s.id}`]
          return (
            <li key={s.id}>
              <Link href={`/assess/${s.id}`} className="lang-card group flex h-full flex-col rounded-2xl border border-line bg-surface p-4 transition hover:-translate-y-0.5" style={{ '--lang': s.color } as React.CSSProperties}>
                <div className="relative flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl text-white" style={{ background: s.color }} aria-hidden>{id === 'mern' ? <Layers size={22} /> : <Calculator size={22} />}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{s.title}</span>
                    <span className="mt-0.5 block text-xs text-muted">{s.keys.length} questions · about {s.minutes} min{best ? ` · best ${best.score}/${best.total}` : ''}</span>
                  </span>
                  <ArrowRight size={16} className="mt-1 shrink-0 transition group-hover:translate-x-0.5" style={{ color: s.color }} />
                </div>
                <p className="relative mt-3 text-sm text-muted">{s.blurb}</p>
                <div className="relative mt-auto pt-4">
                  <ProgressBar value={right / s.keys.length} color={s.color} />
                  <p className="mt-2 text-[11px] text-muted">{right ? <span className="text-good">{right} answered correctly</span> : 'Not started'}</p>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 size-80 rounded-full bg-accent/10 blur-3xl" aria-hidden />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-accent"><Briefcase size={15} /> Company assessments</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Prepare for the online test</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Hiring tests usually mix three things: technical multiple choice, aptitude, and a coding round. Practise all three here: {mcqTotal} multiple-choice questions
              (MERN stack and aptitude) and {coding.length} coding questions you can run in the browser against hidden tests. Switch any set to <strong className="font-medium text-text">mock test</strong> mode
              for a timed run with no hints and a full review at the end.
            </p>
            <p className="mt-2 max-w-2xl text-xs text-muted">These are original practice questions in the style of company tests, not leaked questions from any company.</p>
          </div>
          <div className="grid min-w-60 gap-3">
            <div className="rounded-2xl border border-line bg-surface-2/60 p-4">
              <p className="flex items-center gap-2 text-sm font-medium"><Trophy size={16} className="text-warn" /> Multiple choice</p>
              <p className="mt-2 text-2xl font-semibold">{mcqRight}<span className="text-base font-normal text-muted"> / {mcqTotal}</span></p>
              <ProgressBar value={mcqTotal ? mcqRight / mcqTotal : 0} className="mt-2" />
            </div>
            <div className="rounded-2xl border border-line bg-surface-2/60 p-4">
              <p className="flex items-center gap-2 text-sm font-medium"><Code2 size={16} className="text-accent" /> Coding solved</p>
              <p className="mt-2 text-2xl font-semibold">{codingDone}<span className="text-base font-normal text-muted"> / {coding.length}</span></p>
              <ProgressBar value={coding.length ? codingDone / coding.length : 0} className="mt-2" />
            </div>
          </div>
        </div>
      </header>

      {group('mern', 'MERN stack MCQ', <Layers size={17} className="text-accent" />, 'Scenario and code-output questions on Node.js, Express, MongoDB and React for mid-level roles.')}
      {group('aptitude', 'Aptitude MCQ', <Calculator size={17} className="text-warn" />, 'The aptitude round: numbers, logic and language, with the working explained for each answer.')}

      <section aria-labelledby="as-coding">
        <h2 id="as-coding" className="flex items-center gap-2 font-semibold"><Code2 size={17} className="text-accent" /> Coding questions</h2>
        <p className="mt-1 text-sm text-muted">Practical backend problems (caching, rate limiting, queues, routing, streaming). Write the code in JavaScript or Python and run it against sample and hidden tests.</p>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {coding.map((c) => (
            <li key={c.id}>
              <Link href={`/assess/coding/${c.id}`} className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-4 transition hover:-translate-y-0.5 hover:border-line-strong">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold">{c.title}</span>
                  {p.tasks[c.key] && <span className="rounded-full bg-good/10 px-2 py-0.5 text-[11px] font-medium text-good">Solved</span>}
                </div>
                <p className="mt-1 flex items-center gap-2 text-xs text-muted">
                  <span className={cx('font-medium capitalize', DIFF[c.difficulty])}>{c.difficulty}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1"><Timer size={12} /> {c.minutes} min</span>
                  <span>·</span>
                  <span>{c.topic}</span>
                </p>
                <p className="mt-3 text-sm text-muted">{c.blurb}</p>
                <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-accent">Open <ArrowRight size={14} className="transition group-hover:translate-x-0.5" /></span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
