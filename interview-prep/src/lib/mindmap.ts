// Builds the mind map: Full-stack → category → technology → section → key ideas.
// Pure data (no React), built on the server and handed to the map component.
import type { Block, NoteTopic } from '@/data/notes'
import type { QuestionCategory, QuestionTech } from '@/data/questions'
import { plainText } from './markup'

export type MapKind = 'root' | 'category' | 'tech' | 'section' | 'def' | 'point' | 'flow' | 'mistake' | 'tip' | 'question'

export interface MapNode {
  id: string
  kind: MapKind
  /** Mini-markup text. */
  label: string
  /** Second line: the gist of a question's answer, or a section's summary. */
  detail?: string
  /** Steps of a flow, shown as a chain. */
  steps?: string[]
  /** Topic colour, inherited down the tree. */
  color: string
  /** Technology id, for its logo. */
  tech?: string
  href?: string
  /** Technologies: how many interview questions it has (for the progress chip). */
  count?: number
  children?: MapNode[]
}

/** Leaves per section, so a branch stays readable when expanded. */
const MAX_LEAVES = 7
const MAX_POINTS_PER_BLOCK = 4

/** First sentence of a text, shortened to `max` characters on a word boundary. */
export function gist(text: string, max = 150): string {
  const first = text.split(/\n\s*\n/)[0].replace(/\s+/g, ' ').trim()
  // Find the sentence end with code spans masked, so `a ?? b` or `obj.x` never ends a sentence.
  const masked = first.replace(/`[^`]*`/g, (m) => '`' + 'x'.repeat(m.length - 2) + '`')
  const end = masked.match(/^.+?[.!?](?=\s|$)/)?.[0].length
  const sentence = end ? first.slice(0, end) : first
  if (plainText(sentence).length <= max) return sentence
  // Shorten on the plain text so markup is never cut in half.
  const plain = plainText(sentence)
  return plain.slice(0, plain.lastIndexOf(' ', max - 1)).replace(/[,;:]$/, '') + '…'
}

function leaves(blocks: Block[], prefix: string, color: string): MapNode[] {
  const out: MapNode[] = []
  let n = 0
  const add = (kind: MapKind, label: string, extra: Partial<MapNode> = {}) => out.push({ id: `${prefix}-${n++}`, kind, label, color, ...extra })
  for (const b of blocks) {
    switch (b.type) {
      case 'def':
        add('def', gist(b.text, 170), { detail: b.title })
        break
      case 'p':
        add('point', gist(b.text))
        break
      case 'list':
      case 'steps':
        b.items.slice(0, MAX_POINTS_PER_BLOCK).forEach((it) => add('point', gist(it, 130)))
        break
      case 'flow':
        add('flow', b.caption ? gist(b.caption, 120) : 'Flow', { steps: b.steps.map((s) => plainText(s)) })
        break
      case 'table':
        b.rows.slice(0, MAX_POINTS_PER_BLOCK).forEach((r) => add('point', `**${plainText(r[0])}**: ${r.slice(1).map((c) => plainText(c)).join(' · ')}`))
        break
      case 'mistake':
        add('mistake', gist(b.text, 150), { detail: b.title ?? 'Common mistake' })
        break
      case 'tip':
      case 'revision':
        add('tip', gist(b.text, 150), { detail: b.type === 'tip' ? 'Tip' : 'Revise' })
        break
      case 'code':
        break // code lives in the notes; the map keeps the ideas
    }
  }
  // A section that is all code: name what each example shows instead.
  if (out.length === 0) {
    for (const b of blocks) if (b.type === 'code' && b.title) add('point', `Example: ${b.title}`)
  }
  return out.slice(0, MAX_LEAVES)
}

function questionLeaf(set: QuestionTech, q: QuestionTech['questions'][number]): MapNode {
  return { id: `${set.id}-q-${q.id}`, kind: 'question', label: q.q, detail: gist(q.a, 140), color: set.color, href: `/questions/${set.id}#${q.id}` }
}

/** Hand-made sections for the sets that have no notes topic. */
export const QUESTION_GROUPS: Record<string, [string, string[]][]> = {
  'system-design': [
    ['Scaling basics', ['vertical-vs-horizontal', 'load-balancer', 'cdn', 'high-availability', 'back-of-envelope']],
    ['Caching', ['caching-strategies', 'cache-eviction-invalidation']],
    ['Data at scale', ['replication', 'sharding', 'consistent-hashing', 'sql-vs-nosql', 'unique-id-generation']],
    ['Consistency', ['cap-theorem', 'consistency-models', 'distributed-transactions-saga', 'idempotency-retries']],
    ['Architecture', ['microservices-vs-monolith', 'api-gateway', 'message-queues', 'event-driven', 'realtime-websockets-sse', 'rate-limiting-algorithms', 'observability']],
    ['Design problems', ['design-url-shortener', 'design-rate-limiter', 'design-chat-app', 'design-news-feed', 'design-notification-system']],
  ],
  dsa: [
    ['Foundations', ['big-o-common-operations', 'array-vs-linked-list', 'recursion-vs-iteration', 'approach-unseen-problem']],
    ['Arrays & hashing', ['two-sum', 'group-anagrams', 'kadane', 'merge-intervals', 'dutch-national-flag']],
    ['Patterns', ['two-pointers', 'sliding-window', 'binary-search']],
    ['Lists & stacks', ['reverse-linked-list', 'detect-cycle-floyd', 'valid-parentheses', 'lru-cache']],
    ['Trees', ['tree-traversals', 'max-depth-tree', 'validate-bst', 'lca-bst', 'trie']],
    ['Heaps & sorting', ['top-k-heap', 'kth-largest', 'sorting-comparison']],
    ['Graphs', ['bfs-vs-dfs', 'topological-sort', 'dijkstra']],
    ['Dynamic programming', ['memoisation-vs-tabulation']],
  ],
}

export function techNode(set: QuestionTech, topic: NoteTopic | undefined): MapNode {
  const color = set.color
  const sections: MapNode[] = topic
    ? topic.sections.map((s, i) => ({
        id: `${set.id}-s-${s.id}`,
        kind: 'section' as const,
        label: `${i + 1}. ${s.title}`,
        color,
        href: `/notes/${topic.id}#${s.id}`,
        children: leaves(s.blocks, `${set.id}-s-${s.id}`, color),
      }))
    : (QUESTION_GROUPS[set.id] ?? []).map(([title, ids], i) => ({
        id: `${set.id}-g-${i}`,
        kind: 'section' as const,
        label: `${i + 1}. ${title}`,
        color,
        children: ids.map((id) => set.questions.find((q) => q.id === id)).filter((q) => q !== undefined).map((q) => questionLeaf(set, q)),
      }))
  const top = set.questions.filter((q) => q.freq === 3)
  if (topic) {
    sections.push({ id: `${set.id}-most-asked`, kind: 'section', label: `Most asked (${top.length})`, color, href: `/questions/${set.id}`, children: top.map((q) => questionLeaf(set, q)) })
  }
  return {
    id: set.id,
    kind: 'tech',
    label: set.title,
    detail: topic?.tagline ?? `${set.questions.length} interview questions`,
    color,
    tech: set.id,
    count: set.questions.length,
    href: topic ? `/notes/${topic.id}` : `/questions/${set.id}`,
    children: sections,
  }
}

const CATEGORY_COLOR: Record<QuestionCategory, string> = {
  Frontend: '#d97706',
  Backend: '#16a34a',
  Databases: '#2563eb',
  'DevOps & Tools': '#7c3aed',
  Fundamentals: '#e11d48',
}

export function buildMap(sets: QuestionTech[], topics: Record<string, NoteTopic>, categories: QuestionCategory[]): MapNode {
  return {
    id: 'root',
    kind: 'root',
    label: 'Full-stack interview map',
    detail: `${sets.length} technologies`,
    color: '#0891b2',
    children: categories.map((cat) => ({
      id: `cat-${cat}`,
      kind: 'category' as const,
      label: cat,
      color: CATEGORY_COLOR[cat],
      children: sets.filter((s) => s.category === cat).map((s) => techNode(s, s.notesId ? topics[s.notesId] : undefined)),
    })).filter((c) => c.children.length > 0),
  }
}

/** Every node id in the tree, depth first. */
export function walk(node: MapNode, visit: (n: MapNode, depth: number, parent?: MapNode) => void, depth = 0, parent?: MapNode) {
  visit(node, depth, parent)
  for (const c of node.children ?? []) walk(c, visit, depth + 1, node)
}
