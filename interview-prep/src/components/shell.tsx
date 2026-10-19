'use client'

import { Flame, Keyboard, Search, Target } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { dayStreak, levelFromXp, useProgress } from '@/lib/progress'
import { useToday } from '@/lib/today'
import { CommandPalette, openCommandPalette } from './command-palette'
import { isActive, NAV } from './nav'
import { ThemeToggle } from './theme-toggle'
import { ToastProvider } from './toast'
import { cx, Kbd, ProgressBar } from './ui'

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
      <span className="grid size-8 place-items-center rounded-lg bg-accent/15 text-accent shadow-[0_0_24px_-6px_var(--accent)]">
        <Target size={18} />
      </span>
      <span>Prep<span className="text-accent">Arena</span></span>
    </Link>
  )
}

function XpCard() {
  const p = useProgress()
  const lv = levelFromXp(p.xp)
  const streak = dayStreak(p.activity, useToday())
  return (
    <div className="rounded-xl border border-line bg-surface-2/60 p-3">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold">Level {lv.level}</span>
        <span className="flex items-center gap-1 text-warn" title="Day streak">
          <Flame size={14} /> {streak}
        </span>
      </div>
      <ProgressBar value={lv.pct} />
      <p className="mt-1.5 text-xs text-muted">{lv.into} / {lv.span} XP to level {lv.level + 1}</p>
    </div>
  )
}

function ShortcutsDialog() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      const typing = el.closest('input, textarea, [contenteditable="true"], .cm-editor')
      if (e.key === '?' && !typing) setOpen((o) => !o)
      if (e.key === 'Escape') setOpen(false)
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-shortcuts', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-shortcuts', onOpen)
    }
  }, [])
  if (!open) return null
  const rows: [string, string[]][] = [
    ['Command palette / search', ['Ctrl', 'K']],
    ['Run tests', ['Ctrl', 'Enter']],
    ['Show next hint', ['Alt', 'H']],
    ['Reset code', ['Alt', 'R']],
    ['Flip flashcard', ['Space']],
    ['Grade card: again / good / easy', ['1', '2', '3']],
    ['Show this help', ['?']],
  ]
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4 backdrop-blur-sm" onMouseDown={() => setOpen(false)}>
      <div role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" className="animate-pop w-full max-w-md rounded-2xl border border-line-strong bg-surface p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-semibold">Keyboard shortcuts</h2>
        <ul className="space-y-2.5 text-sm">
          {rows.map(([label, keys]) => (
            <li key={label} className="flex items-center justify-between gap-4">
              <span className="text-muted">{label}</span>
              <span className="flex gap-1">{keys.map((k) => <Kbd key={k}>{k}</Kbd>)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted">On macOS, use ⌘ instead of Ctrl.</p>
      </div>
    </div>
  )
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const p = useProgress()
  const lv = levelFromXp(p.xp)
  const streak = dayStreak(p.activity, useToday())

  return (
    <ToastProvider>
      <div className="flex min-h-dvh">
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r border-line bg-surface/40 p-4 backdrop-blur md:flex">
          <div className="px-2 pt-1"><Logo /></div>
          <nav aria-label="Main" className="flex flex-col gap-1">
            {NAV.map((n) => {
              const active = isActive(pathname, n.href)
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? 'page' : undefined}
                  className={cx(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                    active ? 'bg-accent/10 font-medium text-accent' : 'text-muted hover:bg-surface-2 hover:text-text',
                  )}
                >
                  <n.icon size={18} />
                  {n.label}
                </Link>
              )
            })}
          </nav>
          <div className="mt-auto space-y-3">
            <XpCard />
            <button type="button" onClick={() => window.dispatchEvent(new Event('open-shortcuts'))} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted hover:bg-surface-2 hover:text-text">
              <Keyboard size={14} /> Shortcuts <span className="ml-auto"><Kbd>?</Kbd></span>
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur md:px-6">
            <div className="md:hidden"><Logo /></div>
            <button
              type="button"
              onClick={openCommandPalette}
              className="ml-auto flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm text-muted transition hover:border-line-strong hover:text-text md:ml-0 md:w-80"
              aria-label="Open search"
            >
              <Search size={16} />
              <span className="hidden md:inline">Search levels, decks, pages…</span>
              <span className="ml-auto hidden gap-1 md:flex"><Kbd>Ctrl</Kbd><Kbd>K</Kbd></span>
            </button>
            <div className="hidden items-center gap-3 md:ml-auto md:flex">
              <span className="flex items-center gap-1.5 text-sm text-warn" title="Day streak"><Flame size={16} />{streak} day{streak === 1 ? '' : 's'}</span>
              <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">Lv {lv.level} · {p.xp} XP</span>
            </div>
            <ThemeToggle />
          </header>

          <main className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10">{children}</main>
        </div>
      </div>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-surface/95 backdrop-blur md:hidden">
        {NAV.slice(0, 5).map((n) => {
          const active = isActive(pathname, n.href)
          return (
            <Link key={n.href} href={n.href} aria-current={active ? 'page' : undefined} className={cx('flex flex-col items-center gap-1 py-2.5 text-[11px]', active ? 'text-accent' : 'text-muted')}>
              <n.icon size={20} />
              {n.label}
            </Link>
          )
        })}
      </nav>

      <CommandPalette />
      <ShortcutsDialog />
    </ToastProvider>
  )
}
