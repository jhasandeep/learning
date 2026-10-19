'use client'

import { ArrowRight, Flame, Hash, Shuffle, Trophy } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { buttonClass, Card, ProgressBar } from '@/components/ui'
import { ALGORITHMS } from '@/data/algorithms'
import { BUG_CATEGORY_COUNT, ENDLESS_COUNT, nextUnsolved } from '@/lib/endless'
import { CATEGORY_INFO } from '@/lib/mutate'
import { useProgress } from '@/lib/progress'

export function EndlessHome() {
  const p = useProgress()
  const router = useRouter()
  const [jump, setJump] = useState('')
  const solvedCount = Object.keys(p.endless.solved).length
  const resume = nextUnsolved(p.endless.solved, p.endless.last + 1)

  const onJump = (e: FormEvent) => {
    e.preventDefault()
    const n = Number(jump)
    if (Number.isInteger(n) && n >= 1 && n <= ENDLESS_COUNT) router.push(`/endless/${n}`)
  }

  const randomUnsolved = () => {
    const open = Array.from({ length: ENDLESS_COUNT }, (_, i) => i + 1).filter((n) => !p.endless.solved[n])
    const pool = open.length ? open : [1]
    router.push(`/endless/${pool[Math.floor(Math.random() * pool.length)]}`)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-warn/10 blur-3xl" aria-hidden />
        <p className="text-sm font-medium text-warn">Endless mode</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Fix bug after bug. Keep the streak alive.</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Every level is a correct algorithm with one injected bug. All {ENDLESS_COUNT} bugs were verified by actually running the tests — no fake levels, no bugs that secretly still pass.
          Level numbers are stable, so you can share a link to a tricky one.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={`/endless/${resume}`} className={buttonClass('primary')}>
            {solvedCount === 0 ? 'Start level 1' : `Resume at #${resume}`} <ArrowRight size={16} />
          </Link>
          <button type="button" onClick={randomUnsolved} className={buttonClass('secondary')}><Shuffle size={16} /> Random unsolved</button>
          <form onSubmit={onJump} className="flex items-center gap-2">
            <label htmlFor="jump" className="sr-only">Jump to level</label>
            <div className="flex h-10 items-center rounded-lg border border-line bg-surface-2 px-3 focus-within:border-accent">
              <Hash size={14} className="text-muted" />
              <input
                id="jump" inputMode="numeric" value={jump} onChange={(e) => setJump(e.target.value.replace(/\D/g, ''))}
                placeholder={`1–${ENDLESS_COUNT}`} className="w-20 bg-transparent px-2 text-sm outline-none"
              />
            </div>
            <button type="submit" className={buttonClass('ghost')}>Go</button>
          </form>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="flex items-center gap-2 text-sm text-muted"><Flame size={16} className="text-warn" /> Current streak</p>
          <p className="mt-2 text-3xl font-semibold">{p.endless.streak}</p>
          <p className="text-xs text-muted">solves in a row without revealing the fix</p>
        </Card>
        <Card className="p-5">
          <p className="flex items-center gap-2 text-sm text-muted"><Trophy size={16} className="text-accent" /> Best streak</p>
          <p className="mt-2 text-3xl font-semibold">{p.endless.best}</p>
          <p className="text-xs text-muted">+5 XP bonus per streak step (max +50)</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">Bugs fixed</p>
          <p className="mt-2 text-3xl font-semibold">{solvedCount}<span className="text-base text-muted"> / {ENDLESS_COUNT}</span></p>
          <ProgressBar value={solvedCount / ENDLESS_COUNT} className="mt-2" color="var(--warn)" />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">{BUG_CATEGORY_COUNT} kinds of bugs</h2>
          <ul className="space-y-2 text-sm">
            {Object.values(CATEGORY_INFO).map((c) => (
              <li key={c.label} className="rounded-lg bg-surface-2/60 px-3 py-2">
                <span className="font-medium">{c.label}</span>
                <span className="text-muted"> — {c.hint}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">{ALGORITHMS.length} algorithms</h2>
          <ul className="flex flex-wrap gap-2">
            {ALGORITHMS.map((a) => (
              <li key={a.id} className="rounded-full border border-line bg-surface-2/60 px-3 py-1 text-xs">
                {a.title} <span className="text-muted">· {a.topic}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
