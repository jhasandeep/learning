'use client'

import { ArrowRight, CircleCheck, CircleX, Eye, Lightbulb, ListChecks, LoaderCircle, PencilLine, Play, RotateCcw, Sparkles, Terminal, Wrench } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { RUN_EVENT } from '@/components/editor-events'
import { TechTile } from '@/components/tech-icon'
import { useToast } from '@/components/toast'
import { buttonClass, cx, DifficultyBadge, Kbd } from '@/components/ui'
import { OUTPUT_CHECK } from '@/data/mistakes'
import type { LearnKind } from '@/data/learn/types'
import type { StepInput, StepOutcome } from '@/lib/learn/harness'
import { recordMistake, useProgress, type MistakeMode } from '@/lib/progress'

const CodeEditor = dynamic(() => import('@/components/code-editor'), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-muted">Loading editor…</div>,
})

const draftKey = (key: string, mode: MistakeMode) => `prep-arena:mistake-draft:${key}:${mode}`
const readDraft = (key: string, mode: MistakeMode) => {
  try {
    return localStorage.getItem(draftKey(key, mode))
  } catch {
    return null
  }
}
const writeDraft = (key: string, mode: MistakeMode, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(draftKey(key, mode))
    else localStorage.setItem(draftKey(key, mode), value)
  } catch {
    // storage blocked: drafts just aren't kept
  }
}

type Tab = 'output' | 'checks' | 'preview'

export function MistakePlayer(props: {
  itemKey: string
  set: { id: string; title: string; color: string; badge: string; kind: LearnKind; lang: string; jsx?: boolean; typescript?: boolean }
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  task: ReactNode
  explain: ReactNode
  hints: ReactNode[]
  checks: string[]
  input: Omit<StepInput, 'code'>
  broken: string
  solution: string
  blank: string
  solutionHtml: string
  hasOutput: boolean
  nextHref: string
  nextLabel: string
}) {
  const { itemKey, set, input } = props
  const [mode, setMode] = useState<MistakeMode>('fix')
  const start = mode === 'fix' ? props.broken : props.blank
  const p = useProgress()
  const toast = useToast()
  const [code, setCode] = useState(start)
  const [outcome, setOutcome] = useState<StepOutcome | null>(null)
  const [running, setRunning] = useState(false)
  const [hintsShown, setHintsShown] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [tab, setTab] = useState<Tab>(props.hasOutput ? 'output' : 'checks')
  const editorWrap = useRef<HTMLDivElement>(null)
  const done = Boolean(p.mistakes[`${itemKey}:${mode}`])
  const visual = input.kind === 'html' || input.kind === 'css'

  // ?mode=write opens the write-it-yourself mode (read after mount: the page is prerendered).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the URL is only known in the browser
    if (new URLSearchParams(window.location.search).get('mode') === 'write') setMode('write')
  }, [])

  // Switching mode swaps in that mode's saved draft (or its starting code).
  useEffect(() => {
    const draft = readDraft(itemKey, mode)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- drafts live in localStorage, read after mount and on mode change
    setCode(draft ?? start)
    setOutcome(null)
    setHintsShown(0)
    setRevealed(false)
  }, [itemKey, mode, start])

  useEffect(() => {
    const t = setTimeout(() => writeDraft(itemKey, mode, code === start ? null : code), 400)
    return () => clearTimeout(t)
  }, [code, start, itemKey, mode])

  const run = useCallback(async () => {
    if (running) return
    setRunning(true)
    try {
      const { checkStep } = await import('@/lib/learn/run')
      const result = await checkStep({ ...input, code })
      setOutcome(result)
      const real = result.results.filter((r) => r.name !== OUTPUT_CHECK)
      const passed = !result.error && real.length > 0 && real.every((r) => r.pass)
      if (passed) {
        const gain = recordMistake(itemKey, mode, hintsShown, revealed)
        toast(gain ? `${mode === 'fix' ? 'Fixed' : 'Written'}! +${gain} XP` : 'All checks pass!', 'good')
      }
      setTab(props.hasOutput && (passed || result.logs.length) && !result.error ? 'output' : 'checks')
    } finally {
      setRunning(false)
    }
  }, [running, input, code, itemKey, mode, hintsShown, revealed, toast, props.hasOutput])

  // Ctrl/Cmd+Enter in the editor runs the code.
  useEffect(() => {
    const el = editorWrap.current
    if (!el) return
    const onRun = () => void run()
    el.addEventListener(RUN_EVENT, onRun)
    return () => el.removeEventListener(RUN_EVENT, onRun)
  }, [run])

  const real = outcome?.results.filter((r) => r.name !== OUTPUT_CHECK) ?? []
  const passedNow = Boolean(outcome && !outcome.error && real.length > 0 && real.every((r) => r.pass))
  const preview = input.kind === 'html' ? code : input.kind === 'css' ? `<!doctype html><html><head><style>body{font-family:system-ui,sans-serif;margin:0}${code}</style></head><body>${input.setup ?? ''}</body></html>` : ''
  const tabs: Tab[] = [...(props.hasOutput ? ['output' as const] : []), 'checks', ...(visual ? ['preview' as const] : [])]

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <section className="min-w-0 space-y-4">
        <div className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <TechTile id={set.id} color={set.color} size={36} fallback={set.badge} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium" style={{ color: set.color }}>{set.title}</p>
              <h1 className="flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight">
                {props.title} <DifficultyBadge difficulty={props.difficulty.toLowerCase() as "easy" | "medium" | "hard"} />
                {done && <CircleCheck size={18} className="shrink-0 text-good" aria-label="Completed" />}
              </h1>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1 text-sm font-medium" role="tablist" aria-label="Practice mode">
            {([['fix', 'Fix it', Wrench], ['write', 'Write it', PencilLine]] as const).map(([m, label, Icon]) => (
              <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={cx('flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 transition', mode === m ? 'bg-surface shadow-sm' : 'text-muted hover:text-text')}>
                <Icon size={14} /> {label} {p.mistakes[`${itemKey}:${m}`] && <CircleCheck size={13} className="text-good" />}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">
            {mode === 'fix' ? 'The code on the right has a mistake. Find it, correct it and press Run.' : 'The editor is empty. Type the whole program from memory, then press Run: same checks, no starter code.'}
          </p>
        </div>

        <div className="rounded-2xl border-2 p-4" style={{ borderColor: `color-mix(in srgb, ${set.color} 45%, var(--line))`, background: `color-mix(in srgb, ${set.color} 6%, var(--surface))` }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: set.color }}>{mode === 'fix' ? 'What it should do' : 'Write this program'}</p>
          <p className="mt-1 leading-relaxed">{props.task}</p>
          <ul className="mt-3 space-y-1 text-sm text-muted">
            {props.checks.map((c) => <li key={c} className="flex gap-2"><ListChecks size={15} className="mt-0.5 shrink-0" /> {c}</li>)}
          </ul>
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
            {!revealed && (
              <button type="button" className={buttonClass('ghost', 'sm')} onClick={() => { if (done || window.confirm('Show the answer? Try a hint first: you learn more by getting there yourself. (It earns less XP.)')) setRevealed(true) }}>
                <Eye size={14} /> {mode === 'fix' ? 'Show the answer' : 'Show reference code'}
              </button>
            )}
          </div>
          {(revealed || passedNow) && (
            <div className="space-y-3">
              <div className="rounded-xl border border-line bg-surface p-4 text-sm">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">What was wrong</p>
                {props.explain}
              </div>
              <div className="overflow-hidden rounded-2xl border border-line">
                <div className="flex items-center justify-between bg-surface-2 px-3 py-1.5 text-xs">
                  <span className="font-medium">Correct code</span>
                  <button type="button" className="text-accent hover:underline" onClick={() => setCode(props.solution)}>Put it in the editor</button>
                </div>
                <div className="note-codecard note-pre text-[13px]" dangerouslySetInnerHTML={{ __html: props.solutionHtml }} />
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-20 lg:self-start">
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="flex items-center gap-2 border-b border-line px-3 py-2">
            <span className="text-xs font-medium text-muted">{mode === 'fix' ? 'Broken code: fix it' : 'Your code: write it all'}</span>
            <button type="button" className={cx(buttonClass('ghost', 'sm'), 'ml-auto')} onClick={() => { if (code === start || window.confirm('Reset the editor? Your changes will be lost.')) { setCode(start); setOutcome(null) } }} title="Back to the starting code">
              <RotateCcw size={14} /> Reset
            </button>
            <button type="button" className={buttonClass('primary', 'sm')} onClick={() => void run()} disabled={running}>
              {running ? <LoaderCircle size={14} className="animate-spin" /> : <Play size={14} />} Run <span className="hidden sm:inline"><Kbd>Ctrl ↵</Kbd></span>
            </button>
          </div>
          <div ref={editorWrap} className="h-[22rem] lg:h-[calc(100dvh-26rem)] lg:min-h-[18rem]">
            <CodeEditor value={code} onChange={setCode} language={set.lang} fontSize={14} />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="flex items-center gap-1 border-b border-line px-2 py-1.5" role="tablist">
            {tabs.map((t) => (
              <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cx('rounded-lg px-3 py-1 text-xs font-medium capitalize', tab === t ? 'bg-surface-2 text-text' : 'text-muted hover:text-text')}>
                {t === 'output' ? <span className="inline-flex items-center gap-1"><Terminal size={12} /> Output</span> : t}
              </button>
            ))}
            {outcome && !outcome.error && real.length > 0 && (
              <span className={cx('ml-auto pr-2 text-xs font-medium', passedNow ? 'text-good' : 'text-muted')}>{real.filter((r) => r.pass).length}/{real.length} checks pass</span>
            )}
          </div>
          <div className="max-h-80 min-h-32 overflow-auto p-3 text-sm">
            {tab === 'preview' && visual && <iframe title="Preview" sandbox="" srcDoc={preview} className="h-64 w-full rounded-lg border border-line bg-white" />}
            {tab === 'output' && (
              !outcome ? <p className="text-muted">Press <b>Run</b> to see what your program prints{input.kind === 'js' ? ' (for a server: the response to each request)' : ''}.</p>
              : outcome.error ? <p className="text-bad">The code did not run. See the Checks tab for the error.</p>
              : <pre className="whitespace-pre-wrap rounded-lg bg-[#0d1117] p-3 font-mono text-[12.5px] leading-relaxed text-[#e6edf3]">{outcome.logs.length ? outcome.logs.join('\n') : '(no output)'}</pre>
            )}
            {tab === 'checks' && (
              !outcome ? (
                <p className="text-muted">Press <b>Run</b> to check your code.</p>
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
                      <p className="flex-1 font-medium text-good">{mode === 'fix' ? 'Fixed! Every check passes.' : 'Written! Every check passes.'}</p>
                      {mode === 'fix' && !p.mistakes[`${itemKey}:write`] && (
                        <button type="button" className={buttonClass('secondary', 'sm')} onClick={() => setMode('write')}><PencilLine size={14} /> Now write it</button>
                      )}
                      <Link href={props.nextHref} className={buttonClass('primary', 'sm')}>{props.nextLabel} <ArrowRight size={14} /></Link>
                    </div>
                  )}
                  <ul className="space-y-1.5">
                    {real.map((r, i) => (
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
      </section>
    </div>
  )
}
