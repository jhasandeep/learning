import type { Metadata } from 'next'
import { codeSnippets } from '@/lib/typing-snippets'
import { TypingTest } from './typing-test'

export const metadata: Metadata = {
  title: 'Typing test',
  description: 'A timed typing test: words, punctuation, numbers or real code. See your WPM, accuracy and weakest keys.',
}

export default function Page() {
  return <TypingTest code={codeSnippets().javascript} />
}
