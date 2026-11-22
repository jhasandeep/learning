'use client'

import { ArrowRight, CircleCheck, Eye } from 'lucide-react'
import Link from 'next/link'
import { Inline } from '@/components/notes/inline'
import { buttonClass, cx, ProgressBar } from '@/components/ui'
import { useProgress } from '@/lib/progress'

export function TrackSteps({ track, color, steps }: { track: string; color: string; steps: { id: string; key: string; title: string; task: string }[] }) {
  const p = useProgress()
  const done = steps.filter((s) => p.learn[s.key]).length
  const next = steps.find((s) => !p.learn[s.key])

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <ProgressBar value={done / steps.length} className="min-w-40 flex-1" color={color} />
        <span className="text-sm text-muted">{done}/{steps.length} done</span>
        <Link href={`/learn/${track}/${(next ?? steps[0]).id}`} className={buttonClass('primary')}>
          {done === 0 ? 'Start' : next ? 'Continue' : 'Review'} <ArrowRight size={16} />
        </Link>
      </div>
      <ol className="relative space-y-2 before:absolute before:bottom-6 before:left-[19px] before:top-6 before:w-px before:bg-line">
        {steps.map((s, i) => {
          const r = p.learn[s.key]
          const current = next?.id === s.id
          return (
            <li key={s.id} className="relative">
              <Link
                href={`/learn/${track}/${s.id}`}
                className={cx('group flex gap-4 rounded-2xl border bg-surface p-3 transition hover:border-line-strong', current ? 'border-accent/50 shadow-[0_0_0_1px_var(--accent)]' : 'border-line')}
              >
                <span className={cx('relative z-10 grid size-10 shrink-0 place-items-center rounded-full border-2 text-sm font-semibold', r ? 'border-good bg-good text-white' : current ? 'border-accent bg-surface text-accent' : 'border-line bg-surface text-muted')}>
                  {r ? <CircleCheck size={18} /> : i + 1}
                </span>
                <span className="min-w-0 flex-1 py-0.5">
                  <span className="flex items-center gap-2 font-medium group-hover:text-accent">
                    {s.title}
                    {r?.solution && <span className="inline-flex items-center gap-1 text-[11px] font-normal text-muted"><Eye size={11} /> solution viewed</span>}
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-sm text-muted"><Inline text={s.task} /></span>
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
