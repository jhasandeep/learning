'use client'

import { Flame, SkipForward } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { PlayScreen } from '@/components/play-screen'
import { Button } from '@/components/ui'
import { ENDLESS_COUNT, getEndlessLevel } from '@/lib/endless'
import { breakEndlessStreak, recordEndlessSolve, useProgress } from '@/lib/progress'

export function EndlessPlay({ n }: { n: number }) {
  const router = useRouter()
  const p = useProgress()
  const level = useMemo(() => getEndlessLevel(n), [n])
  const next = n < ENDLESS_COUNT ? n + 1 : 1

  const onSolve = useCallback((hints: number, revealed: boolean, ms: number) => {
    const { gain, streak } = recordEndlessSolve(n, hints, revealed, ms)
    return {
      gain,
      note: revealed
        ? 'Revealing the fix resets your streak — try the next one without it.'
        : gain === 0
          ? `Already solved before, so no new XP. Streak: ${streak} 🔥`
          : `Streak: ${streak} 🔥${streak > 1 ? ` (+${5 * Math.min(streak, 10)} streak bonus)` : ''}`,
    }
  }, [n])

  const skip = () => {
    breakEndlessStreak()
    router.push(`/endless/${next}`)
  }

  return (
    <PlayScreen
      level={level}
      label={`Endless #${n}`}
      backHref="/endless"
      backLabel="Endless"
      nextHref={`/endless/${next}`}
      onSolve={onSolve}
      headerExtra={
        <>
          <span className="flex items-center gap-1.5 rounded-full border border-warn/30 bg-warn/10 px-2.5 py-1 text-sm text-warn" title="Current streak">
            <Flame size={14} /> {p.endless.streak}
          </span>
          <Button size="sm" variant="ghost" onClick={skip} title="Skip (resets streak)">
            <SkipForward size={14} /> Skip
          </Button>
        </>
      }
    />
  )
}
