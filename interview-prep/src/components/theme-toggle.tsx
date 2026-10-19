'use client'

import { Moon, Sun } from 'lucide-react'
import { useSyncExternalStore } from 'react'

// The inline script in layout.tsx applies the saved theme before first paint;
// this component only flips the attribute and remembers the choice.
// Light is the default. The key was renamed (from 'prep-arena:theme') when dark
// mode was fixed, so a "dark" saved while the toggle had no visible effect
// doesn't switch anyone to dark unexpectedly; the old key is cleared.
const THEME_KEY = 'prep-arena:theme-v2'
const OLD_THEME_KEY = 'prep-arena:theme'

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb)
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => obs.disconnect()
}

export function useTheme() {
  return useSyncExternalStore(
    subscribe,
    () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'),
    () => 'light' as const,
  )
}

export function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
  document.documentElement.dataset.theme = next
  try {
    localStorage.setItem(THEME_KEY, next)
  } catch {}
}

export const THEME_SCRIPT = `(function(){try{localStorage.removeItem("${OLD_THEME_KEY}");var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`

export function ThemeToggle() {
  const theme = useTheme()
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-text"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      title="Toggle theme"
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
