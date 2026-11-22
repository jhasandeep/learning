'use client'

import { ArrowLeft, ArrowRight, Pause, Play, SkipBack } from 'lucide-react'
import { useEffect, useId, useMemo, useState } from 'react'
import { Inline } from '@/components/notes/inline'
import { Button, cx } from '@/components/ui'
import type { Arch, ArchNode, NodeKind } from '@/data/system-design/types'

const ICON: Record<NodeKind, string> = {
  client: '💻',
  user: '🧑',
  lb: '⚖️',
  server: '🖥️',
  cache: '⚡',
  db: '🗄️',
  queue: '📬',
  cdn: '🌍',
  service: '🧩',
  worker: '⚙️',
  gateway: '🚪',
  dns: '📖',
}

const W = 17
const H = 9.5

/** The point where the line from `a` to `b` leaves the box around `a`. */
function edgePoint(a: ArchNode, b: ArchNode): [number, number] {
  const dx = b.x - a.x
  const dy = b.y - a.y
  if (dx === 0 && dy === 0) return [a.x, a.y]
  const sx = dx === 0 ? Infinity : W / 2 / Math.abs(dx)
  const sy = dy === 0 ? Infinity : H / 2 / Math.abs(dy)
  const t = Math.min(sx, sy)
  return [a.x + dx * t, a.y + dy * t]
}

/**
 * A system diagram you can step through: boxes, arrows, and a request that travels along them.
 * Frames light up the boxes and arrows involved and explain what is happening.
 */
export function ArchDiagram({ arch }: { arch: Arch }) {
  const uid = useId().replace(/:/g, '')
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const last = arch.frames.length - 1
  const f = arch.frames[Math.min(step, last)]
  const byId = useMemo(() => Object.fromEntries(arch.nodes.map((n) => [n.id, n])), [arch.nodes])

  const active = playing && step < last
  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => setStep((s) => s + 1), 2200)
    return () => clearTimeout(t)
  }, [active, step])

  const isFlow = (from: string, to: string) => f.flow?.some(([a, b]) => a === from && b === to) ?? false

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <p className="text-sm font-semibold">{arch.title}</p>
      <div className="mt-3 overflow-hidden rounded-xl bg-surface-2">
        <svg viewBox="0 0 100 56" className="h-auto w-full" role="img" aria-label={`${arch.title}: ${f.caption}`}>
          <defs>
            <marker id={`${uid}-a`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="var(--line-strong)" />
            </marker>
            <marker id={`${uid}-h`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="var(--accent)" />
            </marker>
          </defs>

          {arch.edges.map((e) => {
            const a = byId[e.from]
            const b = byId[e.to]
            if (!a || !b) return null
            const [x1, y1] = edgePoint(a, b)
            const [x2, y2] = edgePoint(b, a)
            const hot = isFlow(e.from, e.to) || isFlow(e.to, e.from)
            const path = isFlow(e.to, e.from) ? `M${x2} ${y2} L${x1} ${y1}` : `M${x1} ${y1} L${x2} ${y2}`
            return (
              <g key={`${e.from}-${e.to}`}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={hot ? 'var(--accent)' : 'var(--line-strong)'} strokeWidth={hot ? 0.55 : 0.3} markerEnd={`url(#${uid}-${hot ? 'h' : 'a'})`} opacity={hot ? 1 : 0.8} />
                {e.label && <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 0.9} textAnchor="middle" fontSize="2.1" fill="var(--muted)">{e.label}</text>}
                {hot && (
                  <circle r="1.1" fill="var(--warn)">
                    <animateMotion dur="1.4s" repeatCount="indefinite" path={path} />
                  </circle>
                )}
              </g>
            )
          })}

          {arch.nodes.map((n) => {
            const isActive = f.active?.includes(n.id)
            const isBad = f.bad?.includes(n.id)
            const badge = f.badges?.[n.id]
            return (
              <g key={n.id}>
                <rect
                  x={n.x - W / 2}
                  y={n.y - H / 2}
                  width={W}
                  height={H}
                  rx="1.8"
                  fill={isBad ? 'color-mix(in srgb, var(--bad) 18%, var(--surface))' : isActive ? 'color-mix(in srgb, var(--accent) 18%, var(--surface))' : 'var(--surface)'}
                  stroke={isBad ? 'var(--bad)' : isActive ? 'var(--accent)' : 'var(--line-strong)'}
                  strokeWidth={isActive || isBad ? 0.6 : 0.35}
                />
                <text x={n.x} y={n.y - 0.6} textAnchor="middle" fontSize="4" aria-hidden="true">{ICON[n.kind]}</text>
                <text x={n.x} y={n.y + 2.6} textAnchor="middle" fontSize="2.3" fontWeight="600" fill="var(--text)">{n.label}</text>
                {n.sub && <text x={n.x} y={n.y + 4.2} textAnchor="middle" fontSize="1.8" fill="var(--muted)">{n.sub}</text>}
                {badge && (
                  <g>
                    <rect x={n.x - 4.6} y={n.y - H / 2 - 2.6} width="9.2" height="3.4" rx="1.2" fill={/miss|fail|reject|drop|overload|stale|lost/i.test(badge) ? 'var(--bad)' : 'var(--good)'} />
                    <text x={n.x} y={n.y - H / 2 - 0.2} textAnchor="middle" fontSize="2" fontWeight="700" fill="#fff">{badge}</text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      <p className="mt-3 min-h-[3.25rem] text-sm leading-relaxed" aria-live="polite"><span className="font-semibold">Step {Math.min(step, last) + 1} of {arch.frames.length}:</span> <Inline text={f.caption} /></p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => { setPlaying(false); setStep(0) }} disabled={step === 0} aria-label="Back to the first step"><SkipBack size={14} /></Button>
        <Button size="sm" onClick={() => { setPlaying(false); setStep((s) => Math.max(0, s - 1)) }} disabled={step === 0}><ArrowLeft size={14} /> Back</Button>
        <Button size="sm" variant="primary" onClick={() => { setPlaying(false); setStep((s) => Math.min(last, s + 1)) }} disabled={step >= last}>Next <ArrowRight size={14} /></Button>
        <Button size="sm" variant="ghost" onClick={() => { if (!active && step >= last) setStep(0); setPlaying((p) => !p) }}>{active ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Auto play</>}</Button>
        <div className="ml-auto flex gap-1" aria-hidden="true">
          {arch.frames.map((_, i) => <span key={i} className={cx('h-1.5 w-5 rounded-full', i <= step ? 'bg-accent' : 'bg-line')} />)}
        </div>
      </div>
    </div>
  )
}
