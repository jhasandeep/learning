import type { Language } from '@/data/languages'
import { LANG_ICONS } from './lang-icons'
import { cx } from './ui'

/**
 * A language's logo on a soft tile. `active` tints the tile with the
 * language colour and adds a ring, for the selected language.
 */
export function LangIcon({ lang, size = 36, active = false, className }: { lang: Language; size?: number; active?: boolean; className?: string }) {
  const icon = LANG_ICONS[lang.id]
  return (
    <span
      className={cx('lang-tile grid shrink-0 place-items-center rounded-[28%] border transition duration-200', active ? 'border-transparent' : 'border-line bg-surface', className)}
      style={{
        width: size,
        height: size,
        ['--lang' as string]: lang.color,
        background: active ? `color-mix(in srgb, ${lang.color} 14%, var(--surface))` : undefined,
        boxShadow: active ? `0 0 0 2px ${lang.color}, 0 8px 22px -8px ${lang.color}` : undefined,
      }}
      aria-hidden
    >
      {icon ? (
        <span className={cx('block', icon.invertOnDark && 'lang-ink')} style={{ width: size * 0.6, height: size * 0.6 }} dangerouslySetInnerHTML={{ __html: icon.svg }} />
      ) : (
        <span className="font-mono font-bold" style={{ color: lang.color, fontSize: size * 0.34 }}>{lang.badge}</span>
      )}
    </span>
  )
}
