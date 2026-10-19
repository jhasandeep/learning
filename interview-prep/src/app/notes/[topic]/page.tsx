import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'
import { Caveat, Patrick_Hand } from 'next/font/google'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Blocks } from '@/components/notes/blocks'
import { Inline } from '@/components/notes/inline'
import { TechIcon, TechTile } from '@/components/tech-icon'
import { NOTE_TOPICS, NOTE_TOPICS_BY_ID } from '@/data/notes'
import { HAND_SCRIPT, NoteToolbar } from './note-toolbar'
import '../notes.css'

const handTitle = Caveat({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-hand-title' })
const handBody = Patrick_Hand({ subsets: ['latin'], weight: '400', variable: '--font-hand-body' })

// Notes code that can open straight in the online compiler.
const COMPILER_FOR: Record<string, string> = { html: 'html', css: 'html', javascript: 'javascript', typescript: 'typescript', react: 'typescript', sql: 'sql' }

export function generateStaticParams() {
  return NOTE_TOPICS.map((t) => ({ topic: t.id }))
}

export async function generateMetadata({ params }: PageProps<'/notes/[topic]'>): Promise<Metadata> {
  const t = NOTE_TOPICS_BY_ID[(await params).topic]
  return t ? { title: `${t.title} notes`, description: `${t.title} interview revision notes: ${t.tagline}.` } : { title: 'Notes' }
}

export default async function Page({ params }: PageProps<'/notes/[topic]'>) {
  const { topic: id } = await params
  const topic = NOTE_TOPICS_BY_ID[id]
  if (!topic) notFound()
  const index = NOTE_TOPICS.indexOf(topic)
  const prev = NOTE_TOPICS[index - 1]
  const next = NOTE_TOPICS[index + 1]

  return (
    <div className={`${handTitle.variable} ${handBody.variable} mx-auto max-w-6xl`}>
      <script dangerouslySetInnerHTML={{ __html: HAND_SCRIPT }} />
      <div className="no-print mb-4 flex items-center gap-2 text-sm">
        <Link href="/notes" className="inline-flex items-center gap-1 text-muted hover:text-text"><ChevronLeft size={16} /> Notes</Link>
        <span className="text-muted">/</span>
        <span className="font-medium">{topic.title}</span>
      </div>

      <div className="note-layout grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav aria-label="On this page" className="no-print hidden lg:block">
          <div className="sticky top-20 space-y-1 text-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">On this page</p>
            {topic.sections.map((s, i) => (
              <a key={s.id} href={`#${s.id}`} className="block rounded-lg px-2 py-1 text-muted hover:bg-surface-2 hover:text-text">
                <span className="mr-1.5 font-mono text-xs">{i + 1}.</span>{s.title}
              </a>
            ))}
            <a href="#qa" className="block rounded-lg px-2 py-1 text-muted hover:bg-surface-2 hover:text-text">
              <span className="mr-1.5 font-mono text-xs">{topic.sections.length + 1}.</span>Rapid-fire Q&amp;A
            </a>
          </div>
        </nav>

        <article className="note-article min-w-0 max-w-[860px]">
          <header className="note-head mb-6">
            <div className="flex items-center gap-4">
              <TechTile id={topic.id} color={topic.color} size={60} fallback={topic.badge} className="shadow-sm" />
              <div className="min-w-0">
                <p className="text-sm font-medium" style={{ color: topic.color }}>{topic.category} · revision notes</p>
                <h1 className="note-title mt-0.5 text-4xl font-semibold tracking-tight">{topic.title}</h1>
              </div>
            </div>
            <p className="mt-2 text-muted">{topic.tagline}</p>
            <div className="mt-4"><NoteToolbar topicId={topic.id} deckId={topic.id} compilerLang={COMPILER_FOR[topic.id]} /></div>
          </header>

          {topic.sections.map((s, i) => (
            <section key={s.id} id={s.id} className="note-section">
              <h2 className="note-h2"><span className="num" style={{ background: topic.color }}>{i + 1}</span>{s.title}</h2>
              <Blocks blocks={s.blocks} />
            </section>
          ))}

          <section id="qa" className="note-section">
            <h2 className="note-h2"><span className="num" style={{ background: topic.color }}>{topic.sections.length + 1}</span>Rapid-fire Q&amp;A</h2>
            <dl className="note-qa">
              {topic.qa.map(([q, a]) => (
                <div key={q}>
                  <dt>Q. <Inline text={q} /></dt>
                  <dd><Inline text={a} /></dd>
                </div>
              ))}
            </dl>
          </section>

          <nav aria-label="More notes" className="no-print mt-10 grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
            {prev ? (
              <Link href={`/notes/${prev.id}`} className="rounded-xl border border-line p-4 hover:border-line-strong">
                <span className="flex items-center gap-1 text-xs text-muted"><ChevronLeft size={14} /> Previous</span>
                <span className="flex items-center gap-2 font-medium"><TechIcon id={prev.id} size={18} color={prev.color} />{prev.title}</span>
              </Link>
            ) : <span />}
            {next && (
              <Link href={`/notes/${next.id}`} className="rounded-xl border border-line p-4 text-right hover:border-line-strong">
                <span className="flex items-center justify-end gap-1 text-xs text-muted">Next <ChevronRight size={14} /></span>
                <span className="flex items-center justify-end gap-2 font-medium">{next.title}<TechIcon id={next.id} size={18} color={next.color} /></span>
              </Link>
            )}
          </nav>
        </article>
      </div>
    </div>
  )
}
