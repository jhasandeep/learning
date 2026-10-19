import type { Metadata } from 'next'
import { TypingHub } from './typing-hub'

export const metadata: Metadata = {
  title: 'Typing',
  description: 'Learn touch typing from the home row to real code: lessons with an on-screen keyboard and finger guide, timed tests, and your weakest keys.',
}

export default function Page() {
  return <TypingHub />
}
