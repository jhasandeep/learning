import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NOTE_TOPICS_BY_ID } from '@/data/notes'
import { QUESTION_SETS, QUESTION_SETS_BY_ID } from '@/data/questions'
import { techNode } from '@/lib/mindmap'
import '../../notes/notes.css'
import { MindMap } from '../mind-map'

export function generateStaticParams() {
  return QUESTION_SETS.map((s) => ({ tech: s.id }))
}

export async function generateMetadata({ params }: PageProps<'/map/[tech]'>): Promise<Metadata> {
  const s = QUESTION_SETS_BY_ID[(await params).tech]
  return s ? { title: `${s.title} mind map`, description: `Every ${s.title} concept on one zoomable map.` } : { title: 'Mind map' }
}

export default async function Page({ params }: PageProps<'/map/[tech]'>) {
  const set = QUESTION_SETS_BY_ID[(await params).tech]
  if (!set) notFound()
  return <MindMap key={set.id} root={techNode(set, set.notesId ? NOTE_TOPICS_BY_ID[set.notesId] : undefined)} initial="all" />
}
