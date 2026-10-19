import type { Difficulty } from '@/data/algorithms'
import type { ComponentProps, ReactNode } from 'react'

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink hover:brightness-110 shadow-[0_0_0_1px_var(--accent),0_8px_24px_-12px_var(--accent)]',
  secondary: 'bg-surface-2 text-text border border-line hover:border-line-strong',
  ghost: 'text-muted hover:text-text hover:bg-surface-2',
  danger: 'bg-bad/10 text-bad border border-bad/30 hover:bg-bad/20',
}

export function buttonClass(variant: Variant = 'secondary', size: 'sm' | 'md' = 'md') {
  return cx(
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
    size === 'sm' ? 'h-8 px-3 text-sm' : 'h-10 px-4 text-sm',
    VARIANTS[variant],
  )
}

export function Button({ variant, size, className, ...props }: ComponentProps<'button'> & { variant?: Variant; size?: 'sm' | 'md' }) {
  return <button type="button" className={cx(buttonClass(variant, size), className)} {...props} />
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-line-strong bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-muted">
      {children}
    </kbd>
  )
}

const DIFF_STYLE: Record<Difficulty, string> = {
  easy: 'text-good bg-good/10 border-good/30',
  medium: 'text-warn bg-warn/10 border-warn/30',
  hard: 'text-bad bg-bad/10 border-bad/30',
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={cx('rounded-full border px-2 py-0.5 text-xs font-medium capitalize', DIFF_STYLE[difficulty])}>
      {difficulty}
    </span>
  )
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx('rounded-full border border-line bg-surface-2 px-2 py-0.5 text-xs text-muted', className)}>
      {children}
    </span>
  )
}

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cx('rounded-2xl border border-line bg-surface', className)} {...props} />
}

export function ProgressBar({ value, className, color = 'var(--accent)' }: { value: number; className?: string; color?: string }) {
  return (
    <div className={cx('h-2 overflow-hidden rounded-full bg-surface-2', className)} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}>
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.min(100, value * 100)}%`, background: color }} />
    </div>
  )
}

export function Ring({ value, size = 64, stroke = 7, color = 'var(--accent)', children }: { value: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, value))} className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-sm font-semibold">{children}</div>
    </div>
  )
}

export function formatMs(ms: number): string {
  const s = Math.round(ms / 1000)
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
}
