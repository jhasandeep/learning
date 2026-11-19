import type { Metadata } from 'next'
import { ASSESS_SETS, CODING, assessKey, codingKey } from '@/data/assess'
import { AssessIndex, type CodingCard, type SetCard } from './assess-index'

export const metadata: Metadata = {
  title: 'Company assessment prep',
  description: 'Practice for company hiring tests: MERN stack multiple-choice, aptitude (quantitative, logical, verbal and data interpretation) and timed coding questions you can run in the browser.',
}

export default function Page() {
  const sets: SetCard[] = ASSESS_SETS.map((s) => ({
    id: s.id,
    title: s.title,
    blurb: s.blurb,
    group: s.group,
    color: s.color,
    topics: s.topics,
    minutes: Math.round(s.questions.reduce((n, q) => n + q.estimated_time_seconds, 0) / 60),
    keys: s.questions.map((q) => assessKey(s.id, q.id)),
  }))
  const coding: CodingCard[] = CODING.map((c) => ({ id: c.id, title: c.title, topic: c.topic, blurb: c.blurb, difficulty: c.difficulty, minutes: c.estimated_time_minutes, key: codingKey(c.id), tags: c.tags }))
  return <AssessIndex sets={sets} coding={coding} />
}
