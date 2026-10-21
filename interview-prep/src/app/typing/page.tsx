import type { Metadata } from 'next'
import { SYNTAX_LOOK, SYNTAX_SETS } from '@/data/syntax'
import { TypingHub, type SyntaxCard } from './typing-hub'

export const metadata: Metadata = {
  title: 'Typing',
  description: 'Learn touch typing from the home row to real code: lessons with an on-screen keyboard and finger guide, timed tests, interview syntax practice, and your weakest keys.',
}

export default function Page() {
  const syntax: SyntaxCard[] = SYNTAX_SETS.map((s) => ({
    id: s.id,
    title: s.title,
    keys: s.snippets.map((sn) => `${s.id}/${sn.id}`),
    preview: s.snippets.slice(0, 3).map((sn) => sn.title),
    ...(SYNTAX_LOOK[s.id] ?? { icon: s.id, color: '#0891b2' }),
  }))
  return <TypingHub syntax={syntax} />
}
