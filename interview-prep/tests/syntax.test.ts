import { execFileSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import path from 'node:path'
import initSqlJs from 'sql.js'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { SQL_SETUP } from '@/data/notes/sql'
import type { SyntaxSet } from '@/data/syntax/types'
import { typable } from '@/lib/typing'

// Every set file in src/data/syntax, loaded directly so a new file is checked as soon as it exists.
const DIR = path.resolve('src/data/syntax')
const FILES = readdirSync(DIR).filter((f) => f.endsWith('.ts') && !['index.ts', 'types.ts'].includes(f))
const load = async (f: string) => Object.values(await import(/* @vite-ignore */ path.join(DIR, f))).find((v): v is SyntaxSet => Boolean(v && typeof v === 'object' && 'snippets' in v)) as SyntaxSet

const hasPython = (() => {
  try {
    execFileSync('python3', ['--version'])
    return true
  } catch {
    return false
  }
})()

/** Syntax errors from the TypeScript parser (works for JS, JSX, TS and TSX). */
function syntaxErrors(code: string, lang: string): string[] {
  const ext = { javascript: 'js', jsx: 'jsx', typescript: 'ts', tsx: 'tsx' }[lang]!
  const out = ts.transpileModule(code, { fileName: `snippet.${ext}`, reportDiagnostics: true, compilerOptions: { jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ES2022, experimentalDecorators: true } })
  return (out.diagnostics ?? []).map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'))
}

describe('interview syntax sets', () => {
  it('found the set files', () => expect(FILES.length).toBeGreaterThan(0))

  for (const file of FILES) {
    describe(file, () => {
      it('is well formed and typable', async () => {
        const set = await load(file)
        expect(set, 'exports a SyntaxSet').toBeDefined()
        expect(set.id).toBe(file.replace(/\.ts$/, ''))
        expect(set.snippets.length).toBeGreaterThanOrEqual(6)
        expect(new Set(set.snippets.map((s) => s.id)).size).toBe(set.snippets.length)
        for (const s of set.snippets) {
          expect(s.id, s.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
          expect(s.note.length, `${s.id} note`).toBeGreaterThan(30)
          expect(typable(s.code), `${s.id}: only keyboard characters`).toBe(true)
          const lines = s.code.split('\n')
          expect(lines.length, `${s.id}: lines`).toBeLessThanOrEqual(18)
          expect(lines.length, `${s.id}: lines`).toBeGreaterThanOrEqual(2)
          for (const l of lines) {
            expect(l.length, `${s.id}: "${l}"`).toBeLessThanOrEqual(70)
            expect(l, `${s.id}: trailing space`).toBe(l.trimEnd())
            expect((l.match(/^ */)![0].length) % 2, `${s.id}: 2-space indents "${l}"`).toBe(0)
          }
          expect(s.code, `${s.id}: no leading/trailing blank lines`).toBe(s.code.trim())
        }
      })

      it('has valid syntax', async () => {
        const set = await load(file)
        const SQL = set.snippets.some((s) => s.lang === 'sql') ? await initSqlJs() : null
        for (const s of set.snippets) {
          if (s.lang === 'python') {
            if (hasPython) expect(() => execFileSync('python3', ['-I', '-c', 'import ast,sys; ast.parse(sys.stdin.read())'], { input: s.code, stdio: ['pipe', 'pipe', 'pipe'] }), s.id).not.toThrow()
          } else if (s.lang === 'sql') {
            const db = new SQL!.Database()
            expect(() => db.exec(`${SQL_SETUP}\n${s.code}`), s.id).not.toThrow()
            db.close()
          } else {
            expect(syntaxErrors(s.code, s.lang), `${s.id}:\n${s.code}`).toEqual([])
          }
        }
      })
    })
  }
})
