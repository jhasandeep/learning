import type { Language } from '@/data/languages'
import { TechTile } from './tech-icon'

/** A compiler language's logo on a tile (see TechTile). */
export function LangIcon({ lang, size = 36, active = false, className }: { lang: Language; size?: number; active?: boolean; className?: string }) {
  return <TechTile kind="lang" id={lang.id} color={lang.color} size={size} active={active} fallback={lang.badge} className={className} />
}
