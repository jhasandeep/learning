import { Binary, Network, ShieldCheck, type LucideIcon } from 'lucide-react'
import type { CSSProperties } from 'react'
import { cx } from './ui'

// Technology logos from Devicon (copied to public/icons/tech by scripts/build-tech-icons.mjs).
// Topics without a logo (security, system design, DSA) use a line icon in the topic colour.

type Spec = { logo: string } | { lucide: LucideIcon }

/** Compiler language id → logo. */
const LANGS: Record<string, string> = {
  python: 'python', r: 'r', sql: 'sqlite', html: 'html5', java: 'java', kotlin: 'kotlin', c: 'c', cpp: 'cplusplus',
  csharp: 'csharp', javascript: 'javascript', typescript: 'typescript', go: 'go', rust: 'rust', scala: 'scala',
  dart: 'dart', ruby: 'ruby', php: 'php', swift: 'swift',
}

/** Topic id (notes, questions, decks, boards) → logo or icon. */
const TOPICS: Record<string, Spec> = {
  html: { logo: 'html5' }, css: { logo: 'css3' }, javascript: { logo: 'javascript' }, typescript: { logo: 'typescript' },
  react: { logo: 'react' }, nextjs: { logo: 'nextjs' }, nodejs: { logo: 'nodejs' }, express: { logo: 'express' },
  security: { lucide: ShieldCheck }, sql: { logo: 'postgresql' }, mongodb: { logo: 'mongodb' }, git: { logo: 'git' },
  docker: { logo: 'docker' }, testing: { logo: 'jest' }, 'system-design': { lucide: Network }, dsa: { lucide: Binary },
}

/** Logos drawn in black: inverted on dark backgrounds (globals.css .tech-ink). */
const INK = new Set(['rust', 'nextjs', 'express'])

export type TechKind = 'lang' | 'topic'

const spec = (kind: TechKind, id: string): Spec | undefined => (kind === 'lang' ? (LANGS[id] ? { logo: LANGS[id] } : undefined) : TOPICS[id])

export const hasTechIcon = (kind: TechKind, id: string) => Boolean(spec(kind, id))

/** Just the logo, `size` px square. Falls back to `fallback` text in `color`. */
export function TechIcon({ id, kind = 'topic', size = 20, color = 'currentColor', fallback, className }: { id: string; kind?: TechKind; size?: number; color?: string; fallback?: string; className?: string }) {
  const s = spec(kind, id)
  if (!s) return fallback ? <span className={cx('font-mono font-bold', className)} style={{ color, fontSize: size * 0.55 }} aria-hidden>{fallback}</span> : null
  if ('lucide' in s) return <s.lucide size={size} strokeWidth={1.9} className={className} style={{ color }} aria-hidden />
  return (
    // A static, cached SVG: next/image would add nothing for a vector logo.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/icons/tech/${s.logo}.svg`} alt="" width={size} height={size} draggable={false} decoding="async" className={cx('shrink-0 select-none', INK.has(s.logo) && 'tech-ink', className)} style={{ width: size, height: size }} />
  )
}

/**
 * A logo on a soft tile. `active` tints the tile with the technology colour and
 * adds a ring (the selected language in the compiler).
 */
export function TechTile({ id, kind = 'topic', size = 40, color, active = false, fallback, className, style }: { id: string; kind?: TechKind; size?: number; color: string; active?: boolean; fallback?: string; className?: string; style?: CSSProperties }) {
  return (
    <span
      className={cx('grid shrink-0 place-items-center rounded-[28%] border transition duration-200', active ? 'border-transparent' : 'border-line bg-surface', className)}
      style={{
        width: size,
        height: size,
        background: active ? `color-mix(in srgb, ${color} 14%, var(--surface))` : undefined,
        boxShadow: active ? `0 0 0 2px ${color}, 0 8px 22px -8px ${color}` : undefined,
        ...style,
      }}
      aria-hidden
    >
      <TechIcon id={id} kind={kind} size={Math.round(size * 0.58)} color={color} fallback={fallback} />
    </span>
  )
}
