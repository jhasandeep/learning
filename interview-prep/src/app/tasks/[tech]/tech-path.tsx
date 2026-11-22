'use client'

import { ArrowRight, BookOpen, CircleCheck, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { Inline } from '@/components/notes/inline'
import { TechTile } from '@/components/tech-icon'
import { buttonClass } from '@/components/ui'
import { useProgress } from '@/lib/progress'

interface Item { id: string; title: string; goal: string; steps: number }

export function TechPath({ id, title, blurb, color, badge, tasks }: { id: string; title: string; blurb: string; color: string; badge: string; tasks: Item[] }) {
  const p = useProgress()
  const done = tasks.filter((t) => p.tasks[`${id}/${t.id}`]).length
  const nextIndex = tasks.findIndex((t) => !p.tasks[`${id}/${t.id}`])
  const next = tasks[nextIndex === -1 ? 0 : nextIndex]

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/tasks" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-text"><ChevronLeft size={16} /> All tasks</Link>
      <header className="flex items-center gap-4">
        <TechTile id={id} color={color} size={60} fallback={badge} />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{title} tasks</h1>
          <p className="text-muted">{blurb}</p>
        </div>
      </header>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="h-2 w-56 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full" style={{ width: `${(done / tasks.length) * 100}%`, background: color }} /></div>
        <span className="text-sm text-muted">{done} / {tasks.length} done</span>
        <Link href={`/tasks/${id}/${next.id}`} className={`${buttonClass('primary')} ml-auto`}>{done === 0 ? 'Start the first task' : done === tasks.length ? 'Review a task' : 'Continue'} <ArrowRight size={16} /></Link>
        <Link href={`/notes/${id}`} className={buttonClass('secondary')}><BookOpen size={15} /> Read the notes</Link>
      </div>

      <ol className="mt-8 space-y-3">
        {tasks.map((t, i) => {
          const isDone = Boolean(p.tasks[`${id}/${t.id}`])
          return (
            <li key={t.id}>
              <Link href={`/tasks/${id}/${t.id}`} className="flex items-start gap-4 rounded-2xl border border-line bg-surface p-4 transition hover:border-line-strong">
                <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-full text-sm font-bold text-white" style={{ background: isDone ? 'var(--good)' : color }}>
                  {isDone ? <CircleCheck size={18} /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{t.title}</span>
                  <span className="mt-0.5 block text-sm text-muted"><Inline text={t.goal} /></span>
                </span>
                <span className="mt-1 hidden text-xs text-muted sm:block">{t.steps} steps</span>
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
