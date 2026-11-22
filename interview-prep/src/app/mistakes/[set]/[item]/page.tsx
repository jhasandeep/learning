import { ChevronLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { highlight } from '@/components/notes/highlight'
import { Answer } from '@/components/questions/answer'
import { Inline } from '@/components/notes/inline'
import { MISTAKES_BY_ID, MISTAKE_SETS, blankStart, itemChecks, mistakeKey } from '@/data/mistakes'
import { QUESTION_SETS_BY_ID } from '@/data/questions'
import '../../../notes/notes.css'
import { MistakePlayer } from './mistake-player'

export function generateStaticParams() {
  return MISTAKE_SETS.flatMap((s) => s.items.map((i) => ({ set: s.id, item: i.id })))
}

export async function generateMetadata({ params }: PageProps<'/mistakes/[set]/[item]'>): Promise<Metadata> {
  const { set, item } = await params
  const i = MISTAKES_BY_ID[set]?.items.find((x) => x.id === item)
  return i ? { title: `${i.title} · Mistakes`, description: i.task.replace(/[`*=]/g, '') } : { title: 'Mistakes' }
}

/** Shiki language for an editor language. */
const SHIKI: Record<string, string> = { javascript: 'jsx', html: 'html', css: 'css', sql: 'sql' }
const COMMENT: Record<string, string> = { javascript: '//', html: '<!--', css: '/*', sql: '--' }

export default async function Page({ params }: PageProps<'/mistakes/[set]/[item]'>) {
  const { set: setId, item: itemId } = await params
  const set = MISTAKES_BY_ID[setId]
  const meta = QUESTION_SETS_BY_ID[setId]
  const index = set?.items.findIndex((i) => i.id === itemId) ?? -1
  if (!set || !meta || index < 0) notFound()
  const item = set.items[index]
  const next = set.items[index + 1]
  const shiki = SHIKI[set.lang] ?? 'jsx'

  // A comment-only starting point for "write it": the task, no code.
  const open = COMMENT[set.lang]
  const blank = blankStart(item, open).split('\n').map((l) => (open === '<!--' && l.startsWith('<!-- ') ? `${l} -->` : open === '/*' && l.startsWith('/* ') ? `${l} */` : l)).join('\n')

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <Link href="/mistakes" className="inline-flex items-center gap-1 text-muted hover:text-text"><ChevronLeft size={16} /> Mistakes</Link>
        <span className="text-muted">/</span>
        <Link href={`/mistakes/${setId}`} className="text-muted hover:text-text">{set.title}</Link>
        <span className="text-muted">/</span>
        <span className="font-medium">{item.title}</span>
      </div>
      <MistakePlayer
        key={mistakeKey(setId, item.id)}
        itemKey={mistakeKey(setId, item.id)}
        set={{ id: setId, title: set.title, color: meta.color, badge: meta.badge, kind: set.kind, lang: set.lang, jsx: set.jsx, typescript: set.typescript }}
        title={item.title}
        difficulty={item.difficulty}
        task={<Inline text={item.task} />}
        explain={<Answer text={item.explain} />}
        hints={item.hints.map((h, i) => <Inline key={i} text={h} />)}
        checks={item.tests.map(([name]) => name)}
        input={{ kind: set.kind, tests: itemChecks(item), setup: item.setup, typescript: set.typescript, jsx: set.jsx }}
        broken={item.broken}
        solution={item.solution}
        blank={blank}
        solutionHtml={await highlight(item.solution.replace(/\n$/, ''), shiki)}
        hasOutput={Boolean(item.requests?.length || item.demo)}
        nextHref={next ? `/mistakes/${setId}/${next.id}` : `/mistakes/${setId}`}
        nextLabel={next ? 'Next program' : 'Back to the list'}
      />
    </div>
  )
}
