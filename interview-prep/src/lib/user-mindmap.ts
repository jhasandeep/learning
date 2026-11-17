// Your own mind maps: the tree, the edits on it, and a two-sided layout
// (central topic in the middle, main branches split left and right).
// Pure functions only; the editor measures text and keeps the state.

export interface UNode {
  id: string
  text: string
  /** Branch colour; children inherit it unless they set their own. */
  color?: string
  collapsed?: boolean
  children: UNode[]
}

export interface UserMap {
  id: string
  title: string
  root: UNode
  created: string
  updated: string
}

export const BRANCH_COLORS = ['#0891b2', '#7c3aed', '#e11d48', '#16a34a', '#d97706', '#2563eb', '#db2777', '#0d9488']
export const ROOT_COLOR = '#1e293b'

export const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`)

export const node = (text: string, children: UNode[] = [], color?: string): UNode => ({ id: newId(), text, children, ...(color ? { color } : {}) })

// ---------- queries ----------

export function walkU(n: UNode, visit: (n: UNode, depth: number, parent?: UNode) => void, depth = 0, parent?: UNode) {
  visit(n, depth, parent)
  n.children.forEach((c) => walkU(c, visit, depth + 1, n))
}

export function findNode(root: UNode, id: string): UNode | undefined {
  if (root.id === id) return root
  for (const c of root.children) {
    const hit = findNode(c, id)
    if (hit) return hit
  }
  return undefined
}

export function findParent(root: UNode, id: string): UNode | undefined {
  for (const c of root.children) {
    if (c.id === id) return root
    const hit = findParent(c, id)
    if (hit) return hit
  }
  return undefined
}

export function countNodes(root: UNode): number {
  let n = 0
  walkU(root, () => n++)
  return n
}

/** True when `id` is `ancestor` or somewhere below it. */
export function isWithin(root: UNode, ancestor: string, id: string): boolean {
  const a = findNode(root, ancestor)
  return Boolean(a && findNode(a, id))
}

// ---------- edits (all return a new tree) ----------

export function updateNode(root: UNode, id: string, fn: (n: UNode) => UNode): UNode {
  if (root.id === id) return fn(root)
  let changed = false
  const children = root.children.map((c) => {
    const next = updateNode(c, id, fn)
    if (next !== c) changed = true
    return next
  })
  return changed ? { ...root, children } : root
}

export function addChild(root: UNode, parentId: string, child: UNode): UNode {
  return updateNode(root, parentId, (p) => ({ ...p, collapsed: false, children: [...p.children, child] }))
}

/** Adds `sibling` right after `id` (as a child when `id` is the root). */
export function addSibling(root: UNode, id: string, sibling: UNode): UNode {
  const parent = findParent(root, id)
  if (!parent) return addChild(root, id, sibling)
  return updateNode(root, parent.id, (p) => {
    const i = p.children.findIndex((c) => c.id === id)
    return { ...p, children: [...p.children.slice(0, i + 1), sibling, ...p.children.slice(i + 1)] }
  })
}

/** Removes a node and its branch. The root can't be removed. */
export function removeNode(root: UNode, id: string): UNode {
  const parent = findParent(root, id)
  if (!parent) return root
  return updateNode(root, parent.id, (p) => ({ ...p, children: p.children.filter((c) => c.id !== id) }))
}

/** Moves a node up (-1) or down (+1) among its siblings. */
export function moveNode(root: UNode, id: string, dir: -1 | 1): UNode {
  const parent = findParent(root, id)
  if (!parent) return root
  const i = parent.children.findIndex((c) => c.id === id)
  const j = i + dir
  if (j < 0 || j >= parent.children.length) return root
  return updateNode(root, parent.id, (p) => {
    const children = [...p.children]
    ;[children[i], children[j]] = [children[j], children[i]]
    return { ...p, children }
  })
}

/** Re-parents `id` as the last child of `target`. Refused when it would create a loop. */
export function reparent(root: UNode, id: string, target: string): UNode {
  if (id === root.id || isWithin(root, id, target)) return root
  const moving = findNode(root, id)
  if (!moving || findParent(root, id)?.id === target) return root
  return addChild(removeNode(root, id), target, moving)
}

/** A deep copy with fresh ids (for duplicating a map). */
export function cloneTree(n: UNode): UNode {
  return { ...n, id: newId(), children: n.children.map(cloneTree) }
}

// ---------- import / export ----------

/** Checks and cleans an imported tree; throws on anything that isn't one. */
export function parseTree(raw: unknown, depth = 0): UNode {
  if (depth > 40) throw new Error('Map is too deep')
  if (!raw || typeof raw !== 'object') throw new Error('Not a mind map')
  const r = raw as Partial<UNode>
  if (typeof r.text !== 'string') throw new Error('Every node needs text')
  const color = typeof r.color === 'string' && /^#[0-9a-f]{3,8}$/i.test(r.color) ? r.color : undefined
  return {
    id: newId(),
    text: r.text.slice(0, 500),
    ...(color ? { color } : {}),
    ...(r.collapsed ? { collapsed: true } : {}),
    children: Array.isArray(r.children) ? r.children.map((c) => parseTree(c, depth + 1)) : [],
  }
}

/** The map as a Markdown outline: the root as a heading, branches as nested bullets. */
export function toMarkdown(root: UNode): string {
  const out = [`# ${root.text.replace(/\n/g, ' ')}`, '']
  const add = (n: UNode, depth: number) => {
    out.push(`${'  '.repeat(depth)}- ${n.text.replace(/\n/g, ' ')}`)
    n.children.forEach((c) => add(c, depth + 1))
  }
  root.children.forEach((c) => add(c, 0))
  return out.join('\n') + '\n'
}

// ---------- layout ----------

export interface Measured { w: number; h: number; lines: string[] }
export type Measure = (text: string, depth: number) => Measured

export interface UPlaced {
  node: UNode
  x: number
  y: number
  w: number
  h: number
  lines: string[]
  depth: number
  /** 1 = right of the root, -1 = left. 0 for the root. */
  side: -1 | 0 | 1
  color: string
  parent?: string
}

export interface ULayout {
  nodes: UPlaced[]
  byId: Map<string, UPlaced>
  edges: { id: string; from: UPlaced; to: UPlaced }[]
  minX: number
  minY: number
  maxX: number
  maxY: number
}

const H_GAP = [70, 46, 34] // horizontal gap from a parent, by parent depth (last value repeats)
const V_GAP = [26, 12, 8] // vertical gap between siblings, by their depth - 1

/** The colour a node draws with: its own, else its branch's. */
export function branchColor(n: UNode, depth: number, inherited: string | undefined, index: number): string {
  if (n.color) return n.color
  if (depth === 0) return ROOT_COLOR
  if (depth === 1) return BRANCH_COLORS[index % BRANCH_COLORS.length]
  return inherited ?? BRANCH_COLORS[0]
}

export function layoutUserMap(root: UNode, measure: Measure): ULayout {
  const size = new Map<string, Measured>()
  const sub = new Map<string, number>() // height of each visible subtree
  const kids = (n: UNode) => (n.collapsed ? [] : n.children)
  const vgap = (depth: number) => V_GAP[Math.min(depth - 1, V_GAP.length - 1)]

  const measureAll = (n: UNode, depth: number): number => {
    const m = measure(n.text, depth)
    size.set(n.id, m)
    const ks = kids(n)
    const kidsH = ks.reduce((s, c) => s + measureAll(c, depth + 1), 0) + Math.max(0, ks.length - 1) * vgap(depth + 1)
    const h = Math.max(m.h, kidsH)
    sub.set(n.id, h)
    return h
  }
  measureAll(root, 0)

  const nodes: UPlaced[] = []
  const byId = new Map<string, UPlaced>()
  const edges: ULayout['edges'] = []

  const r = size.get(root.id)!
  const rootP: UPlaced = { node: root, x: -r.w / 2, y: -r.h / 2, w: r.w, h: r.h, lines: r.lines, depth: 0, side: 0, color: branchColor(root, 0, undefined, 0) }
  nodes.push(rootP)
  byId.set(root.id, rootP)

  // Place `list` (children of `parent`) on one side, as a column centred on the parent.
  const placeColumn = (list: { n: UNode; i: number }[], parent: UPlaced, side: -1 | 1, depth: number) => {
    if (!list.length) return
    const gap = vgap(depth)
    const total = list.reduce((s, { n }) => s + sub.get(n.id)!, 0) + (list.length - 1) * gap
    let top = parent.y + parent.h / 2 - total / 2
    const hgap = H_GAP[Math.min(depth - 1, H_GAP.length - 1)]
    for (const { n, i } of list) {
      const m = size.get(n.id)!
      const block = sub.get(n.id)!
      const x = side === 1 ? parent.x + parent.w + hgap : parent.x - hgap - m.w
      const me: UPlaced = {
        node: n, x, y: top + (block - m.h) / 2, w: m.w, h: m.h, lines: m.lines, depth, side,
        color: branchColor(n, depth, parent.depth === 0 ? undefined : parent.color, i), parent: parent.node.id,
      }
      nodes.push(me)
      byId.set(n.id, me)
      edges.push({ id: `${parent.node.id}>${n.id}`, from: parent, to: me })
      placeColumn(kids(n).map((c, j) => ({ n: c, i: j })), me, side, depth + 1)
      top += block + gap
    }
  }

  // Split the main branches so both sides are about the same height: first ones go right.
  const main = kids(root).map((n, i) => ({ n, i }))
  const totalH = main.reduce((s, { n }) => s + sub.get(n.id)!, 0)
  let acc = 0
  let split = main.length
  if (main.length > 1) {
    split = 0
    for (const { n } of main) {
      if (acc >= totalH / 2 && split > 0) break
      acc += sub.get(n.id)!
      split++
    }
    split = Math.min(split, main.length - 1)
  }
  placeColumn(main.slice(0, split), rootP, 1, 1)
  placeColumn(main.slice(split), rootP, -1, 1)

  const minX = Math.min(...nodes.map((n) => n.x))
  const minY = Math.min(...nodes.map((n) => n.y))
  const maxX = Math.max(...nodes.map((n) => n.x + n.w))
  const maxY = Math.max(...nodes.map((n) => n.y + n.h))
  return { nodes, byId, edges, minX, minY, maxX, maxY }
}

/** A curved connector from the parent's facing edge to the child's facing edge: start, bend x, end. */
export function userEdgeCurve(a: UPlaced, b: UPlaced) {
  const right = b.side >= 0
  const x1 = a.depth === 0 ? a.x + a.w / 2 : right ? a.x + a.w : a.x
  const y1 = a.y + a.h / 2
  const x2 = right ? b.x : b.x + b.w
  const y2 = b.y + b.h / 2
  const mx = a.depth === 0 ? x1 + (x2 - x1) * 0.55 : (x1 + x2) / 2
  return { x1, y1, mx, x2, y2 }
}

export function userEdgePath(a: UPlaced, b: UPlaced): string {
  const { x1, y1, mx, x2, y2 } = userEdgeCurve(a, b)
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`
}

/** Edge thickness by the parent's depth. */
export const edgeWidth = (parentDepth: number) => (parentDepth === 0 ? 3.5 : parentDepth === 1 ? 2.5 : 1.8)

/** Word-wraps `text` to `max` px using `width` to measure. Respects explicit line breaks. */
export function wrapText(text: string, max: number, width: (s: string) => number): string[] {
  const out: string[] = []
  for (const para of (text || ' ').split('\n')) {
    let line = ''
    for (const word of para.split(/(\s+)/)) {
      if (!word) continue
      const next = line + word
      if (line && /\S/.test(word) && width(next.trimEnd()) > max) {
        out.push(line.trimEnd())
        line = word
      } else {
        line = next
      }
      // A single word longer than the line: break it by characters.
      while (width(line) > max && line.length > 1) {
        let cut = line.length - 1
        while (cut > 1 && width(line.slice(0, cut)) > max) cut--
        out.push(line.slice(0, cut))
        line = line.slice(cut)
      }
    }
    out.push(line.trimEnd() || ' ')
  }
  return out
}
