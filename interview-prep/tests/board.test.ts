import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { BOARDS, BOARDS_BY_ID } from '@/data/boards'
import { NOTE_TOPICS } from '@/data/notes'
import { plain, SLIDE, topicBoard, wrap, type Skeleton } from '@/lib/board/concepts'
import { framesInOrder } from '@/lib/board/pdf'
import { buildRequest, parseResponse } from '@/lib/board/handwriting'
import { clusterStrokes, planCluster, recognizeArrow, recognizeStroke, type Pt } from '@/lib/board/ink'

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

describe('smart pen', () => {
  const ring = (n: number, f: (t: number) => Pt) => Array.from({ length: n + 1 }, (_, i) => f((i / n) * Math.PI * 2))
  const jitter = (p: Pt, i: number): Pt => ({ x: p.x + Math.sin(i * 7) * 2, y: p.y + Math.cos(i * 5) * 2 })

  it('recognises a rough rectangle, circle and diamond', () => {
    const rect: Pt[] = []
    for (let t = 0; t <= 1; t += 0.02) rect.push({ x: 200 * t, y: 0 })
    for (let t = 0; t <= 1; t += 0.02) rect.push({ x: 200, y: 100 * t })
    for (let t = 0; t <= 1; t += 0.02) rect.push({ x: 200 - 200 * t, y: 100 })
    for (let t = 0; t <= 0.96; t += 0.02) rect.push({ x: 0, y: 100 - 100 * t })
    expect(recognizeStroke(rect.map(jitter), 60)?.kind).toBe('rectangle')
    expect(recognizeStroke(ring(60, (a) => ({ x: 100 + 100 * Math.cos(a), y: 60 + 60 * Math.sin(a) })).map(jitter), 60)?.kind).toBe('ellipse')
    const diamond: Pt[] = []
    const corners = [{ x: 100, y: 0 }, { x: 200, y: 60 }, { x: 100, y: 120 }, { x: 0, y: 60 }, { x: 100, y: 5 }]
    for (let c = 0; c < 4; c++) for (let t = 0; t < 1; t += 0.05) diamond.push({ x: corners[c].x + (corners[c + 1].x - corners[c].x) * t, y: corners[c].y + (corners[c + 1].y - corners[c].y) * t })
    expect(recognizeStroke(diamond.map(jitter), 60)?.kind).toBe('diamond')
  })

  it('recognises a straight line and leaves small or wiggly strokes as handwriting', () => {
    const line = Array.from({ length: 30 }, (_, i) => ({ x: i * 8, y: i * 2 + Math.sin(i) }))
    expect(recognizeStroke(line, 60)?.kind).toBe('line')
    expect(recognizeStroke(ring(30, (a) => ({ x: 10 * Math.cos(a), y: 10 * Math.sin(a) })), 60)).toBeNull() // letter "o"
    const squiggle = Array.from({ length: 40 }, (_, i) => ({ x: i * 6, y: Math.sin(i / 2) * 30 }))
    expect(recognizeStroke(squiggle, 60)).toBeNull()
  })

  it('detects an arrow: a long shaft plus a short head near its end', () => {
    const shaft = Array.from({ length: 20 }, (_, i) => ({ x: i * 10, y: 0 }))
    const head = [{ x: 175, y: -12 }, { x: 190, y: 0 }, { x: 175, y: 12 }]
    const arrow = recognizeArrow([shaft, head], 60)
    expect(arrow?.kind).toBe('arrow')
    expect(arrow?.to?.x).toBe(190)
  })

  it('clusters the strokes of one word apart from a distant word', () => {
    const stroke = (x: number): Pt[] => [{ x, y: 0 }, { x: x + 10, y: 30 }]
    expect(clusterStrokes([stroke(0), stroke(25), stroke(50), stroke(400)])).toEqual([[0, 1, 2], [3]])
  })

  it('treats writing inside a box as the box label', () => {
    const box: Pt[] = []
    for (let t = 0; t <= 1; t += 0.02) box.push({ x: 300 * t, y: 0 })
    for (let t = 0; t <= 1; t += 0.02) box.push({ x: 300, y: 120 * t })
    for (let t = 0; t <= 1; t += 0.02) box.push({ x: 300 - 300 * t, y: 120 })
    for (let t = 0; t <= 0.96; t += 0.02) box.push({ x: 0, y: 120 - 120 * t })
    const letter: Pt[] = [{ x: 100, y: 40 }, { x: 110, y: 80 }, { x: 120, y: 40 }]
    const plan = planCluster([box, letter], [0, 1], 60)
    expect(plan.shape?.kind).toBe('rectangle')
    expect(plan.textStrokes).toEqual([1])
  })

  it('parses the recogniser response and builds the request', () => {
    expect(parseResponse(['SUCCESS', [['id', ['hello', 'hallo', ''], [], {}]]])).toEqual(['hello', 'hallo'])
    expect(parseResponse(['FAILED_TO_PARSE_REQUEST_BODY'])).toEqual([])
    const body = buildRequest([[{ x: 10, y: 20 }, { x: 30, y: 60 }]])
    expect(body.requests[0].ink[0][0]).toEqual([0, 20])
    expect(body.requests[0].writing_guide).toEqual({ writing_area_width: 20, writing_area_height: 40 })
  })
})
