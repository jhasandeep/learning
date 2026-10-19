import type { Metadata } from 'next'
import { NOTE_TOPICS_BY_ID } from '@/data/notes'
import { QUESTION_CATEGORIES, QUESTION_SETS } from '@/data/questions'
import { buildMap } from '@/lib/mindmap'
import '../notes/notes.css'
import { MindMap } from './mind-map'

export const metadata: Metadata = {
  title: 'Mind map',
  description: 'A zoomable visual map of every full-stack topic: technologies, sections, definitions, flows, common mistakes and the most-asked questions.',
}

export default function Page() {
  return <MindMap root={buildMap(QUESTION_SETS, NOTE_TOPICS_BY_ID, QUESTION_CATEGORIES)} initial="overview" />
}
