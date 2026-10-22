'use client'

import { ChevronLeft, Copy, FileJson, Network, Plus, Trash2, Upload } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { TechTile } from '@/components/tech-icon'
import { useToast } from '@/components/toast'
import { buttonClass, cx } from '@/components/ui'
import { createUserMap, deleteUserMap, duplicateUserMap, useUserMaps } from '@/lib/user-maps'
import { BRANCH_COLORS, countNodes, node, parseTree, type UserMap } from '@/lib/user-mindmap'
import { MindMapEditor, UNTITLED } from './mind-map-editor'

/** A technology's notes sections, offered as a starting point. */
export interface MapTemplate {
  id: string
  title: string
  color: string
  badge: string
  branches: { text: string; points: string[] }[]
}

const fromTemplate = (t: MapTemplate) => createUserMap(`${t.title} mind map`, node(t.title, t.branches.map((b) => node(b.text, b.points.map((p) => node(p))))))

function when(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  if (mins < 60 * 24) return `${Math.round(mins / 60)} h ago`
  return new Date(iso).toLocaleDateString()
}

export function MapStudio({ templates }: { templates: MapTemplate[] }) {
  const maps = useUserMaps()
  const toast = useToast()
  const [openId, setOpenId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // The open map lives in the URL hash (#<id>), so Back returns to the list.
  // "#from=<technology>" starts a new map from that technology (linked from /map).
  useEffect(() => {
    const sync = () => {
      const h = decodeURIComponent(window.location.hash.slice(1))
      if (h.startsWith('from=')) {
        const t = templates.find((x) => x.id === h.slice(5))
        if (t) {
          const m = fromTemplate(t)
          history.replaceState(null, '', `#${m.id}`)
          setOpenId(m.id)
          return
        }
      }
      setOpenId(h && !h.startsWith('from=') ? h : null)
    }
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [templates])

  const open = (id: string) => {
    window.location.hash = id
  }
  const close = useCallback(() => {
    history.pushState(null, '', window.location.pathname)
    setOpenId(null)
  }, [])

  const importFile = async (file: File) => {
    try {
      const data = JSON.parse(await file.text())
      const root = parseTree(data?.root ?? data)
      const title = typeof data?.title === 'string' && data.title.trim() ? data.title.trim().slice(0, 80) : file.name.replace(/(\.mindmap)?\.json$/i, '')
      open(createUserMap(title, root).id)
      toast(`Imported "${title}"`, 'good')
    } catch (e) {
      toast(`Could not import: ${e instanceof Error ? e.message : 'not a mind map file'}`, 'bad')
    }
  }

  const current = openId ? maps?.find((m) => m.id === openId) : undefined
  if (current) return <MindMapEditor key={current.id} map={current} onBack={close} />

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 pb-24 pt-6 md:px-8 md:pb-10">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/map" className="inline-flex items-center gap-1 text-muted hover:text-text"><ChevronLeft size={16} /> Mind map</Link>
        <span className="text-muted">/</span>
        <span className="font-medium">Create</span>
      </div>

      <header className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 size-80 rounded-full bg-cyan-400/10 blur-3xl" aria-hidden />
        <div className="relative">
          <p className="flex items-center gap-1.5 text-sm font-medium text-accent"><Network size={15} /> Your mind maps</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Create a mind map</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Put a topic in the middle and branch out. <b>Tab</b> adds a child idea, <b>Enter</b> the next one, and typing renames the selected idea.
            Drag an idea onto another to move it, colour branches, fold them, and export as an image, a Markdown outline or a JSON backup. Maps are saved in this browser.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className={buttonClass('primary')} onClick={() => open(createUserMap(UNTITLED, node('Central topic')).id)}><Plus size={16} /> New blank map</button>
            <button type="button" className={buttonClass('secondary')} onClick={() => fileRef.current?.click()}><Upload size={15} /> Import JSON</button>
            <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void importFile(f) }} />
          </div>
        </div>
      </header>

      <section aria-labelledby="mine">
        <h2 id="mine" className="mb-3 font-semibold">Your maps{maps?.length ? ` (${maps.length})` : ''}</h2>
        {maps === null ? (
          <div className="h-28 animate-pulse rounded-2xl bg-surface-2" />
        ) : maps.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line-strong p-8 text-center text-sm text-muted">No maps yet. Start a blank one, or pick a technology below to begin with its main topics.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {maps.map((m) => <MapCard key={m.id} m={m} onOpen={() => open(m.id)} />)}
          </ul>
        )}
      </section>

      <section aria-labelledby="templates">
        <h2 id="templates" className="font-semibold">Start from a technology</h2>
        <p className="mb-3 mt-1 text-sm text-muted">Begins with that technology&apos;s main sections and a few key ideas each, ready for you to rewrite in your own words.</p>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {templates.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => open(fromTemplate(t).id)}
                className="lang-card group flex h-full w-full flex-col items-center gap-2 rounded-2xl border border-line bg-surface px-2 py-3.5 text-center transition hover:-translate-y-0.5"
                style={{ '--lang': t.color } as React.CSSProperties}
                title={`New map with ${t.branches.length} ${t.title} branches`}
              >
                <TechTile id={t.id} color={t.color} size={40} fallback={t.badge} className="relative transition group-hover:scale-105" />
                <span className="relative text-xs font-medium leading-tight">{t.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function MapCard({ m, onOpen }: { m: UserMap; onOpen: () => void }) {
  const toast = useToast()
  const branches = m.root.children.slice(0, 5)
  return (
    <li className="group relative flex h-full flex-col rounded-2xl border border-line bg-surface p-4 transition hover:border-line-strong">
      <button type="button" onClick={onOpen} className="text-left after:absolute after:inset-0 after:content-['']" aria-label={`Open ${m.title}`}>
        <span className="block truncate font-semibold group-hover:text-accent">{m.title}</span>
        <span className="mt-0.5 block text-xs text-muted">{countNodes(m.root)} ideas · edited {when(m.updated)}</span>
      </button>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-white">{m.root.text.split('\n')[0].slice(0, 30)}</span>
        {branches.map((b, i) => (
          <span key={b.id} className="max-w-36 truncate rounded-full border px-2 py-0.5 text-[11px]" style={{ borderColor: b.color ?? BRANCH_COLORS[i % BRANCH_COLORS.length], color: b.color ?? BRANCH_COLORS[i % BRANCH_COLORS.length] }}>{b.text.split('\n')[0]}</span>
        ))}
        {m.root.children.length > branches.length && <span className="text-[11px] text-muted">+{m.root.children.length - branches.length}</span>}
      </div>
      <div className="relative z-10 mt-auto flex justify-end gap-1 pt-3">
        <button type="button" className={cx(buttonClass('ghost', 'sm'), 'px-2')} title="Download a JSON backup" aria-label="Download JSON" onClick={() => {
          const url = URL.createObjectURL(new Blob([JSON.stringify({ title: m.title, root: m.root }, null, 2)], { type: 'application/json' }))
          const a = document.createElement('a')
          a.href = url
          a.download = `${m.title.replace(/[^\w-]+/g, '-').toLowerCase() || 'mind-map'}.mindmap.json`
          a.click()
          window.setTimeout(() => URL.revokeObjectURL(url), 1000)
        }}><FileJson size={15} /></button>
        <button type="button" className={cx(buttonClass('ghost', 'sm'), 'px-2')} title="Duplicate" aria-label="Duplicate" onClick={() => { duplicateUserMap(m.id); toast('Map duplicated', 'good') }}><Copy size={15} /></button>
        <button type="button" className={cx(buttonClass('ghost', 'sm'), 'px-2 hover:text-bad')} title="Delete" aria-label="Delete" onClick={() => { if (window.confirm(`Delete "${m.title}"? This can't be undone.`)) deleteUserMap(m.id) }}><Trash2 size={15} /></button>
      </div>
    </li>
  )
}
