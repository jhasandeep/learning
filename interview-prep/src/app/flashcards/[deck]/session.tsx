'use client'

import { ChevronLeft, PartyPopper, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/components/toast'
import { Button, buttonClass, cx, Kbd, ProgressBar } from '@/components/ui'
import { DECKS_BY_ID, type Card } from '@/data/decks'
import { readProgress, recordReview } from '@/lib/progress'
import { buildSession, dayKey, INTERVAL_DAYS, MAX_BOX, type Grade } from '@/lib/srs'

type Mode = 'due' | 'all'

function intervalLabel(box: number | undefined, grade: Grade): string {
  if (grade === 'again') return 'today'
  const next = Math.min(MAX_BOX, (box ?? 0) + (grade === 'easy' ? 2 : 1))
  const days = INTERVAL_DAYS[next]
  return days === 1 ? '1 day' : `${days} days`
}

export function Session({ deckId }: { deckId: string }) {
  const deck = DECKS_BY_ID[deckId]
  const color = deck.color
  const toast = useToast()
  const [mode, setMode] = useState<Mode>('due')
  const [queue, setQueue] = useState<Card[] | null>(null)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [tally, setTally] = useState({ again: 0, good: 0, easy: 0, xp: 0 })

  const start = useCallback((m: Mode) => {
    const states = readProgress().cards
    setMode(m)
    setQueue(m === 'all' ? [...deck.cards] : buildSession(deck.cards, states, dayKey()))
    setIndex(0)
    setFlipped(false)
    setTally({ again: 0, good: 0, easy: 0, xp: 0 })
  }, [deck.cards])

  // Build the queue after mount: it depends on progress saved in this browser
  // (and the #all hash), neither of which exists during prerendering.
  useEffect(() => {
    const id = requestAnimationFrame(() => start(window.location.hash === '#all' ? 'all' : 'due'))
    return () => cancelAnimationFrame(id)
  }, [start])

  const card = queue?.[index]
  const box = card ? readProgress().cards[card.id]?.box : undefined

  const grade = useCallback((g: Grade) => {
    if (!card || !flipped) return
    const xp = recordReview(card.id, g)
    setTally((t) => ({ ...t, [g]: t[g] + 1, xp: t.xp + xp }))
    // Missed cards come back at the end of this session too.
    if (g === 'again') setQueue((q) => (q ? [...q, card] : q))
    setIndex((i) => i + 1)
    setFlipped(false)
  }, [card, flipped])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea')) return
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault()
        setFlipped((f) => !f)
      }
      if (e.key === '1') grade('again')
      if (e.key === '2') grade('good')
      if (e.key === '3') grade('easy')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [grade])

  useEffect(() => {
    if (queue && queue.length > 0 && index === queue.length) toast(`Session done · +${tally.xp} XP`, 'good')
  }, [index, queue, tally.xp, toast])

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/flashcards" className="inline-flex items-center gap-1 text-sm text-muted hover:text-text"><ChevronLeft size={16} /> Flashcards</Link>
        <span className="text-sm text-muted">/</span>
        <span className="text-sm font-medium">{deck.title}</span>
        <div className="ml-auto flex rounded-lg border border-line bg-surface p-0.5 text-sm" role="group" aria-label="Session mode">
          {(['due', 'all'] as const).map((m) => (
            <button key={m} type="button" aria-pressed={mode === m} onClick={() => start(m)} className={cx('rounded-md px-3 py-1', mode === m ? 'bg-surface-2 text-text' : 'text-muted')}>
              {m === 'due' ? 'Due + new' : `All ${deck.cards.length}`}
            </button>
          ))}
        </div>
      </div>

      {queue === null ? (
        <div className="h-80 animate-pulse rounded-3xl border border-line bg-surface" />
      ) : !card ? (
        <Finished total={queue.length} tally={tally} color={color} onRestart={() => start('all')} />
      ) : (
        <>
          <div className="mb-3 flex items-center gap-3 text-sm text-muted">
            <ProgressBar value={index / queue.length} className="flex-1" color={color} />
            <span>{index + 1} / {queue.length}</span>
          </div>

          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="flip-card block w-full text-left"
            data-flipped={flipped}
            aria-label={flipped ? 'Show question' : 'Show answer'}
          >
            <div className="flip-inner relative min-h-80">
              <div className="flip-face absolute inset-0 flex flex-col rounded-3xl border border-line bg-surface p-8">
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color }}>Question</span>
                <p className="my-auto text-xl font-medium leading-relaxed sm:text-2xl">{card.q}</p>
                <span className="flex items-center gap-2 text-xs text-muted">Click or press <Kbd>Space</Kbd> to reveal</span>
              </div>
              <div className="flip-face flip-back absolute inset-0 flex flex-col overflow-y-auto rounded-3xl border bg-surface p-8" style={{ borderColor: color }}>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color }}>Answer</span>
                <p className="mt-2 text-sm text-muted">{card.q}</p>
                <p className="my-auto py-4 text-base leading-relaxed sm:text-lg">{card.a}</p>
              </div>
            </div>
          </button>

          <div className={cx('mt-4 grid grid-cols-3 gap-3 transition', flipped ? 'opacity-100' : 'pointer-events-none opacity-30')} aria-hidden={!flipped}>
            {([
              ['again', 'Again', 'border-bad/40 text-bad hover:bg-bad/10', '1'],
              ['good', 'Good', 'border-accent/40 text-accent hover:bg-accent/10', '2'],
              ['easy', 'Easy', 'border-good/40 text-good hover:bg-good/10', '3'],
            ] as const).map(([g, label, cls, key]) => (
              <button key={g} type="button" onClick={() => grade(g)} tabIndex={flipped ? 0 : -1} className={cx('rounded-2xl border bg-surface px-3 py-3 text-center transition', cls)}>
                <span className="block font-semibold">{label}</span>
                <span className="block text-xs text-muted">next: {intervalLabel(box, g)} · <Kbd>{key}</Kbd></span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Finished({ total, tally, color, onRestart }: { total: number; tally: { again: number; good: number; easy: number; xp: number }; color: string; onRestart: () => void }) {
  return (
    <div className="animate-pop rounded-3xl border border-line bg-surface p-8 text-center">
      <PartyPopper size={40} className="mx-auto" style={{ color }} />
      <h1 className="mt-3 text-2xl font-semibold">{total === 0 ? 'Nothing due right now' : 'Session complete'}</h1>
      <p className="mt-1 text-sm text-muted">
        {total === 0 ? 'Every card in this deck is scheduled for later. Come back tomorrow, or review them all now.' : `+${tally.xp} XP · ${tally.easy} easy · ${tally.good} good · ${tally.again} again`}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={onRestart}><RotateCcw size={16} /> Review all cards</Button>
        <Link href="/flashcards" className={buttonClass('primary')}>Other decks</Link>
      </div>
    </div>
  )
}
