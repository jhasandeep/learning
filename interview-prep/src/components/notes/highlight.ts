import 'server-only'
import { createHighlighter, type Highlighter } from 'shiki'

// One shared Shiki instance; notes pages are prerendered, so this only runs
// at build time and ships no highlighting JavaScript to the browser.
const LANGS = ['html', 'css', 'jsx', 'tsx', 'sql', 'python', 'yaml', 'bash', 'docker', 'json'] as const
let highlighter: Promise<Highlighter> | null = null

const ALIAS: Record<string, string> = { javascript: 'jsx', js: 'jsx', typescript: 'tsx', ts: 'tsx', dockerfile: 'docker', shell: 'bash', sh: 'bash', text: 'text' }

export async function highlight(code: string, lang: string): Promise<string> {
  // Shiki reads the clock while tokenizing, so the result is cached as a prerendered value.
  'use cache'
  highlighter ??= createHighlighter({ themes: ['github-dark'], langs: [...LANGS] })
  const h = await highlighter
  const resolved = ALIAS[lang] ?? lang
  return h.codeToHtml(code, { lang: (LANGS as readonly string[]).includes(resolved) ? resolved : 'text', theme: 'github-dark' })
}
