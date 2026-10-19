import type { Metadata } from 'next'
import { DeckList } from './deck-list'

export const metadata: Metadata = { title: 'Flashcards' }

export default function Page() {
  return <DeckList />
}
