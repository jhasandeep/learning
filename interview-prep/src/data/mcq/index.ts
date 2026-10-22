// Multiple-choice quizzes, one per technology, keyed by the question-set id
// (so they share the set's title, colour, logo and category).
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
import type { McqSet } from './types'

export type { Mcq, McqDifficulty, McqSet } from './types'

export const MCQ_SETS: McqSet[] = [html, css, javascript, typescript, react, nextjs, nodejs, express, security, sql, mongodb, git, docker, testing, systemDesign, dsa]

export const MCQ_BY_ID: Record<string, McqSet> = Object.fromEntries(MCQ_SETS.map((s) => [s.id, s]))

/** The id used in progress: "<set>/<question>". */
export const mcqKey = (set: string, id: string) => `${set}/${id}`
