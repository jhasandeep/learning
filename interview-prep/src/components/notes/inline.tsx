import type { ReactNode } from 'react'
import { tokenize, type Token } from '@/lib/markup'

function render(tokens: Token[]): ReactNode[] {
  return tokens.map((t, i) => {
    switch (t.type) {
      case 'code':
        return <code key={i} className="note-code">{t.text}</code>
      case 'bold':
        return <strong key={i}>{render(t.children)}</strong>
      case 'hl':
        return <mark key={i} className="note-hl">{render(t.children)}</mark>
      default:
        return t.text
    }
  })
}

/** Renders the notes mini-markup: `code`, **bold**, ==highlight== (see lib/markup). */
export function Inline({ text }: { text: string }) {
  return <>{render(tokenize(text))}</>
}
