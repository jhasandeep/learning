'use client'

import { Printer, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Inline } from '@/components/notes/inline'
import { TechTile } from '@/components/tech-icon'
import { cx } from '@/components/ui'
import type { NoteCategory } from '@/data/notes'
import type { Sheet } from '@/data/cheatsheet'

export interface SheetView extends Sheet {
  title: string
  badge: string
  color: string
  category: NoteCategory
}

const plain = (s: string) => s.replace(/[`*=]/g, '').toLowerCase()

export function CheatSheet({ sheets, categories }: { sheets: SheetView[]; categories: NoteCategory[] }) {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<NoteCategory | 'All'>('All')
  const words = useMemo(() => query.toLowerCase().split(/\s+/).filter(Boolean), [query])

  const shown = useMemo(
    () => sheets
      .filter((s) => cat === 'All' || s.category === cat)
      .map((s) => {
        if (!words.length) return s
        const hay = (text: string) => words.every((w) => text.includes(w))
        // keep the whole sheet when its name matches, otherwise only matching rows
        if (hay(plain(s.title))) return s
        const groups = s.groups
          .map((g) => ({ ...g, rows: g.rows.filter(([a, b]) => hay(plain(`${a} ${b} ${g.title}`))) }))
          .filter((g) => g.rows.length)
        const gotchas = s.gotchas.filter((x) => hay(plain(x)))
        return groups.length || gotchas.length ? { ...s, groups, gotchas } : null
      })
      .filter((s): s is SheetView => s !== null),
    [sheets, cat, words],
  )

  return (
    <div className="cheat mx-auto max-w-6xl space-y-6">
      <header className="no-print rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <p className="text-sm font-medium text-good">Quick revision</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Cheat sheet: every technology</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          {sheets.length} technologies on one page: syntax you forget, how things work, and the mistakes interviewers love.
          Search across everything, filter by area, or print it to PDF.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex h-11 w-full max-w-md items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 focus-within:border-accent">
            <Search size={16} className="text-muted" />
            <label htmlFor="cheat-search" className="sr-only">Search the cheat sheet</label>
            <input id="cheat-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search e.g. “join”, “useEffect”, “rebase”, “JWT”…" className="flex-1 bg-transparent text-sm outline-none" />
          </div>
          <button type="button" onClick={() => window.print()} className="inline-flex h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm font-medium text-muted hover:border-line-strong hover:text-text">
            <Printer size={16} /> Print / save PDF
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Area">
          {(['All', ...categories] as const).map((c) => (
            <button key={c} type="button" role="tab" aria-selected={cat === c} onClick={() => setCat(c)}
              className={cx('rounded-full border px-3 py-1 text-sm', cat === c ? 'border-accent bg-accent/10 text-accent' : 'border-line text-muted hover:text-text')}>
              {c}
            </button>
          ))}
        </div>
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Jump to a technology">
          {sheets.map((s) => (
            <li key={s.id}>
              <a href={`#sheet-${s.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-xs text-muted hover:border-line-strong hover:text-text">
                <span className="size-2 rounded-full" style={{ background: s.color }} /> {s.title.split(' & ')[0]}
              </a>
            </li>
          ))}
        </ul>
      </header>

      {shown.map((s) => (
        <section key={s.id} id={`sheet-${s.id}`} aria-labelledby={`h-${s.id}`} className="cheat-sheet scroll-mt-20 rounded-2xl border border-line bg-surface">
          <div className="flex items-center gap-3 border-b border-line p-4" style={{ borderTop: `3px solid ${s.color}`, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
            <TechTile id={s.id} color={s.color} size={40} fallback={s.badge} />
            <div className="min-w-0 flex-1">
              <h2 id={`h-${s.id}`} className="font-semibold">{s.title}</h2>
              <p className="text-xs text-muted">{s.category}</p>
            </div>
            <a href={`/notes/${s.id}`} className="no-print text-xs font-medium text-accent hover:underline">Full notes →</a>
          </div>
          <div className="grid gap-x-6 gap-y-5 p-4 lg:grid-cols-2">
            {s.groups.map((g) => (
              <div key={g.title} className="cheat-group min-w-0">
                <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">{g.title}</h3>
                <dl className="divide-y divide-line rounded-xl border border-line text-sm">
                  {g.rows.map(([code, text]) => (
                    <div key={code} className="grid gap-x-3 gap-y-0.5 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                      <dt><code className="break-words font-mono text-[12.5px] text-accent">{code}</code></dt>
                      <dd className="text-muted"><Inline text={text} /></dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
            {s.gotchas.length > 0 && (
              <div className="cheat-group min-w-0">
                <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-warn">Watch out</h3>
                <ul className="space-y-1.5 rounded-xl border border-warn/30 bg-warn/5 p-3 text-sm">
                  {s.gotchas.map((x) => <li key={x} className="flex gap-2"><span aria-hidden className="text-warn">⚠</span><span><Inline text={x} /></span></li>)}
                </ul>
              </div>
            )}
          </div>
        </section>
      ))}
      {shown.length === 0 && <p className="py-8 text-center text-muted">Nothing matches “{query}”.</p>}
    </div>
  )
}
