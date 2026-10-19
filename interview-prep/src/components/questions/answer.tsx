import { Fragment } from 'react'
import { Inline } from '@/components/notes/inline'

/**
 * Renders an answer: paragraphs separated by blank lines; a run of lines
 * starting with "- " becomes a bullet list, "1. " a numbered list.
 */
export function Answer({ text }: { text: string }) {
  return (
    <div className="space-y-3 leading-relaxed">
      {text.split(/\n\s*\n/).map((para, i) => {
        const lines = para.split('\n')
        const out: React.ReactNode[] = []
        let list: { ordered: boolean; items: string[] } | null = null
        const flush = () => {
          if (!list) return
          const items = list.items.map((it, j) => <li key={j}><Inline text={it} /></li>)
          out.push(list.ordered ? <ol key={out.length} className="list-decimal space-y-1 pl-5 marker:text-muted">{items}</ol> : <ul key={out.length} className="list-disc space-y-1 pl-5 marker:text-accent">{items}</ul>)
          list = null
        }
        for (const line of lines) {
          const bullet = line.match(/^\s*- (.*)$/)
          const numbered = line.match(/^\s*\d+\. (.*)$/)
          if (bullet || numbered) {
            const ordered = Boolean(numbered)
            if (list && list.ordered !== ordered) flush()
            list ??= { ordered, items: [] }
            list.items.push((bullet ?? numbered)![1])
          } else {
            flush()
            out.push(<p key={out.length}><Inline text={line} /></p>)
          }
        }
        flush()
        return <Fragment key={i}>{out}</Fragment>
      })}
    </div>
  )
}
