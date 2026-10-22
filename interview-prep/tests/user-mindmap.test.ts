import { describe, expect, it } from 'vitest'
import {
  addChild, addSibling, countNodes, findNode, findParent, layoutUserMap, moveNode, node, parseTree, removeNode, reparent, toMarkdown, updateNode, wrapText, type Measure, type UNode,
} from '@/lib/user-mindmap'

// Every character is 8px wide and lines are 20px tall: enough to check the geometry.
const measure: Measure = (text, depth) => {
  const lines = wrapText(text, depth === 0 ? 200 : 160, (s) => s.length * 8)
  return { w: Math.max(...lines.map((l) => l.length * 8)) + 20, h: lines.length * 20 + 12, lines }
}

function sample(): UNode {
  return node('Root', [
    node('A', [node('A1'), node('A2', [node('A2a'), node('A2b')])]),
    node('B', [node('B1')]),
    node('C'),
    node('D', [node('D1'), node('D2'), node('D3')]),
  ])
}
const byText = (root: UNode, text: string) => {
  let hit: UNode | undefined
  const visit = (n: UNode) => {
    if (n.text === text) hit = n
    n.children.forEach(visit)
  }
  visit(root)
  return hit!
}

describe('mind map editing', () => {
  it('adds children and siblings in place without touching the old tree', () => {
    const r = sample()
    const a = byText(r, 'A')
    const r2 = addChild(r, a.id, node('A3'))
    expect(byText(r2, 'A').children.map((c) => c.text)).toEqual(['A1', 'A2', 'A3'])
    expect(a.children).toHaveLength(2) // immutable
    const r3 = addSibling(r2, byText(r2, 'A1').id, node('A1.5'))
    expect(byText(r3, 'A').children.map((c) => c.text)).toEqual(['A1', 'A1.5', 'A2', 'A3'])
    // A sibling of the root becomes a child of it.
    expect(addSibling(r, r.id, node('E')).children.at(-1)!.text).toBe('E')
  })

  it('removes branches but never the root', () => {
    const r = sample()
    const r2 = removeNode(r, byText(r, 'A').id)
    expect(countNodes(r2)).toBe(countNodes(r) - 5)
    expect(removeNode(r, r.id)).toBe(r)
  })

  it('moves among siblings within bounds', () => {
    const r = sample()
    const c = byText(r, 'C').id
    expect(moveNode(r, c, -1).children.map((n) => n.text)).toEqual(['A', 'C', 'B', 'D'])
    expect(moveNode(r, byText(r, 'A').id, -1)).toBe(r)
  })

  it('re-parents, refusing loops', () => {
    const r = sample()
    const a = byText(r, 'A').id
    const r2 = reparent(r, a, byText(r, 'B').id)
    expect(findParent(r2, a)!.text).toBe('B')
    expect(reparent(r, a, byText(r, 'A2a').id)).toBe(r) // into its own branch
    expect(reparent(r, r.id, a)).toBe(r) // the root
  })

  it('updates one node and keeps unrelated branches shared', () => {
    const r = sample()
    const r2 = updateNode(r, byText(r, 'B1').id, (n) => ({ ...n, text: 'B one' }))
    expect(findNode(r2, byText(r, 'B1').id)!.text).toBe('B one')
    expect(r2.children[0]).toBe(r.children[0])
  })

  it('imports only valid trees, with fresh ids', () => {
    const r = sample()
    const back = parseTree(JSON.parse(JSON.stringify(r)))
    expect(countNodes(back)).toBe(countNodes(r))
    expect(back.id).not.toBe(r.id)
    expect(() => parseTree({ title: 'x' })).toThrow()
    expect(() => parseTree(null)).toThrow()
    expect(parseTree({ text: 'x', color: 'red; background: url(evil)' }).color).toBeUndefined()
  })

  it('exports a Markdown outline', () => {
    expect(toMarkdown(node('Topic', [node('One', [node('Two')])]))).toBe('# Topic\n\n- One\n  - Two\n')
  })
})

describe('mind map layout', () => {
  const overlaps = (r: UNode) => {
    const { nodes } = layoutUserMap(r, measure)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]
        const b = nodes[j]
        if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) return `${a.node.text} overlaps ${b.node.text}`
      }
    }
    return null
  }

  it('centres the root and splits main branches across both sides', () => {
    const r = sample()
    const l = layoutUserMap(r, measure)
    const root = l.byId.get(r.id)!
    expect(root.x + root.w / 2).toBeCloseTo(0)
    const sides = new Set(r.children.map((c) => l.byId.get(c.id)!.side))
    expect(sides).toEqual(new Set([1, -1]))
  })

  it('places children outward from their parent', () => {
    const r = sample()
    const l = layoutUserMap(r, measure)
    for (const n of l.nodes) {
      if (!n.parent) continue
      const p = l.byId.get(n.parent)!
      if (n.side === 1) expect(n.x, n.node.text).toBeGreaterThan(p.x + p.w)
      else expect(n.x + n.w, n.node.text).toBeLessThan(p.x)
    }
  })

  it('never overlaps nodes, even with long text and many branches', () => {
    expect(overlaps(sample())).toBeNull()
    const big = node('A central topic with quite a long name', Array.from({ length: 9 }, (_, i) => node(`Branch ${i} ${'word '.repeat(i * 3)}`, Array.from({ length: i % 4 }, (_, j) => node(`Leaf ${i}.${j} ${'x'.repeat(j * 30)}`)))))
    expect(overlaps(big)).toBeNull()
  })

  it('hides the children of a folded branch', () => {
    const r = sample()
    const a = byText(r, 'A')
    const folded = updateNode(r, a.id, (n) => ({ ...n, collapsed: true }))
    const l = layoutUserMap(folded, measure)
    expect(l.byId.has(byText(r, 'A1').id)).toBe(false)
    expect(l.nodes).toHaveLength(countNodes(r) - 4)
  })

  it('colours a branch from its main idea down, unless a node sets its own', () => {
    const r = sample()
    const r2 = updateNode(r, byText(r, 'B1').id, (n) => ({ ...n, color: '#123456' }))
    const l = layoutUserMap(r2, measure)
    expect(l.byId.get(byText(r, 'A2a').id)!.color).toBe(l.byId.get(byText(r, 'A').id)!.color)
    expect(l.byId.get(byText(r, 'B1').id)!.color).toBe('#123456')
    expect(l.byId.get(byText(r, 'A').id)!.color).not.toBe(l.byId.get(byText(r, 'B').id)!.color)
  })

  it('wraps text by width and breaks words that are too long', () => {
    const w = (s: string) => s.length * 10
    expect(wrapText('one two three four', 90, w)).toEqual(['one two', 'three', 'four'])
    expect(wrapText('abcdefghijklmnop', 50, w)).toEqual(['abcde', 'fghij', 'klmno', 'p'])
    expect(wrapText('first\nsecond', 500, w)).toEqual(['first', 'second'])
    expect(wrapText('', 100, w)).toEqual([' '])
  })
})
