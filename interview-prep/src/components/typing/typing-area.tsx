'use client'

import { MousePointerClick } from 'lucide-react'
import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cx } from '@/components/ui'

/**
 * Shows the text to type and captures keystrokes through a hidden textarea
 * (so phone keyboards work too). Wrong characters turn red, the caret blinks
 * on the next character, and the view scrolls to keep the current line visible.
 */
export function TypingArea({ target, typed, onChar, onBack, lines = 3, disabled = false, autoFocus = true }: {
  target: string
  typed: string
  onChar: (ch: string) => void
  onBack: (word: boolean) => void
  /** Visible lines before the text scrolls. */
  lines?: number
  disabled?: boolean
  autoFocus?: boolean
}) {
  const input = useRef<HTMLTextAreaElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (autoFocus && !disabled) input.current?.focus()
  }, [autoFocus, disabled, target])

  // Keep the caret's line second from the top.
  useLayoutEffect(() => {
    const el = box.current
    const caret = el?.querySelector<HTMLElement>('[data-caret]')
    if (!el || !caret) return
    const lineH = parseFloat(getComputedStyle(el).lineHeight) || 36
    el.scrollTop = Math.max(0, caret.offsetTop - lineH)
  }, [typed.length])

  return (
    <div className="relative" onClick={() => input.current?.focus()}>
      <textarea
        ref={input}
        aria-label="Type the text shown"
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        className="absolute inset-0 -z-10 h-full w-full resize-none opacity-0"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === 'Backspace') {
            e.preventDefault()
            onBack(e.ctrlKey || e.altKey || e.metaKey)
          } else if (e.key === 'Enter') {
            e.preventDefault()
            onChar('\n')
          } else if (e.key === 'Tab') {
            e.preventDefault() // indentation is typed automatically after Enter
          } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            onChar(e.key)
          }
        }}
        onInput={(e) => {
          // Phone keyboards send "Unidentified" key events: read what they inserted instead.
          const v = e.currentTarget.value
          e.currentTarget.value = ''
          for (const ch of v) onChar(ch)
        }}
      />
      <div
        ref={box}
        className={cx('typing-text relative overflow-hidden whitespace-pre-wrap break-words px-1 font-mono text-xl leading-[2.4rem] sm:text-2xl sm:leading-[2.75rem]', !focused && !disabled && 'blur-[2px]')}
        style={{ maxHeight: `calc(${lines} * (var(--line, 2.75rem)))` }}
      >
        <Chars target={target} typed={typed} />
      </div>
      {!focused && !disabled && (
        <button type="button" onClick={() => input.current?.focus()} className="absolute inset-0 grid place-items-center rounded-xl text-sm font-medium text-muted">
          <span className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 shadow-sm"><MousePointerClick size={16} /> Click here to start typing</span>
        </button>
      )}
    </div>
  )
}

const Chars = memo(function Chars({ target, typed }: { target: string; typed: string }) {
  const out: React.ReactNode[] = []
  for (let i = 0; i < target.length; i++) {
    const t = target[i]
    const state = i < typed.length ? (typed[i] === t ? 'ok' : 'bad') : i === typed.length ? 'cur' : 'todo'
    const shown = t === '\n' ? '↵' : t === ' ' && state === 'bad' ? '·' : t
    out.push(
      <span
        key={i}
        data-caret={state === 'cur' || undefined}
        className={cx(
          state === 'ok' && 'text-text',
          state === 'bad' && 'rounded-sm bg-bad/20 text-bad',
          state === 'todo' && 'text-muted/70',
          state === 'cur' && 'typing-caret text-muted',
          t === '\n' && 'text-[0.7em] opacity-60',
        )}
      >
        {shown}
      </span>,
    )
    if (t === '\n') out.push(<br key={`br${i}`} />)
  }
  if (typed.length >= target.length) out.push(<span key="end" data-caret className="typing-caret">{' '}</span>)
  return <>{out}</>
})
