'use client'

import {
  ChevronLeft, CornerDownRight, Download, FileJson, FileText, Image as ImageIcon, ListTree, Maximize, Minimize, Minus, Palette, Plus, Redo2, Scan, Trash2, Undo2,
} from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useToast } from '@/components/toast'
import { cx } from '@/components/ui'
import { saveUserMap } from '@/lib/user-maps'
import {
  addChild, addSibling, BRANCH_COLORS, edgeWidth, findNode, findParent, isWithin, layoutUserMap, moveNode, node, removeNode, reparent, toMarkdown, updateNode,
  userEdgeCurve, userEdgePath, wrapText, type Measure, type UNode, type UPlaced, type UserMap,
} from '@/lib/user-mindmap'

type View = { x: number; y: number; k: number }
interface Doc { root: UNode; past: UNode[]; future: UNode[] }
interface Editing { id: string; draft: string; isNew: boolean }

const MIN_K = 0.15
const MAX_K = 2.5
const clampK = (k: number) => Math.min(MAX_K, Math.max(MIN_K, k))
const HISTORY = 100
export const UNTITLED = 'Untitled map'

/** How each depth looks; the measure and the PNG export use the same numbers. */
const STYLE = [
  { size: 19, weight: 600, line: 26, padX: 22, padY: 14, max: 280, radius: 18, border: 0 },
  { size: 15, weight: 600, line: 21, padX: 15, padY: 9, max: 230, radius: 12, border: 2 },
  { size: 14, weight: 400, line: 20, padX: 11, padY: 6, max: 240, radius: 9, border: 1.5 },
] as const
const styleFor = (depth: number) => STYLE[Math.min(depth, STYLE.length - 1)]

function makeMeasure(fontFamily: string): Measure {
  const ctx = document.createElement('canvas').getContext('2d')!
  return (text, depth) => {
    const s = styleFor(depth)
    ctx.font = `${s.weight} ${s.size}px ${fontFamily}`
    const width = (t: string) => ctx.measureText(t).width
    const lines = wrapText(text, s.max, width)
    const w = Math.max(depth === 0 ? 120 : 48, Math.ceil(Math.max(...lines.map(width))) + s.padX * 2 + 1)
    return { w, h: lines.length * s.line + s.padY * 2, lines }
  }
}

function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const fileName = (title: string) => title.trim().replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'mind-map'

/** Blends a hex colour with white: `amount` of the colour. */
function tint(hex: string, amount: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6)
  const rgb = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16))
  return `rgb(${rgb.map((c) => Math.round(255 - (255 - c) * amount)).join(',')})`
}

export function MindMapEditor({ map, onBack }: { map: UserMap; onBack: () => void }) {
  const toast = useToast()
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [doc, setDoc] = useState<Doc>({ root: map.root, past: [], future: [] })
  const [title, setTitle] = useState(map.title)
  const [selected, setSelected] = useState(map.root.id)
  const [editing, setEditing] = useState<Editing | null>(null)
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 })
  const [fullscreen, setFullscreen] = useState(false)
  const [menu, setMenu] = useState<'color' | 'export' | null>(null)
  const [saveFailed, setSaveFailed] = useState(false)
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; target: string | null } | null>(null)
  const pointer = useRef<{ pointers: Map<number, { x: number; y: number }>; moved: boolean; nodeId?: string; pinch?: { d: number; k: number } }>({ pointers: new Map(), moved: false })
  const fitted = useRef(false)

  const [fontFamily, setFontFamily] = useState('system-ui, sans-serif')
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the page font is only known in the browser
    setFontFamily(getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif')
  }, [])
  const measure = useMemo(() => makeMeasure(fontFamily), [fontFamily])
  const layout = useMemo(() => layoutUserMap(doc.root, measure), [doc.root, measure])
  const root = doc.root

  // Save every change (the store writes to localStorage).
  useEffect(() => {
    if (doc.root === map.root && title === map.title) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reflects whether the browser accepted the write
    setSaveFailed(!saveUserMap(map.id, { root: doc.root, title: title.trim() || UNTITLED }))
  }, [doc.root, title, map.id, map.root, map.title])

  const change = useCallback((fn: (r: UNode) => UNode) => {
    setDoc((d) => {
      const next = fn(d.root)
      return next === d.root ? d : { root: next, past: [...d.past.slice(-HISTORY), d.root], future: [] }
    })
  }, [])
  const undo = () => setDoc((d) => (d.past.length ? { root: d.past[d.past.length - 1], past: d.past.slice(0, -1), future: [d.root, ...d.future] } : d))
  const redo = () => setDoc((d) => (d.future.length ? { root: d.future[0], past: [...d.past, d.root], future: d.future.slice(1) } : d))

  const size = () => ({ w: canvasRef.current?.clientWidth ?? 1000, h: canvasRef.current?.clientHeight ?? 700 })

  const fit = useCallback(() => {
    const { w, h } = size()
    const bw = layout.maxX - layout.minX
    const bh = layout.maxY - layout.minY
    const k = clampK(Math.min((w - 80) / bw, (h - 80) / bh, 1.1))
    setView({ k, x: w / 2 - ((layout.minX + layout.maxX) / 2) * k, y: h / 2 - ((layout.minY + layout.maxY) / 2) * k })
  }, [layout])

  useLayoutEffect(() => {
    if (fitted.current) return
    fitted.current = true
    fit()
  }, [fit])

  // Keep the selected node on screen after edits.
  const reveal = useCallback((id: string) => {
    const n = layout.byId.get(id)
    if (!n) return
    const { w, h } = size()
    setView((v) => {
      const sx = v.x + n.x * v.k
      const sy = v.y + n.y * v.k
      const margin = 40
      let { x, y } = v
      if (sx < margin) x += margin - sx
      if (sx + n.w * v.k > w - margin) x -= sx + n.w * v.k - (w - margin)
      if (sy < margin) y += margin - sy
      if (sy + n.h * v.k > h - margin) y -= sy + n.h * v.k - (h - margin)
      return x === v.x && y === v.y ? v : { ...v, x, y }
    })
  }, [layout])
  // eslint-disable-next-line react-hooks/set-state-in-effect -- pans the view (state) after the layout changes
  useEffect(() => reveal(selected), [selected, layout, reveal])

  // Undo can remove the selected node: fall back to the root.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- keeps the selection valid after undo/redo
    if (!findNode(doc.root, selected)) setSelected(doc.root.id)
  }, [doc.root, selected])

  // ---------- editing actions ----------

  const startEdit = (id: string, isNew = false) => {
    const n = findNode(root, id)
    if (n) setEditing({ id, draft: isNew ? '' : n.text, isNew })
  }

  const commitEdit = useCallback((ed: Editing | null = editing) => {
    if (!ed) return
    const text = ed.draft.replace(/\s+$/, '')
    setEditing(null)
    if (!text.trim()) {
      if (ed.isNew) {
        setDoc((d) => ({ ...d, root: removeNode(d.root, ed.id) }))
        setSelected((s) => (s === ed.id ? findParent(root, ed.id)?.id ?? root.id : s))
      }
      return
    }
    // An untitled map takes its name from the central topic.
    if (ed.id === root.id && title === UNTITLED) setTitle(text.split('\n')[0].slice(0, 80))
    // A new node was already added (with empty text) as one undo step; fill it in place.
    if (ed.isNew) setDoc((d) => ({ ...d, root: updateNode(d.root, ed.id, (n) => ({ ...n, text })) }))
    else change((r) => updateNode(r, ed.id, (n) => (n.text === text ? n : { ...n, text })))
  }, [editing, change, root, title])

  const addChildTo = (parentId: string) => {
    if (!findNode(root, parentId)) return
    const child = node('')
    change((r) => addChild(r, parentId, child))
    setSelected(child.id)
    setEditing({ id: child.id, draft: '', isNew: true })
  }
  const addSiblingTo = (id: string) => {
    if (id === root.id) return addChildTo(id)
    const sib = node('')
    change((r) => addSibling(r, id, sib))
    setSelected(sib.id)
    setEditing({ id: sib.id, draft: '', isNew: true })
  }
  const remove = (id: string) => {
    if (id === root.id) return
    const parent = findParent(root, id)
    const siblings = parent?.children ?? []
    const i = siblings.findIndex((c) => c.id === id)
    change((r) => removeNode(r, id))
    setSelected(siblings[i + 1]?.id ?? siblings[i - 1]?.id ?? parent?.id ?? root.id)
  }
  const toggleCollapse = (id: string) => change((r) => updateNode(r, id, (n) => (n.children.length ? { ...n, collapsed: !n.collapsed } : n)))
  const setColor = (color: string | undefined) => {
    change((r) => updateNode(r, selected, (n) => {
      const next = { ...n, color }
      if (!color) delete next.color
      return next
    }))
    setMenu(null)
  }

  // ---------- keyboard ----------

  const zoomAt = (sx: number, sy: number, factor: number) => setView((v) => {
    const k = clampK(v.k * factor)
    return { k, x: sx - ((sx - v.x) * k) / v.k, y: sy - ((sy - v.y) * k) / v.k }
  })
  const zoomCenter = (factor: number) => {
    const { w, h } = size()
    zoomAt(w / 2, h / 2, factor)
  }

  const navigate = (key: string) => {
    const me = layout.byId.get(selected)
    if (!me) return
    const kids = (side: number) => layout.nodes.filter((n) => n.parent === me.node.id && (side === 0 || n.side === side)).sort((a, b) => a.y - b.y)
    const closest = (list: UPlaced[]) => list.reduce<UPlaced | undefined>((best, n) => (!best || Math.abs(n.y - me.y) < Math.abs(best.y - me.y) ? n : best), undefined)
    let target: UPlaced | undefined
    if (key === 'ArrowRight') target = me.side === -1 ? layout.byId.get(me.parent!) : closest(kids(me.side === 0 ? 1 : 0))
    else if (key === 'ArrowLeft') target = me.side === 1 ? layout.byId.get(me.parent!) : closest(kids(me.side === 0 ? -1 : 0))
    else if (me.parent) {
      const sibs = layout.nodes.filter((n) => n.parent === me.parent && n.side === me.side).sort((a, b) => a.y - b.y)
      const i = sibs.indexOf(me)
      target = sibs[key === 'ArrowUp' ? i - 1 : i + 1]
    }
    if (target) setSelected(target.node.id)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (editing || el.closest('input, textarea, select, [contenteditable]')) return
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) redo()
        else undo()
      } else if (mod && e.key.toLowerCase() === 'y') redo()
      else if (mod) return
      else if (e.key === 'Tab') addChildTo(selected)
      else if (e.key === 'Enter') addSiblingTo(selected)
      else if (e.key === 'F2' || e.key === ' ') startEdit(selected)
      else if (e.key === 'Delete' || e.key === 'Backspace') remove(selected)
      else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) change((r) => moveNode(r, selected, e.key === 'ArrowUp' ? -1 : 1))
      else if (e.key.startsWith('Arrow')) navigate(e.key)
      else if (e.key === '.') toggleCollapse(selected)
      else if (e.key === '0') fit()
      else if (e.key === '+' || e.key === '=') zoomCenter(1.2)
      else if (e.key === '-') zoomCenter(1 / 1.2)
      else if (e.key === 'Escape') setMenu(null)
      else if (e.key.length === 1 && !e.altKey && /\S/.test(e.key)) {
        // Typing on a selected node starts editing it, replacing the text (like a spreadsheet cell).
        setEditing({ id: selected, draft: e.key, isNew: false })
      } else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === wrapRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // ---------- zoom & pan ----------


  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      // A mouse wheel (or pinch, which arrives with ctrlKey) zooms; a trackpad's two-finger scroll pans.
      if (e.ctrlKey || e.metaKey || (Math.abs(e.deltaY) > 40 && e.deltaX === 0)) {
        const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015))
        setView((v) => {
          const k = clampK(v.k * factor)
          const sx = e.clientX - r.left
          const sy = e.clientY - r.top
          return { k, x: sx - ((sx - v.x) * k) / v.k, y: sy - ((sy - v.y) * k) / v.k }
        })
      } else {
        setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }))
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const toMap = (clientX: number, clientY: number) => {
    const r = canvasRef.current!.getBoundingClientRect()
    return { x: (clientX - r.left - view.x) / view.k, y: (clientY - r.top - view.y) / view.k }
  }
  const nodeAt = (x: number, y: number, except?: string) =>
    layout.nodes.find((n) => x >= n.x && x <= n.x + n.w && y >= n.y && y <= n.y + n.h && !(except && isWithin(root, except, n.node.id)))

  const onPointerDown = (e: ReactPointerEvent) => {
    if ((e.target as HTMLElement).closest('button, input, textarea, [data-menu]')) return
    setMenu(null)
    const p = pointer.current
    p.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (p.pointers.size === 1) {
      p.moved = false
      p.nodeId = (e.target as HTMLElement).closest<HTMLElement>('[data-node-id]')?.dataset.nodeId
    }
    if (p.pointers.size === 2) {
      const [a, b] = [...p.pointers.values()]
      p.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), k: view.k }
      p.nodeId = undefined
      setDrag(null)
    }
  }
  const onPointerMove = (e: ReactPointerEvent) => {
    const p = pointer.current
    const prev = p.pointers.get(e.pointerId)
    if (!prev) return
    const dx = e.clientX - prev.x
    const dy = e.clientY - prev.y
    p.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (!p.moved && Math.abs(dx) + Math.abs(dy) > 3) {
      p.moved = true
      canvasRef.current?.setPointerCapture(e.pointerId)
    }
    if (!p.moved) return
    if (p.pointers.size === 2 && p.pinch) {
      const [a, b] = [...p.pointers.values()]
      const r = canvasRef.current!.getBoundingClientRect()
      zoomAt((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, (p.pinch.k * Math.hypot(a.x - b.x, a.y - b.y)) / p.pinch.d / view.k)
    } else if (p.nodeId && p.nodeId !== root.id) {
      // Dragging a node: drop it on another node to move the branch there.
      const m = toMap(e.clientX, e.clientY)
      setDrag({ id: p.nodeId, x: m.x, y: m.y, target: nodeAt(m.x, m.y, p.nodeId)?.node.id ?? null })
    } else {
      setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }))
    }
  }
  const onPointerUp = (e: ReactPointerEvent) => {
    const p = pointer.current
    p.pointers.delete(e.pointerId)
    if (p.pointers.size < 2) p.pinch = undefined
    if (drag) {
      if (drag.target) {
        change((r) => reparent(r, drag.id, drag.target!))
        setSelected(drag.id)
      }
      setDrag(null)
    } else if (!p.moved && p.pointers.size === 0) {
      if (p.nodeId) setSelected(p.nodeId)
    }
    if (p.pointers.size === 0) p.nodeId = undefined
  }

  // ---------- export ----------

  const exportPng = async () => {
    setMenu(null)
    const pad = 40
    const scale = 2
    const w = layout.maxX - layout.minX + pad * 2
    const h = layout.maxY - layout.minY + pad * 2
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(w * scale)
    canvas.height = Math.ceil(h * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(scale, scale)
    ctx.translate(pad - layout.minX, pad - layout.minY)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(layout.minX - pad, layout.minY - pad, w, h)
    for (const e of layout.edges) {
      const c = userEdgeCurve(e.from, e.to)
      ctx.beginPath()
      ctx.moveTo(c.x1, c.y1)
      ctx.bezierCurveTo(c.mx, c.y1, c.mx, c.y2, c.x2, c.y2)
      ctx.strokeStyle = e.to.color
      ctx.globalAlpha = 0.7
      ctx.lineWidth = edgeWidth(e.from.depth)
      ctx.lineCap = 'round'
      ctx.stroke()
      ctx.globalAlpha = 1
    }
    for (const n of layout.nodes) {
      const s = styleFor(n.depth)
      ctx.beginPath()
      ctx.roundRect(n.x, n.y, n.w, n.h, s.radius)
      ctx.fillStyle = n.depth === 0 ? n.color : n.depth === 1 ? tint(n.color, 0.14) : '#ffffff'
      ctx.fill()
      if (s.border) {
        ctx.lineWidth = s.border
        ctx.strokeStyle = n.depth === 1 ? n.color : tint(n.color, 0.55)
        ctx.stroke()
      }
      ctx.font = `${s.weight} ${s.size}px ${fontFamily}`
      ctx.fillStyle = n.depth === 0 ? '#ffffff' : '#121826'
      ctx.textBaseline = 'middle'
      n.lines.forEach((line, i) => ctx.fillText(line, n.x + s.padX, n.y + s.padY + s.line * i + s.line / 2))
    }
    canvas.toBlob((blob) => blob && download(`${fileName(title)}.png`, blob), 'image/png')
  }
  const exportMarkdown = () => {
    setMenu(null)
    download(`${fileName(title)}.md`, new Blob([toMarkdown(root)], { type: 'text/markdown' }))
  }
  const exportJson = () => {
    setMenu(null)
    download(`${fileName(title)}.mindmap.json`, new Blob([JSON.stringify({ title, root }, null, 2)], { type: 'application/json' }))
    toast('Saved as JSON. Import it on the My maps page.', 'info')
  }

  // ---------- render ----------

  const sel = layout.byId.get(selected)
  const selNode = sel?.node
  const editNode = editing ? layout.byId.get(editing.id) : undefined
  const btn = 'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-xs font-medium text-text transition hover:border-line-strong disabled:opacity-40'
  const dragNode = drag ? layout.byId.get(drag.id) : undefined

  return (
    <div ref={wrapRef} className="flex h-[calc(100dvh-3.5rem-4.25rem)] flex-col bg-bg md:h-[calc(100dvh-3.5rem)]">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface px-3 py-2">
        <button type="button" className={btn} onClick={onBack} title="All your mind maps"><ChevronLeft size={14} /> My maps</button>
        <label htmlFor="map-title" className="sr-only">Map title</label>
        <input
          id="map-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          className="h-8 w-40 min-w-0 rounded-lg border border-transparent bg-transparent px-2 text-sm font-semibold outline-none hover:border-line focus:border-accent sm:w-56"
          maxLength={80}
        />
        <span className={cx('hidden text-[11px] sm:inline', saveFailed ? 'text-bad' : 'text-muted')}>{saveFailed ? 'Not saved: browser storage is full' : 'Saved in this browser'}</span>

        <div className="flex items-center gap-1" role="group" aria-label="Edit">
          <button type="button" className={btn} onClick={() => addChildTo(selected)} title="Add a child idea (Tab)"><CornerDownRight size={14} /> <span className="hidden md:inline">Child</span></button>
          <button type="button" className={btn} onClick={() => addSiblingTo(selected)} title="Add an idea next to this one (Enter)"><Plus size={14} /> <span className="hidden md:inline">Sibling</span></button>
          <button type="button" className={btn} onClick={() => remove(selected)} disabled={selected === root.id} title="Delete this branch (Delete)" aria-label="Delete"><Trash2 size={14} /></button>
          <div className="relative">
            <button type="button" className={btn} onClick={() => setMenu(menu === 'color' ? null : 'color')} title="Branch colour" aria-label="Branch colour" aria-expanded={menu === 'color'}>
              <Palette size={14} style={{ color: sel?.color }} />
            </button>
            {menu === 'color' && (
              <div data-menu className="absolute left-0 top-10 z-20 w-48 rounded-xl border border-line bg-surface p-2 shadow-lg">
                <p className="px-1 pb-2 text-[11px] text-muted">Colour for this branch</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {BRANCH_COLORS.concat(['#1e293b', '#64748b', '#ea580c', '#65a30d']).map((c) => (
                    <button key={c} type="button" onClick={() => setColor(c)} className={cx('size-9 rounded-lg border-2 transition hover:scale-105', selNode?.color === c ? 'border-text' : 'border-transparent')} style={{ background: c }} aria-label={`Colour ${c}`} />
                  ))}
                </div>
                {selNode?.color && <button type="button" onClick={() => setColor(undefined)} className="mt-2 w-full rounded-lg px-2 py-1 text-left text-xs text-muted hover:bg-surface-2">Reset to automatic</button>}
              </div>
            )}
          </div>
          <button type="button" className={btn} onClick={() => toggleCollapse(selected)} disabled={!selNode?.children.length} title="Fold or unfold this branch (.)"><ListTree size={14} /></button>
          <button type="button" className={btn} onClick={undo} disabled={!doc.past.length} title="Undo (Ctrl+Z)" aria-label="Undo"><Undo2 size={14} /></button>
          <button type="button" className={btn} onClick={redo} disabled={!doc.future.length} title="Redo (Ctrl+Shift+Z)" aria-label="Redo"><Redo2 size={14} /></button>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button type="button" className={btn} onClick={() => zoomCenter(1 / 1.2)} aria-label="Zoom out"><Minus size={14} /></button>
          <span className="w-11 text-center text-xs tabular-nums text-muted">{Math.round(view.k * 100)}%</span>
          <button type="button" className={btn} onClick={() => zoomCenter(1.2)} aria-label="Zoom in"><Plus size={14} /></button>
          <button type="button" className={btn} onClick={fit} title="Fit the map on screen (0)"><Scan size={14} /> <span className="hidden sm:inline">Fit</span></button>
          <div className="relative">
            <button type="button" className={btn} onClick={() => setMenu(menu === 'export' ? null : 'export')} aria-expanded={menu === 'export'}><Download size={14} /> <span className="hidden sm:inline">Export</span></button>
            {menu === 'export' && (
              <div data-menu className="absolute right-0 top-10 z-20 w-52 rounded-xl border border-line bg-surface p-1 shadow-lg">
                <button type="button" onClick={exportPng} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-2"><ImageIcon size={15} /> Image (PNG)</button>
                <button type="button" onClick={exportMarkdown} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-2"><FileText size={15} /> Outline (Markdown)</button>
                <button type="button" onClick={exportJson} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-2"><FileJson size={15} /> Backup (JSON)</button>
              </div>
            )}
          </div>
          <button type="button" className={btn} onClick={() => (fullscreen ? document.exitFullscreen() : wrapRef.current?.requestFullscreen())} aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}>{fullscreen ? <Minimize size={14} /> : <Maximize size={14} />}</button>
        </div>
      </div>

      {/* canvas */}
      <div
        ref={canvasRef}
        className={cx('map-canvas relative min-h-0 flex-1 touch-none overflow-hidden select-none', drag ? 'cursor-grabbing' : 'cursor-grab')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={(e) => {
          if ((e.target as HTMLElement).closest('button, textarea, [data-menu]')) return
          const id = (e.target as HTMLElement).closest<HTMLElement>('[data-node-id]')?.dataset.nodeId
          if (id) startEdit(id)
          else {
            // Double-click on empty space adds a main branch.
            addChildTo(root.id)
          }
        }}
      >
        <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}>
          <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={1} height={1} aria-hidden>
            {layout.edges.map((e) => (
              <path key={e.id} d={userEdgePath(e.from, e.to)} fill="none" stroke={e.to.color} strokeOpacity={0.7} strokeWidth={edgeWidth(e.from.depth)} strokeLinecap="round" />
            ))}
          </svg>
          {layout.nodes.map((n) => (
            <NodeBox
              key={n.node.id}
              n={n}
              selected={n.node.id === selected}
              dropTarget={drag?.target === n.node.id}
              dragging={drag?.id === n.node.id}
              hidden={editing?.id === n.node.id}
              onToggle={() => toggleCollapse(n.node.id)}
              onAdd={() => addChildTo(n.node.id)}
            />
          ))}
          {dragNode && drag && (
            <div className="pointer-events-none absolute left-0 top-0 rounded-lg border-2 border-dashed px-2 py-1 text-sm opacity-80 shadow-lg" style={{ transform: `translate(${drag.x + 8}px, ${drag.y + 8}px)`, borderColor: dragNode.color, background: 'var(--surface)' }}>
              {dragNode.lines[0]}{dragNode.lines.length > 1 ? '…' : ''}
            </div>
          )}
          {editing && editNode && (
            <EditBox key={editing.id} n={editNode} fontFamily={fontFamily} editing={editing} setEditing={setEditing} commit={commitEdit} addChild={() => { const ed = editing; commitEdit(ed); if (ed.draft.trim()) addChildTo(ed.id) }} />
          )}
        </div>

        {countRoot(root) === 1 && !editing && (
          <p className="pointer-events-none absolute inset-x-0 top-6 mx-auto w-max max-w-[90%] rounded-xl border border-line bg-surface/95 px-4 py-2.5 text-center text-sm shadow-sm">
            Press <b>Tab</b> to add an idea, <b>Enter</b> for the next one, and just start typing to rename.
          </p>
        )}
        <p className="pointer-events-none absolute bottom-3 left-3 hidden rounded-lg border border-line bg-surface/90 px-2.5 py-1.5 text-[11px] text-muted shadow-sm backdrop-blur sm:block">
          Tab child · Enter sibling · type to rename · Del delete · arrows move · drag a node onto another to move it · Ctrl+Z undo
        </p>
      </div>
    </div>
  )
}

const countRoot = (r: UNode) => 1 + r.children.length

function NodeBox({ n, selected, dropTarget, dragging, hidden, onToggle, onAdd }: { n: UPlaced; selected: boolean; dropTarget: boolean; dragging: boolean; hidden: boolean; onToggle: () => void; onAdd: () => void }) {
  const s = styleFor(n.depth)
  const ring = dropTarget ? `0 0 0 3px var(--good)` : selected ? `0 0 0 3px color-mix(in srgb, var(--accent) 70%, transparent)` : undefined
  const bg = n.depth === 0 ? n.color : n.depth === 1 ? `color-mix(in srgb, ${n.color} 14%, var(--surface))` : 'var(--surface)'
  const border = n.depth === 1 ? n.color : `color-mix(in srgb, ${n.color} 55%, var(--surface))`
  const out = n.side === -1 ? 'left' : 'right'
  return (
    <div
      data-node-id={n.node.id}
      className={cx('absolute left-0 top-0 cursor-pointer', dragging && 'opacity-40')}
      style={{ transform: `translate(${n.x}px, ${n.y}px)`, width: n.w, height: n.h }}
    >
      <div
        className="h-full w-full shadow-sm"
        style={{
          borderRadius: s.radius,
          background: bg,
          border: s.border ? `${s.border}px solid ${border}` : undefined,
          padding: `${s.padY - s.border}px ${s.padX - s.border}px`,
          fontSize: s.size,
          fontWeight: s.weight,
          lineHeight: `${s.line}px`,
          color: n.depth === 0 ? '#fff' : 'var(--text)',
          boxShadow: ring,
          visibility: hidden ? 'hidden' : undefined,
        }}
      >
        {n.lines.map((l, i) => <div key={i} className="whitespace-pre">{l}</div>)}
      </div>
      {n.node.children.length > 0 && n.depth > 0 && (
        <button
          type="button"
          onClick={onToggle}
          className="absolute top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-full border-2 bg-surface text-[10px] font-bold leading-none shadow-sm"
          style={{ [out]: -11, borderColor: n.color, color: n.color }}
          aria-label={n.node.collapsed ? `Unfold (${n.node.children.length})` : 'Fold'}
          title={n.node.collapsed ? 'Unfold' : 'Fold'}
        >
          {n.node.collapsed ? n.node.children.length : '−'}
        </button>
      )}
      {selected && !hidden && (!n.node.children.length || n.depth === 0) && (
        <button
          type="button"
          onClick={onAdd}
          className="absolute top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-accent text-accent-ink shadow-md transition hover:scale-110"
          style={n.depth === 0 ? { right: -12 } : { [out]: -13 }}
          aria-label="Add a child idea"
          title="Add a child idea (Tab)"
        >
          <Plus size={14} />
        </button>
      )}
    </div>
  )
}

function EditBox({ n, fontFamily, editing, setEditing, commit, addChild }: { n: UPlaced; fontFamily: string; editing: Editing; setEditing: (e: Editing | null) => void; commit: (e: Editing) => void; addChild: () => void }) {
  const s = styleFor(n.depth)
  const ref = useRef<HTMLTextAreaElement>(null)
  const done = useRef(false) // so the blur that follows Enter/Escape/Tab doesn't commit twice
  const finish = (fn: () => void) => {
    if (done.current) return
    done.current = true
    fn()
  }
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
  }, [])
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${el.scrollHeight}px`
  }, [editing.draft])
  const width = Math.max(n.w, n.depth === 0 ? 200 : 170)
  return (
    <textarea
      ref={ref}
      value={editing.draft}
      onChange={(e) => setEditing({ ...editing, draft: e.target.value })}
      onBlur={() => finish(() => commit(editing))}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          finish(() => commit(editing))
        } else if (e.key === 'Escape') {
          e.preventDefault()
          finish(() => (editing.isNew ? commit({ ...editing, draft: '' }) : setEditing(null)))
        } else if (e.key === 'Tab') {
          e.preventDefault()
          finish(addChild)
        }
      }}
      onPointerDown={(e) => e.stopPropagation()}
      placeholder={n.depth === 0 ? 'Central topic' : 'New idea'}
      aria-label="Node text"
      rows={1}
      className="absolute left-0 top-0 z-10 resize-none overflow-hidden rounded-lg border-2 border-accent bg-surface text-text shadow-lg outline-none"
      style={{
        transform: `translate(${n.side === -1 ? n.x + n.w - width : n.depth === 0 ? n.x + n.w / 2 - width / 2 : n.x}px, ${n.y}px)`,
        width,
        minHeight: n.h,
        padding: `${s.padY - 2}px ${s.padX - 2}px`,
        fontFamily,
        fontSize: s.size,
        fontWeight: s.weight,
        lineHeight: `${s.line}px`,
      }}
    />
  )
}
