import { ArrowRight } from 'lucide-react'
import type { Block } from '@/data/notes'
import { CodeActions } from './code-actions'
import { highlight } from './highlight'
import { Inline } from './inline'

// Languages the online compiler can run straight from a notes snippet.
const RUNNABLE = new Set(['javascript', 'typescript', 'sql', 'html', 'python'])

export async function CodeBlock({ block }: { block: Extract<Block, { type: 'code' }> }) {
  const html = await highlight(block.code, block.lang)
  return (
    <figure className="note-box note-codecard">
      <figcaption className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2">
        <span className="note-tag">{block.title ?? block.lang}</span>
        <CodeActions code={block.code} runLang={block.run && RUNNABLE.has(block.lang) ? block.lang : undefined} />
      </figcaption>
      <div className="note-pre" dangerouslySetInnerHTML={{ __html: html }} />
    </figure>
  )
}

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'p':
            return <p key={i} className="note-p"><Inline text={b.text} /></p>
          case 'def':
            return (
              <div key={i} className="note-box note-def">
                <p className="note-box-title">{b.title ?? 'Definition'}</p>
                <p><Inline text={b.text} /></p>
              </div>
            )
          case 'list':
            return (
              <ul key={i} className="note-list">
                {b.items.map((it, j) => <li key={j}><Inline text={it} /></li>)}
              </ul>
            )
          case 'steps':
            return (
              <ol key={i} className="note-steps">
                {b.items.map((it, j) => <li key={j}><Inline text={it} /></li>)}
              </ol>
            )
          case 'code':
            return <CodeBlock key={i} block={b} />
          case 'table':
            return (
              <div key={i} className="note-box overflow-x-auto">
                <table className="note-table">
                  <thead><tr>{b.head.map((h, j) => <th key={j}><Inline text={h} /></th>)}</tr></thead>
                  <tbody>
                    {b.rows.map((row, r) => (
                      <tr key={r}>{row.map((cell, c) => <td key={c}><Inline text={cell} /></td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          case 'flow':
            return (
              <figure key={i} className="note-box note-flow">
                <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-2">
                  {b.steps.map((s, j) => (
                    <span key={j} className="flex items-center gap-1">
                      <span className="note-flow-step" data-tone={j % 4}><Inline text={s} /></span>
                      {j < b.steps.length - 1 && <ArrowRight size={16} className="note-flow-arrow" aria-hidden />}
                    </span>
                  ))}
                </div>
                {b.caption && <figcaption className="note-caption">{b.caption}</figcaption>}
              </figure>
            )
          case 'mistake':
            return (
              <div key={i} className="note-box note-mistake">
                <p className="note-box-title">{b.title ?? 'Common mistake'}</p>
                <p><Inline text={b.text} /></p>
              </div>
            )
          case 'tip':
            return <div key={i} className="note-box note-tip"><Inline text={b.text} /></div>
          case 'revision':
            return (
              <div key={i} className="note-box note-revision">
                <p className="note-box-title">Revision</p>
                <p><Inline text={b.text} /></p>
              </div>
            )
        }
      })}
    </>
  )
}
