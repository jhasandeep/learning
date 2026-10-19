// Whiteboards: a free sketch board, a concept board per notes topic (generated
// from the notes), and teaching boards built from the PDF volumes.
import { NOTE_TOPICS } from './notes'

export type BoardDef =
  | { id: string; kind: 'sketch'; title: string; text: string }
  | { id: string; kind: 'topic'; title: string; text: string; topicId: string; color: string; badge: string }
  | { id: string; kind: 'pdf'; title: string; text: string; pdf: string }

export const BOARDS: BoardDef[] = [
  { id: 'sketch', kind: 'sketch', title: 'My sketchbook', text: 'A blank infinite canvas. Draw, explain, import any PDF.' },
  ...NOTE_TOPICS.map((t) => ({ id: t.id, kind: 'topic' as const, title: t.title, text: t.tagline, topicId: t.id, color: t.color, badge: t.badge })),
  { id: 'system-design', kind: 'pdf', title: 'System Design notes', text: 'All 48 pages of the System Design volume as slides to annotate.', pdf: '/notes/system-design.pdf' },
  { id: 'dsa', kind: 'pdf', title: 'DSA notes (Python & JS)', text: 'The DSA volume as slides to annotate.', pdf: '/notes/dsa-python-js.pdf' },
  { id: 'dsa-handwritten', kind: 'pdf', title: 'DSA handwritten notebook', text: 'The handwritten DSA notebook as slides to annotate.', pdf: '/notes/dsa-handwritten.pdf' },
]

export const BOARDS_BY_ID: Record<string, BoardDef> = Object.fromEntries(BOARDS.map((b) => [b.id, b]))
