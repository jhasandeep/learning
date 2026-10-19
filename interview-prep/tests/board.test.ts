import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { BOARDS, BOARDS_BY_ID } from '@/data/boards'
import { NOTE_TOPICS } from '@/data/notes'
import { plain, SLIDE, topicBoard, wrap, type Skeleton } from '@/lib/board/concepts'
import { framesInOrder } from '@/lib/board/pdf'

type Any = Skeleton & { id?: string; x: number; y: number; width?: number; height?: number; text?: string; fontSize?: number; fontFamily?: number; lineHeight?: number; children?: string[]; start?: { id: string }; end?: { id: string }; label?: { text: string } }

/** Height of a skeleton element: text is lines × size × line height (that is what Excalidraw lays out). */
const height = (e: Any) => (e.type === 'text' ? e.text!.split('\n').length * e.fontSize! * e.lineHeight! : e.height ?? 0)

describe('board text helpers', () => {
  it('strips the notes markup like the notes renderer does', () => {
    expect(plain('A **closure** keeps ==its scope== via `fn()`')).toBe('A closure keeps its scope via fn()')
    expect(plain('`==` vs `===`?')).toBe('== vs ===?')
  })

  it('wraps words to the width and hard-breaks long ones', () => {
    expect(wrap('the quick brown fox jumps', 10)).toEqual(['the quick', 'brown fox', 'jumps'])
    expect(wrap('abcdefghijkl', 5)).toEqual(['abcde', 'fghij', 'kl'])
    expect(wrap('one\ntwo', 20)).toEqual(['one', 'two'])
  })
})

describe('concept boards', () => {
  for (const topic of NOTE_TOPICS) {
    it(`${topic.id}: a frame per section plus cover and Q&A, with a sound layout`, () => {
      const els = topicBoard(topic) as Any[]
      const byId = new Map(els.filter((e) => e.id).map((e) => [e.id!, e]))
      expect(byId.size, 'unique ids').toBe(els.filter((e) => e.id).length)

      const frames = els.filter((e) => e.type === 'frame')
      expect(frames.length).toBe(1 + topic.sections.length + Math.ceil(topic.qa.length / 6))
      for (const s of topic.sections) expect(frames.some((f) => (f as { name?: string }).name?.endsWith(s.title)), s.title).toBe(true)

      // Every element sits inside its frame, and frames never overlap.
      for (const f of frames) {
        for (const id of f.children!) {
          const c = byId.get(id)!
          expect(c, id).toBeDefined()
          expect(c.y, `${f.id}/${id} top`).toBeGreaterThanOrEqual(f.y)
          expect(c.y + height(c), `${f.id}/${id} bottom`).toBeLessThanOrEqual(f.y + f.height! + 0.5)
          expect(c.x + (c.width ?? 0), `${f.id}/${id} right`).toBeLessThanOrEqual(f.x + f.width! + 0.5)
        }
      }
      const sorted = [...frames].sort((a, b) => a.y - b.y)
      for (let i = 1; i < sorted.length; i++) expect(sorted[i].y).toBeGreaterThan(sorted[i - 1].y + sorted[i - 1].height!)

      // Flow arrows bind to boxes that exist.
      for (const a of els.filter((e) => e.type === 'arrow')) {
        expect(byId.get(a.start!.id)?.type).toBe('rectangle')
        expect(byId.get(a.end!.id)?.type).toBe('rectangle')
      }

      // No markup leaks onto the board.
      for (const e of els) {
        const t = e.type === 'text' ? e.text : e.label?.text
        if (t && e.fontFamily !== 3) expect(t, t).not.toMatch(/\*\*|`/)
      }
    })
  }

  it('starts every board at the slide origin', () => {
    const first = topicBoard(NOTE_TOPICS[0]).find((e) => e.type === 'frame') as Any
    expect([first.x, first.y]).toEqual([SLIDE.x, SLIDE.y])
  })
})

describe('board registry', () => {
  it('has a board per notes topic and a PDF behind every PDF board', () => {
    for (const t of NOTE_TOPICS) expect(BOARDS_BY_ID[t.id]?.kind).toBe('topic')
    expect(new Set(BOARDS.map((b) => b.id)).size).toBe(BOARDS.length)
    for (const b of BOARDS) if (b.kind === 'pdf') expect(existsSync(`public${b.pdf}`), b.pdf).toBe(true)
  })

  it('ships a concept-board PDF for every topic (npm run notes:pdf regenerates them)', () => {
    for (const t of NOTE_TOPICS) expect(existsSync(`public/notes/boards/${t.id}.pdf`), t.id).toBe(true)
  })

  it('orders frames top to bottom, then left to right', () => {
    const f = (id: string, x: number, y: number) => ({ id, type: 'frame', x, y, isDeleted: false }) as never
    expect(framesInOrder([f('c', 0, 900), f('b', 800, 10), f('a', 0, 0)]).map((e: { id: string }) => e.id)).toEqual(['a', 'b', 'c'])
  })
})
