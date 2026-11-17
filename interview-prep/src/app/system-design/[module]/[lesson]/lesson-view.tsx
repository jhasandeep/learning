'use client'

import { ArrowLeft, ArrowRight, Check, ChevronLeft, CircleCheck, Eye, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { ArchDiagram } from '@/components/arch-diagram'
import { CodeCard, LANG_NAME, Practice, Section, TAGS, useLang } from '@/components/lesson-kit'
import { Inline } from '@/components/notes/inline'
import { Sim } from '@/components/system-sims'
import { Button, buttonClass, cx } from '@/components/ui'
import type { Both, Lang } from '@/data/dsa/types'
import type { QuizQuestion, SdLesson } from '@/data/system-design/types'
import { useProgress } from '@/lib/progress'

export interface SdHtml {
  steps: Both[]
  solution: Both
}

interface Props {
  module: { id: string; title: string; color: string; count: number }
  index: number
  lesson: SdLesson
  html: SdHtml
  prev?: { href: string; title: string }
  next?: { href: string; title: string }
}

export const sdKey = (moduleId: string, lessonId: string) => `sd/${moduleId}/${lessonId}`

function Quiz({ questions }: { questions: QuizQuestion[] }) {
  const [picked, setPicked] = useState<Record<number, number>>({})
  const score = Object.entries(picked).filter(([i, p]) => questions[Number(i)].answer === p).length
  return (
    <div className="space-y-4">
      {questions.map((q, qi) => {
        const choice = picked[qi]
        const answered = choice !== undefined
        return (
          <fieldset key={qi} className="rounded-2xl border border-line bg-surface p-4">
            <legend className="px-1 text-sm font-semibold">{qi + 1}. <Inline text={q.q} /></legend>
            <div className="mt-2 space-y-2">
              {q.options.map((o, oi) => {
                const right = oi === q.answer
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={answered}
                    onClick={() => setPicked((p) => ({ ...p, [qi]: oi }))}
                    className={cx('flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm transition', !answered && 'border-line hover:border-line-strong', answered && right && 'border-good bg-good/10', answered && choice === oi && !right && 'border-bad bg-bad/10', answered && !right && choice !== oi && 'border-line opacity-60')}
                  >
                    <span className="mt-0.5 flex-none">{answered ? (right ? <Check size={15} className="text-good" /> : choice === oi ? <X size={15} className="text-bad" /> : <span className="inline-block w-[15px]" />) : <span className="inline-block h-[15px] w-[15px] rounded-full border border-line" />}</span>
                    <span><Inline text={o} /></span>
                  </button>
                )
              })}
            </div>
            {answered && <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-sm leading-relaxed"><span className="font-semibold">{choice === q.answer ? 'Correct. ' : 'Not quite. '}</span><Inline text={q.why} /></p>}
          </fieldset>
        )
      })}
      {Object.keys(picked).length === questions.length && <p className="text-sm font-semibold">Score: {score} / {questions.length}</p>}
    </div>
  )
}

export function SdLessonView({ module, index, lesson, html, prev, next }: Props) {
  const [lang, setLang] = useLang()
  const progress = useProgress()
  const done = Boolean(progress.tasks[sdKey(module.id, lesson.id)])
  const [shown, setShown] = useState(1)
  const [view, setView] = useState<'before' | 'how'>(lesson.before ? 'before' : 'how')
  const [open, setOpen] = useState<Record<number, boolean>>({})

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <Link href="/system-design" className="inline-flex items-center gap-1 text-muted hover:text-text"><ChevronLeft size={16} /> System design course</Link>
        <span className="text-muted">/</span>
        <span className="font-medium">{module.title}</span>
        <span className="text-muted">· lesson {index + 1} of {module.count}</span>
        {done && <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-good/10 px-2 py-0.5 text-xs font-medium text-good"><CircleCheck size={12} /> Completed</span>}
      </div>

      <header className="rounded-3xl border border-line bg-surface p-6">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: module.color }}>{lesson.topic}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{lesson.title}</h1>
        <p className="mt-2 text-muted">{lesson.blurb}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
          <span className="rounded-md bg-surface-2 px-2 py-1">Picture · real example · code · practice</span>
        </div>
      </header>

      <div className="sticky top-14 z-20 -mx-1 my-4 flex items-center gap-3 rounded-xl border border-line bg-surface/95 px-3 py-2 backdrop-blur">
        <span className="text-sm text-muted">Code in</span>
        <div className="inline-flex rounded-lg border border-line p-0.5" role="radiogroup" aria-label="Programming language">
          {(['python', 'javascript'] as Lang[]).map((l) => (
            <button key={l} type="button" role="radio" aria-checked={lang === l} onClick={() => setLang(l)} className={cx('rounded-md px-3 py-1 text-sm font-medium transition', lang === l ? 'bg-accent text-white' : 'text-muted hover:text-text')}>
              {LANG_NAME[l]}
            </button>
          ))}
        </div>
        <nav aria-label="Lesson sections" className="ml-auto hidden gap-3 text-xs text-muted lg:flex">
          {[['problem', 'Problem'], ['see', 'See it'], ['real', 'Real world'], ['build', 'Build it'], ...(lesson.sim ? [['play', 'Play']] : []), ['practice', 'Practice'], ['quiz', 'Quiz']].map(([id, label]) => <a key={id} href={`#${id}`} className="hover:text-text">{label}</a>)}
        </nav>
      </div>

      <div className="space-y-10">
        <Section n={1} id="problem" title="The problem it solves">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="leading-relaxed"><Inline text={lesson.why.story} /></p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted">{lesson.why.pains.map((p) => <li key={p}><Inline text={p} /></li>)}</ul>
          </div>
        </Section>

        <Section n={2} id="see" title="See it in action">
          {lesson.before && (
            <div className="mb-3 inline-flex rounded-lg border border-line p-0.5" role="tablist">
              {([['before', lesson.tabs?.[0] ?? 'Without it'], ['how', lesson.tabs?.[1] ?? 'With it']] as const).map(([id, label]) => (
                <button key={id} type="button" role="tab" aria-selected={view === id} onClick={() => setView(id)} className={cx('rounded-md px-3 py-1 text-sm font-medium transition', view === id ? 'bg-accent text-white' : 'text-muted hover:text-text')}>{label}</button>
              ))}
            </div>
          )}
          <ArchDiagram key={view} arch={view === 'before' && lesson.before ? lesson.before : lesson.how} />
        </Section>

        <Section n={3} id="real" title="Real-world examples">
          <div className="grid gap-3 sm:grid-cols-2">
            {lesson.realWorld.map((r) => (
              <div key={r.name} className="rounded-2xl border border-line bg-surface p-4">
                <p className="font-semibold">{r.name}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted"><Inline text={r.text} /></p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-surface p-4"><p className="font-semibold text-good">What you gain</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{lesson.tradeoffs.gain.map((g) => <li key={g}><Inline text={g} /></li>)}</ul></div>
            <div className="rounded-2xl border border-line bg-surface p-4"><p className="font-semibold text-bad">What it costs</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{lesson.tradeoffs.cost.map((g) => <li key={g}><Inline text={g} /></li>)}</ul></div>
            <div className="rounded-2xl border border-line bg-surface p-4"><p className="font-semibold text-accent">Use it when</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{lesson.tradeoffs.useWhen.map((g) => <li key={g}><Inline text={g} /></li>)}</ul></div>
            <div className="rounded-2xl border border-line bg-surface p-4"><p className="font-semibold text-warn">Think twice when</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{lesson.tradeoffs.avoidWhen.map((g) => <li key={g}><Inline text={g} /></li>)}</ul></div>
          </div>
        </Section>

        <Section n={4} id="build" title="Build it yourself, step by step">
          <ol className="space-y-5">
            {lesson.steps.slice(0, shown).map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-line bg-surface p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-surface-2 text-xs font-bold">{i + 1}</span>
                  <h3 className="font-semibold">{s.title}</h3>
                  <span className={cx('rounded-full px-2 py-0.5 text-xs font-semibold', s.buggy ? 'bg-bad/15 text-bad' : TAGS[s.tag].cls)}>{s.buggy ? 'Looks right, but breaks' : TAGS[s.tag].label}</span>
                </div>
                <p className="mt-3 leading-relaxed"><Inline text={s.idea} /></p>
                <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-muted marker:font-semibold">{s.walk.map((w, j) => <li key={j}><Inline text={w} /></li>)}</ol>
                <div className="mt-4"><CodeCard html={html.steps[i][lang]} code={s.code[lang]} lang={lang} title={`Step ${i + 1}`} /></div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-md bg-surface-2 px-2 py-1">Speed <b className="font-mono">{s.time}</b></span>
                  <span className="rounded-md bg-surface-2 px-2 py-1">Memory <b className="font-mono">{s.space}</b></span>
                </div>
                {s.verdict && <p className="mt-3 rounded-lg border-l-4 border-accent bg-accent/5 px-3 py-2 text-sm"><Inline text={s.verdict} /></p>}
              </li>
            ))}
          </ol>
          {shown < lesson.steps.length && <Button className="mt-4" variant="primary" onClick={() => setShown((n) => n + 1)}>Show the next version <ArrowRight size={16} /></Button>}
        </Section>

        {lesson.sim && (
          <Section n={5} id="play" title="Play with it">
            <p className="mb-3 text-sm text-muted"><Inline text={lesson.sim.intro} /></p>
            <Sim id={lesson.sim.id} />
            <div className="mt-3 rounded-2xl border border-line bg-surface p-4">
              <p className="text-sm font-semibold">Try this</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">{lesson.sim.tryThis.map((t) => <li key={t}><Inline text={t} /></li>)}</ul>
            </div>
          </Section>
        )}

        <Section n={lesson.sim ? 6 : 5} id="practice" title="Practice: write the real thing">
          <p className="mb-4 text-sm text-muted">Implement <code className="note-code">{(lesson.practice.symbol ?? lesson.practice.fn)[lang]}</code> in the editor and press <b>Check my code</b>. The tests drive your code the way a real system would use it.</p>
          <Practice key={lang} lesson={lesson} progressKey={sdKey(module.id, lesson.id)} solutionHtml={html.solution} lang={lang} />
        </Section>

        <Section n={lesson.sim ? 7 : 6} id="quiz" title="Check your understanding">
          <Quiz questions={lesson.quiz} />
          <h3 className="mb-3 mt-8 font-semibold">How you would answer in an interview</h3>
          <div className="space-y-3">
            {lesson.interview.map((it, i) => (
              <div key={i} className="rounded-2xl border border-line bg-surface p-4">
                <p className="font-medium"><Inline text={it.q} /></p>
                {open[i] ? <p className="mt-2 text-sm leading-relaxed text-muted"><Inline text={it.a} /></p> : <Button size="sm" variant="ghost" className="mt-2" onClick={() => setOpen((o) => ({ ...o, [i]: true }))}><Eye size={14} /> Think first, then show a model answer</Button>}
              </div>
            ))}
          </div>
        </Section>

        <Section n={lesson.sim ? 8 : 7} id="wrap" title="Wrap-up">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="font-semibold text-bad">Common mistakes</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">{lesson.mistakes.map((m) => <li key={m}><Inline text={m} /></li>)}</ul>
          </div>
          <p className="mt-4 rounded-2xl border-2 border-good/40 bg-good/5 p-4 text-sm"><span className="font-semibold text-good">Remember:</span> <Inline text={lesson.recap} /></p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {prev && <Link href={prev.href} className={buttonClass('secondary')}><ArrowLeft size={16} /> {prev.title}</Link>}
            {next ? <Link href={next.href} className={`${buttonClass('primary')} ml-auto`}>Next lesson: {next.title} <ArrowRight size={16} /></Link> : <Link href="/system-design" className={`${buttonClass('primary')} ml-auto`}>Back to the course <ArrowRight size={16} /></Link>}
          </div>
        </Section>
      </div>
    </div>
  )
}
