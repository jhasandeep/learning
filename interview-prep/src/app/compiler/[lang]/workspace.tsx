'use client'

import {
  CircleCheck, CircleX, Clock, Database, Download, Keyboard, Link2, Loader, Minus, Play, Plus, RefreshCw, RotateCcw, Server, Square, Trash2, Zap,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { RUN_EVENT } from '@/components/editor-events'
import { LangBadge } from '@/components/lang-badge'
import { useToast } from '@/components/toast'
import { Button, cx, Kbd } from '@/components/ui'
import { LANGUAGES, LANGUAGES_BY_ID } from '@/data/languages'
import type { RunSummary, SqlItem, SqlSchemaTable, Stream } from '@/lib/run/protocol'
import { decodeShare, encodeShare } from '@/lib/share'

const CodeEditor = dynamic(() => import('@/components/code-editor'), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-muted">Loading editor…</div>,
})

const codeKey = (id: string) => `prep-arena:compiler:${id}:code`
const stdinKey = (id: string) => `prep-arena:compiler:${id}:stdin`
const PREFS_KEY = 'prep-arena:compiler:prefs'

interface Chunk { stream: Stream; text: string }
type Status = 'idle' | 'loading' | 'running' | 'done'

function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeLocal(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {}
}

function initialCode(id: string, template: string): string {
  if (typeof window === 'undefined') return template
  return readLocal(codeKey(id)) ?? template
}

/** Console bridge injected into the HTML preview so its logs show up below it. */
const PREVIEW_BRIDGE = `<script>(function(){function f(v){try{return typeof v==="string"?v:JSON.stringify(v)}catch(e){return String(v)}}
function s(l,a){parent.postMessage({__preview:1,level:l,text:Array.prototype.map.call(a,f).join(" ")},"*")}
["log","info","warn","error"].forEach(function(l){var o=console[l];console[l]=function(){s(l,arguments);o.apply(console,arguments)}});
addEventListener("error",function(e){s("error",[e.message+(e.lineno?" (line "+e.lineno+")":"")])})})()</script>`

function withBridge(html: string): string {
  return /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => `${m}${PREVIEW_BRIDGE}`) : `${PREVIEW_BRIDGE}${html}`
}

export function Workspace({ langId }: { langId: string }) {
  const lang = LANGUAGES_BY_ID[langId]
  const isWeb = lang.runtime === 'web'
  const isSql = lang.runtime === 'sql'
  const toast = useToast()

  const [code, setCode] = useState(() => initialCode(lang.id, lang.template))
  const [stdin, setStdin] = useState('')
  const [chunks, setChunks] = useState<Chunk[]>([])
  const [images, setImages] = useState<string[]>([])
  const [sql, setSql] = useState<{ items: SqlItem[]; schema: SqlSchemaTable[] } | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [loadingText, setLoadingText] = useState('')
  const [summary, setSummary] = useState<RunSummary | null>(null)
  const [pane, setPane] = useState<'code' | 'output'>('code')
  const [fontSize, setFontSize] = useState(14)
  const [split, setSplit] = useState(55)
  const [server, setServer] = useState<{ configured: boolean; backend?: string; reason?: string } | null>(null)
  const [preview, setPreview] = useState<{ html: string; key: number } | null>(null)
  const [autoRun, setAutoRun] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // Latest code/stdin, updated on every keystroke: Ctrl+Enter can fire before
  // React commits the last edit, and must still run what is on screen.
  const codeRef = useRef(code)
  const stdinRef = useRef(stdin)
  const updateCode = useCallback((v: string) => { codeRef.current = v; setCode(v) }, [])
  const updateStdin = useCallback((v: string) => { stdinRef.current = v; setStdin(v) }, [])

  // Restore stdin, preferences and shared links after mount (browser-only state).
  useEffect(() => {
    const id = requestAnimationFrame(async () => {
      updateStdin(readLocal(stdinKey(lang.id)) ?? '')
      try {
        const prefs = JSON.parse(readLocal(PREFS_KEY) ?? '{}') as { fontSize?: number; split?: number }
        if (prefs.fontSize) setFontSize(prefs.fontSize)
        if (prefs.split) setSplit(prefs.split)
      } catch {}
      const token = new URLSearchParams(window.location.hash.slice(1)).get('s')
      if (token) {
        const shared = await decodeShare(token)
        if (shared) {
          updateCode(shared.code)
          updateStdin(shared.stdin)
          toast('Loaded shared code')
        } else {
          toast('That share link is broken', 'bad')
        }
        history.replaceState(null, '', window.location.pathname)
      }
    })
    return () => cancelAnimationFrame(id)
  }, [lang.id, toast, updateCode, updateStdin])

  useEffect(() => {
    if (lang.engine !== 'server') return
    let cancelled = false
    fetch('/api/run').then((r) => r.json()).then((d) => { if (!cancelled) setServer(d) }).catch(() => { if (!cancelled) setServer({ configured: false, reason: 'Could not reach the server.' }) })
    return () => { cancelled = true }
  }, [lang.engine])

  // Persist drafts (debounced) and preferences.
  useEffect(() => {
    const t = setTimeout(() => {
      writeLocal(codeKey(lang.id), code === lang.template ? null : code)
      writeLocal(stdinKey(lang.id), stdin || null)
    }, 400)
    return () => clearTimeout(t)
  }, [code, stdin, lang.id, lang.template])

  useEffect(() => {
    writeLocal(PREFS_KEY, JSON.stringify({ fontSize, split }))
  }, [fontSize, split])

  const append = useCallback((stream: Stream, text: string) => {
    setChunks((prev) => {
      const last = prev[prev.length - 1]
      if (last && last.stream === stream) return [...prev.slice(0, -1), { stream, text: last.text + text }]
      return [...prev, { stream, text }]
    })
  }, [])

  const run = useCallback(async () => {
    const code = codeRef.current
    const stdin = stdinRef.current
    setPane('output')
    if (isWeb) {
      setChunks([])
      setPreview((p) => ({ html: withBridge(code), key: (p?.key ?? 0) + 1 }))
      setSummary(null)
      setStatus('done')
      return
    }
    if (status === 'running' || status === 'loading') return
    const { runCode } = await import('@/lib/run')
    setChunks([])
    setImages([])
    setSummary(null)
    setStatus('running')
    const result = await runCode(lang, code, stdin, {
      onLoading: (text) => { setStatus('loading'); setLoadingText(text) },
      onOutput: (stream, text) => { setStatus('running'); append(stream, text) },
      onSql: (items, schema) => setSql({ items, schema }),
      onImage: (url) => setImages((imgs) => [...imgs, url]),
    })
    setSummary(result)
    setStatus('done')
  }, [isWeb, status, lang, append])

  const stop = useCallback(async () => {
    const { stopAll } = await import('@/lib/run')
    stopAll()
  }, [])

  const resetDb = async () => {
    if (status === 'running' || status === 'loading') return
    const { resetSqlDatabase } = await import('@/lib/run')
    setChunks([])
    setStatus('running')
    const result = await resetSqlDatabase({ onOutput: append, onSql: (items, schema) => setSql({ items, schema }) })
    setSummary(result)
    setStatus('done')
    toast('Database reset to the sample tables')
  }

  // Live preview for HTML: re-render shortly after typing stops.
  useEffect(() => {
    if (!isWeb || !autoRun) return
    const t = setTimeout(() => setPreview((p) => ({ html: withBridge(code), key: (p?.key ?? 0) + 1 })), 700)
    return () => clearTimeout(t)
  }, [isWeb, autoRun, code])

  useEffect(() => {
    if (!isWeb) return
    const onMessage = (e: MessageEvent<{ __preview?: number; level: string; text: string }>) => {
      if (e.source !== iframeRef.current?.contentWindow || !e.data?.__preview) return
      append(e.data.level === 'error' || e.data.level === 'warn' ? 'stderr' : 'stdout', `${e.data.text}\n`)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [isWeb, append])

  useEffect(() => {
    const onRunEvent = () => run()
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !e.defaultPrevented) { e.preventDefault(); run() }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); toast('Saved in this browser') }
    }
    window.addEventListener(RUN_EVENT, onRunEvent)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener(RUN_EVENT, onRunEvent)
      window.removeEventListener('keydown', onKey)
    }
  }, [run, toast])

  const share = async () => {
    const url = `${window.location.origin}/compiler/${lang.id}#s=${await encodeShare({ code, stdin })}`
    try {
      await navigator.clipboard.writeText(url)
      toast('Share link copied to clipboard', 'good')
    } catch {
      window.prompt('Copy this link', url)
    }
  }

  const download = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([code], { type: 'text/plain' }))
    a.download = lang.file
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const reset = () => {
    updateCode(lang.template)
    toast('Reset to the starter code')
  }

  // Drag the divider to resize editor vs output (desktop).
  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault()
    const box = containerRef.current?.getBoundingClientRect()
    if (!box) return
    const move = (ev: PointerEvent) => setSplit(Math.min(80, Math.max(25, ((ev.clientX - box.left) / box.width) * 100)))
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const busy = status === 'running' || status === 'loading'

  return (
    <div className="flex h-[calc(100dvh-3.5rem-4.25rem)] flex-col md:h-[calc(100dvh-3.5rem)] md:flex-row">
      {/* language rail */}
      <nav aria-label="Languages" className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-line bg-surface px-3 py-2 md:w-[60px] md:flex-col md:overflow-y-auto md:border-b-0 md:border-r md:px-2 md:py-3">
        {LANGUAGES.map((l) => (
          <Link key={l.id} href={`/compiler/${l.id}`} title={`${l.name} compiler`} aria-label={`${l.name} compiler`} aria-current={l.id === lang.id ? 'page' : undefined} className="rounded-lg p-0.5 transition hover:scale-105">
            <LangBadge lang={l} size={38} active={l.id === lang.id} />
          </Link>
        ))}
      </nav>

      {/* mobile pane switch */}
      <div className="flex gap-1 border-b border-line bg-surface p-2 md:hidden" role="tablist" aria-label="Panes">
        {(['code', 'output'] as const).map((p) => (
          <button key={p} type="button" role="tab" aria-selected={pane === p} onClick={() => setPane(p)} className={cx('flex-1 rounded-lg py-1.5 text-sm font-medium', pane === p ? 'bg-surface-2 text-text' : 'text-muted')}>
            {p === 'code' ? lang.file : isWeb ? 'Preview' : 'Output'}
          </button>
        ))}
      </div>

      <div ref={containerRef} className="flex min-h-0 min-w-0 flex-1">
        {/* editor */}
        <section aria-label="Editor" className={cx('min-h-0 min-w-0 flex-col border-line md:flex md:border-r', pane === 'code' ? 'flex flex-1' : 'hidden')} style={{ flexBasis: `${split}%` }}>
          <div className="flex items-center gap-2 border-b border-line bg-surface px-3 py-2">
            <h1 className="flex min-w-0 items-center gap-2 text-sm font-semibold">
              <span className="hidden md:inline"><LangBadge lang={lang} size={22} active /></span>
              <span className="truncate">{lang.name} Online Compiler</span>
            </h1>
            <span className={cx('hidden items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] lg:inline-flex', lang.engine === 'browser' ? 'border-good/40 text-good' : 'border-violet/40 text-violet')} title={lang.engine === 'browser' ? 'Runs entirely in your browser — nothing is sent to a server' : 'Compiled and run on the server'}>
              {lang.engine === 'browser' ? <Zap size={11} /> : <Server size={11} />}
              {lang.engine === 'browser' ? 'in browser' : server?.backend ? `server · ${server.backend}` : 'server'}
            </span>
            <div className="ml-auto flex items-center gap-0.5">
              <IconButton label="Smaller text" onClick={() => setFontSize((f) => Math.max(11, f - 1))}><Minus size={15} /></IconButton>
              <IconButton label="Larger text" onClick={() => setFontSize((f) => Math.min(22, f + 1))}><Plus size={15} /></IconButton>
              <IconButton label="Reset to starter code" onClick={reset}><RotateCcw size={15} /></IconButton>
              <IconButton label="Download file" onClick={download}><Download size={15} /></IconButton>
              <IconButton label="Copy share link" onClick={share}><Link2 size={15} /></IconButton>
              {busy ? (
                <Button key="stop" size="sm" variant="danger" onClick={stop} className="ml-1"><Square size={13} /> Stop</Button>
              ) : (
                <Button key="run" size="sm" variant="primary" onClick={run} className="ml-1" title="Run (Ctrl+Enter)">
                  <Play size={14} /> Run <span className="hidden gap-0.5 opacity-75 xl:flex"><Kbd>Ctrl</Kbd><Kbd>↵</Kbd></span>
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center border-b border-line bg-surface-2/50 px-3">
            <span className="border-b-2 border-accent px-2 py-1.5 font-mono text-xs">{lang.file}</span>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden bg-code">
            <CodeEditor value={code} onChange={updateCode} language={lang.id} fontSize={fontSize} />
          </div>
        </section>

        <div role="separator" aria-orientation="vertical" aria-label="Resize panels" onPointerDown={startDrag} className="group hidden w-1.5 shrink-0 cursor-col-resize items-center justify-center bg-surface-2/40 hover:bg-accent/20 md:flex">
          <span className="h-10 w-0.5 rounded bg-line-strong group-hover:bg-accent" />
        </div>

        {/* output */}
        <section aria-label="Output" className={cx('min-h-0 min-w-0 flex-col bg-surface md:flex', pane === 'output' ? 'flex flex-1' : 'hidden')} style={{ flexBasis: `${100 - split}%` }}>
          <div className="flex items-center gap-2 border-b border-line px-3 py-2">
            <h2 className="text-sm font-semibold">{isWeb ? 'Preview' : 'Output'}</h2>
            <StatusLine status={status} loadingText={loadingText} summary={summary} />
            <div className="ml-auto flex items-center gap-1">
              {isWeb && (
                <label className="flex items-center gap-1.5 text-xs text-muted">
                  <input type="checkbox" checked={autoRun} onChange={(e) => setAutoRun(e.target.checked)} className="accent-[var(--accent)]" /> Live
                </label>
              )}
              {isSql && <Button size="sm" variant="ghost" onClick={resetDb} title="Restore the sample tables"><RefreshCw size={14} /> Reset DB</Button>}
              <IconButton label="Clear output" onClick={() => { setChunks([]); setImages([]); setSummary(null); setStatus('idle'); if (isSql) setSql((s) => (s ? { ...s, items: [] } : s)) }}><Trash2 size={15} /></IconButton>
            </div>
          </div>

          {lang.engine === 'server' && server && !server.configured && (
            <div className="m-3 rounded-xl border border-warn/40 bg-warn/10 p-3 text-sm">
              <b className="text-warn">Server runner not configured.</b> <span className="text-muted">{server.reason} See the README section “Running compiled languages”.</span>
            </div>
          )}

          {isWeb ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 bg-white">
                {preview ? (
                  <iframe key={preview.key} ref={iframeRef} title="HTML preview" srcDoc={preview.html} sandbox="allow-scripts allow-modals allow-forms allow-popups" className="h-full w-full border-0" />
                ) : (
                  <div className="grid h-full place-items-center text-sm text-slate-500">Preview appears here</div>
                )}
              </div>
              <div className="h-36 shrink-0 overflow-y-auto border-t border-line p-3">
                <p className="mb-1 text-xs font-medium text-muted">Console</p>
                <Terminal chunks={chunks} empty="console.log() output from the page shows here." />
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-auto p-3">
                {isSql ? (
                  <SqlOutput sql={sql} chunks={chunks} />
                ) : (
                  <>
                    <Terminal chunks={chunks} empty={status === 'idle' ? `Press Run to execute ${lang.file}.` : ''} />
                    {images.map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={src} alt={`Plot ${i + 1}`} className="mt-3 max-w-full rounded-lg border border-line bg-white" />
                    ))}
                  </>
                )}
              </div>
              {lang.stdin && (
                <div className="shrink-0 border-t border-line p-3">
                  <label htmlFor="stdin" className="mb-1 flex items-center justify-between text-xs font-medium text-muted">
                    <span>Input (stdin) — one value per line</span>
                    <span className="hidden items-center gap-1 sm:flex"><Keyboard size={12} /> read by input(), Scanner, cin, gets…</span>
                  </label>
                  <textarea
                    id="stdin" value={stdin} onChange={(e) => updateStdin(e.target.value)} rows={3} spellCheck={false}
                    placeholder="e.g. Sandeep"
                    className="w-full resize-y rounded-lg border border-line bg-code px-3 py-2 font-mono text-sm outline-none focus:border-accent"
                  />
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={label} aria-label={label} className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-text">
      {children}
    </button>
  )
}

function StatusLine({ status, loadingText, summary }: { status: Status; loadingText: string; summary: RunSummary | null }) {
  if (status === 'loading') return <span className="flex items-center gap-1.5 text-xs text-muted"><Loader size={13} className="animate-spin" /> {loadingText}</span>
  if (status === 'running') return <span className="flex items-center gap-1.5 text-xs text-accent"><Loader size={13} className="animate-spin" /> Running…</span>
  if (status !== 'done' || !summary) return null
  if (summary.signal === 'TIMEOUT') return <span className="flex items-center gap-1 text-xs text-bad"><Clock size={13} /> Time limit exceeded</span>
  if (summary.signal === 'STOPPED') return <span className="flex items-center gap-1 text-xs text-muted"><Square size={12} /> Stopped</span>
  if (summary.exitCode === null) return null
  const ok = summary.exitCode === 0
  return (
    <span className={cx('flex items-center gap-1 text-xs', ok ? 'text-good' : 'text-bad')}>
      {ok ? <CircleCheck size={13} /> : <CircleX size={13} />} exit code {summary.exitCode} · {summary.ms} ms
    </span>
  )
}

function Terminal({ chunks, empty }: { chunks: Chunk[]; empty: string }) {
  if (chunks.length === 0) return <p className="font-mono text-sm text-muted">{empty}</p>
  return (
    <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed" aria-live="polite">
      {chunks.map((c, i) => (
        <span key={i} className={cx(c.stream === 'stderr' && 'text-bad', c.stream === 'stdin' && 'text-accent', c.stream === 'system' && 'text-warn')}>{c.text}</span>
      ))}
    </pre>
  )
}

function SqlOutput({ sql, chunks }: { sql: { items: SqlItem[]; schema: SqlSchemaTable[] } | null; chunks: Chunk[] }) {
  return (
    <div className="space-y-4">
      {chunks.length > 0 && <Terminal chunks={chunks} empty="" />}
      {!sql || sql.items.length === 0 ? (
        chunks.length === 0 && <p className="font-mono text-sm text-muted">Press Run to execute your query.</p>
      ) : (
        sql.items.map((item, i) =>
          item.kind === 'message' ? (
            <p key={i} className="rounded-lg bg-surface-2 px-3 py-2 font-mono text-xs"><span className="text-good">✓</span> {item.text}</p>
          ) : (
            <div key={i} className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-surface-2">
                  <tr>{item.table.columns.map((c) => <th key={c} className="px-3 py-2 font-semibold">{c}</th>)}</tr>
                </thead>
                <tbody>
                  {item.table.rows.map((row, r) => (
                    <tr key={r} className="border-t border-line">
                      {row.map((v, c) => <td key={c} className={cx('px-3 py-1.5', v === null && 'italic text-muted')}>{v === null ? 'NULL' : String(v)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="border-t border-line bg-surface-2/50 px-3 py-1 text-[11px] text-muted">{item.table.rows.length} row{item.table.rows.length === 1 ? '' : 's'}</p>
            </div>
          ),
        )
      )}
      {sql && (
        <details className="rounded-xl border border-line" open>
          <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-medium text-muted"><Database size={13} /> Tables in the database</summary>
          <ul className="grid gap-2 p-3 pt-0 sm:grid-cols-2">
            {sql.schema.map((t) => (
              <li key={t.name} className="rounded-lg bg-surface-2/60 px-3 py-2 font-mono text-xs">
                <b>{t.name}</b> <span className="text-muted">({t.rows} rows)</span>
                <div className="mt-1 text-muted">{t.columns.map((c) => `${c.name} ${c.type.toLowerCase()}`).join(', ')}</div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
