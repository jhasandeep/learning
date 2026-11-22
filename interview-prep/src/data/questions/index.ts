// Most-asked interview questions: one set per technology, in curriculum order.
import { NOTE_TOPICS_BY_ID } from '../notes'
import { companyCoding } from './company-coding'
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
import { outputEventLoop } from './output-event-loop'
import { outputPython } from './output-python'
import { react } from './react'
import { security } from './security'
import { sql } from './sql'
import { systemDesign } from './system-design'
import { testing } from './testing'
import { typescript } from './typescript'
import type { Question, QuestionSet } from './types'

export type { Difficulty, Question, QuestionSet } from './types'

export type QuestionCategory = 'Frontend' | 'Backend' | 'Databases' | 'DevOps & Tools' | 'Fundamentals' | 'Company Prep'

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
  { ...companyCoding, category: 'Company Prep', color: '#0891b2', badge: 'CC' },
  { ...outputEventLoop, category: 'Company Prep', color: '#f59e0b', badge: 'EL' },
  { ...outputPython, category: 'Company Prep', color: '#3776ab', badge: 'PY' },
]

export const QUESTION_SETS_BY_ID: Record<string, QuestionTech> = Object.fromEntries(QUESTION_SETS.map((s) => [s.id, s]))

export const QUESTION_CATEGORIES: QuestionCategory[] = ['Frontend', 'Backend', 'Databases', 'DevOps & Tools', 'Fundamentals', 'Company Prep']

/** The id used in progress and URLs: "<set>/<question>". */
export const questionKey = (set: string, q: Question) => `${set}/${q.id}`

/** Lower-case text for search. */
export const questionText = (q: Question) => [q.q, q.a, q.tags.join(' '), q.followUp ?? '', q.code?.code ?? ''].join(' ').toLowerCase()
