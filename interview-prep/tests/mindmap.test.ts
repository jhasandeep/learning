import { describe, expect, it } from 'vitest'
import { NOTE_TOPICS_BY_ID } from '@/data/notes'
import { QUESTION_CATEGORIES, QUESTION_SETS, QUESTION_SETS_BY_ID } from '@/data/questions'
import { buildMap, gist, QUESTION_GROUPS, techNode, walk, type MapNode } from '@/lib/mindmap'
import { layoutMap } from '@/lib/mindmap-layout'

const root = buildMap(QUESTION_SETS, NOTE_TOPICS_BY_ID, QUESTION_CATEGORIES)
const allIds = (n: MapNode) => {
  const ids = new Set<string>()
  walk(n, (x) => x.children?.length && ids.add(x.id))
  return ids
}

describe('mind map data', () => {
  it('has every technology, once, under its category', () => {
    const techs: string[] = []
    walk(root, (n) => n.kind === 'tech' && techs.push(n.id))
    expect(techs.sort()).toEqual(QUESTION_SETS.map((s) => s.id).sort())
  })

  it('uses unique node ids', () => {
    const ids: string[] = []
    walk(root, (n) => ids.push(n.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every section something to remember', () => {
    walk(root, (n) => {
      if (n.kind === 'section') expect(n.children?.length, n.id).toBeGreaterThan(0)
    })
  })

  it('keeps markup balanced on every card', () => {
    walk(root, (n) => {
      for (const t of [n.label, n.detail ?? '']) expect((t.match(/`/g) ?? []).length % 2, `${n.id}: ${t}`).toBe(0)
    })
  })

  it('places every System Design and DSA question in exactly one group', () => {
    for (const [set, groups] of Object.entries(QUESTION_GROUPS)) {
      const grouped = groups.flatMap(([, ids]) => ids)
      expect(new Set(grouped).size, `${set}: duplicates`).toBe(grouped.length)
      expect(grouped.sort(), set).toEqual(QUESTION_SETS_BY_ID[set].questions.map((q) => q.id).sort())
    }
  })

  it('shortens text to its first sentence without cutting markup', () => {
    expect(gist('A closure keeps its scope. It is used for private state.')).toBe('A closure keeps its scope.')
    expect(gist('**word** '.repeat(40), 50).length).toBeLessThanOrEqual(51)
    expect(gist('**word** '.repeat(40), 50)).not.toContain('**')
    expect(gist('Use `a ?? b` for defaults. Then more.')).toBe('Use `a ?? b` for defaults.')
    expect(gist('Call `obj.method()` here. Next.')).toBe('Call `obj.method()` here.')
  })
})

describe('mind map layout', () => {
  const heights = new Map<string, number>()
  const check = (tree: MapNode) => {
    const layout = layoutMap(tree, allIds(tree), heights)
    // Nodes in the same column never overlap.
    const columns = new Map<number, typeof layout.nodes>()
    for (const n of layout.nodes) columns.set(n.x, [...(columns.get(n.x) ?? []), n])
    for (const col of columns.values()) {
      const sorted = [...col].sort((a, b) => a.y - b.y)
      for (let i = 1; i < sorted.length; i++) expect(sorted[i].y, `${sorted[i - 1].node.id} / ${sorted[i].node.id}`).toBeGreaterThanOrEqual(sorted[i - 1].y + sorted[i - 1].h)
    }
    // Children sit to the right of their parent; every edge joins visible nodes.
    for (const e of layout.edges) expect(e.to.x).toBeGreaterThan(e.from.x + e.from.w)
    expect(layout.nodes.every((n) => n.y >= 0 && n.y + n.h <= layout.height + 0.5)).toBe(true)
    return layout
  }

  it('lays out the whole map fully expanded without overlaps', () => {
    const layout = check(root)
    expect(layout.nodes.length).toBeGreaterThan(500)
  })

  it('lays out each technology map', () => {
    for (const s of QUESTION_SETS) check(techNode(s, s.notesId ? NOTE_TOPICS_BY_ID[s.notesId] : undefined))
  })

  it('shows only expanded branches', () => {
    const layout = layoutMap(root, new Set(['root']), heights)
    expect(layout.nodes.map((n) => n.node.kind).sort()).toEqual(['root', ...QUESTION_CATEGORIES.map(() => 'category')].sort())
  })
})
