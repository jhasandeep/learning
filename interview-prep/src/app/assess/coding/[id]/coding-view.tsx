'use client'

import { ArrowLeft, ArrowRight, ChevronLeft, CircleCheck, Timer } from 'lucide-react'
import Link from 'next/link'
import { LANG_NAME, Practice, useLang } from '@/components/lesson-kit'
import { Inline } from '@/components/notes/inline'
import { buttonClass, cx } from '@/components/ui'
import { codingKey, type CodingQuestion } from '@/data/assess'
import type { Both, Lang } from '@/data/dsa/types'
import { useProgress } from '@/lib/progress'

const DIFF = { easy: 'text-good', medium: 'text-warn', hard: 'text-bad' } as const

interface Props {
  q: CodingQuestion
  index: number
  total: number
  solutionHtml: Both
  prev?: { id: string; title: string }
  next?: { id: string; title: string }
}

export function CodingView({ q, index, total, solutionHtml, prev, next }: Props) {
  const [lang, setLang] = useLang()
  const progress = useProgress()
  const key = codingKey(q.id)
  const done = Boolean(progress.tasks[key])

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <Link href="/assess" className="inline-flex items-center gap-1 text-muted hover:text-text"><ChevronLeft size={16} /> Company prep</Link>
        <span className="text-muted">/</span>
        <span className="font-medium">Coding</span>
        <span className="text-muted">· question {index + 1} of {total}</span>
        {done && <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-good/10 px-2 py-0.5 text-xs font-medium text-good"><CircleCheck size={12} /> Solved</span>}
      </div>

      <header className="rounded-3xl border border-line bg-surface p-6">
        <p className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
          {q.topic}
          <span className={cx('capitalize', DIFF[q.difficulty])}>{q.difficulty}</span>
          <span className="inline-flex items-center gap-1 font-medium normal-case text-muted"><Timer size={12} /> about {q.estimated_time_minutes} minutes</span>
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{q.title}</h1>
        <div className="mt-4 space-y-3 text-[15px] leading-relaxed">
          {q.statement.split('\n\n').map((para, i) => <p key={i}><Inline text={para} /></p>)}
        </div>
        <ul className="mt-3 flex flex-wrap gap-1.5">{q.tags.map((t) => <li key={t} className="rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-xs text-muted">{t}</li>)}</ul>
      </header>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-line bg-surface p-4">
          <h2 className="font-semibold">Input</h2>
          <p className="mt-1 text-sm text-muted"><Inline text={q.input_format} /></p>
          <h2 className="mt-4 font-semibold">Output</h2>
          <p className="mt-1 text-sm text-muted"><Inline text={q.output_format} /></p>
        </section>
        <section className="rounded-2xl border border-line bg-surface p-4">
          <h2 className="font-semibold">Constraints</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">{q.constraints.map((c) => <li key={c}><Inline text={c} /></li>)}</ul>
        </section>
      </div>

      <section className="mt-4 space-y-3" aria-labelledby="examples">
        <h2 id="examples" className="font-semibold">Examples</h2>
        {q.examples.map((e, i) => (
          <div key={i} className="rounded-2xl border border-line bg-surface p-4 text-sm">
            <p><span className="font-semibold">Input:</span> <Inline text={e.input} /></p>
            <p className="mt-1"><span className="font-semibold">Output:</span> <Inline text={e.output} /></p>
            <p className="mt-1 text-muted"><span className="font-semibold text-text">Why:</span> <Inline text={e.explanation} /></p>
          </div>
        ))}
      </section>

      <div className="sticky top-14 z-20 -mx-1 my-4 flex items-center gap-3 rounded-xl border border-line bg-surface/95 px-3 py-2 backdrop-blur">
        <span className="text-sm text-muted">Code in</span>
        <div className="inline-flex rounded-lg border border-line p-0.5" role="radiogroup" aria-label="Programming language">
          {(['javascript', 'python'] as Lang[]).map((l) => (
            <button key={l} type="button" role="radio" aria-checked={lang === l} onClick={() => setLang(l)} className={cx('rounded-md px-3 py-1 text-sm font-medium transition', lang === l ? 'bg-accent text-white' : 'text-muted hover:text-text')}>
              {LANG_NAME[l]}
            </button>
          ))}
        </div>
        <span className="ml-auto hidden text-xs text-muted sm:inline">{q.practice.cases.length} tests: {q.visible} samples and {q.practice.cases.length - q.visible} hidden edge cases</span>
      </div>

      <section aria-labelledby="solve" className="space-y-3">
        <h2 id="solve" className="font-semibold">Your solution</h2>
        <p className="text-sm text-muted">
          Write <code className="note-code">{(q.practice.symbol ?? q.practice.fn)[lang]}</code> and press <b>Check my code</b>. Hidden tests are listed by what they cover, so you know which edge cases to think about.
        </p>
        <Practice key={lang} lesson={q} progressKey={key} solutionHtml={solutionHtml} lang={lang} />
      </section>

      <details className="mt-6 rounded-2xl border border-line bg-surface p-4">
        <summary className="cursor-pointer font-semibold">After you solve it: complexity and common mistakes</summary>
        <p className="mt-3 text-sm"><span className="font-semibold">Time:</span> {q.complexity.time}</p>
        <p className="mt-1 text-sm"><span className="font-semibold">Space:</span> {q.complexity.space}</p>
        <p className="mt-3 text-sm font-semibold">Mistakes to avoid</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">{q.mistakes.map((m) => <li key={m}><Inline text={m} /></li>)}</ul>
      </details>

      <nav className="mt-6 flex justify-between gap-3" aria-label="Coding questions">
        {prev ? <Link href={`/assess/coding/${prev.id}`} className={buttonClass('secondary')}><ArrowLeft size={16} /> {prev.title}</Link> : <span />}
        {next ? <Link href={`/assess/coding/${next.id}`} className={buttonClass('secondary')}>{next.title} <ArrowRight size={16} /></Link> : <span />}
      </nav>
    </div>
  )
}
