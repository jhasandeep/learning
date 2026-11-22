'use client'

import { ArrowLeft, ArrowRight, CircleCheck, CircleX, GraduationCap, Lightbulb, Loader, Play, Upload } from 'lucide-react'
import { Fragment, useMemo, useState, type ReactNode } from 'react'
import { useToast } from '@/components/toast'
import { Button, cx, ProgressBar } from '@/components/ui'
import { MONGO_LESSONS } from '@/data/mongo-lessons'
import { markMongoLessonDone, useProgress } from '@/lib/progress'

/** `code` and **bold** inside a lesson paragraph. */
function inline(text: string): ReactNode {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('`')) return <code key={i} className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.85em]">{part.slice(1, -1)}</code>
    if (part.startsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    return <Fragment key={i}>{part}</Fragment>
  })
}

interface Props {
  /** Replace the editor's content. */
  onLoad: (code: string) => void
  /** Run what is in the editor. */
  onRun: () => void
  /** What is in the editor right now. */
  getCode: () => string
}

/** Guided MongoDB lessons: read, load the example, then solve a challenge that is checked against a reference solution. */
export function MongoLearn({ onLoad, onRun, getCode }: Props) {
  const toast = useToast()
  const { mongoLessons } = useProgress()
  const done = useMemo(() => mongoLessons ?? {}, [mongoLessons])
  const firstOpen = useMemo(() => Math.max(0, MONGO_LESSONS.findIndex((l) => !done[l.id])), [done])
  const [picked, setPicked] = useState<number | null>(null)
  const index = picked ?? firstOpen
  const lesson = MONGO_LESSONS[index]
  const [checking, setChecking] = useState(false)
  const [verdict, setVerdict] = useState<{ id: string; pass: boolean; detail: string } | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [solution, setSolution] = useState<string | null>(null)
  const completed = MONGO_LESSONS.filter((l) => done[l.id]).length

  const go = (i: number) => {
    setPicked(i)
    setVerdict(null)
  }

  const check = async () => {
    setPicked(index) // stay on this lesson when it completes, so the result stays visible
    setChecking(true)
    try {
      const { checkMongo } = await import('@/lib/run')
      const result = await checkMongo(getCode(), lesson.challenge)
      setVerdict({ id: lesson.id, ...result })
      if (result.pass) {
        const xp = markMongoLessonDone(lesson.id)
        toast(xp > 0 ? `Lesson complete! +${xp} XP` : 'Correct!', 'good')
      }
    } finally {
      setChecking(false)
    }
  }

  const shown = verdict?.id === lesson.id ? verdict : null

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center gap-3">
        <GraduationCap size={18} className="shrink-0 text-accent" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted">{completed} of {MONGO_LESSONS.length} lessons completed</p>
          <ProgressBar value={(completed / MONGO_LESSONS.length) * 100} className="mt-1" />
        </div>
      </div>

      <nav aria-label="Lessons" className="flex flex-wrap gap-1.5">
        {MONGO_LESSONS.map((l, i) => (
          <button
            key={l.id}
            type="button"
            onClick={() => go(i)}
            title={l.title}
            aria-label={`Lesson ${i + 1}: ${l.title}`}
            aria-current={i === index ? 'step' : undefined}
            className={cx(
              'grid size-8 place-items-center rounded-lg border text-xs font-semibold transition',
              i === index ? 'border-accent bg-accent/10 text-accent' : done[l.id] ? 'border-good/40 bg-good/10 text-good' : 'border-line text-muted hover:text-text',
            )}
          >
            {done[l.id] && i !== index ? <CircleCheck size={14} /> : i + 1}
          </button>
        ))}
      </nav>

      <article className="space-y-3">
        <header>
          <p className="font-mono text-[11px] uppercase tracking-wider text-accent">Lesson {index + 1} of {MONGO_LESSONS.length}</p>
          <h3 className="font-display text-lg font-semibold leading-snug">{lesson.title}</h3>
          <p className="text-xs text-muted">{lesson.summary}</p>
        </header>
        {lesson.body.map((p, i) => <p key={i} className="leading-relaxed text-muted">{inline(p)}</p>)}

        <div className="overflow-hidden rounded-xl border border-line">
          <p className="border-b border-line bg-surface-2/60 px-3 py-1.5 text-xs font-medium">{lesson.example.title}</p>
          <pre className="overflow-x-auto bg-code px-3 py-2 font-mono text-[12.5px] leading-relaxed">{lesson.example.code.trimEnd()}</pre>
          <div className="flex flex-wrap gap-2 border-t border-line px-3 py-2">
            <Button size="sm" variant="secondary" onClick={() => onLoad(lesson.example.code)}><Upload size={13} /> Load into editor</Button>
            <Button size="sm" variant="primary" onClick={() => { onLoad(lesson.example.code); setTimeout(onRun, 0) }}><Play size={13} /> Load and run</Button>
          </div>
        </div>

        <section aria-label="Challenge" className="rounded-xl border border-accent/40 bg-accent/5 p-3">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-accent">Challenge</p>
          <p className="mt-1 leading-relaxed">{inline(lesson.challenge.task)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => { onLoad(lesson.challenge.starter); setVerdict(null) }}><Upload size={13} /> Load starter</Button>
            <Button size="sm" variant="primary" onClick={check} disabled={checking}>
              {checking ? <Loader size={13} className="animate-spin" /> : <CircleCheck size={13} />} Check my answer
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setHint(hint === lesson.id ? null : lesson.id)}><Lightbulb size={13} /> Hint</Button>
          </div>
          {hint === lesson.id && <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-xs leading-relaxed">{inline(lesson.challenge.hint)}</p>}
          {shown && (
            <p role="status" className={cx('mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs leading-relaxed', shown.pass ? 'bg-good/10 text-good' : 'bg-bad/10 text-bad')}>
              {shown.pass ? <CircleCheck size={14} className="mt-0.5 shrink-0" /> : <CircleX size={14} className="mt-0.5 shrink-0" />}
              <span>{shown.detail}</span>
            </p>
          )}
          <div className="mt-3">
            {solution === lesson.id ? (
              <div className="overflow-hidden rounded-lg border border-line">
                <pre className="overflow-x-auto bg-code px-3 py-2 font-mono text-[12.5px]">{lesson.challenge.solution}</pre>
                <div className="border-t border-line px-3 py-1.5"><Button size="sm" variant="ghost" onClick={() => onLoad(lesson.challenge.solution)}><Upload size={13} /> Load solution</Button></div>
              </div>
            ) : (
              <button type="button" onClick={() => setSolution(lesson.id)} className="text-xs text-muted underline-offset-2 hover:text-text hover:underline">Stuck? Show the solution</button>
            )}
          </div>
        </section>
      </article>

      <div className="flex justify-between gap-2 border-t border-line pt-3">
        <Button size="sm" variant="ghost" onClick={() => go(index - 1)} disabled={index === 0}><ArrowLeft size={13} /> Previous</Button>
        <Button size="sm" variant="ghost" onClick={() => go(index + 1)} disabled={index === MONGO_LESSONS.length - 1}>Next <ArrowRight size={13} /></Button>
      </div>
    </div>
  )
}
