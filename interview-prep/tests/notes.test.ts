import { existsSync } from 'node:fs'
import vm from 'node:vm'
import initSqlJs from 'sql.js'
import { transform } from 'sucrase'
import { describe, expect, it } from 'vitest'
import { ALL_CARDS, DECKS } from '@/data/decks'
import { NOTE_TOPICS, topicText, type Block } from '@/data/notes'

const RUNNABLE = new Set(['javascript', 'typescript', 'sql', 'html', 'python'])

function texts(b: Block): string[] {
  if ('text' in b) return [b.text]
  if ('items' in b) return b.items
  if (b.type === 'table') return [...b.head, ...b.rows.flat()]
  if (b.type === 'flow') return b.steps
  return []
}

/** Run a JS snippet the way the compiler's worker does (async body, captured console). */
async function runJs(code: string): Promise<string[]> {
  const logs: string[] = []
  const fakeConsole = { log: (...a: unknown[]) => logs.push(a.map(String).join(' ')), error: (...a: unknown[]) => logs.push(a.map(String).join(' ')) }
  const context = vm.createContext({ console: fakeConsole, setTimeout, clearTimeout, queueMicrotask, structuredClone, Promise, Date, Map })
  const wrapped = `(async () => {\n${code}\n})()`
  await vm.runInContext(wrapped, context, { timeout: 3000 })
  await new Promise((r) => setTimeout(r, 400)) // let timers in the snippet fire
  return logs
}

describe('notes content', () => {
  it('has unique topics with real depth', () => {
    expect(new Set(NOTE_TOPICS.map((t) => t.id)).size).toBe(NOTE_TOPICS.length)
    for (const t of NOTE_TOPICS) {
      expect(t.sections.length, t.id).toBeGreaterThanOrEqual(4)
      expect(t.qa.length, t.id).toBeGreaterThanOrEqual(8)
      expect(new Set(t.sections.map((s) => s.id)).size, t.id).toBe(t.sections.length)
    }
  })

  it('uses balanced inline markup', () => {
    for (const t of NOTE_TOPICS) {
      for (const s of t.sections) {
        for (const b of s.blocks) {
          for (const text of texts(b)) {
            expect((text.match(/`/g) ?? []).length % 2, `${t.id}/${s.id}: ${text}`).toBe(0)
            expect((text.match(/\*\*/g) ?? []).length % 2, `${t.id}/${s.id}: ${text}`).toBe(0)
            expect((text.match(/==/g) ?? []).length % 2, `${t.id}/${s.id}: ${text}`).toBe(0)
          }
        }
      }
    }
  })

  it('builds a search index', () => {
    expect(topicText(NOTE_TOPICS.find((t) => t.id === 'javascript')!)).toContain('event loop')
  })
})

describe('runnable notes snippets', () => {
  const snippets = NOTE_TOPICS.flatMap((t) =>
    t.sections.flatMap((s) => s.blocks.filter((b): b is Extract<Block, { type: 'code' }> => b.type === 'code' && Boolean(b.run)).map((b) => ({ where: `${t.id}/${s.id}`, block: b }))),
  )

  it('only marks compiler languages as runnable', () => {
    expect(snippets.length).toBeGreaterThan(15)
    for (const { where, block } of snippets) expect(RUNNABLE.has(block.lang), where).toBe(true)
  })

  for (const { where, block } of snippets.filter((x) => x.block.lang === 'javascript' || x.block.lang === 'typescript')) {
    it(`${where}: ${block.title ?? block.lang} runs without errors`, async () => {
      const js = block.lang === 'typescript' ? transform(block.code, { transforms: ['typescript'], disableESTransforms: true }).code : block.code
      const logs = await runJs(js)
      expect(logs.length).toBeGreaterThan(0)
    })
  }

  for (const { where, block } of snippets.filter((x) => x.block.lang === 'sql')) {
    it(`${where}: ${block.title ?? 'sql'} runs on SQLite`, async () => {
      const SQL = await initSqlJs()
      const db = new SQL.Database()
      expect(() => db.exec(block.code)).not.toThrow()
      db.close()
    })
  }

  it('JavaScript snippets print what their comments promise', async () => {
    const js = NOTE_TOPICS.find((t) => t.id === 'javascript')!
    const order = js.sections.find((s) => s.id === 'event-loop')!.blocks.find((b) => b.type === 'code') as Extract<Block, { type: 'code' }>
    expect(await runJs(order.code)).toEqual(['1 sync', '2 sync', '3 promise (microtask)', '4 microtask', '5 timeout (macrotask)'])
    const loop = js.sections.find((s) => s.id === 'scope')!.blocks.find((b) => b.type === 'code') as Extract<Block, { type: 'code' }>
    expect(await runJs(loop.code)).toEqual(['3,3,3 0,1,2'])
  })
})

describe('notes flashcard decks', () => {
  it('adds a deck for every topic and keeps card ids unique', () => {
    for (const t of NOTE_TOPICS) expect(DECKS.some((d) => d.id === t.id), t.id).toBe(true)
    const ids = ALL_CARDS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('notes PDFs', () => {
  it('ships a handwritten PDF for every topic (run scripts/export-notes-pdf.mjs after adding one)', () => {
    for (const t of NOTE_TOPICS) expect(existsSync(`public/notes/${t.id}.pdf`), t.id).toBe(true)
  })
})
