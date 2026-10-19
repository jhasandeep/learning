import { CHAR_KEY, FINGERS, isLeftHand, KEYBOARD, type Finger, type Key } from '@/data/typing'
import { cx } from '@/components/ui'

/** Which key (and which Shift) the next character needs. */
export function target(next: string | null | undefined): { key: Key | null; shiftSide: 'left' | 'right' | null; finger: Finger | null } {
  if (next == null) return { key: null, shiftSide: null, finger: null }
  if (next === ' ') return { key: KEYBOARD[4][0], shiftSide: null, finger: 'th' }
  if (next === '\n') { const enter = KEYBOARD[2][KEYBOARD[2].length - 1]; return { key: enter, shiftSide: null, finger: 'rp' } }
  const entry = CHAR_KEY[next]
  if (!entry) return { key: null, shiftSide: null, finger: null }
  // Shift with the other hand's pinky.
  return { key: entry.key, shiftSide: entry.shift ? (isLeftHand(entry.key.finger) ? 'right' : 'left') : null, finger: entry.key.finger }
}

/**
 * A US QWERTY keyboard. Keys are tinted by finger; `next` highlights the key
 * (and Shift) to press. With `heat`, keys are tinted by how often they are missed.
 */
export function Keyboard({ next, heat, className }: { next?: string | null; heat?: Record<string, [number, number]>; className?: string }) {
  const t = target(next)
  const keyId = (k: Key) => (k.label === 'Space' ? 'space' : k.label === 'Enter' ? 'enter' : k.base)
  return (
    <div className={cx('mx-auto w-full max-w-3xl select-none rounded-2xl border border-line bg-surface-2/50 p-2 sm:p-3', className)} aria-hidden>
      {KEYBOARD.map((row, r) => (
        <div key={r} className={cx('flex gap-1 sm:gap-1.5', r > 0 && 'mt-1 sm:mt-1.5', r === 4 && 'justify-center')}>
          {row.map((k, i) => {
            const color = FINGERS[k.finger].color
            const isShift = k.label === 'Shift'
            const active = t.key === k || (isShift && ((t.shiftSide === 'left' && i === 0) || (t.shiftSide === 'right' && i > 0)))
            const stat = heat?.[keyId(k)]
            const missRate = stat && stat[0] + stat[1] >= 5 ? stat[1] / (stat[0] + stat[1]) : null
            const style = heat
              ? { background: missRate === null ? undefined : `color-mix(in srgb, #ef4444 ${Math.min(100, Math.round(missRate * 400))}%, var(--surface))` }
              : active
                ? { background: color, color: '#fff', boxShadow: `0 0 0 3px color-mix(in srgb, ${color} 35%, transparent), 0 6px 16px -6px ${color}` }
                : { background: `color-mix(in srgb, ${color} 10%, var(--surface))`, borderColor: `color-mix(in srgb, ${color} 25%, var(--line))` }
            return (
              <div
                key={i}
                className={cx('relative grid h-8 min-w-0 place-items-center whitespace-pre rounded-md border border-line text-center font-mono text-[10px] leading-[1.05] text-text transition-colors duration-100 sm:h-11 sm:rounded-lg sm:text-xs', active && 'z-10 scale-105 font-semibold')}
                style={{ flex: `${k.w ?? 1} 1 0`, ...style }}
                title={heat && stat ? `${k.label.replace('\n', ' ')}: ${stat[1]} missed of ${stat[0] + stat[1]}` : FINGERS[k.finger].name}
              >
                {k.label}
                {k.bump && <span className="absolute bottom-1 h-0.5 w-2.5 rounded-full bg-current opacity-50" />}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

/** Two hands as finger pills; the finger to use next lights up. */
export function Hands({ finger }: { finger: Finger | null }) {
  const left: Finger[] = ['lp', 'lr', 'lm', 'li']
  const right: Finger[] = ['ri', 'rm', 'rr', 'rp']
  const heights: Record<Finger, number> = { lp: 26, lr: 36, lm: 42, li: 36, ri: 36, rm: 42, rr: 36, rp: 26, th: 20 }
  const pill = (f: Finger) => (
    <span
      key={f}
      className="w-3.5 rounded-full border transition-all duration-150 sm:w-4"
      style={{ height: heights[f], background: f === finger ? FINGERS[f].color : `color-mix(in srgb, ${FINGERS[f].color} 18%, var(--surface))`, borderColor: `color-mix(in srgb, ${FINGERS[f].color} 50%, transparent)`, transform: f === finger ? 'translateY(-4px)' : undefined }}
      title={FINGERS[f].name}
    />
  )
  return (
    <div className="flex items-end justify-center gap-6 sm:gap-10" aria-hidden>
      <div className="flex items-end gap-1">{left.map(pill)}<span className="ml-1 h-5 w-4 -rotate-12 rounded-full border sm:w-5" style={{ background: finger === 'th' ? FINGERS.th.color : 'var(--surface-2)', borderColor: 'var(--line-strong)' }} /></div>
      <div className="flex items-end gap-1"><span className="mr-1 h-5 w-4 rotate-12 rounded-full border sm:w-5" style={{ background: finger === 'th' ? FINGERS.th.color : 'var(--surface-2)', borderColor: 'var(--line-strong)' }} />{right.map(pill)}</div>
    </div>
  )
}

/** The finger to use, as text for screen readers and the caption under the keyboard. */
export function fingerHint(next: string | null | undefined): string {
  if (next == null) return ''
  const t = target(next)
  if (!t.finger) return ''
  const label = next === ' ' ? 'Space' : next === '\n' ? 'Enter' : next
  return `${label}: ${FINGERS[t.finger].name}${t.shiftSide ? ` + ${t.shiftSide} Shift` : ''}`
}
