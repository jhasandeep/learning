// Learn tracks: one per technology, in curriculum order (same ids as the question sets).
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
import type { LearnTrack } from './types'

export type { LearnKind, LearnStep, LearnTrack } from './types'

export const LEARN_TRACKS: LearnTrack[] = [html, css, javascript, typescript, react, nextjs, nodejs, express, security, sql, mongodb, git, docker, testing, systemDesign, dsa]

export const LEARN_BY_ID: Record<string, LearnTrack> = Object.fromEntries(LEARN_TRACKS.map((t) => [t.id, t]))

/** The id used in progress and drafts: "<track>/<step>". */
export const learnKey = (track: string, step: string) => `${track}/${step}`
