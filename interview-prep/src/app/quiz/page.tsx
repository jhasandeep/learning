import type { Metadata } from 'next'
import { MCQ_BY_ID, mcqKey } from '@/data/mcq'
import { QUESTION_CATEGORIES, QUESTION_SETS } from '@/data/questions'
import { QuizIndex, type QuizCard } from './quiz-index'

export const metadata: Metadata = {
  title: 'Multiple-choice quiz',
  description: 'Multiple-choice questions for every full-stack technology, with instant feedback and an explanation for each answer.',
}

export default function Page() {
  const cards: QuizCard[] = QUESTION_SETS.filter((s) => MCQ_BY_ID[s.id]).map((s) => ({
    id: s.id,
    title: s.title,
    category: s.category,
    color: s.color,
    badge: s.badge,
    keys: MCQ_BY_ID[s.id].questions.map((q) => mcqKey(s.id, q.id)),
  }))
  return <QuizIndex cards={cards} categories={QUESTION_CATEGORIES} />
}
