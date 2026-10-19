import type { Language } from '@/data/languages'
import { cx } from './ui'

/** Compact coloured monogram used as the language "logo". */
export function LangBadge({ lang, size = 36, active = false, className }: { lang: Language; size?: number; active?: boolean; className?: string }) {
  const long = lang.badge.length > 2
  return (
    <span
      className={cx('grid shrink-0 place-items-center rounded-lg font-mono font-bold tracking-tight transition', className)}
      style={{
        width: size,
        height: size,
        fontSize: size * (long ? 0.3 : 0.38),
        color: active ? '#fff' : lang.color,
        background: active ? lang.color : `color-mix(in srgb, ${lang.color} 13%, transparent)`,
        boxShadow: active ? `0 6px 18px -6px ${lang.color}` : undefined,
      }}
      aria-hidden
    >
      {lang.badge}
    </span>
  )
}
