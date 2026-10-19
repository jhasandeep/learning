import type { Metadata } from 'next'
import { BOARDS } from '@/data/boards'
import { NOTE_CATEGORIES, NOTE_TOPICS_BY_ID } from '@/data/notes'
import { BoardIndex } from './board-index'

export const metadata: Metadata = {
  title: 'Whiteboard',
  description: 'Excalidraw-style whiteboards for learning and teaching: concept boards for every notes topic, PDF slides to annotate, presenting and PDF export.',
}

export default function Page() {
  const groups = NOTE_CATEGORIES.map((cat) => ({
    category: cat,
    boards: BOARDS.filter((b) => b.kind === 'topic' && NOTE_TOPICS_BY_ID[b.topicId].category === cat),
  }))
  return <BoardIndex sketch={BOARDS.filter((b) => b.kind === 'sketch')} groups={groups} pdfs={BOARDS.filter((b) => b.kind === 'pdf')} />
}
