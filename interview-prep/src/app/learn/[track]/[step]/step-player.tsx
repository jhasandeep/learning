'use client'

import { ArrowLeft, ArrowRight, CircleCheck, CircleX, Eye, Lightbulb, ListChecks, LoaderCircle, Play, RotateCcw, Sparkles, Terminal } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { RUN_EVENT } from '@/components/editor-events'
import { TechTile } from '@/components/tech-icon'
import { useToast } from '@/components/toast'
import { buttonClass, cx, Kbd } from '@/components/ui'
import type { StepInput, StepOutcome } from '@/lib/learn/harness'
import { recordLearnStep, useProgress } from '@/lib/progress'

const CodeEditor = dynamic(() => import('@/components/code-editor'), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-muted">Loading editor…</div>,
})

const draftKey = (key: string) => `prep-arena:learn-draft:${key}`
const readDraft = (key: string) => {
  try {
    return localStorage.getItem(draftKey(key))
  } catch {
    return null
  }
}
const writeDraft = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(draftKey(key))
    else localStorage.setItem(draftKey(key), value)
  } catch {
    // storage blocked: drafts just aren't kept
  }
}

type Tab = 'checks' | 'preview' | 'console'

export function StepPlayer(props: {
  stepKey: string
  track: { id: string; title: string; color: string; badge: string }
  index: number
  total: number
  steps: { id: string; key: string; title: string }[]
  prevId?: string
  nextId?: string
  title: string
  lesson: ReactNode
  task: ReactNode
  hints: ReactNode[]
  solutionHtml: string
  checks: string[]
  input: Omit<StepInput, 'code'>
  starter: string
  solution: string
  lang: string
}) {
  const { stepKey, track, input, starter } = props
  const p = useProgress()
  const toast = useToast()
  const [code, setCode] = useState(starter)
  const [outcome, setOutcome] = useState<StepOutcome | null>(null)
  const [running, setRunning] = useState(false)
  const [hintsShown, setHintsShown] = useState(0)
  const [solutionShown, setSolutionShown] = useState(false)
  const [tab, setTab] = useState<Tab>('checks')
  const editorWrap = useRef<HTMLDivElement>(null)
  const done = Boolean(p.learn[stepKey])
  const visual = input.kind === 'html' || input.kind === 'css'

  // Restore the saved draft after hydration.
  useEffect(() => {
    const draft = readDraft(stepKey)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- drafts live in localStorage, read once after mount
    if (draft !== null) setCode(draft)
  }, [stepKey])

  useEffect(() => {
    const t = setTimeout(() => writeDraft(stepKey, code === starter ? null : code), 400)
    return () => clearTimeout(t)
  }, [code, starter, stepKey])

  const check = useCallback(async () => {
    if (running) return
    setRunning(true)
    try {
      const { checkStep } = await import('@/lib/learn/run')
      const result = await checkStep({ ...input, code })
      setOutcome(result)
      const passed = !result.error && result.results.length > 0 && result.results.every((r) => r.pass)
      if (passed) {
        const gain = recordLearnStep(stepKey, hintsShown, solutionShown)
        toast(gain ? `Step complete! +${gain} XP` : 'All checks pass!', 'good')
        setTab('checks')
      } else if (result.error || result.results.some((r) => !r.pass)) {
        setTab('checks')
      }
    } finally {
      setRunning(false)
    }
  }, [running, input, code, stepKey, hintsShown, solutionShown, toast])

  // Ctrl/Cmd+Enter in the editor runs the checks.
  useEffect(() => {
    const el = editorWrap.current
    if (!el) return
    const onRun = () => void check()
    el.addEventListener(RUN_EVENT, onRun)
    return () => el.removeEventListener(RUN_EVENT, onRun)
  }, [check])

  const passedNow = outcome && !outcome.error && outcome.results.length > 0 && outcome.results.every((r) => r.pass)
  const passCount = outcome?.results.filter((r) => r.pass).length ?? 0
  const preview = input.kind === 'html' ? code : input.kind === 'css' ? `<!doctype html><html><head><style>body{font-family:system-ui,sans-serif;margin:0}${code}</style></head><body>${input.setup ?? ''}</body></html>` : ''

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      {/* lesson */}
      <section className="min-w-0 space-y-4">
        <div className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <TechTile id={track.id} color={track.color} size={36} fallback={track.badge} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium" style={{ color: track.color }}>Step {props.index + 1} of {props.total}</p>
              <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                {props.title}
                {done && <CircleCheck size={18} className="shrink-0 text-good" aria-label="Completed" />}
              </h1>
            </div>
          </div>
          <div className="mt-2 flex gap-1" aria-hidden>
            {props.steps.map((s, i) => (
              <Link key={s.id} href={`/learn/${track.id}/${s.id}`} title={s.title} className={cx('h-1.5 flex-1 rounded-full transition', p.learn[s.key] ? 'bg-good' : i === props.index ? '' : 'bg-surface-2')} style={i === props.index && !p.learn[s.key] ? { background: track.color } : undefined} />
            ))}
          </div>
          <div className="mt-5 text-[15px]">{props.lesson}</div>
        </div>

        <div className="rounded-2xl border-2 p-4" style={{ borderColor: `color-mix(in srgb, ${track.color} 45%, var(--line))`, background: `color-mix(in srgb, ${track.color} 6%, var(--surface))` }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: track.color }}>Your task</p>
          <p className="mt-1 leading-relaxed">{props.task}</p>
          {props.checks.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-muted">
              {props.checks.map((c) => <li key={c} className="flex gap-2"><ListChecks size={15} className="mt-0.5 shrink-0" /> {c}</li>)}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          {props.hints.slice(0, hintsShown).map((h, i) => (
            <p key={i} className="flex gap-2 rounded-xl border border-warn/30 bg-warn/5 px-3.5 py-2.5 text-sm"><Lightbulb size={16} className="mt-0.5 shrink-0 text-warn" /><span>{h}</span></p>
          ))}
          <div className="flex flex-wrap gap-2">
            {hintsShown < props.hints.length && (
              <button type="button" className={buttonClass('secondary', 'sm')} onClick={() => setHintsShown((n) => n + 1)}>
                <Lightbulb size={14} /> {hintsShown ? 'Another hint' : 'Show a hint'}
              </button>
            )}
            {!solutionShown && (
              <button type="button" className={buttonClass('ghost', 'sm')} onClick={() => { if (done || window.confirm('Show the solution? Try a hint first: you learn more by getting there yourself. (This step then earns less XP.)')) setSolutionShown(true) }}>
                <Eye size={14} /> Show solution
              </button>
            )}
          </div>
          {solutionShown && (
            <div className="overflow-hidden rounded-2xl border border-line">
              <div className="flex items-center justify-between bg-surface-2 px-3 py-1.5 text-xs">
                <span className="font-medium">Solution</span>
                <button type="button" className="text-accent hover:underline" onClick={() => setCode(props.solution)}>Put it in the editor</button>
              </div>
              <div className="note-codecard note-pre text-[13px]" dangerouslySetInnerHTML={{ __html: props.solutionHtml }} />
            </div>
          )}
        </div>
      </section>

      {/* editor + results */}
      <section className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-20 lg:self-start">
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="flex items-center gap-2 border-b border-line px-3 py-2">
            <span className="text-xs font-medium text-muted">Your code</span>
            <button type="button" className={cx(buttonClass('ghost', 'sm'), 'ml-auto')} onClick={() => { if (code === starter || window.confirm('Reset to the starter code? Your changes will be lost.')) { setCode(starter); setOutcome(null) } }} title="Back to the starter code">
              <RotateCcw size={14} /> Reset
            </button>
            <button type="button" className={buttonClass('primary', 'sm')} onClick={() => void check()} disabled={running}>
              {running ? <LoaderCircle size={14} className="animate-spin" /> : <Play size={14} />} Check <span className="hidden sm:inline"><Kbd>Ctrl ↵</Kbd></span>
            </button>
          </div>
          <div ref={editorWrap} className="h-[22rem] lg:h-[calc(100dvh-24rem)] lg:min-h-[18rem]">
            <CodeEditor value={code} onChange={setCode} language={props.lang} fontSize={14} />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="flex items-center gap-1 border-b border-line px-2 py-1.5" role="tablist">
            {(['checks', ...(visual ? ['preview' as const] : []), ...(outcome?.logs.length ? ['console' as const] : [])] as Tab[]).map((t) => (
              <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cx('rounded-lg px-3 py-1 text-xs font-medium capitalize', tab === t ? 'bg-surface-2 text-text' : 'text-muted hover:text-text')}>
                {t === 'console' ? <span className="inline-flex items-center gap-1"><Terminal size={12} /> Console</span> : t}
              </button>
            ))}
            {outcome && !outcome.error && outcome.results.length > 0 && (
              <span className={cx('ml-auto pr-2 text-xs font-medium', passedNow ? 'text-good' : 'text-muted')}>{passCount}/{outcome.results.length} checks pass</span>
            )}
          </div>
          <div className="max-h-80 overflow-auto p-3 text-sm">
            {tab === 'preview' && visual && (
              <iframe title="Preview" sandbox="" srcDoc={preview} className="h-64 w-full rounded-lg border border-line bg-white" />
            )}
            {tab === 'console' && (
              <pre className="whitespace-pre-wrap font-mono text-[12px] text-muted">{outcome?.logs.join('\n')}</pre>
            )}
            {tab === 'checks' && (
              !outcome ? (
                <p className="text-muted">Write your code, then press <b>Check</b> to run the checks.</p>
              ) : outcome.error ? (
                <div className="rounded-xl border border-bad/40 bg-bad/5 p-3">
                  <p className="flex items-center gap-1.5 font-medium text-bad"><CircleX size={16} /> Your code didn&apos;t run</p>
                  <pre className="mt-1 whitespace-pre-wrap font-mono text-[12px]">{outcome.error}</pre>
                </div>
              ) : (
                <div className="space-y-3">
                  {passedNow && (
                    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-good/40 bg-good/10 p-3">
                      <Sparkles size={18} className="text-good" />
                      <p className="flex-1 font-medium text-good">Nice work, every check passes!</p>
                      {props.nextId ? (
                        <Link href={`/learn/${track.id}/${props.nextId}`} className={buttonClass('primary', 'sm')}>Next step <ArrowRight size={14} /></Link>
                      ) : (
                        <Link href={`/learn/${track.id}`} className={buttonClass('primary', 'sm')}>Track complete <ArrowRight size={14} /></Link>
                      )}
                    </div>
                  )}
                  <ul className="space-y-1.5">
                    {outcome.results.map((r, i) => (
                      <li key={i} className="flex gap-2">
                        {r.pass ? <CircleCheck size={16} className="mt-0.5 shrink-0 text-good" /> : <CircleX size={16} className="mt-0.5 shrink-0 text-bad" />}
                        <span className="min-w-0">
                          <span className={r.pass ? '' : 'font-medium'}>{r.name}</span>
                          {r.message && <span className="mt-0.5 block break-words font-mono text-[12px] text-muted">{r.message}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {outcome.table && (
                    <div className="overflow-x-auto rounded-lg border border-line">
                      <table className="w-full text-left font-mono text-[12px]">
                        <thead className="bg-surface-2"><tr>{outcome.table.columns.map((c) => <th key={c} className="px-2 py-1 font-semibold">{c}</th>)}</tr></thead>
                        <tbody>{outcome.table.values.map((row, i) => <tr key={i} className="border-t border-line">{row.map((v, j) => <td key={j} className="px-2 py-1">{v === null ? <span className="text-muted">NULL</span> : String(v)}</td>)}</tr>)}</tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>

        <div className="flex justify-between">
          {props.prevId ? <Link href={`/learn/${track.id}/${props.prevId}`} className={buttonClass('ghost', 'sm')}><ArrowLeft size={14} /> Previous</Link> : <span />}
          {props.nextId && <Link href={`/learn/${track.id}/${props.nextId}`} className={buttonClass('ghost', 'sm')}>{done ? 'Next' : 'Skip'} <ArrowRight size={14} /></Link>}
        </div>
      </section>
    </div>
  )
}
