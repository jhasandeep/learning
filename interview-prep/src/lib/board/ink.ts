// Pure geometry for the "Smart pen": group freehand strokes that belong together
// and recognise rough shapes. Handwriting → text lives in handwriting.ts.

export interface Pt { x: number; y: number }
export interface Box { x: number; y: number; w: number; h: number }

export type ShapeKind = 'rectangle' | 'ellipse' | 'diamond' | 'line' | 'arrow'

export interface Shape { kind: ShapeKind; box: Box; /** line/arrow only: from → to */ from?: Pt; to?: Pt }

export const bbox = (pts: Pt[]): Box => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const p of pts) {
    if (p.x < x0) x0 = p.x
    if (p.y < y0) y0 = p.y
    if (p.x > x1) x1 = p.x
    if (p.y > y1) y1 = p.y
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

export const union = (a: Box, b: Box): Box => {
  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y)
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y }
}

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)

export const pathLength = (pts: Pt[]) => {
  let n = 0
  for (let i = 1; i < pts.length; i++) n += dist(pts[i - 1], pts[i])
  return n
}

const inside = (inner: Box, outer: Box, slack = 0) =>
  inner.x >= outer.x - slack && inner.y >= outer.y - slack && inner.x + inner.w <= outer.x + outer.w + slack && inner.y + inner.h <= outer.y + outer.h + slack

/** Strokes closer than this (screen px) are one word / one drawing. */
const GAP_X = 55
const GAP_Y = 14

/**
 * Groups strokes whose (padded) boxes touch. Letters of a word, the dot of an "i"
 * and the strokes of one shape end up together; separate lines/words stay apart.
 */
export function clusterStrokes(strokes: Pt[][], zoom = 1): number[][] {
  const boxes = strokes.map(bbox)
  const parent = strokes.map((_, i) => i)
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  const gx = GAP_X / zoom, gy = GAP_Y / zoom
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j]
      if (a.x - gx <= b.x + b.w && b.x - gx <= a.x + a.w && a.y - gy <= b.y + b.h && b.y - gy <= a.y + a.h) parent[find(j)] = find(i)
    }
  }
  const groups = new Map<number, number[]>()
  strokes.forEach((_, i) => groups.set(find(i), [...(groups.get(find(i)) ?? []), i]))
  return [...groups.values()].sort((a, b) => boxes[a[0]].y - boxes[b[0]].y || boxes[a[0]].x - boxes[b[0]].x)
}

/** Fits a closed stroke to a rectangle, ellipse or diamond; returns the kind and its error (lower is better). */
function fitClosed(pts: Pt[], box: Box): { kind: 'rectangle' | 'ellipse' | 'diamond'; err: number } {
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2
  let ell = 0, rect = 0, dia = 0
  for (const p of pts) {
    const u = (p.x - cx) / (box.w / 2), v = (p.y - cy) / (box.h / 2)
    ell += Math.abs(Math.hypot(u, v) - 1)
    rect += 1 - Math.max(Math.abs(u), Math.abs(v))
    dia += Math.abs(Math.abs(u) + Math.abs(v) - 1)
  }
  const n = pts.length
  const fits = [
    { kind: 'rectangle' as const, err: rect / n },
    { kind: 'ellipse' as const, err: ell / n },
    { kind: 'diamond' as const, err: dia / n },
  ]
  return fits.sort((a, b) => a.err - b.err)[0]
}

/** Resamples to evenly spaced points so slow/fast parts of a stroke weigh the same. */
export function resample(pts: Pt[], n = 64): Pt[] {
  const total = pathLength(pts)
  if (total === 0 || pts.length < 2) return pts
  const step = total / (n - 1)
  const out: Pt[] = [pts[0]]
  let carried = 0
  for (let i = 1; i < pts.length; i++) {
    let a = pts[i - 1]
    const b = pts[i]
    let d = dist(a, b)
    while (carried + d >= step && d > 0) {
      const t = (step - carried) / d
      a = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
      out.push(a)
      d = dist(a, b)
      carried = 0
    }
    carried += d
  }
  if (out.length < n) out.push(pts[pts.length - 1])
  return out
}

/**
 * Recognises one stroke as a shape, or null when it does not look like one
 * (then it is probably handwriting). `minSize` is in scene units: smaller
 * strokes are letters, not shapes.
 */
export function recognizeStroke(stroke: Pt[], minSize: number): Shape | null {
  if (stroke.length < 4) return null
  const box = bbox(stroke)
  const size = Math.max(box.w, box.h)
  if (size < minSize) return null
  const len = pathLength(stroke)
  const first = stroke[0], last = stroke[stroke.length - 1]
  const gap = dist(first, last)

  // Open and nearly straight → a line.
  if (gap / len > 0.88) return { kind: 'line', box, from: first, to: last }

  // Closed loop → rectangle / ellipse / diamond (needs real area: a squashed loop is a line).
  if (gap / len < 0.25 && Math.min(box.w, box.h) > size * 0.18) {
    const fit = fitClosed(resample(stroke), box)
    if (fit.err < 0.16) return { kind: fit.kind, box }
  }
  return null
}

/**
 * A long straight stroke plus one or two short strokes near one end is an arrow
 * (the shaft and the head are usually drawn separately).
 */
export function recognizeArrow(strokes: Pt[][], minSize: number): Shape | null {
  if (strokes.length < 2 || strokes.length > 3) return null
  const longest = strokes.reduce((a, b) => (pathLength(b) > pathLength(a) ? b : a))
  const shaft = recognizeStroke(longest, minSize)
  if (!shaft || shaft.kind !== 'line' || !shaft.from || !shaft.to) return null
  const len = dist(shaft.from, shaft.to)
  const rest = strokes.filter((s) => s !== longest)
  const near = (p: Pt, ends: Pt) => dist(p, ends) < len * 0.3
  const headAt = (end: Pt) => rest.every((s) => pathLength(s) < len * 0.5 && s.some((p) => near(p, end)))
  if (headAt(shaft.to)) return shaft.kind === 'line' ? { kind: 'arrow', box: shaft.box, from: shaft.from, to: shaft.to } : null
  if (headAt(shaft.from)) return { kind: 'arrow', box: shaft.box, from: shaft.to, to: shaft.from }
  return null
}

export interface Plan {
  /** indices into the strokes given to plan() */
  strokes: number[]
  shape?: Shape
  /** Strokes (indices) to read as handwriting: the whole group, or the writing inside a shape. */
  textStrokes: number[]
}

/**
 * Decides what a cluster of strokes is:
 *  - a shape (maybe with handwriting inside it → its label),
 *  - an arrow (shaft + head),
 *  - otherwise handwriting.
 */
export function planCluster(strokes: Pt[][], indices: number[], minSize: number): Plan {
  const group = indices.map((i) => strokes[i])
  const arrow = recognizeArrow(group, minSize)
  if (arrow) return { strokes: indices, shape: arrow, textStrokes: [] }

  // The biggest stroke may be a shape that has writing inside it.
  const biggest = indices.reduce((a, b) => (bbox(strokes[b]).w * bbox(strokes[b]).h > bbox(strokes[a]).w * bbox(strokes[a]).h ? b : a))
  const shape = recognizeStroke(strokes[biggest], minSize)
  if (shape && shape.kind !== 'line') {
    const others = indices.filter((i) => i !== biggest)
    if (others.every((i) => inside(bbox(strokes[i]), shape.box, 6))) return { strokes: indices, shape, textStrokes: others }
  }
  if (shape?.kind === 'line' && indices.length === 1) return { strokes: indices, shape, textStrokes: [] }
  return { strokes: indices, textStrokes: indices }
}
