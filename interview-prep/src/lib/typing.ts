// The typing engine: session state, keystroke handling and statistics, plus
// the generators that turn a lesson into practice text. Pure functions only.
import { CHAR_KEY, COMMON_WORDS, EASY_WORDS, PUNCTUATION_WORDS, SENTENCES, type Lesson } from '@/data/typing'

// ---------- session ----------

export interface Session {
  target: string
  typed: string
  /** Character keystrokes (not counting backspace or auto-indent). */
  strokes: number
  /** Keystrokes that did not match the expected character, even if fixed later. */
  wrong: number
  startedAt: number | null
  endedAt: number | null
  /** Code mode: after Enter, type the next line's indentation automatically. */
  autoIndent: boolean
  /** Base key → [hits, misses]. */
  keys: Record<string, [number, number]>
}

export function createSession(target: string, autoIndent = false): Session {
  return { target, typed: '', strokes: 0, wrong: 0, startedAt: null, endedAt: null, autoIndent, keys: {} }
}

/** The physical key that produces a character (its unshifted symbol), for per-key stats. */
export function keyOf(ch: string): string {
  if (ch === ' ') return 'space'
  if (ch === '\n') return 'enter'
  const entry = CHAR_KEY[ch]
  return entry ? entry.key.base : ch.toLowerCase()
}

export const isDone = (s: Session) => s.typed.length >= s.target.length

export function typeChar(s: Session, ch: string, now: number): Session {
  if (s.endedAt !== null || isDone(s)) return s
  const expected = s.target[s.typed.length]
  const ok = ch === expected
  const key = keyOf(expected)
  const [hits, misses] = s.keys[key] ?? [0, 0]
  let typed = s.typed + ch
  if (s.autoIndent && ch === '\n' && ok) {
    const indent = s.target.slice(typed.length).match(/^[ \t]*/)![0]
    typed += indent
  }
  const next: Session = {
    ...s,
    typed,
    strokes: s.strokes + 1,
    wrong: s.wrong + (ok ? 0 : 1),
    startedAt: s.startedAt ?? now,
    keys: { ...s.keys, [key]: ok ? [hits + 1, misses] : [hits, misses + 1] },
  }
  if (isDone(next)) next.endedAt = now
  return next
}

/** Delete one character, or (word = true) back to the start of the current word. */
export function backspace(s: Session, word = false): Session {
  if (s.endedAt !== null || !s.typed) return s
  let typed = s.typed
  if (word) {
    typed = typed.replace(/\s+$/, '')
    typed = typed.slice(0, typed.search(/\S*$/))
  } else {
    // Right after an auto-indent, one Backspace removes the indent and the Enter together.
    const indent = s.autoIndent ? s.typed.match(/\n[ \t]+$/) : null
    typed = indent ? typed.slice(0, -indent[0].length) : typed.slice(0, -1)
  }
  return { ...s, typed }
}

/** Grow the target (timed tests add words as you type). */
export const extend = (s: Session, more: string): Session => ({ ...s, target: s.target + more })

/** Finish early (timed tests). */
export const finish = (s: Session, now: number): Session => (s.endedAt !== null ? s : { ...s, endedAt: now, startedAt: s.startedAt ?? now })

export interface Stats {
  wpm: number
  raw: number
  accuracy: number
  correct: number
  incorrect: number
  seconds: number
}

export function stats(s: Session, now: number): Stats {
  let correct = 0
  for (let i = 0; i < s.typed.length; i++) if (s.typed[i] === s.target[i]) correct++
  const end = s.endedAt ?? now
  const seconds = s.startedAt === null ? 0 : Math.max(0, (end - s.startedAt) / 1000)
  const minutes = Math.max(seconds, 1) / 60
  return {
    wpm: Math.round(correct / 5 / minutes),
    raw: Math.round(s.typed.length / 5 / minutes),
    accuracy: s.strokes ? Math.round(((s.strokes - s.wrong) / s.strokes) * 1000) / 10 : 100,
    correct,
    incorrect: s.typed.length - correct,
    seconds,
  }
}

/** 0–3 stars for a finished lesson. */
export function starsFor(st: Stats): 0 | 1 | 2 | 3 {
  if (st.accuracy >= 97 && st.wpm >= 30) return 3
  if (st.accuracy >= 94 && st.wpm >= 15) return 2
  if (st.accuracy >= 85) return 1
  return 0
}

// ---------- text generation ----------

/** Small seeded random generator, so a lesson attempt is reproducible. */
export function rng(seed: number) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const pick = <T,>(list: readonly T[]): T => list[Math.floor(next() * list.length)]
  const shuffle = <T,>(list: readonly T[]): T[] => {
    const out = [...list]
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1))
      ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
  }
  return { next, pick, shuffle }
}
type Rng = ReturnType<typeof rng>

const ALL_WORDS = [...new Set([...EASY_WORDS, ...COMMON_WORDS])]

/** Words that use only `allowed` characters (preferring ones with a new key). */
export function wordsFrom(allowed: string, prefer = ''): string[] {
  const ok = ALL_WORDS.filter((w) => w.length >= 2 && [...w].every((c) => allowed.includes(c)))
  const preferred = prefer ? ok.filter((w) => [...prefer].some((c) => w.includes(c))) : []
  return preferred.length >= 6 ? preferred : ok
}

function drill(keys: string[], r: Rng): string[] {
  const groups: string[] = []
  for (const c of keys) groups.push(c.repeat(3))
  if (keys.length >= 2) {
    const [a, b] = keys
    groups.push(`${a}${b}${a}`, `${b}${a}${b}`, `${a}${a}${b}`, `${b}${b}${a}`, `${a}${b}`, `${b}${a}`)
  }
  return r.shuffle(groups)
}

function mixed(pool: string, newKeys: string, r: Rng, count: number): string[] {
  return Array.from({ length: count }, () => {
    const len = 3 + Math.floor(r.next() * 3)
    return Array.from({ length: len }, () => (r.next() < 0.5 && newKeys ? r.pick([...newKeys]) : r.pick([...pool]))).join('')
  })
}

const SYMBOL_TOKENS: Record<string, string[]> = {
  brackets: ['()', '[]', '{}', 'f(x)', 'arr[i]', '{ a }', '(a, b)', '[1, 2]', 'map[key]', 'fn()', 'obj{}', '(())', '[[0]]', '{ id: 1 }', 'list[0]', 'call(a)', '{ x, y }', 'grid[r][c]'],
  operators: ['a = b', 'x + y', 'n - 1', 'i * 2', 'a / b', 'x < y', 'a > b', '!ok', 'a && b', 'a || b', 'n % 2', 'i += 1', 'a === b', 'x !== y', 'a <= b', 'n >= 0', 'x => x * 2', 'a & b', 'a | b', 'i++'],
  'code-symbols': ['$x', '#id', '@user', 'snake_case', '`code`', 'C:\\path', '~/home', '2 ^ 3', '${name}', '#!/bin/sh', '@Component', '__init__', '$("#app")', '`${a}`', '~x', 'a_b_c', 'user@mail.com', '#fff'],
}

/** The practice text for one attempt at a lesson. `snippets` feeds the code lessons. */
export function lessonText(lesson: Lesson, seed: number, snippets: Record<string, string[]> = {}): string {
  const r = rng(seed)
  switch (lesson.kind) {
    case 'keys': {
      const allowed = lesson.keys
      const fresh = lesson.newKeys.join('')
      const letters = [...allowed].filter((c) => /[a-z]/.test(c)).join('')
      let words = wordsFrom(letters, fresh.replace(/[^a-z]/g, ''))
      if (words.length < 3) words = mixed(letters, fresh, r, 8)
      const tokens = [...drill(lesson.newKeys, r), ...mixed(allowed, fresh, r, 6), ...Array.from({ length: 10 }, () => r.pick(words))]
      return tokens.join(' ')
    }
    case 'words': {
      const pool = lesson.keys ? wordsFrom(lesson.keys) : COMMON_WORDS
      return Array.from({ length: 28 }, () => r.pick(pool)).join(' ')
    }
    case 'shift': {
      const names = ['Asha', 'Ben', 'Chen', 'Dina', 'React', 'Node', 'JavaScript', 'Python', 'SQL', 'Git', 'Docker', 'Linux', 'HTML', 'CSS', 'API', 'JSON']
      return Array.from({ length: 22 }, (_, i) => (i % 3 === 0 ? r.pick(names) : (([w]) => w[0].toUpperCase() + w.slice(1))([r.pick(COMMON_WORDS)]))).join(' ')
    }
    case 'punctuation':
      return Array.from({ length: 22 }, (_, i) => (i % 2 ? r.pick(PUNCTUATION_WORDS) : r.pick(COMMON_WORDS))).join(' ')
    case 'numbers':
      return Array.from({ length: 18 }, () => {
        const kind = r.next()
        if (kind < 0.25) return String(1900 + Math.floor(r.next() * 130))
        if (kind < 0.5) return String(Math.floor(r.next() * 1000))
        if (kind < 0.7) return r.pick(['404', '200', '500', '8080', '3000', '127', '255', '1024', '65535'])
        if (kind < 0.85) return `${Math.floor(r.next() * 100)}.${Math.floor(r.next() * 100)}`
        return `${1 + Math.floor(r.next() * 9)},${String(Math.floor(r.next() * 1000)).padStart(3, '0')}`
      }).join(' ')
    case 'sentences':
      return r.shuffle(SENTENCES).slice(0, 3).join(' ')
    case 'symbols':
      return r.shuffle(SYMBOL_TOKENS[lesson.id] ?? []).slice(0, 14).join(' ')
    case 'code': {
      const list = snippets[lesson.lang ?? 'javascript'] ?? []
      return list.length ? r.pick(list) : 'const answer = 42\nconsole.log(answer)'
    }
  }
}

/** Endless text for a timed test: words, words with punctuation, or code. */
export function testWords(mode: 'words' | 'punctuation' | 'numbers', r: Rng, count: number): string {
  return Array.from({ length: count }, (_, i) => {
    if (mode === 'punctuation' && i % 4 === 3) return r.pick(PUNCTUATION_WORDS)
    if (mode === 'numbers' && i % 4 === 3) return String(Math.floor(r.next() * 10000))
    const w = r.pick(COMMON_WORDS)
    return mode === 'punctuation' && i % 7 === 0 ? w[0].toUpperCase() + w.slice(1) : w
  }).join(' ')
}

/** Is every character of `text` on the keyboard? (snippets with →, emoji etc. are skipped) */
export const typable = (text: string) => [...text].every((c) => c === '\n' || c === ' ' || CHAR_KEY[c])
