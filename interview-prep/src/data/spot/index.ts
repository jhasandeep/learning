// "Find the mistake" bug hunts, one per technology, keyed by the question-set
// id (so they share the set's title, colour, logo and category).
import { css } from './css'
import { docker } from './docker'
import { dsa } from './dsa'
import { express } from './express'
import { git } from './git'
import { html } from './html'
import { javascript } from './javascript'
import { mongodb } from './mongodb'
import { nextjs } from './nextjs'
import { nodejs } from './nodejs'
import { react } from './react'
import { security } from './security'
import { sql } from './sql'
import { systemDesign } from './system-design'
import { testing } from './testing'
import { typescript } from './typescript'
import type { SpotSet } from './types'

export { fixedCode } from './types'
export type { SpotBug, SpotDifficulty, SpotSet } from './types'

export const SPOT_SETS: SpotSet[] = [html, css, javascript, typescript, react, nextjs, nodejs, express, security, sql, mongodb, git, docker, testing, systemDesign, dsa]

export const SPOT_BY_ID: Record<string, SpotSet> = Object.fromEntries(SPOT_SETS.map((s) => [s.id, s]))

/** The id used in progress: "<set>/<bug>". */
export const spotKey = (set: string, id: string) => `${set}/${id}`
