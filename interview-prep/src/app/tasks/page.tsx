import type { Metadata } from 'next'
import { NOTE_CATEGORIES, NOTE_TOPICS_BY_ID } from '@/data/notes'
import { TASK_PATHS, taskKey } from '@/data/tasks'
import { TasksIndex, type PathCard } from './tasks-index'

export const metadata: Metadata = {
  title: 'Tasks',
  description: 'Learn by doing: a short path of hands-on tasks for every technology, with a checklist that ticks off as your code works.',
}

export default function Page() {
  const paths: PathCard[] = TASK_PATHS.map((p) => {
    const t = NOTE_TOPICS_BY_ID[p.id]
    return {
      id: p.id,
      title: p.title,
      blurb: p.blurb,
      category: t?.category ?? 'Frontend',
      color: t?.color ?? '#0891b2',
      badge: t?.badge ?? p.title.slice(0, 2),
      keys: p.tasks.map((x) => taskKey(p.id, x.id)),
      first: p.tasks[0]?.id ?? '',
    }
  })
  return <TasksIndex paths={paths} categories={NOTE_CATEGORIES} />
}
