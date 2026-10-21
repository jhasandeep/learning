import type { Metadata } from 'next'
import { SYNTAX_SETS } from '@/data/syntax'
import { TypingTest } from './typing-test'

export const metadata: Metadata = {
  title: 'Typing test',
  description: 'A timed typing test (15 s to 10 min, or Auto): words, punctuation, numbers or interview code. See your WPM, accuracy and weakest keys.',
}

export default function Page() {
  return <TypingTest code={SYNTAX_SETS.map((s) => ({ id: s.id, title: s.title, snippets: s.snippets.map((sn) => sn.code) }))} />
}
