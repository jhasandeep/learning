import { Download, FileText } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Revision notes' }

const NOTES = [
  {
    file: '/notes/system-design.pdf',
    title: 'System Design',
    pages: 48,
    text: 'Load balancers, CDN, caching, sharding, CAP, queues, microservices, rate limiting, JWT, plus Instagram, IRCTC Tatkal and UPI case studies.',
    color: 'var(--accent)',
  },
  {
    file: '/notes/dsa-python-js.pdf',
    title: 'DSA in Python & JavaScript',
    pages: 33,
    text: 'Big-O, the four patterns, recursion, searching, sorting and string problems — every solution in both languages, tested.',
    color: 'var(--violet)',
  },
  {
    file: '/notes/dsa-handwritten.pdf',
    title: 'DSA — handwritten notebook',
    pages: 38,
    text: 'The same DSA notes on ruled notebook paper with handwriting and coloured-pen code.',
    color: 'var(--warn)',
  },
]

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <p className="text-sm font-medium text-good">Revision notes</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Read before the round</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">Handwritten-style PDFs with diagrams, common mistakes and rapid-fire Q&amp;A. The flashcards in this app come from the same notes.</p>
      </header>
      <ul className="grid gap-4 md:grid-cols-3">
        {NOTES.map((n) => (
          <li key={n.file} className="flex flex-col rounded-2xl border border-line bg-surface p-5">
            <span className="grid size-10 place-items-center rounded-xl" style={{ color: n.color, background: `color-mix(in srgb, ${n.color} 14%, transparent)` }}>
              <FileText size={20} />
            </span>
            <h2 className="mt-4 font-semibold">{n.title}</h2>
            <p className="mt-1 flex-1 text-sm text-muted">{n.text}</p>
            <div className="mt-4 flex items-center gap-3 text-sm">
              <a href={n.file} target="_blank" rel="noreferrer" className="font-medium" style={{ color: n.color }}>Open PDF</a>
              <a href={n.file} download className="inline-flex items-center gap-1 text-muted hover:text-text"><Download size={14} /> Download</a>
              <span className="ml-auto text-xs text-muted">{n.pages} pages</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
