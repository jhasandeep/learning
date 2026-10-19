import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DECKS, DECKS_BY_ID } from '@/data/decks'
import { Session } from './session'

export function generateStaticParams() {
  return DECKS.map((d) => ({ deck: d.id }))
}

export async function generateMetadata({ params }: PageProps<'/flashcards/[deck]'>): Promise<Metadata> {
  const { deck } = await params
  return { title: `${DECKS_BY_ID[deck]?.title ?? 'Deck'} flashcards` }
}

export default async function Page({ params }: PageProps<'/flashcards/[deck]'>) {
  const { deck } = await params
  if (!DECKS_BY_ID[deck]) notFound()
  return <Session key={deck} deckId={deck} />
}
