import { css } from './css'
import { git } from './git'
import { html } from './html'
import { django } from './django'
import { docker } from './docker'
import { express } from './express'
import { fastapi } from './fastapi'
import { javascript } from './javascript'
import { mongodb } from './mongodb'
import { nextjs } from './nextjs'
import { nodejs } from './nodejs'
import { python } from './python'
import { react } from './react'
import { security } from './security'
import { sql } from './sql'
import { typescript } from './typescript'
import { testing } from './testing'
import type { TaskPath } from './types'

export type { CheckItem, MongoTask, Rule, RuleTask, RunTask, SqlTask, Task, TaskPath } from './types'

/** Every technology's path of hands-on tasks, in the notes curriculum order. */
export const TASK_PATHS: TaskPath[] = [html, css, javascript, typescript, python, sql, mongodb, react, nextjs, nodejs, express, security, django, fastapi, git, docker, testing]

export const TASK_PATHS_BY_ID: Record<string, TaskPath> = Object.fromEntries(TASK_PATHS.map((p) => [p.id, p]))

/** The id used in progress: "<tech>/<task>". */
export const taskKey = (tech: string, task: string) => `${tech}/${task}`
