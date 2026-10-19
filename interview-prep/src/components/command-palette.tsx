'use client'

import { Bug, Hash, Layers, Moon, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { CAMPAIGN } from '@/data/campaign'
import { DECKS } from '@/data/decks'
import { ENDLESS_COUNT } from '@/lib/endless'
import { NAV } from './nav'
import { toggleTheme } from './theme-toggle'
import { cx, Kbd } from './ui'

interface Item { id: string; label: string; hint: string; icon: ReactNode; run: () => void }

export function openCommandPalette() {
  window.dispatchEvent(new Event('open-command-palette'))
}

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setQuery('')
        setActive(0)
        setOpen((o) => !o)
      }
    }
    const onOpen = () => {
      setQuery('')
      setActive(0)
      setOpen(true)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-command-palette', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-command-palette', onOpen)
    }
  }, [])

  const items = useMemo<Item[]>(() => {
    const go = (href: string) => () => router.push(href)
    const all: Item[] = [
      ...NAV.map((n) => ({ id: n.href, label: n.label, hint: 'Page', icon: <n.icon size={16} />, run: go(n.href) })),
      ...CAMPAIGN.map((l, i) => ({ id: l.id, label: `${i + 1}. ${l.title}`, hint: `Campaign · ${l.topic}`, icon: <Bug size={16} />, run: go(`/campaign/${l.id}`) })),
      ...DECKS.map((d) => ({ id: d.id, label: `${d.title} flashcards`, hint: `${d.cards.length} cards`, icon: <Layers size={16} />, run: go(`/flashcards/${d.id}`) })),
      { id: 'theme', label: 'Toggle light / dark theme', hint: 'Action', icon: <Moon size={16} />, run: toggleTheme },
    ]
    const q = query.trim().toLowerCase()
    const n = Number(q.replace(/^#/, ''))
    const jump: Item[] = q && Number.isInteger(n) && n >= 1 && n <= ENDLESS_COUNT
      ? [{ id: `endless-${n}`, label: `Endless level #${n}`, hint: 'Jump', icon: <Hash size={16} />, run: go(`/endless/${n}`) }]
      : []
    const words = q.split(/\s+/).filter(Boolean)
    const matches = all.filter((it) => words.every((w) => `${it.label} ${it.hint}`.toLowerCase().includes(w)))
    return [...jump, ...matches].slice(0, 12)
  }, [query, router])

  if (!open) return null

  const choose = (item: Item | undefined) => {
    if (!item) return
    setOpen(false)
    item.run()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={() => setOpen(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="animate-pop w-full max-w-xl overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={18} className="text-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)) }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
              if (e.key === 'Enter') choose(items[active])
              if (e.key === 'Escape') setOpen(false)
            }}
            placeholder="Search levels, decks, pages… or type a level number"
            className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
            aria-label="Search"
          />
          <Kbd>Esc</Kbd>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
          {items.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">Nothing matches “{query}”.</li>}
          {items.map((it, i) => (
            <li key={it.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(it)}
                className={cx('flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm', i === active ? 'bg-surface-2 text-text' : 'text-muted')}
              >
                <span className={i === active ? 'text-accent' : ''}>{it.icon}</span>
                <span className="flex-1 truncate">{it.label}</span>
                <span className="text-xs text-muted">{it.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
