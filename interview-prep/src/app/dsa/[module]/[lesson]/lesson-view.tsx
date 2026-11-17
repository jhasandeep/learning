'use client'

import { ArrowLeft, ArrowRight, ChevronLeft, CircleCheck, CircleDashed, CircleX, Eye, Lightbulb, Loader, Pause, Play, RotateCcw, SkipBack, SkipForward, Sparkles, Timer } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { CodeActions } from '@/components/notes/code-actions'
import { Inline } from '@/components/notes/inline'
import { useToast } from '@/components/toast'
import { Button, buttonClass, cx } from '@/components/ui'
import type { BuildStep, Frame, Lang, Lesson } from '@/data/dsa/types'
import type { Both } from '@/data/dsa/types'
import type { CheckItem } from '@/data/tasks/types'
import { lessonKey, practiceSolution, practiceTask } from '@/lib/dsa'
import { markTaskDone, useProgress } from '@/lib/progress'
import { checkTask, taskRequirements } from '@/lib/task-runner'

const CodeEditor = dynamic(() => import('@/components/code-editor'), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-muted">Loading editor…</div>,
})

export interface LessonHtml {
  steps: Both[]
  solution: Both
}

interface Props {
  module: { id: string; title: string; color: string; count: number }
  index: number
  lesson: Lesson
  html: LessonHtml
  prev?: { href: string; title: string }
  next?: { href: string; title: string }
}

// ---- language choice, remembered across lessons ------------------------------------------------------

const LANG_KEY = 'prep-arena:dsa-lang'
const LANG_EVENT = 'dsa-lang-change'

function readLang(): Lang {
  try {
    return localStorage.getItem(LANG_KEY) === 'javascript' ? 'javascript' : 'python'
  } catch {
    return 'python'
  }
}

function useLang(): [Lang, (l: Lang) => void] {
  const lang = useSyncExternalStore(
    (cb) => {
      window.addEventListener(LANG_EVENT, cb)
      window.addEventListener('storage', cb)
      return () => {
        window.removeEventListener(LANG_EVENT, cb)
        window.removeEventListener('storage', cb)
      }
    },
    readLang,
    () => 'python' as Lang,
  )
  const set = useCallback((l: Lang) => {
    try {
      localStorage.setItem(LANG_KEY, l)
    } catch {}
    window.dispatchEvent(new Event(LANG_EVENT))
  }, [])
  return [lang, set]
}

const LANG_NAME: Record<Lang, string> = { python: 'Python', javascript: 'JavaScript' }

// ---- small pieces ------------------------------------------------------------------------------------

const TAGS: Record<BuildStep['tag'], { label: string; cls: string }> = {
  idea: { label: 'Start here', cls: 'bg-accent/15 text-accent' },
  slow: { label: 'Works, but slow', cls: 'bg-warn/15 text-warn' },
  better: { label: 'Better', cls: 'bg-accent/15 text-accent' },
  best: { label: 'Best solution', cls: 'bg-good/15 text-good' },
}

function Section({ n, title, children, id }: { n: number; title: string; children: React.ReactNode; id: string }) {
  return (
    <section id={id} className="scroll-mt-24" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="mb-4 flex items-center gap-3 text-xl font-semibold tracking-tight">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-surface-2 text-sm font-bold text-muted">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function CodeCard({ html, code, lang, title }: { html: string; code: string; lang: Lang; title: string }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-line bg-[#0d1117]">
      <figcaption className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2">
        <span className="text-xs font-medium text-slate-300">{title} · {LANG_NAME[lang]}</span>
        <CodeActions code={code} runLang={lang} />
      </figcaption>
      <div className="overflow-x-auto text-[13px] leading-relaxed [&_pre]:!bg-transparent [&_pre]:p-4" dangerouslySetInnerHTML={{ __html: html }} />
    </figure>
  )
}

// ---- dry run -----------------------------------------------------------------------------------------

function ArrayBoxes({ array }: { array: NonNullable<Frame['array']> }) {
  const pointerAt = (i: number) => Object.entries(array.pointers ?? {}).filter(([, idx]) => idx === i).map(([name]) => name)
  return (
    <div>
      {array.label && <p className="mb-1 text-xs font-medium text-muted">{array.label}</p>}
      <div className="flex flex-wrap gap-1.5">
        {array.cells.map((c, i) => {
          const marked = array.marks?.includes(i)
          const pointers = pointerAt(i)
          return (
            <div key={i} className="flex flex-col items-center">
              <div className={cx('grid h-12 min-w-12 place-items-center rounded-lg border-2 px-2 font-mono text-base font-semibold transition-colors', marked ? 'border-accent bg-accent/15 text-accent' : 'border-line bg-surface-2', pointers.length > 0 && 'ring-2 ring-warn/60')}>
                {String(c) === ' ' ? '␣' : c}
              </div>
              <span className="mt-0.5 text-[10px] text-muted">{i}</span>
              <span className="h-4 text-[11px] font-semibold text-warn">{pointers.join(', ')}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DryRun({ run }: { run: Lesson['dryRun'] }) {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const last = run.frames.length - 1
  const f = run.frames[step]

  // auto play stops by itself on the last step
  const active = playing && step < last
  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => setStep((s) => s + 1), 1600)
    return () => clearTimeout(t)
  }, [active, step])

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-sm font-semibold">{run.title}</p>
      <p className="mt-0.5 font-mono text-xs text-muted">{run.input}</p>

      <div className="mt-4 min-h-[170px] space-y-4 rounded-xl bg-surface-2 p-4" aria-live="polite">
        {f.array && <ArrayBoxes array={f.array} />}
        {f.extra && (
          <div>
            <p className="mb-1 text-xs font-medium text-muted">{f.extra.label}</p>
            <div className="flex min-h-9 flex-wrap gap-1.5">
              {f.extra.items.length === 0 ? <span className="text-xs italic text-muted">empty</span> : f.extra.items.map((it, i) => <span key={`${it}-${i}`} className="rounded-md border border-line bg-surface px-2.5 py-1 font-mono text-sm">{it}</span>)}
            </div>
          </div>
        )}
        {f.vars && f.vars.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {f.vars.map(([k, v]) => <span key={k} className="rounded-md bg-code px-2.5 py-1 font-mono text-xs"><span className="text-muted">{k}</span> = <span className="font-semibold">{v}</span></span>)}
          </div>
        )}
      </div>

      <p className="mt-3 text-sm leading-relaxed"><span className="font-semibold">Step {step + 1} of {run.frames.length}:</span> <Inline text={f.caption} /></p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => { setPlaying(false); setStep(0) }} disabled={step === 0} aria-label="Back to the first step"><SkipBack size={14} /></Button>
        <Button size="sm" onClick={() => { setPlaying(false); setStep((s) => Math.max(0, s - 1)) }} disabled={step === 0}><ArrowLeft size={14} /> Back</Button>
        <Button size="sm" variant="primary" onClick={() => { setPlaying(false); setStep((s) => Math.min(last, s + 1)) }} disabled={step === last}>Next <ArrowRight size={14} /></Button>
        <Button size="sm" onClick={() => { setPlaying(false); setStep(last) }} disabled={step === last} aria-label="Jump to the last step"><SkipForward size={14} /></Button>
        <Button size="sm" variant="ghost" onClick={() => { if (!playing && step >= last) setStep(0); setPlaying((p) => !p) }}>{active ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Auto play</>}</Button>
        <div className="ml-auto flex gap-1" aria-hidden="true">
          {run.frames.map((_, i) => <span key={i} className={cx('h-1.5 w-5 rounded-full', i <= step ? 'bg-accent' : 'bg-line')} />)}
        </div>
      </div>
    </div>
  )
}

// ---- practice ----------------------------------------------------------------------------------------

const draftKey = (key: string, lang: Lang) => `prep-arena:dsa:${key}:${lang}`

function readDraft(key: string, lang: Lang, starter: string): string {
  try {
    return localStorage.getItem(draftKey(key, lang)) ?? starter
  } catch {
    return starter
  }
}

function Practice({ lesson, moduleId, solutionHtml, lang }: { lesson: Lesson; moduleId: string; solutionHtml: Both; lang: Lang }) {
  const key = lessonKey(moduleId, lesson.id)
  const toast = useToast()
  const progress = useProgress()
  const done = Boolean(progress.tasks[key])
  const starter = lesson.practice.starter[lang]
  const task = useMemo(() => practiceTask(lesson, lang), [lesson, lang])
  const requirements = useMemo(() => taskRequirements(task), [task])

  const [code, setCode] = useState(() => readDraft(key, lang, starter))
  const [items, setItems] = useState<CheckItem[] | null>(null)
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)
  const [hints, setHints] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [gain, setGain] = useState<number | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(draftKey(key, lang), code)
    } catch {}
  }, [code, key, lang])

  const passed = items ? items.filter((i) => i.pass).length : 0
  const allPass = items !== null && items.length > 0 && passed === items.length
  const shown: CheckItem[] = items ?? requirements.map((label) => ({ label, pass: false }))

  const check = async () => {
    setRunning(true)
    try {
      const res = await checkTask(task, code)
      setItems(res.items)
      setOutput(res.output)
      if (res.items.length > 0 && res.items.every((i) => i.pass)) {
        const g = markTaskDone(key, hints, revealed)
        setGain(g)
        toast(g ? `Lesson complete · +${g} XP` : 'Lesson complete', 'good')
      }
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={check} disabled={running}>
              {running ? <Loader size={16} className="animate-spin" /> : <Play size={16} />} {running ? 'Checking…' : 'Check my code'}
            </Button>
            <Button onClick={() => { setCode(starter); setItems(null); setOutput(''); setGain(null) }}><RotateCcw size={15} /> Reset</Button>
            <span className="ml-auto text-xs text-muted">{LANG_NAME[lang]} · saved as you type{lang === 'python' ? ' · the first Python run takes a few seconds to load' : ''}</span>
          </div>
          <div className="h-[360px] overflow-hidden rounded-2xl border border-line bg-code">
            <CodeEditor key={lang} value={code} onChange={setCode} language={lang} />
          </div>
          {output && (
            <div className="rounded-2xl border border-line bg-surface">
              <p className="border-b border-line px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted">Output</p>
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap px-4 py-3 font-mono text-[12.5px] leading-relaxed">{output}</pre>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Tests</p>
              <span className="text-xs text-muted">{items ? `${passed} / ${items.length} pass` : `${requirements.length} tests`}</span>
            </div>
            <ul className="mt-3 space-y-2" aria-live="polite">
              {shown.map((it) => (
                <li key={it.label} className="flex items-start gap-2 text-sm">
                  {items === null ? <CircleDashed size={17} className="mt-0.5 flex-none text-muted" /> : it.pass ? <CircleCheck size={17} className="mt-0.5 flex-none text-good" /> : <CircleX size={17} className="mt-0.5 flex-none text-bad" />}
                  <span>
                    <span className={cx(items && it.pass && 'text-muted')}>{it.label}</span>
                    {items && !it.pass && it.detail && <span className="mt-0.5 block text-xs text-bad">{it.detail}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="font-semibold">Stuck?</p>
            <div className="mt-2 space-y-2">
              {lesson.practice.hints.slice(0, hints).map((h, i) => (
                <p key={i} className="rounded-lg bg-surface-2 px-3 py-2 text-sm leading-relaxed"><span className="font-semibold">Hint {i + 1}:</span> <Inline text={h} /></p>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {hints < lesson.practice.hints.length && <Button size="sm" onClick={() => setHints((h) => h + 1)}><Lightbulb size={14} /> {hints === 0 ? 'Give me a hint' : 'Another hint'}</Button>}
              {!revealed ? <Button size="sm" variant="ghost" onClick={() => setRevealed(true)}><Eye size={14} /> Show solution</Button> : <Button size="sm" variant="ghost" onClick={() => setCode(practiceSolution(lesson)[lang])}>Load into editor</Button>}
            </div>
            {revealed && <div className="mt-3 max-h-64 overflow-auto rounded-lg text-[12.5px] [&_pre]:p-3" dangerouslySetInnerHTML={{ __html: solutionHtml[lang] }} />}
          </div>
        </div>
      </div>

      {(allPass || done) && (
        <div className="rounded-2xl border-2 border-good bg-good/5 p-5">
          <p className="flex items-center gap-2 text-lg font-semibold text-good"><Sparkles size={20} /> {allPass ? `Every test passes${gain ? ` · +${gain} XP` : ''}` : 'You already completed this lesson'}</p>
          <p className="mt-2 text-sm"><span className="font-semibold">Remember:</span> <Inline text={lesson.recap} /></p>
        </div>
      )}
    </div>
  )
}

// ---- the lesson --------------------------------------------------------------------------------------

export function LessonView({ module, index, lesson, html, prev, next }: Props) {
  const [lang, setLang] = useLang()
  const progress = useProgress()
  const done = Boolean(progress.tasks[lessonKey(module.id, lesson.id)])
  const [shown, setShown] = useState(1)
  const solutionHtml = html.solution

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <Link href="/dsa" className="inline-flex items-center gap-1 text-muted hover:text-text"><ChevronLeft size={16} /> DSA course</Link>
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
          <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-1"><Timer size={12} /> about {Math.max(8, lesson.steps.length * 5 + 5)} minutes</span>
          <span className="rounded-md bg-surface-2 px-2 py-1">{lesson.steps.length} {lesson.steps.length === 1 ? 'approach' : 'approaches'}</span>
          <span className="rounded-md bg-surface-2 px-2 py-1">{lesson.practice.cases.length} tests</span>
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
        <nav aria-label="Lesson sections" className="ml-auto hidden gap-3 text-xs text-muted md:flex">
          {[['idea', 'Idea'], ['problem', 'Problem'], ['build', 'Build it'], ['dry-run', 'Dry run'], ['practice', 'Your turn']].map(([id, label]) => <a key={id} href={`#${id}`} className="hover:text-text">{label}</a>)}
        </nav>
      </div>

      <div className="space-y-10">
        <Section n={1} id="idea" title="The idea in everyday words">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="flex items-center gap-3 font-semibold"><span className="text-2xl" aria-hidden="true">{lesson.analogy.emoji}</span> {lesson.analogy.title}</p>
            <p className="mt-2 leading-relaxed text-muted"><Inline text={lesson.analogy.text} /></p>
          </div>
        </Section>

        <Section n={2} id="problem" title="The problem">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="leading-relaxed"><Inline text={lesson.problem.statement} /></p>
            <div className="mt-4 space-y-2">
              {lesson.problem.examples.map((e, i) => (
                <div key={i} className="rounded-lg bg-surface-2 px-3 py-2 text-sm">
                  <p className="font-mono text-[13px]"><span className="text-muted">Input:</span> {e.input}</p>
                  <p className="font-mono text-[13px]"><span className="text-muted">Output:</span> {e.output}</p>
                  {e.why && <p className="mt-0.5 text-xs text-muted">{e.why}</p>}
                </div>
              ))}
            </div>
            {lesson.problem.constraints && <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">{lesson.problem.constraints.map((c) => <li key={c}>{c}</li>)}</ul>}
          </div>
        </Section>

        <Section n={3} id="build" title="Build it step by step">
          <ol className="space-y-5">
            {lesson.steps.slice(0, shown).map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-line bg-surface p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-surface-2 text-xs font-bold">{i + 1}</span>
                  <h3 className="font-semibold">{s.title}</h3>
                  <span className={cx('rounded-full px-2 py-0.5 text-xs font-semibold', s.buggy ? 'bg-bad/15 text-bad' : TAGS[s.tag].cls)}>{s.buggy ? 'Looks right, but breaks' : TAGS[s.tag].label}</span>
                </div>
                <p className="mt-3 leading-relaxed"><Inline text={s.idea} /></p>
                <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-muted marker:font-semibold">
                  {s.walk.map((w, j) => <li key={j}><Inline text={w} /></li>)}
                </ol>
                <div className="mt-4">
                  <CodeCard html={html.steps[i][lang]} code={s.code[lang]} lang={lang} title={`Step ${i + 1}`} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-md bg-surface-2 px-2 py-1">Time <b className="font-mono">{s.time}</b></span>
                  <span className="rounded-md bg-surface-2 px-2 py-1">Space <b className="font-mono">{s.space}</b></span>
                </div>
                {s.verdict && <p className="mt-3 rounded-lg border-l-4 border-accent bg-accent/5 px-3 py-2 text-sm"><Inline text={s.verdict} /></p>}
              </li>
            ))}
          </ol>
          {shown < lesson.steps.length ? (
            <Button className="mt-4" variant="primary" onClick={() => setShown((n) => n + 1)}>Show a better idea <ArrowRight size={16} /></Button>
          ) : lesson.steps.length > 1 ? (
            <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-surface">
              <table className="w-full text-sm">
                <caption className="px-4 pt-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">All approaches side by side</caption>
                <thead><tr className="text-left text-xs text-muted"><th className="px-4 py-2">Approach</th><th className="px-4 py-2">Time</th><th className="px-4 py-2">Space</th></tr></thead>
                <tbody>
                  {lesson.steps.map((s) => (
                    <tr key={s.title} className="border-t border-line"><td className="px-4 py-2">{s.title}</td><td className="px-4 py-2 font-mono">{s.time}</td><td className="px-4 py-2 font-mono">{s.space}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </Section>

        <Section n={4} id="dry-run" title="Dry run: watch it work">
          <DryRun run={lesson.dryRun} />
        </Section>

        <Section n={5} id="practice" title="Your turn: write it yourself">
          <p className="mb-4 text-sm text-muted">Write <code className="note-code">{lesson.practice.fn[lang]}</code> in the editor and press <b>Check my code</b>. The tests run right here in your browser.</p>
          <Practice key={lang} lesson={lesson} moduleId={module.id} solutionHtml={solutionHtml} lang={lang} />
        </Section>

        <Section n={6} id="wrap" title="Wrap-up">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-surface p-5">
              <p className="font-semibold text-bad">Common mistakes</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">{lesson.mistakes.map((m) => <li key={m}><Inline text={m} /></li>)}</ul>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-5">
              <p className="font-semibold text-accent">Try these next</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">{lesson.variants.map((m) => <li key={m}><Inline text={m} /></li>)}</ul>
            </div>
          </div>
          <p className="mt-4 rounded-2xl border-2 border-good/40 bg-good/5 p-4 text-sm"><span className="font-semibold text-good">Remember:</span> <Inline text={lesson.recap} /></p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {prev && <Link href={prev.href} className={buttonClass('secondary')}><ArrowLeft size={16} /> {prev.title}</Link>}
            {next ? <Link href={next.href} className={`${buttonClass('primary')} ml-auto`}>Next lesson: {next.title} <ArrowRight size={16} /></Link> : <Link href="/dsa" className={`${buttonClass('primary')} ml-auto`}>Back to the course <ArrowRight size={16} /></Link>}
          </div>
        </Section>
      </div>
    </div>
  )
}
