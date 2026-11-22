'use client'

import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Inline } from '@/components/notes/inline'

type Section = { id: string; title: string }

/** Thin bar at the top of the page showing how far down the notes you are. */
export function ReadingProgress() {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setPct(max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div className="no-print pointer-events-none fixed inset-x-0 top-0 z-40 h-1" aria-hidden>
      <div className="h-full bg-accent transition-[width] duration-150" style={{ width: `${pct}%` }} />
    </div>
  )
}

/** "On this page" list that highlights the section you are reading. */
export function NoteOutline({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState(sections[0]?.id)
  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => Boolean(e))
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -60% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [sections])

  return (
    <nav aria-label="On this page" className="no-print hidden lg:block">
      <div className="sticky top-20 space-y-1 text-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">On this page</p>
        {sections.map((s, i) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            aria-current={active === s.id ? 'location' : undefined}
            className={`block rounded-lg border-l-2 px-2 py-1 transition ${active === s.id ? 'border-accent bg-surface-2 font-medium text-text' : 'border-transparent text-muted hover:bg-surface-2 hover:text-text'}`}
          >
            <span className="mr-1.5 font-mono text-xs">{i + 1}.</span>{s.title}
          </a>
        ))}
      </div>
    </nav>
  )
}

/** Rapid-fire Q&A as active recall: think of the answer first, then reveal it. */
export function QaList({ items }: { items: [string, string][] }) {
  const [open, setOpen] = useState<Set<number>>(new Set())
  const all = open.size === items.length
  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (!next.delete(i)) next.add(i)
      return next
    })

  return (
    <div>
      <div className="no-print mb-3 flex items-center justify-between gap-3 text-sm text-muted">
        <span>Try answering in your head first, then tap to check.</span>
        <button
          type="button"
          onClick={() => setOpen(all ? new Set() : new Set(items.map((_, i) => i)))}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 font-medium text-text hover:border-line-strong"
        >
          {all ? <EyeOff size={14} /> : <Eye size={14} />} {all ? 'Hide all answers' : 'Reveal all'}
        </button>
      </div>
      <dl className="note-qa">
        {items.map(([q, a], i) => (
          <div key={q} className="note-qa-item" data-open={open.has(i) ? '1' : '0'}>
            <dt>
              <button type="button" onClick={() => toggle(i)} aria-expanded={open.has(i)} className="note-qa-q">
                <span>Q. <Inline text={q} /></span>
                <span className="note-qa-hint no-print">{open.has(i) ? 'Hide' : 'Show answer'}</span>
              </button>
            </dt>
            <dd className="note-qa-a"><Inline text={a} /></dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
