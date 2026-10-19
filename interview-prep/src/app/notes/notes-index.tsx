'use client'

import { CircleCheck, Download, FileText, Search } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { TechTile } from '@/components/tech-icon'
import { ProgressBar } from '@/components/ui'
import type { NoteCategory } from '@/data/notes'
import { useProgress } from '@/lib/progress'

export interface TopicCard {
  id: string
  title: string
  tagline: string
  category: NoteCategory
  badge: string
  color: string
  sections: { id: string; title: string }[]
  qa: number
  search: string
}

const PDFS = [
  { file: '/notes/system-design.pdf', title: 'System Design', pages: 48, text: 'Load balancers, CDN, caching, sharding, CAP, queues, microservices, rate limiting, JWT, and the Instagram, IRCTC and UPI case studies.' },
  { file: '/notes/dsa-python-js.pdf', title: 'DSA in Python & JavaScript', pages: 33, text: 'Big-O, the four patterns, recursion, searching, sorting and string problems — every solution in both languages.' },
  { file: '/notes/dsa-handwritten.pdf', title: 'DSA — handwritten notebook', pages: 38, text: 'The same DSA notes on ruled notebook paper.' },
]

export function NotesIndex({ topics, categories }: { topics: TopicCard[]; categories: NoteCategory[] }) {
  const p = useProgress()
  const [query, setQuery] = useState('')
  const words = useMemo(() => query.toLowerCase().split(/\s+/).filter(Boolean), [query])
  const shown = useMemo(() => topics.filter((t) => words.every((w) => t.search.includes(w))), [topics, words])
  const read = topics.filter((t) => p.notesRead[t.id]).length

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <p className="text-sm font-medium text-good">Revision notes</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">The full-stack interview handbook</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          {topics.length} topics from HTML to Docker, written for revision: definitions, diagrams, real code you can run in the compiler, common mistakes, and rapid-fire Q&amp;A that also becomes a flashcard deck.
          Switch any topic to the handwritten style, or print it to PDF.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <div className="flex h-11 w-full max-w-md items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 focus-within:border-accent">
            <Search size={16} className="text-muted" />
            <label htmlFor="notes-search" className="sr-only">Search notes</label>
            <input id="notes-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search every topic, e.g. “event loop”, “index”, “JWT”…" className="flex-1 bg-transparent text-sm outline-none" />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <ProgressBar value={read / topics.length} className="w-32" color="var(--good)" /> {read}/{topics.length} read
          </div>
        </div>
      </header>

      {categories.map((cat) => {
        const list = shown.filter((t) => t.category === cat)
        if (list.length === 0) return null
        return (
          <section key={cat} aria-labelledby={`cat-${cat}`}>
            <h2 id={`cat-${cat}`} className="mb-3 font-semibold">{cat}</h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((t) => {
                const hits = words.length ? t.sections.filter((s) => words.some((w) => s.title.toLowerCase().includes(w))) : []
                return (
                  <li key={t.id}>
                    <Link href={`/notes/${t.id}`} className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-4 transition hover:-translate-y-0.5 hover:border-line-strong">
                      <div className="flex items-start gap-3">
                        <TechTile id={t.id} color={t.color} size={46} fallback={t.badge} className="transition group-hover:scale-105" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 font-medium group-hover:underline">
                            {t.title}
                            {p.notesRead[t.id] && <CircleCheck size={14} className="text-good" aria-label="read" />}
                          </span>
                          <span className="mt-0.5 block text-sm text-muted">{t.tagline}</span>
                        </span>
                      </div>
                      {hits.length > 0 && <p className="mt-2 text-xs text-accent">Matches: {hits.map((h) => h.title).join(' · ')}</p>}
                      <p className="mt-auto pt-3 text-xs text-muted">{t.sections.length} sections · {t.qa} Q&amp;A</p>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
      {shown.length === 0 && <p className="py-6 text-center text-muted">No topic mentions “{query}”.</p>}

      <section aria-labelledby="pdf-volumes">
        <h2 id="pdf-volumes" className="mb-3 font-semibold">PDF volumes</h2>
        <ul className="grid gap-3 md:grid-cols-3">
          {PDFS.map((n) => (
            <li key={n.file} className="flex flex-col rounded-2xl border border-line bg-surface p-4">
              <span className="flex items-center gap-2 font-medium"><FileText size={16} className="text-good" /> {n.title}</span>
              <p className="mt-1 flex-1 text-sm text-muted">{n.text}</p>
              <div className="mt-3 flex items-center gap-3 text-sm">
                <a href={n.file} target="_blank" rel="noreferrer" className="font-medium text-accent">Open PDF</a>
                <a href={n.file} download className="inline-flex items-center gap-1 text-muted hover:text-text"><Download size={14} /> Download</a>
                <span className="ml-auto text-xs text-muted">{n.pages} pages</span>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-3 rounded-2xl border border-line bg-surface p-4">
          <p className="flex items-center gap-2 font-medium"><FileText size={16} className="text-good" /> Full-stack handwritten notes · one PDF per topic</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {topics.map((t) => (
              <li key={t.id}>
                <a href={`/notes/${t.id}.pdf`} download className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-sm text-muted hover:border-line-strong hover:text-text">
                  <Download size={13} /> {t.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
