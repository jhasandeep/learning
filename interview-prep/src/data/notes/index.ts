import { css } from './css'
import { django } from './django'
import { docker } from './docker'
import { express } from './express'
import { fastapi } from './fastapi'
import { git } from './git'
import { html } from './html'
import { javascript } from './javascript'
import { mongodb } from './mongodb'
import { nextjs } from './nextjs'
import { nodejs } from './nodejs'
import { python } from './python'
import { react } from './react'
import { security } from './security'
import { sql } from './sql'
import { testing } from './testing'
import { typescript } from './typescript'
import type { NoteCategory, NoteTopic } from './types'

export type { AnalogyStep, Block, NoteCategory, NoteSection, NoteTopic } from './types'

/** Full-stack curriculum order. */
export const NOTE_TOPICS: NoteTopic[] = [
  html, css, javascript, typescript, react, nextjs,
  nodejs, express, python, django, fastapi, security,
  sql, mongodb,
  git, docker, testing,
]

export const NOTE_TOPICS_BY_ID = Object.fromEntries(NOTE_TOPICS.map((t) => [t.id, t]))

export const NOTE_CATEGORIES: NoteCategory[] = ['Frontend', 'Backend', 'Databases', 'DevOps & Tools']

/** Plain text of a topic, for search. */
export function topicText(t: NoteTopic): string {
  const parts: string[] = [t.title, t.tagline]
  for (const s of t.sections) {
    parts.push(s.title)
    for (const b of s.blocks) {
      if ('text' in b) parts.push(b.text)
      if ('items' in b) parts.push(...b.items)
      if (b.type === 'table') parts.push(...b.head, ...b.rows.flat())
      if (b.type === 'flow') parts.push(...b.steps)
      if (b.type === 'analogy') parts.push(b.title, ...b.steps.flatMap((x) => [x.who, x.tech, x.text]))
      if (b.type === 'code') parts.push(b.title ?? '', b.code)
    }
  }
  for (const [q, a] of t.qa) parts.push(q, a)
  return parts.join(' ').replace(/[`*=]/g, '')
}
