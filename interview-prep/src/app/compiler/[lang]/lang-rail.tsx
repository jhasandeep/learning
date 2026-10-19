'use client'

import Link from 'next/link'
import { useState } from 'react'
import { LangIcon } from '@/components/lang-icon'
import { LANGUAGES, type Language } from '@/data/languages'
import { cx } from '@/components/ui'

const GROUPS = [
  { label: 'Browser', langs: LANGUAGES.filter((l) => l.engine === 'browser') },
  { label: 'Server', langs: LANGUAGES.filter((l) => l.engine === 'server') },
]

/** Logo-only language switcher: a vertical rail on desktop, a scrolling strip on mobile. */
export function LangRail({ current }: { current: Language }) {
  // The rail scrolls, which would clip a CSS tooltip, so the name is shown in a fixed-position bubble.
  const [tip, setTip] = useState<{ name: string; detail: string; top: number; left: number } | null>(null)
  const show = (l: Language, el: HTMLElement) => {
    if (!window.matchMedia('(min-width: 768px)').matches) return
    const r = el.getBoundingClientRect()
    setTip({ name: l.name, detail: l.engine === 'browser' ? 'runs in your browser' : 'compiled on the server', top: r.top + r.height / 2, left: r.right + 10 })
  }

  return (
    <nav aria-label="Languages" className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-line bg-surface px-3 py-2.5 md:w-[68px] md:flex-col md:overflow-y-auto md:border-b-0 md:border-r md:px-0 md:py-3" onScroll={() => setTip(null)}>
      {GROUPS.map((g, gi) => (
        <div key={g.label} className="contents">
          {gi > 0 && <span className="mx-1 h-7 w-px shrink-0 bg-line md:mx-0 md:my-1 md:h-px md:w-8" aria-hidden />}
          <span className="hidden text-[9px] font-semibold uppercase tracking-wider text-muted md:block">{g.label}</span>
          {g.langs.map((l) => {
            const active = l.id === current.id
            return (
              <Link
                key={l.id}
                href={`/compiler/${l.id}`}
                aria-label={`${l.name} compiler`}
                aria-current={active ? 'page' : undefined}
                onMouseEnter={(e) => show(l, e.currentTarget)}
                onMouseLeave={() => setTip(null)}
                onFocus={(e) => show(l, e.currentTarget)}
                onBlur={() => setTip(null)}
                className="group relative shrink-0 rounded-xl p-0.5 outline-none md:px-[13px] md:py-0"
              >
                <span className={cx('absolute left-0 top-1/2 hidden h-6 w-1 -translate-y-1/2 rounded-r-full transition-all md:block', active ? 'opacity-100' : 'h-2 opacity-0 group-hover:opacity-60')} style={{ background: l.color }} aria-hidden />
                <LangIcon lang={l} size={40} active={active} className={cx(!active && 'group-hover:-translate-y-0.5 group-hover:border-line-strong group-hover:shadow-md group-focus-visible:border-accent')} />
              </Link>
            )
          })}
        </div>
      ))}
      {tip && (
        <span role="tooltip" className="pointer-events-none fixed z-50 -translate-y-1/2 animate-pop whitespace-nowrap rounded-lg border border-line-strong bg-surface px-2.5 py-1.5 text-xs shadow-xl" style={{ top: tip.top, left: tip.left }}>
          <span className="font-semibold">{tip.name}</span> <span className="text-muted">· {tip.detail}</span>
        </span>
      )}
    </nav>
  )
}
