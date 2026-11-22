// Mistakes: fix the broken code, or write it yourself. One set per technology
// (same ids as the question sets), in curriculum order.
import { css } from './css'
import { express } from './express'
import { html } from './html'
import { javascript } from './javascript'
import { react } from './react'
import { sql } from './sql'
import type { MistakeSet } from './types'

export type { MistakeDifficulty, MistakeItem, MistakeRequest, MistakeSet } from './types'
export { OUTPUT_CHECK, blankStart, demoSource, itemChecks } from './types'

export const MISTAKE_SETS: MistakeSet[] = [html, css, javascript, react, express, sql]

export const MISTAKES_BY_ID: Record<string, MistakeSet> = Object.fromEntries(MISTAKE_SETS.map((s) => [s.id, s]))

/** The id used in progress and drafts: "<set>/<item>". */
export const mistakeKey = (set: string, item: string) => `${set}/${item}`
