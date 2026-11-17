'use client'

import { ArrowRight, ChevronLeft, CircleCheck, CircleDashed, CircleX, Eye, Lightbulb, Loader, Play, RotateCcw, Sparkles } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Inline } from '@/components/notes/inline'
import { useToast } from '@/components/toast'
import { Button, buttonClass, cx } from '@/components/ui'
import { LANGUAGES } from '@/data/languages'
import type { CheckItem, Task } from '@/data/tasks/types'
import { markTaskDone, useProgress } from '@/lib/progress'
import { checkTask, taskRequirements } from '@/lib/task-runner'
import { fromWire } from '@/lib/tasks'

const CodeEditor = dynamic(() => import('@/components/code-editor'), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-muted">Loading editor…</div>,
})

const draftKey = (key: string) => `prep-arena:task:${key}`

type PathStub = { id: string; title: string; blurb: string; tasks: { id: string; title: string }[] }

function readDraft(key: string, starter: string): string {
  if (typeof window === 'undefined') return starter
  try {
    return localStorage.getItem(draftKey(key)) ?? starter
  } catch {
    return starter
  }
}

export function TaskWorkspace({ path, task: wireTask, index, color }: { path: PathStub; task: Task; index: number; color: string }) {
  const task = useMemo(() => fromWire(wireTask), [wireTask])
  const key = `${path.id}/${task.id}`
  const toast = useToast()
  const progress = useProgress()
  const done = Boolean(progress.tasks[key])
  const next = path.tasks[index + 1]
  const [code, setCode] = useState(() => readDraft(key, wireTask.starter))
  const [items, setItems] = useState<CheckItem[] | null>(null)
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)
  const [hints, setHints] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [justSolved, setJustSolved] = useState<number | null>(null)

  // Save the draft as you type (restored by readDraft the next time).
  useEffect(() => {
    try {
      localStorage.setItem(draftKey(key), code)
    } catch {}
  }, [code, key])

  const requirements = useMemo(() => taskRequirements(task), [task])
  const passed = items ? items.filter((i) => i.pass).length : 0
  const allPass = items !== null && items.length > 0 && passed === items.length
  const lang = LANGUAGES.find((l) => l.id === task.language)

  const check = async () => {
    setRunning(true)
    try {
      const res = await checkTask(task, code)
      setItems(res.items)
      setOutput(res.output)
      if (res.items.length > 0 && res.items.every((i) => i.pass)) {
        const gain = markTaskDone(key, hints, revealed)
        setJustSolved(gain)
        toast(gain ? `Task complete · +${gain} XP` : 'Task complete', 'good')
      }
    } finally {
      setRunning(false)
    }
  }

  const reset = () => {
    setCode(task.starter)
    setItems(null)
    setOutput('')
    setJustSolved(null)
  }

  const shown: CheckItem[] = items ?? requirements.map((label) => ({ label, pass: false }))

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <Link href={`/tasks/${path.id}`} className="inline-flex items-center gap-1 text-muted hover:text-text"><ChevronLeft size={16} /> {path.title} tasks</Link>
        <span className="text-muted">/</span>
        <span className="font-medium">Task {index + 1} of {path.tasks.length}</span>
        {done && <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-good/10 px-2 py-0.5 text-xs font-medium text-good"><CircleCheck size={12} /> Completed</span>}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <section className="space-y-4">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>Your mission</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{task.title}</h1>
            <p className="mt-2 text-muted"><Inline text={task.goal} /></p>
            <ol className="mt-4 space-y-2 text-sm leading-relaxed">
              {task.steps.map((s, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: color }}>{i + 1}</span>
                  <span><Inline text={s} /></span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Checklist</p>
              <span className="text-xs text-muted">{items ? `${passed} / ${items.length} done` : `${requirements.length} requirements`}</span>
            </div>
            <ul className="mt-3 space-y-2" aria-live="polite">
              {shown.map((it) => (
                <li key={it.label} className="flex items-start gap-2 text-sm">
                  {items === null ? <CircleDashed size={18} className="mt-0.5 flex-none text-muted" /> : it.pass ? <CircleCheck size={18} className="mt-0.5 flex-none text-good" /> : <CircleX size={18} className="mt-0.5 flex-none text-bad" />}
                  <span>
                    <span className={cx(items && it.pass && 'text-muted line-through decoration-good/50')}><Inline text={it.label} /></span>
                    {items && !it.pass && it.detail && <span className="mt-0.5 block text-xs text-bad"><Inline text={it.detail} /></span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="font-semibold">Stuck?</p>
            <div className="mt-2 space-y-2">
              {task.hints.slice(0, hints).map((h, i) => (
                <p key={i} className="rounded-lg bg-surface-2 px-3 py-2 text-sm leading-relaxed"><span className="font-semibold">Hint {i + 1}:</span> <Inline text={h} /></p>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {hints < task.hints.length && <Button size="sm" onClick={() => setHints((h) => h + 1)}><Lightbulb size={14} /> {hints === 0 ? 'Give me a hint' : 'Another hint'}</Button>}
              {!revealed ? (
                <Button size="sm" variant="ghost" onClick={() => setRevealed(true)}><Eye size={14} /> Show solution</Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setCode(task.solution)}>Load solution into editor</Button>
              )}
            </div>
            {revealed && <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-code p-3 font-mono text-[12.5px] leading-relaxed">{task.solution}</pre>}
          </div>
        </section>

        <section className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={check} disabled={running}>
              {running ? <Loader size={16} className="animate-spin" /> : <Play size={16} />} {running ? 'Checking…' : 'Check my work'}
            </Button>
            <Button onClick={reset}><RotateCcw size={15} /> Reset code</Button>
            <span className="ml-auto text-xs text-muted">{lang ? lang.name : task.language} · your draft is saved automatically</span>
          </div>
          <div className="h-[420px] overflow-hidden rounded-2xl border border-line bg-code">
            <CodeEditor value={code} onChange={setCode} language={task.language} />
          </div>

          {output && (
            <div className="rounded-2xl border border-line bg-surface">
              <p className="border-b border-line px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted">Output</p>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap px-4 py-3 font-mono text-[12.5px] leading-relaxed">{output}</pre>
            </div>
          )}

          {allPass && (
            <div className="rounded-2xl border-2 border-good bg-good/5 p-5">
              <p className="flex items-center gap-2 text-lg font-semibold text-good"><Sparkles size={20} /> Nice work: every requirement passes{justSolved ? ` · +${justSolved} XP` : ''}</p>
              <p className="mt-2 text-sm"><span className="font-semibold">What you learned:</span> <Inline text={task.learned} /></p>
              <div className="mt-4 flex flex-wrap gap-2">
                {next ? (
                  <Link href={`/tasks/${path.id}/${next.id}`} className={buttonClass('primary')}>Next task: {next.title} <ArrowRight size={16} /></Link>
                ) : (
                  <Link href="/tasks" className={buttonClass('primary')}>All {path.title} tasks done: pick another technology <ArrowRight size={16} /></Link>
                )}
                <Link href={`/notes/${path.id}`} className={buttonClass('secondary')}>Read the {path.title} notes</Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
