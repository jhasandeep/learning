// Most-asked interview questions: one set per technology, in curriculum order.
import { NOTE_TOPICS_BY_ID } from '../notes'
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
import type { Question, QuestionSet } from './types'

export type { Difficulty, Question, QuestionSet } from './types'

export type QuestionCategory = 'Frontend' | 'Backend' | 'Databases' | 'DevOps & Tools' | 'Fundamentals'

export interface QuestionTech extends QuestionSet {
  category: QuestionCategory
  color: string
  badge: string
  /** The matching notes topic (also its flashcard deck and whiteboard id). */
  notesId?: string
}

const fromNotes = (set: QuestionSet): QuestionTech => {
  const t = NOTE_TOPICS_BY_ID[set.id]
  return { ...set, category: t.category, color: t.color, badge: t.badge, notesId: t.id }
}

export const QUESTION_SETS: QuestionTech[] = [
  fromNotes(html),
  fromNotes(css),
  fromNotes(javascript),
  fromNotes(typescript),
  fromNotes(react),
  fromNotes(nextjs),
  fromNotes(nodejs),
  fromNotes(express),
  fromNotes(security),
  fromNotes(sql),
  fromNotes(mongodb),
  fromNotes(git),
  fromNotes(docker),
  fromNotes(testing),
  { ...systemDesign, category: 'Fundamentals', color: '#e11d48', badge: 'SD' },
  { ...dsa, category: 'Fundamentals', color: '#16a34a', badge: 'DSA' },
]

export const QUESTION_SETS_BY_ID: Record<string, QuestionTech> = Object.fromEntries(QUESTION_SETS.map((s) => [s.id, s]))

export const QUESTION_CATEGORIES: QuestionCategory[] = ['Frontend', 'Backend', 'Databases', 'DevOps & Tools', 'Fundamentals']

/** The id used in progress and URLs: "<set>/<question>". */
export const questionKey = (set: string, q: Question) => `${set}/${q.id}`

/** Lower-case text for search. */
export const questionText = (q: Question) => [q.q, q.a, q.tags.join(' '), q.followUp ?? '', q.code?.code ?? ''].join(' ').toLowerCase()
