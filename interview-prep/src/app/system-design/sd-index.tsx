'use client'

import { ArrowRight, CircleCheck, Server } from 'lucide-react'
import Link from 'next/link'
import { buttonClass, ProgressBar } from '@/components/ui'
import { useProgress } from '@/lib/progress'

export interface SdModuleCard {
  id: string
  title: string
  blurb: string
  color: string
  lessons: { id: string; title: string; topic: string; blurb: string; key: string }[]
}

const PARTS = [
  ['🎬', 'See it', 'An animated diagram you can step through, with and without the building block.'],
  ['🌍', 'Real world', 'How well-known systems use it, and what it costs you.'],
  ['⌨️', 'Build it', 'Working code in Python and JavaScript, from a simple version to a good one.'],
  ['🎛️', 'Play', 'A simulator: change the numbers and watch the system react.'],
  ['✅', 'Practice', 'Implement it yourself in the browser, plus a quiz and interview answers.'],
]

export function SdIndex({ modules }: { modules: SdModuleCard[] }) {
  const p = useProgress()
  const all = modules.flatMap((m) => m.lessons.map((l) => ({ m, l })))
  const done = all.filter(({ l }) => p.tasks[l.key]).length
  const next = all.find(({ l }) => !p.tasks[l.key]) ?? all[0]

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <p className="flex items-center gap-2 text-sm font-medium text-good"><Server size={16} /> System design course</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Learn system design by seeing and building each part</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Every lesson takes one building block of large systems and teaches it five ways, so you understand it instead of memorising it. The last lesson puts the pieces together in a full design.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <ProgressBar value={all.length ? done / all.length : 0} className="w-48" color="var(--good)" />
          <span className="text-sm text-muted">{done} / {all.length} lessons done</span>
          {next && <Link href={`/system-design/${next.m.id}/${next.l.id}`} className={`${buttonClass('primary')} ml-auto`}>{done === 0 ? 'Start lesson 1' : done === all.length ? 'Review a lesson' : 'Continue'} <ArrowRight size={16} /></Link>}
        </div>
      </header>

      <section aria-label="What every lesson contains">
        <ul className="grid gap-3 sm:grid-cols-5">
          {PARTS.map(([icon, title, text]) => (
            <li key={title} className="rounded-2xl border border-line bg-surface p-3">
              <p className="text-xl" aria-hidden="true">{icon}</p>
              <p className="mt-1 text-sm font-semibold">{title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      {modules.map((m, mi) => {
        const doneIn = m.lessons.filter((l) => p.tasks[l.key]).length
        return (
          <section key={m.id} aria-labelledby={`m-${m.id}`}>
            <div className="mb-3 flex flex-wrap items-baseline gap-3">
              <h2 id={`m-${m.id}`} className="text-xl font-semibold">{mi + 1}. {m.title}</h2>
              <span className="ml-auto text-sm text-muted">{doneIn} / {m.lessons.length} done</span>
            </div>
            <p className="mb-4 text-sm text-muted">{m.blurb}</p>
            <ol className="space-y-3">
              {m.lessons.map((l, i) => {
                const isDone = Boolean(p.tasks[l.key])
                return (
                  <li key={l.id}>
                    <Link href={`/system-design/${m.id}/${l.id}`} className="flex items-start gap-4 rounded-2xl border border-line bg-surface p-4 transition hover:border-line-strong">
                      <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-full text-sm font-bold text-white" style={{ background: isDone ? 'var(--good)' : m.color }}>
                        {isDone ? <CircleCheck size={18} /> : i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{l.title}</span>
                        <span className="mt-0.5 block text-sm text-muted">{l.blurb}</span>
                        <span className="mt-1.5 inline-block rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">{l.topic}</span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}
    </div>
  )
}
