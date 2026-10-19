'use client'

import { ArrowUpRight, ChevronLeft, ChevronRight, Eye, EyeOff, Maximize, Minimize, Minus, Plus, Scan, Search, X } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { Inline } from '@/components/notes/inline'
import { TechTile } from '@/components/tech-icon'
import { cx } from '@/components/ui'
import { useProgress } from '@/lib/progress'
import { plainText } from '@/lib/markup'
import { walk, type MapNode } from '@/lib/mindmap'
import { edgePath, layoutMap, type Placed } from '@/lib/mindmap-layout'

type View = { x: number; y: number; k: number }
type Preset = 'overview' | 'sections' | 'all'

const MIN_K = 0.08
const MAX_K = 2.5
const ANIM_MS = 360
const READABLE_K = 0.6 // smallest zoom where card text is comfortably readable
const clampK = (k: number) => Math.min(MAX_K, Math.max(MIN_K, k))

/** Ids to expand for a preset: everything above the given depth (or all). */
function presetIds(root: MapNode, preset: Preset): Set<string> {
  const limit = preset === 'all' ? Infinity : root.kind === 'root' ? (preset === 'overview' ? 2 : 3) : preset === 'overview' ? 1 : 2
  const ids = new Set<string>()
  walk(root, (n, d) => {
    if (n.children?.length && d < limit) ids.add(n.id)
  })
  return ids
}

const searchText = (n: MapNode) => plainText([n.label, n.detail ?? '', ...(n.steps ?? [])].join(' ')).toLowerCase()

export function MindMap({ root, initial }: { root: MapNode; initial: Preset }) {
  const p = useProgress()
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const nodeEls = useRef(new Map<string, HTMLDivElement>())
  const [expanded, setExpanded] = useState(() => presetIds(root, initial))
  const [heights, setHeights] = useState(() => new Map<string, number>())
  const [view, setView] = useState<View>({ x: 40, y: 40, k: 0.8 })
  const [animate, setAnimate] = useState(false)
  const [recall, setRecall] = useState(false)
  const [revealed, setRevealed] = useState(() => new Set<string>())
  const [query, setQuery] = useState('')
  const [hit, setHit] = useState(0)
  const visited = useRef(false) // Enter goes to the current match first, then the next
  const [fullscreen, setFullscreen] = useState(false)
  const anchor = useRef<{ id: string; sx: number; sy: number } | null>(null)
  const focusId = useRef<string | null>(null)
  const fitPending = useRef(true)
  const drag = useRef<{ pointers: Map<number, { x: number; y: number }>; moved: boolean; pinch?: { d: number; k: number } }>({ pointers: new Map(), moved: false })

  const layout = useMemo(() => layoutMap(root, expanded, heights), [root, expanded, heights])

  const parents = useMemo(() => {
    const m = new Map<string, string>()
    walk(root, (n, _d, parent) => parent && m.set(n.id, parent.id))
    return m
  }, [root])
  const all = useMemo(() => {
    const list: MapNode[] = []
    walk(root, (n) => list.push(n))
    return list
  }, [root])

  const words = query.trim().toLowerCase()
  const matches = useMemo(() => (words.length < 2 ? [] : all.filter((n) => searchText(n).includes(words))), [all, words])
  const matchIds = useMemo(() => new Set(matches.map((m) => m.id)), [matches])

  const flash = () => {
    setAnimate(true)
    window.setTimeout(() => setAnimate(false), ANIM_MS)
  }

  // Measure rendered nodes; the layout re-runs with real heights before paint.
  useLayoutEffect(() => {
    let changed = false
    const next = new Map(heights)
    for (const n of layout.nodes) {
      const el = nodeEls.current.get(n.node.id)
      if (!el) continue
      const h = el.offsetHeight
      if (Math.abs((next.get(n.node.id) ?? -1) - h) > 1) {
        next.set(n.node.id, h)
        changed = true
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- measuring the DOM, then laying out again before paint
    if (changed) setHeights(next)
  }, [layout, heights])

  const size = () => {
    const el = canvasRef.current
    return { w: el?.clientWidth ?? 1200, h: el?.clientHeight ?? 800 }
  }

  const fit = useCallback((animated = true, readable = false) => {
    const { w, h } = size()
    const k = clampK(Math.min((w - 60) / layout.width, (h - 60) / layout.height, 1.1))
    if (animated) flash()
    // A map too big to read when fitted opens at a readable zoom instead, with
    // the root on the left, vertically centred (Fit still shows everything).
    if (readable && k < READABLE_K) {
      const r = layout.nodes[0]
      setView({ k: READABLE_K, x: Math.max(16, (w - layout.width * READABLE_K) / 2) - (layout.width * READABLE_K > w ? r.x * READABLE_K : 0), y: h / 2 - (r.y + r.h / 2) * READABLE_K })
      return
    }
    setView({ k, x: (w - layout.width * k) / 2, y: (h - layout.height * k) / 2 })
  }, [layout])

  // After a layout change: keep the clicked node still, centre a search hit, or fit on first load.
  useLayoutEffect(() => {
    if (anchor.current) {
      const n = layout.byId.get(anchor.current.id)
      const a = anchor.current
      anchor.current = null
      if (n) setView((v) => ({ ...v, x: a.sx - n.x * v.k, y: a.sy - n.y * v.k }))
    } else if (focusId.current) {
      const n = layout.byId.get(focusId.current)
      if (n) {
        focusId.current = null
        const { w, h } = size()
        setView((v) => {
          const k = Math.max(v.k, 0.9)
          return { k, x: w / 2 - (n.x + n.w / 2) * k, y: h / 2 - (n.y + n.h / 2) * k }
        })
      }
    } else if (fitPending.current && heights.size) {
      fitPending.current = false
      fit(false, true)
    }
  }, [layout, heights.size, fit])

  const toggle = (n: Placed) => {
    if (!n.hasChildren) return
    anchor.current = { id: n.node.id, sx: view.x + n.x * view.k, sy: view.y + n.y * view.k }
    flash()
    setExpanded((e) => {
      const next = new Set(e)
      if (next.has(n.node.id)) next.delete(n.node.id)
      else next.add(n.node.id)
      return next
    })
  }

  const applyPreset = (preset: Preset) => {
    fitPending.current = true
    flash()
    setExpanded(presetIds(root, preset))
  }

  const goTo = (i: number) => {
    if (!matches.length) return
    const idx = ((i % matches.length) + matches.length) % matches.length
    setHit(idx)
    const target = matches[idx]
    focusId.current = target.id
    flash()
    setExpanded((e) => {
      const next = new Set(e)
      for (let id = parents.get(target.id); id; id = parents.get(id)) next.add(id)
      return next
    })
  }

  const zoomAt = (sx: number, sy: number, factor: number, animated = false) => {
    if (animated) flash()
    setView((v) => {
      const k = clampK(v.k * factor)
      return { k, x: sx - ((sx - v.x) * k) / v.k, y: sy - ((sy - v.y) * k) / v.k }
    })
  }
  const zoomCenter = (factor: number) => {
    const { w, h } = size()
    zoomAt(w / 2, h / 2, factor, true)
  }

  // Wheel zooms around the cursor (React's onWheel is passive, so attach it directly).
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015))
      setView((v) => {
        const k = clampK(v.k * factor)
        const sx = e.clientX - r.left
        const sy = e.clientY - r.top
        return { k, x: sx - ((sx - v.x) * k) / v.k, y: sy - ((sy - v.y) * k) / v.k }
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // Keyboard: + / - zoom, 0 fit, / search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea')) return
      if (e.key === '+' || e.key === '=') zoomCenter(1.25)
      else if (e.key === '-') zoomCenter(0.8)
      else if (e.key === '0') fit()
      else if (e.key === '/') {
        e.preventDefault()
        document.getElementById('map-search')?.focus()
      } else return
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === wrapRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // Drag to pan, two fingers to pinch-zoom.
  const onPointerDown = (e: ReactPointerEvent) => {
    if ((e.target as HTMLElement).closest('a, input, button[data-keep]')) return
    const d = drag.current
    d.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (d.pointers.size === 1) d.moved = false
    if (d.pointers.size === 2) {
      const [a, b] = [...d.pointers.values()]
      d.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), k: view.k }
    }
  }
  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current
    const prev = d.pointers.get(e.pointerId)
    if (!prev) return
    const dx = e.clientX - prev.x
    const dy = e.clientY - prev.y
    d.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (!d.moved && Math.abs(dx) + Math.abs(dy) > 3) {
      d.moved = true
      // Capture only once it's a drag, so a plain click still reaches the node.
      canvasRef.current?.setPointerCapture(e.pointerId)
    }
    if (d.pointers.size === 2 && d.pinch) {
      const [a, b] = [...d.pointers.values()]
      const r = canvasRef.current!.getBoundingClientRect()
      const factor = (d.pinch.k * Math.hypot(a.x - b.x, a.y - b.y)) / d.pinch.d / view.k
      zoomAt((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, factor)
      d.moved = true
    } else if (d.pointers.size === 1) {
      setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }))
    }
  }
  const onPointerUp = (e: ReactPointerEvent) => {
    const d = drag.current
    d.pointers.delete(e.pointerId)
    if (d.pointers.size < 2) d.pinch = undefined
  }

  const onNodeClick = (n: Placed) => {
    if (drag.current.moved) return
    if (recall && !n.hasChildren) {
      setRevealed((r) => new Set(r).add(n.node.id))
      return
    }
    toggle(n)
  }

  const knownFor = (tech: string) => Object.entries(p.questions).filter(([k, s]) => s === 'known' && k.startsWith(`${tech}/`)).length
  const isRoot = root.kind === 'root'
  const btn = 'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-xs font-medium text-text transition hover:border-line-strong disabled:opacity-40'

  return (
    <div ref={wrapRef} className="flex h-[calc(100dvh-3.5rem-4.25rem)] flex-col bg-bg md:h-[calc(100dvh-3.5rem)]">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface px-3 py-2">
        <div className="flex h-8 min-w-48 flex-1 items-center gap-2 rounded-lg border border-line bg-bg px-2.5 focus-within:border-accent sm:max-w-sm">
          <Search size={14} className="shrink-0 text-muted" />
          <label htmlFor="map-search" className="sr-only">Search the map</label>
          <input
            id="map-search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setHit(0); visited.current = false }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              goTo(e.shiftKey ? hit - 1 : visited.current ? hit + 1 : hit)
              visited.current = true
            }}
            placeholder="Find a concept… (press /)"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          {words.length >= 2 && <span className="shrink-0 text-[11px] text-muted">{matches.length ? `${hit + 1}/${matches.length}` : '0'}</span>}
          {matches.length > 1 && (
            <>
              <button type="button" data-keep onClick={() => goTo(hit - 1)} aria-label="Previous match" className="text-muted hover:text-text"><ChevronLeft size={14} /></button>
              <button type="button" data-keep onClick={() => goTo(hit + 1)} aria-label="Next match" className="text-muted hover:text-text"><ChevronRight size={14} /></button>
            </>
          )}
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="text-muted hover:text-text"><X size={14} /></button>}
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="How much to show">
          <button type="button" className={btn} onClick={() => applyPreset('overview')}>{isRoot ? 'Technologies' : 'Sections'}</button>
          {isRoot && <button type="button" className={btn} onClick={() => applyPreset('sections')}>Sections</button>}
          <button type="button" className={btn} onClick={() => applyPreset('all')}>Everything</button>
        </div>
        <button type="button" className={cx(btn, recall && 'border-violet/50 bg-violet/10 text-violet')} aria-pressed={recall} onClick={() => { setRecall((r) => !r); setRevealed(new Set()) }} title="Hide the details and test your memory: click a card to reveal it">
          {recall ? <EyeOff size={14} /> : <Eye size={14} />} Recall
        </button>
        <div className="ml-auto flex items-center gap-1">
          <button type="button" className={btn} onClick={() => zoomCenter(0.8)} aria-label="Zoom out"><Minus size={14} /></button>
          <span className="w-12 text-center text-xs tabular-nums text-muted">{Math.round(view.k * 100)}%</span>
          <button type="button" className={btn} onClick={() => zoomCenter(1.25)} aria-label="Zoom in"><Plus size={14} /></button>
          <button type="button" className={btn} onClick={() => fit()} title="Fit everything on screen (0)"><Scan size={14} /> <span className="hidden sm:inline">Fit</span></button>
          <button type="button" className={btn} onClick={() => (fullscreen ? document.exitFullscreen() : wrapRef.current?.requestFullscreen())} aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}>{fullscreen ? <Minimize size={14} /> : <Maximize size={14} />}</button>
        </div>
      </div>

      {/* canvas */}
      <div
        ref={canvasRef}
        className="map-canvas relative min-h-0 flex-1 cursor-grab touch-none overflow-hidden select-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={(e) => {
          if ((e.target as HTMLElement).closest('[data-node]')) return
          const r = canvasRef.current!.getBoundingClientRect()
          zoomAt(e.clientX - r.left, e.clientY - r.top, 1.6, true)
        }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`, transition: animate ? `transform ${ANIM_MS}ms cubic-bezier(.2,.8,.2,1)` : undefined }}
        >
          <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={layout.width} height={layout.height} aria-hidden>
            {layout.edges.map((e) => (
              <path
                key={e.id}
                d={edgePath(e.from, e.to)}
                fill="none"
                stroke={e.to.node.color}
                strokeOpacity={e.from.depth === 0 ? 0.55 : 0.4}
                strokeWidth={Math.max(1.5, 4 - e.from.depth * 0.8)}
                style={{ transition: animate ? `d ${ANIM_MS}ms cubic-bezier(.2,.8,.2,1)` : undefined }}
              />
            ))}
          </svg>
          {layout.nodes.map((n) => (
            <div
              key={n.node.id}
              data-node
              ref={(el) => { if (el) nodeEls.current.set(n.node.id, el); else nodeEls.current.delete(n.node.id) }}
              className="map-node absolute left-0 top-0"
              style={{ width: n.w, transform: `translate(${n.x}px, ${n.y}px)`, transition: animate ? `transform ${ANIM_MS}ms cubic-bezier(.2,.8,.2,1)` : undefined }}
            >
              <NodeCard
                n={n}
                onClick={() => onNodeClick(n)}
                hidden={recall && !n.hasChildren && !revealed.has(n.node.id)}
                match={matchIds.has(n.node.id)}
                current={matches[hit]?.id === n.node.id}
                known={n.node.kind === 'tech' && n.node.tech ? knownFor(n.node.tech) : 0}
              />
            </div>
          ))}
        </div>

        <p className="pointer-events-none absolute bottom-3 left-3 hidden rounded-lg border border-line bg-surface/90 px-2.5 py-1.5 text-[11px] text-muted shadow-sm backdrop-blur sm:block">
          Scroll to zoom · drag to move · click a node to open it · double-click to zoom in
        </p>
      </div>
    </div>
  )
}

function Toggle({ n }: { n: Placed }) {
  if (!n.hasChildren) return null
  const count = n.node.children?.length ?? 0
  return (
    <span className="absolute -right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full border-2 bg-surface text-[10px] font-bold shadow-sm" style={{ borderColor: n.node.color, color: n.node.color }} aria-hidden>
      {n.expanded ? '−' : count}
    </span>
  )
}

function OpenLink({ href, color }: { href?: string; color: string }) {
  if (!href) return null
  return (
    <Link href={href} onClick={(e) => e.stopPropagation()} className="shrink-0 rounded-md p-0.5 opacity-60 transition hover:bg-surface-2 hover:opacity-100" style={{ color }} title="Open" aria-label="Open">
      <ArrowUpRight size={14} />
    </Link>
  )
}

const LEAF_STYLE: Record<string, { label: string; tint: string }> = {
  def: { label: 'Definition', tint: '#7c3aed' },
  mistake: { label: 'Mistake', tint: '#e11d48' },
  tip: { label: 'Tip', tint: '#16a34a' },
  flow: { label: 'Flow', tint: '#0284c7' },
  question: { label: 'Q', tint: '#ea580c' },
}

function NodeCard({ n, onClick, hidden, match, current, known }: { n: Placed; onClick: () => void; hidden: boolean; match: boolean; current: boolean; known: number }) {
  const { node } = n
  const ring = current ? '0 0 0 3px var(--accent), 0 10px 30px -10px var(--accent)' : match ? '0 0 0 2px color-mix(in srgb, var(--accent) 60%, transparent)' : undefined
  const blur: CSSProperties | undefined = hidden ? { filter: 'blur(6px)', userSelect: 'none' } : undefined
  const clickable = n.hasChildren || hidden

  if (node.kind === 'root') {
    return (
      <button type="button" onClick={onClick} className="relative block w-full rounded-2xl px-5 py-4 text-left text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${node.color}, #7c3aed)`, boxShadow: ring }}>
        <span className="block text-lg font-semibold leading-tight">{node.label}</span>
        <span className="block text-xs text-white/80">{node.detail}</span>
        <Toggle n={n} />
      </button>
    )
  }
  if (node.kind === 'category') {
    return (
      <button type="button" onClick={onClick} className="relative block w-full rounded-full border-2 px-4 py-2.5 text-left text-sm font-semibold" style={{ borderColor: node.color, color: node.color, background: `color-mix(in srgb, ${node.color} 9%, var(--surface))`, boxShadow: ring }}>
        {node.label}
        <Toggle n={n} />
      </button>
    )
  }
  if (node.kind === 'tech') {
    return (
      <div role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => e.key === 'Enter' && onClick()} className="relative flex cursor-pointer items-center gap-3 rounded-2xl border bg-surface p-3 shadow-sm transition hover:shadow-md" style={{ borderColor: `color-mix(in srgb, ${node.color} 45%, var(--line))`, boxShadow: ring }}>
        <TechTile id={node.tech!} color={node.color} size={44} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1 font-semibold leading-tight">{node.label} <OpenLink href={node.href} color={node.color} /></span>
          <span className="mt-0.5 line-clamp-1 block text-[11px] text-muted">{node.detail}</span>
          {node.count ? <span className="mt-1 block text-[10px] font-medium" style={{ color: known ? 'var(--good)' : 'var(--muted)' }}>{known}/{node.count} questions known</span> : null}
        </span>
        <Toggle n={n} />
      </div>
    )
  }
  if (node.kind === 'section') {
    return (
      <div role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => e.key === 'Enter' && onClick()} className="relative flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface py-2.5 pl-3 pr-5 text-sm font-medium shadow-sm transition hover:shadow-md" style={{ borderLeft: `4px solid ${node.color}`, boxShadow: ring }}>
        <span className="min-w-0 flex-1 leading-snug">{node.label}</span>
        <OpenLink href={node.href} color={node.color} />
        <Toggle n={n} />
      </div>
    )
  }

  // Leaves: the ideas to remember.
  const style = LEAF_STYLE[node.kind]
  const tint = style?.tint ?? node.color
  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => clickable && e.key === 'Enter' && onClick()}
      className={cx('relative rounded-xl border px-3.5 py-2.5 text-[13px] leading-snug shadow-sm', hidden && 'cursor-pointer')}
      style={{ borderColor: `color-mix(in srgb, ${tint} 30%, var(--line))`, background: `color-mix(in srgb, ${tint} ${node.kind === 'point' ? 0 : 6}%, var(--surface))`, boxShadow: ring }}
    >
      <div className="flex items-start gap-2">
        {node.kind === 'point' ? <span className="mt-1.5 size-1.5 shrink-0 rounded-full" style={{ background: node.color }} /> : (
          <span className="mt-px shrink-0 rounded px-1 py-px text-[9px] font-bold uppercase tracking-wide" style={{ color: tint, background: `color-mix(in srgb, ${tint} 14%, transparent)` }}>
            {node.kind === 'def' || node.kind === 'mistake' || node.kind === 'tip' ? (node.detail ?? style.label) : style?.label}
          </span>
        )}
        <span className="min-w-0 flex-1">
          {node.kind === 'question' ? (
            <>
              <span className="block font-medium"><Inline text={node.label} /></span>
              {node.detail && <span className="mt-1 block text-[12px] text-muted" style={blur}><Inline text={node.detail} /></span>}
            </>
          ) : (
            <span className="block" style={blur}><Inline text={node.label} /></span>
          )}
          {node.steps && (
            <span className="mt-2 flex flex-wrap items-center gap-1" style={blur}>
              {node.steps.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1">
                  {i > 0 && <span className="text-muted">→</span>}
                  <span className="rounded-md border px-1.5 py-0.5 text-[11px]" style={{ borderColor: `color-mix(in srgb, ${tint} 35%, var(--line))` }}>{s}</span>
                </span>
              ))}
            </span>
          )}
        </span>
        <OpenLink href={node.href} color={tint} />
      </div>
      {hidden && <span className="pointer-events-none absolute inset-0 grid place-items-center text-[11px] font-medium text-violet">Click to reveal</span>}
    </div>
  )
}
