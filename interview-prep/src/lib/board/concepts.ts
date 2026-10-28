// Turns a notes topic into an Excalidraw "concept board": one frame (slide) per
// section, a cover and Q&A sticky notes. Pure data: the board component feeds
// the skeleton to Excalidraw's convertToExcalidrawElements in the browser.
//
// Text is wrapped here with explicit line breaks, so every block's height is
// known up front (lines × font size × line height) and the layout is stable.
import type { ExcalidrawElementSkeleton } from '@excalidraw/excalidraw/data/transform'
import type { Block, NoteTopic } from '@/data/notes'
import { SQL_SETUP } from '@/data/notes/sql'
import { plainText } from '@/lib/markup'

export type Skeleton = ExcalidrawElementSkeleton

// Excalidraw font ids (FONT_FAMILY in @excalidraw/excalidraw/constants).
export const FONT = { hand: 5, code: 3 } as const
const LINE = { hand: 1.25, code: 1.2 }
// Average glyph width as a share of the font size, kept on the wide side so a
// wrapped line never runs past its box.
const GLYPH = { hand: 0.53, code: 0.61 }

export const SLIDE = { w: 1280, minH: 720, pad: 56, gap: 200, x: 100, y: 100 }
const W = SLIDE.w - SLIDE.pad * 2
const CODE_LINES = 16
const QA_PER_SLIDE = 6

const C = {
  ink: '#1e1e1e',
  muted: '#495057',
  violet: '#6741d9', violetBg: '#e5dbff',
  red: '#c92a2a', redBg: '#ffe3e3',
  green: '#2b8a3e', greenBg: '#d3f9d8',
  yellow: '#e67700', yellowBg: '#fff3bf',
  blue: '#1971c2', blueBg: '#d0ebff',
  codeBg: '#f1f3f5', codeLine: '#868e96',
}

/** Drops the notes mini-markup (`code`, **bold**, ==highlight==). */
export const plain = plainText

/** Greedy word wrap to `max` characters; long words are hard-broken. */
export function wrap(text: string, max: number): string[] {
  const out: string[] = []
  for (const para of text.split('\n')) {
    let line = ''
    for (let word of para.split(/\s+/).filter(Boolean)) {
      while (word.length > max) {
        if (line) { out.push(line); line = '' }
        out.push(word.slice(0, max))
        word = word.slice(max)
      }
      if (!line) line = word
      else if (line.length + 1 + word.length <= max) line += ' ' + word
      else { out.push(line); line = word }
    }
    out.push(line)
  }
  return out
}

const chars = (width: number, size: number, font: keyof typeof GLYPH = 'hand') => Math.max(8, Math.floor(width / (size * GLYPH[font])))
const textH = (lines: number, size: number, font: keyof typeof LINE = 'hand') => lines * size * LINE[font]

/** Builds one board; ids are deterministic (prefix + counter) so tests can follow bindings. */
class Board {
  els: Skeleton[] = []
  private n = 0
  constructor(private prefix: string) {}

  id(kind: string) {
    return `${this.prefix}-${kind}-${++this.n}`
  }

  text(x: number, y: number, lines: string[], o: { size?: number; color?: string; font?: keyof typeof FONT; group?: string } = {}) {
    const size = o.size ?? 20
    const font = o.font ?? 'hand'
    const id = this.id('t')
    this.els.push({
      type: 'text', id, x, y, text: lines.join('\n'), fontSize: size, fontFamily: FONT[font],
      lineHeight: LINE[font] as never, strokeColor: o.color ?? C.ink, groupIds: o.group ? [o.group] : [],
    })
    return { id, h: textH(lines.length, size, font) }
  }

  rect(x: number, y: number, w: number, h: number, o: { stroke: string; bg: string; group?: string; label?: string; size?: number; id?: string; dashed?: boolean }) {
    const id = o.id ?? this.id('r')
    this.els.push({
      type: 'rectangle', id, x, y, width: w, height: h, strokeColor: o.stroke, backgroundColor: o.bg,
      fillStyle: 'solid', strokeWidth: 2, roughness: 1, roundness: { type: 3 }, strokeStyle: o.dashed ? 'dashed' : 'solid',
      groupIds: o.group ? [o.group] : [],
      ...(o.label ? { label: { text: o.label, fontSize: o.size ?? 18, fontFamily: FONT.hand, strokeColor: C.ink } } : {}),
    } as Skeleton)
    return id
  }

  /** Arrow from (x1, y1) to (x2, y2), bound to the two boxes so it follows them when moved. */
  arrow(from: string, to: string, x1: number, y1: number, x2: number, y2: number, color = C.muted) {
    this.els.push({
      type: 'arrow', x: x1, y: y1, width: Math.abs(x2 - x1), height: Math.abs(y2 - y1), points: [[0, 0], [x2 - x1, y2 - y1]] as never,
      strokeColor: color, strokeWidth: 2, start: { id: from }, end: { id: to },
    })
  }

  /** Everything added since `mark` becomes the children of a new frame (slide). */
  frame(mark: number, name: string, y: number, h: number) {
    const children = this.els.slice(mark).flatMap((e) => ('id' in e && e.id ? [e.id] : []))
    this.els.push({ type: 'frame', id: this.id('frame'), name, children, x: SLIDE.x, y, width: SLIDE.w, height: Math.max(SLIDE.minH, h) })
    return Math.max(SLIDE.minH, h)
  }
}

/** A titled, coloured box (definition, mistake, tip, revision). */
function callout(b: Board, x: number, y: number, title: string, body: string, stroke: string, bg: string, dashed = false) {
  const group = b.id('g')
  const lines = wrap(plain(body), chars(W - 48, 20))
  const h = 20 + textH(1, 22) + 6 + textH(lines.length, 20) + 20
  b.rect(x, y, W, h, { stroke, bg, group, dashed })
  b.text(x + 24, y + 20, [title], { size: 22, color: stroke, group })
  b.text(x + 24, y + 20 + textH(1, 22) + 6, lines, { group })
  return h
}

function block(b: Board, input: Block, x: number, y: number): number {
  // On the whiteboard an analogy is a flow of its steps, captioned with its title.
  const block: Exclude<Block, { type: 'analogy' }> =
    input.type === 'analogy'
      ? { type: 'flow', steps: input.steps.map((st) => `${st.icon} ${st.who} (${st.tech}): ${st.text}`), caption: input.title }
      : input
  switch (block.type) {
    case 'p':
      return b.text(x, y, wrap(plain(block.text), chars(W, 20))).h
    case 'def':
      return callout(b, x, y, block.title ?? 'Definition', block.text, C.violet, C.violetBg)
    case 'mistake':
      return callout(b, x, y, block.title ?? 'Common mistake', block.text, C.red, C.redBg)
    case 'tip':
      return callout(b, x, y, 'Tip', block.text, C.green, C.greenBg)
    case 'revision':
      return callout(b, x, y, 'Revise', block.text, C.yellow, C.yellowBg, true)
    case 'recap':
      return callout(b, x, y, 'Remember', block.text, C.green, C.greenBg)
    case 'list':
    case 'steps': {
      let h = 0
      block.items.forEach((item, i) => {
        const mark = block.type === 'steps' ? `${i + 1}.` : '•'
        const lines = wrap(plain(item), chars(W - 36, 20))
        b.text(x, y + h, [mark], { color: C.blue })
        h += b.text(x + 36, y + h, lines).h + 6
      })
      return h
    }
    case 'code': {
      const group = b.id('g')
      const max = chars(W - 40, 15, 'code')
      const comment = block.lang === 'sql' ? '--' : block.lang === 'python' || block.lang === 'bash' || block.lang === 'yaml' ? '#' : '//'
      // On a slide the shared sample-table setup is noise: show the query itself.
      const code = block.code.startsWith(SQL_SETUP) && !/sample tables/i.test(block.title ?? '') ? `${comment} uses the sample emp / dept tables${block.code.slice(SQL_SETUP.length)}` : block.code
      let lines = code.replace(/\t/g, '  ').split('\n').map((l) => (l.length > max ? l.slice(0, max - 1) + '…' : l))
      if (lines.length > CODE_LINES) lines = [...lines.slice(0, CODE_LINES - 1), `${comment} … ${lines.length - CODE_LINES + 1} more lines in the notes`]
      const titleH = block.title ? textH(1, 18) + 8 : 0
      const h = 18 + titleH + textH(lines.length, 15, 'code') + 18
      b.rect(x, y, W, h, { stroke: C.codeLine, bg: C.codeBg, group })
      if (block.title) b.text(x + 20, y + 14, [block.title], { size: 18, color: C.blue, group })
      b.text(x + 20, y + 18 + titleH, lines, { size: 15, font: 'code', group })
      return h
    }
    case 'table': {
      const cols = block.head.length
      const colW = W / cols
      const max = chars(colW - 24, 17)
      const rows = [block.head, ...block.rows].map((r) => r.map((cell) => wrap(plain(cell), max)))
      let h = 0
      rows.forEach((row, r) => {
        const rowH = Math.max(...row.map((l) => textH(l.length, 17))) + 20
        row.forEach((lines, c) => {
          b.rect(x + c * colW, y + h, colW, rowH, { stroke: C.muted, bg: r === 0 ? C.blueBg : '#ffffff' })
          b.text(x + c * colW + 12, y + h + 10, lines, { size: 17, color: r === 0 ? C.blue : C.ink })
        })
        h += rowH
      })
      return h
    }
    case 'flow': {
      const n = block.steps.length
      const perRow = Math.min(n, 4)
      const gap = 70
      const boxW = (W - gap * (perRow - 1)) / perRow
      const labels = block.steps.map((s) => wrap(plain(s), chars(boxW - 28, 18)))
      const boxH = Math.max(...labels.map((l) => textH(l.length, 18))) + 36
      const boxes = labels.map((l, i) => {
        const bx = x + (i % perRow) * (boxW + gap)
        const by = y + Math.floor(i / perRow) * (boxH + 60)
        return { bx, by, id: b.rect(bx, by, boxW, boxH, { stroke: C.blue, bg: C.blueBg, label: l.join('\n'), size: 18 }) }
      })
      for (let i = 1; i < boxes.length; i++) {
        const a = boxes[i - 1]
        const z = boxes[i]
        if (a.by === z.by) b.arrow(a.id, z.id, a.bx + boxW + 6, a.by + boxH / 2, z.bx - 6, z.by + boxH / 2)
        else b.arrow(a.id, z.id, a.bx + boxW / 2, a.by + boxH + 6, z.bx + boxW / 2, z.by - 6) // wraps to the next row
      }
      let h = Math.ceil(n / perRow) * (boxH + 60) - 60
      if (block.caption) h += 14 + b.text(x, y + h + 14, wrap(plain(block.caption), chars(W, 17)), { size: 17, color: C.muted }).h
      return h
    }
  }
}

/** The full concept board for one notes topic: cover, a slide per section, Q&A sticky notes. */
export function topicBoard(topic: NoteTopic): Skeleton[] {
  const b = new Board(topic.id)
  const x = SLIDE.x + SLIDE.pad
  let top = SLIDE.y

  // Cover slide: title, tagline and the section map.
  let mark = b.els.length
  let y = top + SLIDE.pad
  y += b.text(x, y, [`${topic.category} · concept board`], { size: 20, color: topic.color }).h + 8
  y += b.text(x, y, [topic.title], { size: 64, color: topic.color }).h + 8
  y += b.text(x, y, wrap(topic.tagline, chars(W, 26)), { size: 26, color: C.muted }).h + 32
  const half = Math.ceil(topic.sections.length / 2)
  topic.sections.forEach((s, i) => {
    const col = i < half ? 0 : 1
    const row = i < half ? i : i - half
    b.rect(x + col * (W / 2 + 10), y + row * 74, W / 2 - 10, 60, { stroke: topic.color, bg: '#ffffff', label: `${i + 1}. ${s.title}`, size: 20 })
  })
  y += half * 74 + 16
  y += b.text(x, y, ['Draw on any slide, then Present (arrow keys) or export the board as a PDF.'], { size: 17, color: C.muted }).h
  top += b.frame(mark, `${topic.title} — cover`, top, y - top + SLIDE.pad) + SLIDE.gap

  // One slide per section.
  topic.sections.forEach((s, i) => {
    mark = b.els.length
    y = top + SLIDE.pad
    y += b.text(x, y, [`${i + 1}. ${s.title}`], { size: 40, color: topic.color }).h + 24
    for (const blk of s.blocks) y += block(b, blk, x, y) + 22
    top += b.frame(mark, `${i + 1}. ${s.title}`, top, y - top + SLIDE.pad - 22) + SLIDE.gap
  })

  // Q&A as sticky notes, a few per slide so they stay readable when presenting.
  const pages = Math.ceil(topic.qa.length / QA_PER_SLIDE)
  for (let p = 0; p < pages; p++) {
    mark = b.els.length
    y = top + SLIDE.pad
    y += b.text(x, y, [pages > 1 ? `Rapid-fire Q&A (${p + 1}/${pages})` : 'Rapid-fire Q&A'], { size: 40, color: topic.color }).h + 24
    const cardW = (W - 2 * 24) / 3
    const cards = topic.qa.slice(p * QA_PER_SLIDE, (p + 1) * QA_PER_SLIDE).map(([q, a]) => ({
      q: wrap(plain(q), chars(cardW - 36, 19)),
      a: wrap(plain(a), chars(cardW - 36, 17)),
    }))
    for (let r = 0; r < cards.length; r += 3) {
      const row = cards.slice(r, r + 3)
      const rowH = Math.max(...row.map((c) => textH(c.q.length, 19) + 10 + textH(c.a.length, 17))) + 40
      row.forEach((c, i) => {
        const cx = x + i * (cardW + 24)
        const group = b.id('g')
        b.rect(cx, y, cardW, rowH, { stroke: C.yellow, bg: C.yellowBg, group })
        const qh = b.text(cx + 18, y + 20, c.q, { size: 19, color: C.red, group }).h
        b.text(cx + 18, y + 30 + qh, c.a, { size: 17, group })
      })
      y += rowH + 24
    }
    top += b.frame(mark, pages > 1 ? `Q&A ${p + 1}/${pages}` : 'Q&A', top, y - top + SLIDE.pad - 24) + SLIDE.gap
  }

  return b.els
}
