import type { Metadata } from 'next'
import { MISTAKE_SETS, mistakeKey } from '@/data/mistakes'
import { QUESTION_SETS_BY_ID } from '@/data/questions'
import { MistakesIndex, type MistakeCard } from './mistakes-index'

export const metadata: Metadata = {
  title: 'Mistakes',
  description: 'Fix broken code, or write it from scratch: Express servers, React todo apps, JavaScript, SQL, HTML and CSS, with instant checks and the real output.',
}

export default function Page() {
  const cards: MistakeCard[] = MISTAKE_SETS.map((s) => {
    const meta = QUESTION_SETS_BY_ID[s.id]
    return { id: s.id, title: s.title, color: meta.color, badge: meta.badge, items: s.items.map((i) => ({ id: i.id, key: mistakeKey(s.id, i.id), title: i.title })) }
  })
  return <MistakesIndex cards={cards} />
}
