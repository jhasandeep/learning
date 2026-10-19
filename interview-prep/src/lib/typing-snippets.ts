import 'server-only'
import { NOTE_TOPICS } from '@/data/notes'
import { SQL_SETUP } from '@/data/notes/sql'
import { QUESTION_SETS } from '@/data/questions'
import { PYTHON_SNIPPETS } from '@/data/typing'
import { typable } from './typing'

// Code-typing practice drawn from the notes and question examples: short,
// typable on a plain keyboard, by language. Built on the server.

const MAX_LINES = 10
const MAX_WIDTH = 64
const fits = (code: string) => {
  const lines = code.split('\n')
  return lines.length >= 2 && lines.length <= MAX_LINES && lines.every((l) => l.length <= MAX_WIDTH) && typable(code)
}
const tidy = (code: string) => code.replace(/\t/g, '  ').split('\n').map((l) => l.replace(/\s+$/, '')).join('\n').trim()

export function codeSnippets(): Record<string, string[]> {
  const all: { lang: string; code: string }[] = []
  for (const t of NOTE_TOPICS) for (const s of t.sections) for (const b of s.blocks) if (b.type === 'code') all.push({ lang: b.lang, code: b.code })
  for (const set of QUESTION_SETS) for (const q of set.questions) if (q.code) all.push(q.code)

  const js = all.filter((c) => ['javascript', 'typescript', 'tsx'].includes(c.lang)).map((c) => tidy(c.code)).filter(fits)
  // SQL examples start with sample-table setup: keep the queries after it, one per blank-line block.
  const sql = all
    .filter((c) => c.lang === 'sql')
    .flatMap((c) => tidy(c.code.startsWith(SQL_SETUP) ? c.code.slice(SQL_SETUP.length) : c.code).split(/\n\s*\n/))
    .map((q) => q.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n').trim())
    .filter((q) => /^(SELECT|WITH|UPDATE|INSERT|DELETE|CREATE INDEX)/i.test(q) && fits(q))

  return { javascript: [...new Set(js)], python: PYTHON_SNIPPETS.map(tidy), sql: [...new Set(sql)] }
}
