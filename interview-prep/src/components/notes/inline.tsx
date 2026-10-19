import { Fragment } from 'react'

/** Renders the notes mini-markup: `code`, **bold**, ==highlight==. */
export function Inline({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|==[^=]+==)/)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
          return <code key={i} className="note-code">{part.slice(1, -1)}</code>
        }
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
        if (part.startsWith('==') && part.endsWith('==')) return <mark key={i} className="note-hl">{part.slice(2, -2)}</mark>
        return <Fragment key={i}>{part}</Fragment>
      })}
    </>
  )
}
