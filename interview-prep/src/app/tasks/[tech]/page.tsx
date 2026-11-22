import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NOTE_TOPICS_BY_ID } from '@/data/notes'
import { TASK_PATHS, TASK_PATHS_BY_ID } from '@/data/tasks'
import { TechPath } from './tech-path'

export function generateStaticParams() {
  return TASK_PATHS.map((p) => ({ tech: p.id }))
}

export async function generateMetadata({ params }: PageProps<'/tasks/[tech]'>): Promise<Metadata> {
  const p = TASK_PATHS_BY_ID[(await params).tech]
  return p ? { title: `${p.title} tasks`, description: p.blurb } : { title: 'Tasks' }
}

export default async function Page({ params }: PageProps<'/tasks/[tech]'>) {
  const { tech } = await params
  const path = TASK_PATHS_BY_ID[tech]
  if (!path) notFound()
  const topic = NOTE_TOPICS_BY_ID[tech]
  return (
    <TechPath
      id={path.id}
      title={path.title}
      blurb={path.blurb}
      color={topic?.color ?? '#0891b2'}
      badge={topic?.badge ?? path.title.slice(0, 2)}
      tasks={path.tasks.map((t) => ({ id: t.id, title: t.title, goal: t.goal, steps: t.steps.length }))}
    />
  )
}
