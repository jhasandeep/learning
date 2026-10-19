// Horizontal tidy-tree layout for the mind map: the root on the left, each
// level in its own column, every parent centred on its visible children.
import type { MapKind, MapNode } from './mindmap'

export const NODE_WIDTH: Record<MapKind, number> = {
  root: 250, category: 190, tech: 260, section: 240, def: 340, point: 340, flow: 340, mistake: 340, tip: 340, question: 340,
}
const COLUMN_GAP = 90
const SIBLING_GAP = 14
const GROUP_GAP = 26 // extra space between the subtrees of different parents

export interface Placed {
  node: MapNode
  x: number
  y: number
  w: number
  h: number
  depth: number
  parent?: string
  hasChildren: boolean
  expanded: boolean
}

export interface Edge {
  id: string
  from: Placed
  to: Placed
}

export interface Layout {
  nodes: Placed[]
  byId: Map<string, Placed>
  edges: Edge[]
  width: number
  height: number
}

/** A rough height for a node not measured yet (the DOM measures the real one). */
export function estimateHeight(n: MapNode): number {
  const w = NODE_WIDTH[n.kind] - 28
  const lines = (text: string | undefined, px: number) => (text ? Math.max(1, Math.ceil((text.length * px) / w)) : 0)
  switch (n.kind) {
    case 'root': return 76
    case 'category': return 50
    case 'tech': return 74
    case 'section': return 44
    case 'flow': return 30 + lines(n.label, 6.4) * 17 + Math.ceil((n.steps ?? []).join('   ').length * 6.2 / w) * 28
    default: return 22 + lines(n.label, 6.8) * 19 + lines(n.detail, 6.2) * 16
  }
}

export function layoutMap(root: MapNode, expanded: Set<string>, heights: Map<string, number>): Layout {
  const visibleChildren = (n: MapNode) => (expanded.has(n.id) ? n.children ?? [] : [])
  const h = (n: MapNode) => heights.get(n.id) ?? estimateHeight(n)

  // Column x positions from the widest node at each depth.
  const colWidth: number[] = []
  const scan = (n: MapNode, d: number) => {
    colWidth[d] = Math.max(colWidth[d] ?? 0, NODE_WIDTH[n.kind])
    visibleChildren(n).forEach((c) => scan(c, d + 1))
  }
  scan(root, 0)
  const colX = colWidth.map((_, d) => colWidth.slice(0, d).reduce((s, w) => s + w + COLUMN_GAP, 0))

  // Height of each visible subtree.
  const subtree = new Map<string, number>()
  const size = (n: MapNode): number => {
    const kids = visibleChildren(n)
    const gap = kids.some((c) => visibleChildren(c).length) ? GROUP_GAP : SIBLING_GAP
    const kidsH = kids.reduce((s, c) => s + size(c), 0) + Math.max(0, kids.length - 1) * gap
    const total = Math.max(h(n), kidsH)
    subtree.set(n.id, total)
    return total
  }
  size(root)

  const nodes: Placed[] = []
  const byId = new Map<string, Placed>()
  const edges: Edge[] = []
  const place = (n: MapNode, top: number, d: number, parent?: Placed): Placed => {
    const kids = visibleChildren(n)
    const gap = kids.some((c) => visibleChildren(c).length) ? GROUP_GAP : SIBLING_GAP
    const kidsH = kids.reduce((s, c) => s + subtree.get(c.id)!, 0) + Math.max(0, kids.length - 1) * gap
    const me: Placed = { node: n, x: colX[d], y: 0, w: NODE_WIDTH[n.kind], h: h(n), depth: d, parent: parent?.node.id, hasChildren: Boolean(n.children?.length), expanded: expanded.has(n.id) }
    nodes.push(me)
    byId.set(n.id, me)
    if (kids.length) {
      let y = top + (subtree.get(n.id)! - kidsH) / 2
      const placed = kids.map((c) => {
        const p = place(c, y, d + 1, me)
        y += subtree.get(c.id)! + gap
        return p
      })
      const first = placed[0]
      const last = placed[placed.length - 1]
      me.y = (first.y + first.h / 2 + last.y + last.h / 2) / 2 - me.h / 2
      placed.forEach((p) => edges.push({ id: `${n.id}>${p.node.id}`, from: me, to: p }))
    } else {
      me.y = top + (subtree.get(n.id)! - me.h) / 2
    }
    return me
  }
  place(root, 0, 0)

  const width = Math.max(...nodes.map((n) => n.x + n.w))
  const height = subtree.get(root.id)!
  return { nodes, byId, edges, width, height }
}

/** A smooth horizontal connector from the right edge of `a` to the left edge of `b`. */
export function edgePath(a: Placed, b: Placed): string {
  const x1 = a.x + a.w
  const y1 = a.y + a.h / 2
  const x2 = b.x
  const y2 = b.y + b.h / 2
  const mx = (x1 + x2) / 2
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`
}
