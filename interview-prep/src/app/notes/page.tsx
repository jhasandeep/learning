import type { Metadata } from 'next'
import { NOTE_CATEGORIES, NOTE_TOPICS, topicText } from '@/data/notes'
import { NotesIndex, type TopicCard } from './notes-index'

export const metadata: Metadata = {
  title: 'Revision notes',
  description: 'Full-stack interview revision notes: HTML, CSS, JavaScript, TypeScript, React, Next.js, Node.js, Express, security, SQL, MongoDB, Git, Docker and testing.',
}

export default function Page() {
  const topics: TopicCard[] = NOTE_TOPICS.map((t) => ({
    id: t.id,
    title: t.title,
    tagline: t.tagline,
    category: t.category,
    badge: t.badge,
    color: t.color,
    sections: t.sections.map((s) => ({ id: s.id, title: s.title })),
    qa: t.qa.length,
    search: topicText(t).toLowerCase(),
  }))
  return <NotesIndex topics={topics} categories={NOTE_CATEGORIES} />
}
