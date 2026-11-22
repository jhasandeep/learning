import type { Block, NoteTopic } from '@/data/notes/types'
import { plainText } from './markup'
import { typable, type rng } from './typing'

// Typing practice from the technology notes: real sentences about a
// technology (definitions, key points, tips, common mistakes, Q&A answers),
// cleaned up so every character is on the keyboard.

export interface NoteTypingSet {
  id: string
  title: string
  sentences: string[]
}

const REPLACEMENTS: [RegExp, string][] = [
  [/[‘’]/g, "'"],
  [/[“”]/g, '"'],
  [/[–—]/g, '-'],
  [/→/g, '->'],
  [/…/g, '...'],
  [/×/g, 'x'],
  [/≈/g, '~'],
  [/ /g, ' '],
]

const MIN_CHARS = 40
const MAX_CHARS = 200
/** Keep the page payload small: at most this many sentences per technology, spread across the notes. */
const MAX_PER_TOPIC = 80

function clean(text: string): string {
  let s = plainText(text)
  for (const [re, to] of REPLACEMENTS) s = s.replace(re, to)
  return s.replace(/\s+/g, ' ').trim()
}

function textsOf(b: Block): string[] {
  switch (b.type) {
    case 'p':
    case 'tip':
    case 'revision':
      return [b.text]
    case 'def':
    case 'mistake':
      return [b.title && !b.text.toLowerCase().startsWith(b.title.toLowerCase()) ? `${b.title}: ${b.text}` : b.text]
    case 'list':
    case 'steps':
      return b.items
    default:
      return [] // code, tables and flows are not prose
  }
}

/** Splits a paragraph into sentences without breaking on things like "e.g." or "v1.2". */
function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+(?=[A-Z])/)
}

function usable(s: string): boolean {
  if (s.length < MIN_CHARS || s.length > MAX_CHARS) return false
  if (!typable(s)) return false
  // Mostly-code lines make poor prose; keep text with at least a few real words.
  return (s.match(/[A-Za-z]{3,}/g) ?? []).length >= 5
}

/** The typable sentences of one topic's notes, in reading order, without duplicates. */
export function noteSentences(topic: NoteTopic): string[] {
  const raw: string[] = []
  for (const section of topic.sections) for (const b of section.blocks) raw.push(...textsOf(b))
  for (const [, answer] of topic.qa) raw.push(answer)
  const out: string[] = []
  const seen = new Set<string>()
  for (const t of raw) {
    for (let s of sentences(clean(t))) {
      s = s.trim()
      if (!usable(s) || seen.has(s)) continue
      seen.add(s)
      out.push(/[.!?:]$/.test(s) ? s : `${s}.`)
    }
  }
  if (out.length <= MAX_PER_TOPIC) return out
  const step = out.length / MAX_PER_TOPIC
  return Array.from({ length: MAX_PER_TOPIC }, (_, i) => out[Math.floor(i * step)])
}

/** Typing sets for every notes topic that has enough prose. */
export function noteTypingSets(topics: NoteTopic[]): NoteTypingSet[] {
  return topics.map((t) => ({ id: t.id, title: t.title, sentences: noteSentences(t) })).filter((s) => s.sentences.length >= 8)
}

/**
 * About `chars` characters of notes prose. One technology gives a shuffled run of its sentences; "all" reads
 * in short runs of 3 sentences from the same technology so a passage still makes sense.
 */
export function notesText(sets: NoteTypingSet[], setId: string, r: ReturnType<typeof rng>, chars: number): string {
  const pool = setId === 'all' ? sets : sets.filter((s) => s.id === setId)
  if (pool.length === 0) return ''
  const out: string[] = []
  let length = 0
  while (length < chars) {
    const set = r.pick(pool)
    const run = setId === 'all' ? 3 : 1
    for (const s of r.shuffle(set.sentences).slice(0, run)) {
      out.push(s)
      length += s.length + 1
    }
  }
  return out.join(' ')
}
