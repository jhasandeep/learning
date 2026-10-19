'use client'

import { CircleDot, Download, FileText, Frame, MonitorPlay, PenTool, Shapes } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { BoardDef } from '@/data/boards'
import { savedBoardIds } from '@/lib/board/store'

const HOW = [
  { icon: PenTool, title: 'Learn by drawing', text: 'Every notes topic is a ready-made hand-drawn board. Add your own arrows, doodles and examples on top.' },
  { icon: Frame, title: 'Frames are slides', text: 'Each section is a frame. Press F to frame anything you draw, and it becomes a slide too.' },
  { icon: MonitorPlay, title: 'Teach it', text: 'Present goes full screen, steps through the slides with the arrow keys, and has a laser pointer and a pen.' },
  { icon: Shapes, title: 'Teaching shapes', text: 'The library holds client, server, database, cache, queue and load balancer shapes, plus note callouts.' },
  { icon: FileText, title: 'PDFs in and out', text: 'Import any PDF to annotate it page by page. Export PDF downloads the board with one page per slide.' },
]

export function BoardIndex({ sketch, groups, pdfs }: { sketch: BoardDef[]; groups: { category: string; boards: BoardDef[] }[]; pdfs: BoardDef[] }) {
  const [saved, setSaved] = useState<Set<string>>(new Set())
  useEffect(() => {
    savedBoardIds().then((ids) => setSaved(new Set(ids))).catch(() => {})
  }, [])
  const mark = (id: string) => saved.has(id) && <CircleDot size={12} className="shrink-0 text-good" aria-label="has your edits" />
  const topics = groups.flatMap((g) => g.boards)

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <p className="text-sm font-medium text-violet">Whiteboard</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Draw it, explain it, teach it</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          An Excalidraw whiteboard with a concept board for each of the {topics.length} notes topics, generated from the notes: definitions, flow diagrams, tables, code and Q&amp;A sticky notes, one slide per section.
          Present them, annotate PDFs, and download any board as a PDF. Boards are saved in your browser.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {sketch.map((b) => (
            <Link key={b.id} href={`/board/${b.id}`} className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-white shadow hover:opacity-90">
              <PenTool size={16} /> Open my sketchbook {mark(b.id)}
            </Link>
          ))}
          <Link href="/board/javascript" className="inline-flex h-10 items-center gap-2 rounded-xl border border-line px-4 text-sm font-medium hover:border-line-strong">
            <MonitorPlay size={16} /> Try a concept board
          </Link>
        </div>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {HOW.map((h) => (
          <li key={h.title} className="rounded-2xl border border-line bg-surface p-4">
            <h.icon size={18} className="text-violet" />
            <p className="mt-2 text-sm font-medium">{h.title}</p>
            <p className="mt-1 text-xs text-muted">{h.text}</p>
          </li>
        ))}
      </ul>

      {groups.map((g) => (
        <section key={g.category} aria-labelledby={`b-${g.category}`}>
          <h2 id={`b-${g.category}`} className="mb-3 font-semibold">{g.category} concept boards</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.boards.map((b) => b.kind === 'topic' && (
              <li key={b.id} className="flex flex-col rounded-2xl border border-line bg-surface p-4 transition hover:border-line-strong">
                <Link href={`/board/${b.id}`} className="group flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl font-mono text-xs font-bold" style={{ color: b.color, background: `color-mix(in srgb, ${b.color} 13%, transparent)` }}>{b.badge}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 font-medium group-hover:underline">{b.title} {mark(b.id)}</span>
                    <span className="mt-0.5 block text-sm text-muted">{b.text}</span>
                  </span>
                </Link>
                <div className="mt-3 flex items-center gap-3 pt-1 text-xs">
                  <Link href={`/board/${b.id}`} className="font-medium text-accent">Open board</Link>
                  <a href={`/notes/boards/${b.id}.pdf`} download className="inline-flex items-center gap-1 text-muted hover:text-text"><Download size={12} /> Board PDF</a>
                  <a href={`/notes/${b.id}.pdf`} download className="inline-flex items-center gap-1 text-muted hover:text-text"><Download size={12} /> Notes PDF</a>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section aria-labelledby="pdf-boards">
        <h2 id="pdf-boards" className="mb-1 font-semibold">Teach from the PDF volumes</h2>
        <p className="mb-3 text-sm text-muted">The first time you open one, each page is turned into a slide you can draw on. That takes a few seconds.</p>
        <ul className="grid gap-3 md:grid-cols-3">
          {pdfs.map((b) => b.kind === 'pdf' && (
            <li key={b.id}>
              <Link href={`/board/${b.id}`} className="flex h-full flex-col rounded-2xl border border-line bg-surface p-4 hover:border-line-strong">
                <span className="flex items-center gap-2 font-medium"><FileText size={16} className="text-good" /> {b.title} {mark(b.id)}</span>
                <span className="mt-1 text-sm text-muted">{b.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
