// The notes/questions mini-markup: `code`, **bold**, ==highlight==.
// Code spans win: markup characters inside them are literal. Bold and
// highlight may contain code spans (e.g. ==save `next` first==).

export type Token =
  | { type: 'text'; text: string }
  | { type: 'code'; text: string }
  | { type: 'bold' | 'hl'; children: Token[] }

/** Index of the closing `mark` at or after `from`, skipping over code spans; -1 if none. */
function closing(s: string, mark: string, from: number): number {
  for (let i = from; i < s.length; i++) {
    if (s[i] === '`') {
      const end = s.indexOf('`', i + 1)
      if (end === -1) return -1
      i = end
    } else if (s.startsWith(mark, i)) {
      return i
    }
  }
  return -1
}

export function tokenize(s: string): Token[] {
  const out: Token[] = []
  let text = ''
  const flush = () => {
    if (text) out.push({ type: 'text', text })
    text = ''
  }
  for (let i = 0; i < s.length; ) {
    if (s[i] === '`') {
      const end = s.indexOf('`', i + 1)
      if (end > i + 1) {
        flush()
        out.push({ type: 'code', text: s.slice(i + 1, end) })
        i = end + 1
        continue
      }
    }
    const mark = s.startsWith('**', i) ? '**' : s.startsWith('==', i) ? '==' : null
    if (mark) {
      const end = closing(s, mark, i + 2)
      if (end > i + 2) {
        flush()
        out.push({ type: mark === '**' ? 'bold' : 'hl', children: tokenize(s.slice(i + 2, end)) })
        i = end + 2
        continue
      }
    }
    text += s[i++]
  }
  flush()
  return out
}

/** The text with all markup removed. */
export function plainText(s: string): string {
  const walk = (tokens: Token[]): string => tokens.map((t) => ('children' in t ? walk(t.children) : t.text)).join('')
  return walk(tokenize(s))
}
