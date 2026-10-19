'use client'

import { useCallback } from 'react'
import { PlayScreen } from '@/components/play-screen'
import { CAMPAIGN } from '@/data/campaign'
import type { Playable } from '@/lib/level'
import { recordCampaignSolve } from '@/lib/progress'

export function CampaignPlay({ id }: { id: string }) {
  const index = CAMPAIGN.findIndex((l) => l.id === id)
  const l = CAMPAIGN[index]
  const next = CAMPAIGN[index + 1]

  const level: Playable = {
    key: `campaign-${l.id}`,
    kind: 'campaign',
    title: l.title,
    topic: l.topic,
    difficulty: l.difficulty,
    story: l.story,
    description: l.description,
    fnName: l.fnName,
    buggy: l.buggy,
    solution: l.solution,
    tests: l.tests,
    hints: l.hints,
    explanation: l.explanation,
    bugs: l.bugs,
  }

  const onSolve = useCallback(
    (hints: number, revealed: boolean, ms: number) => {
      const gain = recordCampaignSolve(l.id, hints, revealed, ms, l.bugs)
      return {
        gain,
        note: next ? undefined : 'That was the final level — the campaign is complete. Endless mode has 140+ more bugs waiting.',
      }
    },
    [l.id, l.bugs, next],
  )

  return (
    <PlayScreen
      level={level}
      label={`Level ${index + 1} of ${CAMPAIGN.length}`}
      backHref="/campaign"
      backLabel="Campaign"
      nextHref={next ? `/campaign/${next.id}` : '/endless'}
      onSolve={onSolve}
    />
  )
}
