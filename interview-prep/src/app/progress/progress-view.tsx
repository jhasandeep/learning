'use client'

import { Award, Download, Flame, Lock, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { useToast } from '@/components/toast'
import { Button, Card, cx, ProgressBar, Ring } from '@/components/ui'
import { CAMPAIGN } from '@/data/campaign'
import { ALL_CARDS } from '@/data/decks'
import { ENDLESS_COUNT } from '@/lib/endless'
import {
  BADGES, dayStreak, exportProgress, importProgress, levelFromXp, resetProgress, useProgress, type Progress,
} from '@/lib/progress'
import { addDays, dayKey } from '@/lib/srs'
import { useToday } from '@/lib/today'

const WEEKS = 18

function Heatmap({ activity, today }: { activity: Progress['activity']; today: string }) {
  // Columns are weeks (oldest → newest), rows are Sunday → Saturday.
  const [y, m, d] = today.split('-').map(Number)
  const weekday = new Date(y, m - 1, d).getDay()
  const start = addDays(today, -weekday - (WEEKS - 1) * 7)
  const days = Array.from({ length: WEEKS * 7 }, (_, i) => addDays(start, i))
  const level = (n: number) => (n === 0 ? 0 : n < 2 ? 1 : n < 4 ? 2 : n < 7 ? 3 : 4)
  const shades = ['var(--surface-2)', 'color-mix(in srgb, var(--good) 30%, var(--surface-2))', 'color-mix(in srgb, var(--good) 55%, var(--surface-2))', 'color-mix(in srgb, var(--good) 80%, var(--surface-2))', 'var(--good)']
  const total = Object.values(activity).reduce((a, b) => a + b, 0)

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="grid w-max grid-flow-col grid-rows-7 gap-1" role="img" aria-label={`${total} practice activities in the last ${WEEKS} weeks`}>
          {days.map((key) => {
            const n = activity[key] ?? 0
            const future = key > today
            return (
              <span
                key={key}
                title={`${key}: ${n} activit${n === 1 ? 'y' : 'ies'}`}
                className={cx('size-3.5 rounded-[3px]', future && 'opacity-0')}
                style={{ background: shades[level(n)] }}
              />
            )
          })}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-xs text-muted">
        Less {shades.map((s) => <span key={s} className="size-3 rounded-[3px]" style={{ background: s }} />)} More
      </div>
    </div>
  )
}

export function ProgressView() {
  const p = useProgress()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const today = useToday()
  const lv = levelFromXp(p.xp)
  const streak = dayStreak(p.activity, today)
  const campaignSolved = CAMPAIGN.filter((l) => p.campaign[l.id]).length
  const endlessSolved = Object.keys(p.endless.solved).length
  const seenCards = ALL_CARDS.filter((c) => p.cards[c.id]).length
  const mastered = ALL_CARDS.filter((c) => (p.cards[c.id]?.box ?? 0) >= 4).length
  const ctx = { campaignTotal: CAMPAIGN.length, today }
  const earned = BADGES.filter((b) => b.earned(p, ctx))

  const download = () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `preparena-progress-${dayKey()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const upload = async (file: File) => {
    try {
      importProgress(await file.text())
      toast('Progress imported', 'good')
    } catch {
      toast('That file is not a PrepArena progress export', 'bad')
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col gap-6 rounded-3xl border border-line bg-surface p-6 sm:flex-row sm:items-center sm:p-8">
        <Ring value={lv.pct} size={112} stroke={10}>
          <span className="text-center leading-tight"><span className="block text-xs text-muted">Level</span><span className="text-3xl">{lv.level}</span></span>
        </Ring>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold tracking-tight">{p.xp.toLocaleString()} XP</h1>
          <p className="text-sm text-muted">{lv.span - lv.into} XP to level {lv.level + 1}</p>
          <ProgressBar value={lv.pct} className="mt-3 max-w-md" />
        </div>
        <div className="flex gap-6 text-center">
          <div><p className="flex items-center justify-center gap-1 text-2xl font-semibold text-warn"><Flame size={20} />{streak}</p><p className="text-xs text-muted">day streak</p></div>
          <div><p className="text-2xl font-semibold">{earned.length}</p><p className="text-xs text-muted">badges</p></div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Campaign" value={`${campaignSolved}/${CAMPAIGN.length}`} pct={campaignSolved / CAMPAIGN.length} color="var(--accent)" />
        <StatCard label="Endless bugs fixed" value={`${endlessSolved}/${ENDLESS_COUNT}`} pct={endlessSolved / ENDLESS_COUNT} color="var(--warn)" sub={`best streak ${p.endless.best}`} />
        <StatCard label="Cards seen" value={`${seenCards}/${ALL_CARDS.length}`} pct={seenCards / ALL_CARDS.length} color="var(--violet)" sub={`${p.reviews} reviews`} />
        <StatCard label="Cards mastered" value={`${mastered}`} pct={mastered / ALL_CARDS.length} color="var(--good)" sub="box 4 or higher" />
      </div>

      <Card className="p-6">
        <h2 className="mb-4 font-semibold">Activity · last {WEEKS} weeks</h2>
        {today ? <Heatmap activity={p.activity} today={today} /> : <div className="h-32 animate-pulse rounded-xl bg-surface-2" />}
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-semibold">Badges</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BADGES.map((b) => {
            const got = b.earned(p, ctx)
            return (
              <li key={b.id} className={cx('flex items-center gap-3 rounded-xl border p-3', got ? 'border-warn/40 bg-warn/5' : 'border-line opacity-60')}>
                <span className={cx('grid size-10 place-items-center rounded-xl', got ? 'bg-warn/15 text-warn' : 'bg-surface-2 text-muted')}>
                  {got ? <Award size={20} /> : <Lock size={16} />}
                </span>
                <span>
                  <span className="block text-sm font-medium">{b.title}</span>
                  <span className="block text-xs text-muted">{b.description}</span>
                </span>
              </li>
            )
          })}
        </ul>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold">Your data</h2>
        <p className="mt-1 text-sm text-muted">Progress is stored only in this browser. Export it to move to another device or keep a backup.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={download}><Download size={16} /> Export JSON</Button>
          <Button onClick={() => fileRef.current?.click()}><Upload size={16} /> Import</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }} />
          {confirmReset ? (
            <>
              <Button variant="danger" onClick={() => { resetProgress(); setConfirmReset(false); toast('Progress reset') }}><Trash2 size={16} /> Yes, delete everything</Button>
              <Button variant="ghost" onClick={() => setConfirmReset(false)}>Cancel</Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => setConfirmReset(true)}><Trash2 size={16} /> Reset progress</Button>
          )}
        </div>
      </Card>
    </div>
  )
}

function StatCard({ label, value, pct, color, sub }: { label: string; value: string; pct: number; color: string; sub?: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <ProgressBar value={pct} className="mt-3" color={color} />
      {sub && <p className="mt-2 text-xs text-muted">{sub}</p>}
    </Card>
  )
}
