'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { cx } from './ui'

type Tone = 'good' | 'bad' | 'info'
interface Toast { id: number; text: string; tone: Tone }

const ToastContext = createContext<(text: string, tone?: Tone) => void>(() => {})

export function useToast() {
  return useContext(ToastContext)
}

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((text: string, tone: Tone = 'info') => {
    const id = nextId++
    setToasts((t) => [...t.slice(-2), { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cx(
              'animate-pop pointer-events-auto rounded-xl border bg-surface px-4 py-2 text-sm shadow-xl',
              t.tone === 'good' && 'border-good/50 text-good',
              t.tone === 'bad' && 'border-bad/50 text-bad',
              t.tone === 'info' && 'border-line-strong text-text',
            )}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
