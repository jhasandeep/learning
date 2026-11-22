import type { Metadata } from 'next'
import { LEARN_TRACKS, learnKey } from '@/data/learn'
import { QUESTION_CATEGORIES, QUESTION_SETS_BY_ID } from '@/data/questions'
import { LearnIndex, type TrackCard } from './learn-index'

export const metadata: Metadata = {
  title: 'Learn to code',
  description: 'Step-by-step coding lessons for every technology: read a short idea, write the code, and get it checked instantly.',
}

export default function Page() {
  const cards: TrackCard[] = LEARN_TRACKS.map((t) => {
    const meta = QUESTION_SETS_BY_ID[t.id]
    return {
      id: t.id,
      title: meta.title,
      category: meta.category,
      color: meta.color,
      badge: meta.badge,
      intro: t.intro,
      steps: t.steps.map((s) => ({ id: s.id, key: learnKey(t.id, s.id), title: s.title })),
    }
  })
  return <LearnIndex cards={cards} categories={QUESTION_CATEGORIES} />
}
