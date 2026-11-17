'use client'

import { CircleCheck, CircleDashed, CircleX, Eye, Lightbulb, Loader, Play, RotateCcw, Sparkles } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { CodeActions } from '@/components/notes/code-actions'
import { Inline } from '@/components/notes/inline'
import { useToast } from '@/components/toast'
import { Button, cx } from '@/components/ui'
import type { BuildStep, Both, Lang, Lesson } from '@/data/dsa/types'
import type { CheckItem } from '@/data/tasks/types'
import { practiceSolution, practiceTask } from '@/lib/dsa'
import { markTaskDone, useProgress } from '@/lib/progress'
import { checkTask, taskRequirements } from '@/lib/task-runner'

const CodeEditor = dynamic(() => import('@/components/code-editor'), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-muted">Loading editor…</div>,
})

// Pieces shared by the DSA course and the system design course.

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

export function useLang(): [Lang, (l: Lang) => void] {
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

export const LANG_NAME: Record<Lang, string> = { python: 'Python', javascript: 'JavaScript' }

// ---- small pieces ------------------------------------------------------------------------------------

export const TAGS: Record<BuildStep['tag'], { label: string; cls: string }> = {
  idea: { label: 'Start here', cls: 'bg-accent/15 text-accent' },
  slow: { label: 'Works, but slow', cls: 'bg-warn/15 text-warn' },
  better: { label: 'Better', cls: 'bg-accent/15 text-accent' },
  best: { label: 'Best solution', cls: 'bg-good/15 text-good' },
}

export function Section({ n, title, children, id }: { n: number; title: string; children: React.ReactNode; id: string }) {
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

export function CodeCard({ html, code, lang, title }: { html: string; code: string; lang: Lang; title: string }) {
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

// ---- practice ----------------------------------------------------------------------------------------

const draftKey = (key: string, lang: Lang) => `prep-arena:dsa:${key}:${lang}`

function readDraft(key: string, lang: Lang, starter: string): string {
  try {
    return localStorage.getItem(draftKey(key, lang)) ?? starter
  } catch {
    return starter
  }
}

export type PracticeLesson = Pick<Lesson, 'id' | 'title' | 'blurb' | 'recap' | 'practice' | 'steps'>

export function Practice({ lesson, progressKey: key, solutionHtml, lang }: { lesson: PracticeLesson; progressKey: string; solutionHtml: Both; lang: Lang }) {
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

