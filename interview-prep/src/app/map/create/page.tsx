import type { Metadata } from 'next'
import { NOTE_TOPICS_BY_ID } from '@/data/notes'
import { QUESTION_SETS } from '@/data/questions'
import { plainText } from '@/lib/markup'
import { techNode } from '@/lib/mindmap'
import { MapStudio, type MapTemplate } from './map-studio'

export const metadata: Metadata = {
  title: 'Create a mind map',
  description: 'Build your own mind maps: add ideas with the keyboard, colour branches, drag to reorganise, and export as an image or outline.',
}

const short = (s: string, max = 80) => (s.length <= max ? s : `${s.slice(0, s.lastIndexOf(' ', max - 1))}…`)

export default function Page() {
  // Each technology's sections (and a few ideas per section) as a starting point.
  const templates: MapTemplate[] = QUESTION_SETS.map((set) => {
    const tech = techNode(set, set.notesId ? NOTE_TOPICS_BY_ID[set.notesId] : undefined)
    return {
      id: set.id,
      title: set.title,
      color: set.color,
      badge: set.badge,
      branches: (tech.children ?? [])
        .filter((s) => !s.id.endsWith('-most-asked'))
        .map((s) => ({
          text: plainText(s.label).replace(/^\d+\.\s*/, ''),
          points: (s.children ?? []).slice(0, 3).map((c) => short(c.kind === 'flow' && c.steps ? `${plainText(c.label)}: ${c.steps.join(' → ')}` : plainText(c.label))),
        })),
    }
  })
  return <MapStudio templates={templates} />
}
