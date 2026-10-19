import { Star } from 'lucide-react'
import { cx } from '@/components/ui'

/** Live WPM / accuracy / progress (or time left) above the text. */
export function StatsBar({ items }: { items: { label: string; value: string; tone?: 'good' | 'bad' | 'warn' }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => (
        <div key={it.label} className="min-w-24 flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-center">
          <p className={cx('font-mono text-2xl font-semibold tabular-nums', it.tone === 'good' && 'text-good', it.tone === 'bad' && 'text-bad', it.tone === 'warn' && 'text-warn')}>{it.value}</p>
          <p className="text-[11px] uppercase tracking-wider text-muted">{it.label}</p>
        </div>
      ))}
    </div>
  )
}

/** Keys missed most in a session, worst first. */
export function weakKeys(keys: Record<string, [number, number]>, min = 3, limit = 5) {
  return Object.entries(keys)
    .filter(([, [h, m]]) => h + m >= min && m > 0)
    .map(([k, [h, m]]) => ({ key: k, misses: m, total: h + m, rate: m / (h + m) }))
    .sort((a, b) => b.rate - a.rate || b.misses - a.misses)
    .slice(0, limit)
}

export const keyLabel = (k: string) => (k === 'space' ? 'Space' : k === 'enter' ? 'Enter' : k.toUpperCase())

/** 0–3 stars. */
export function Stars({ n, size = 16, className }: { n: number; size?: number; className?: string }) {
  return (
    <span className={cx('inline-flex gap-0.5', className)} aria-label={`${n} of 3 stars`}>
      {[1, 2, 3].map((i) => <Star key={i} size={size} className={i <= n ? 'fill-amber-400 text-amber-400' : 'text-line-strong'} />)}
    </span>
  )
}
