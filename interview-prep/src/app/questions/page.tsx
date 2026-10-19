import type { Metadata } from 'next'
import { QUESTION_CATEGORIES, QUESTION_SETS, questionKey } from '@/data/questions'
import { QuestionsIndex, type SetCard } from './questions-index'

export const metadata: Metadata = {
  title: 'Interview questions',
  description: 'The most asked interview questions for every full-stack technology, with answers, code, follow-ups and a practice mode.',
}

export default function Page() {
  const sets: SetCard[] = QUESTION_SETS.map((s) => ({
    id: s.id,
    title: s.title,
    category: s.category,
    color: s.color,
    badge: s.badge,
    keys: s.questions.map((q) => questionKey(s.id, q)),
    easy: s.questions.filter((q) => q.difficulty === 'Easy').length,
    medium: s.questions.filter((q) => q.difficulty === 'Medium').length,
    hard: s.questions.filter((q) => q.difficulty === 'Hard').length,
    top: s.questions.filter((q) => q.freq === 3).length,
    preview: s.questions.filter((q) => q.freq === 3).slice(0, 2).map((q) => q.q.replace(/`/g, '')),
  }))
  return <QuestionsIndex sets={sets} categories={QUESTION_CATEGORIES} />
}
