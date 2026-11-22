'use client'

import { CircleCheck, Circle, PencilLine, Wrench } from 'lucide-react'
import Link from 'next/link'
import { Inline } from '@/components/notes/inline'
import { DifficultyBadge } from '@/components/ui'
import { useProgress } from '@/lib/progress'

export function MistakeList({ set, items }: { set: string; color: string; items: { id: string; key: string; title: string; task: string; difficulty: 'Easy' | 'Medium' | 'Hard' }[] }) {
  const p = useProgress()
  return (
    <ol className="space-y-2.5">
      {items.map((i, n) => {
        const fixed = Boolean(p.mistakes[`${i.key}:fix`])
        const written = Boolean(p.mistakes[`${i.key}:write`])
        return (
          <li key={i.id} className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold text-muted">{n + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-medium">{i.title} <DifficultyBadge difficulty={i.difficulty.toLowerCase() as "easy" | "medium" | "hard"} /></p>
                <p className="mt-1 text-sm text-muted"><Inline text={i.task} /></p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/mistakes/${set}/${i.id}?mode=fix`} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:bg-surface-2">
                    <Wrench size={14} className="text-warn" /> Fix it {fixed ? <CircleCheck size={14} className="text-good" /> : <Circle size={14} className="text-muted/50" />}
                  </Link>
                  <Link href={`/mistakes/${set}/${i.id}?mode=write`} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:bg-surface-2">
                    <PencilLine size={14} className="text-accent" /> Write it {written ? <CircleCheck size={14} className="text-good" /> : <Circle size={14} className="text-muted/50" />}
                  </Link>
                </div>
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
