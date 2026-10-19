import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BOARDS, BOARDS_BY_ID } from '@/data/boards'
import { BoardClient } from './board-client'

export function generateStaticParams() {
  return BOARDS.map((b) => ({ id: b.id }))
}

export async function generateMetadata({ params }: PageProps<'/board/[id]'>): Promise<Metadata> {
  const b = BOARDS_BY_ID[(await params).id]
  return b ? { title: `${b.title} · whiteboard`, description: b.text } : { title: 'Whiteboard' }
}

export default async function Page({ params }: PageProps<'/board/[id]'>) {
  const def = BOARDS_BY_ID[(await params).id]
  if (!def) notFound()
  return <BoardClient key={def.id} def={def} />
}
