// Interview syntax sets for typing practice, in learning order.
import { async } from './async'
import { express } from './express'
import { javascript } from './javascript'
import { mongodb } from './mongodb'
import { nestjs } from './nestjs'
import { nextjs } from './nextjs'
import { nodejs } from './nodejs'
import { python } from './python'
import { react } from './react'
import { sql } from './sql'
import { testing } from './testing'
import { typescript } from './typescript'
import type { SyntaxSet } from './types'

export type { SyntaxLang, SyntaxSet, SyntaxSnippet } from './types'

export const SYNTAX_SETS: SyntaxSet[] = [javascript, async, typescript, react, nextjs, nodejs, express, nestjs, testing, sql, mongodb, python]

export const SYNTAX_SETS_BY_ID: Record<string, SyntaxSet> = Object.fromEntries(SYNTAX_SETS.map((s) => [s.id, s]))

/** Logo/colour for each set (TechIcon topic ids where one exists). */
export const SYNTAX_LOOK: Record<string, { icon: string; color: string }> = {
  javascript: { icon: 'javascript', color: '#ca8a04' },
  async: { icon: 'javascript', color: '#7c3aed' },
  typescript: { icon: 'typescript', color: '#2563eb' },
  react: { icon: 'react', color: '#0891b2' },
  nextjs: { icon: 'nextjs', color: '#475569' },
  nodejs: { icon: 'nodejs', color: '#16a34a' },
  express: { icon: 'express', color: '#525252' },
  nestjs: { icon: 'nestjs', color: '#e0234e' },
  testing: { icon: 'testing', color: '#c2410c' },
  sql: { icon: 'sql', color: '#2563eb' },
  mongodb: { icon: 'mongodb', color: '#15803d' },
  python: { icon: 'python', color: '#3776ab' },
}
