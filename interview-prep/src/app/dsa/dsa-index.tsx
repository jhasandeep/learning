'use client'

import { ArrowRight, CircleCheck, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { buttonClass, ProgressBar } from '@/components/ui'
import { useProgress } from '@/lib/progress'

export interface ModuleCard {
  id: string
  title: string
  level: string
  blurb: string
  color: string
  lessons: { id: string; title: string; topic: string; blurb: string; steps: number; key: string }[]
}

export function DsaIndex({ modules }: { modules: ModuleCard[] }) {
  const p = useProgress()
  const all = modules.flatMap((m) => m.lessons.map((l) => ({ m, l })))
  const done = all.filter(({ l }) => p.tasks[l.key]).length
  const next = all.find(({ l }) => !p.tasks[l.key]) ?? all[0]

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <p className="flex items-center gap-2 text-sm font-medium text-good"><GraduationCap size={16} /> DSA course</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Learn data structures and algorithms, step by step</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Every lesson is one coding question, taught in <b>Python and JavaScript</b>: the plain idea first, then the slow way, then the better way, a visual dry run, and an exercise you solve right on the page. Lessons go from easy to hard, so you never have to leave to look something up.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <ProgressBar value={all.length ? done / all.length : 0} className="w-48" color="var(--good)" />
          <span className="text-sm text-muted">{done} / {all.length} lessons done</span>
          {next && <Link href={`/dsa/${next.m.id}/${next.l.id}`} className={`${buttonClass('primary')} ml-auto`}>{done === 0 ? 'Start lesson 1' : done === all.length ? 'Review a lesson' : 'Continue'} <ArrowRight size={16} /></Link>}
        </div>
      </header>

      {modules.map((m, mi) => {
        const doneIn = m.lessons.filter((l) => p.tasks[l.key]).length
        return (
          <section key={m.id} aria-labelledby={`m-${m.id}`}>
            <div className="mb-3 flex flex-wrap items-baseline gap-3">
              <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ background: m.color }}>{m.level}</span>
              <h2 id={`m-${m.id}`} className="text-xl font-semibold">{mi + 1}. {m.title}</h2>
              <span className="ml-auto text-sm text-muted">{doneIn} / {m.lessons.length} done</span>
            </div>
            <p className="mb-4 text-sm text-muted">{m.blurb}</p>
            <ol className="space-y-3">
              {m.lessons.map((l, i) => {
                const isDone = Boolean(p.tasks[l.key])
                return (
                  <li key={l.id}>
                    <Link href={`/dsa/${m.id}/${l.id}`} className="flex items-start gap-4 rounded-2xl border border-line bg-surface p-4 transition hover:border-line-strong">
                      <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-full text-sm font-bold text-white" style={{ background: isDone ? 'var(--good)' : m.color }}>
                        {isDone ? <CircleCheck size={18} /> : i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{l.title}</span>
                        <span className="mt-0.5 block text-sm text-muted">{l.blurb}</span>
                        <span className="mt-1.5 inline-block rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">{l.topic}</span>
                      </span>
                      <span className="mt-1 hidden text-xs text-muted sm:block">{l.steps} ways</span>
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
