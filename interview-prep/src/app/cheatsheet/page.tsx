import type { Metadata } from 'next'
import { NOTE_CATEGORIES, NOTE_TOPICS_BY_ID } from '@/data/notes'
import { SHEETS } from '@/data/cheatsheet'
import { CheatSheet, type SheetView } from './cheatsheet'

export const metadata: Metadata = {
  title: 'Cheat sheet',
  description: 'One-page quick revision for every technology: HTML, CSS, JavaScript, TypeScript, React, Next.js, Node.js, Express, Python, Django, FastAPI, security, SQL, MongoDB, Git, Docker and testing.',
}

export default function Page() {
  const sheets: SheetView[] = SHEETS.flatMap((s) => {
    const t = NOTE_TOPICS_BY_ID[s.id]
    if (!t) return []
    return [{ ...s, title: t.title, badge: t.badge, color: t.color, category: t.category }]
  })
  return <CheatSheet sheets={sheets} categories={NOTE_CATEGORIES} />
}
