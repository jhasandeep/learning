import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NOTE_TOPICS_BY_ID } from '@/data/notes'
import { TASK_PATHS, TASK_PATHS_BY_ID } from '@/data/tasks'
import { toWire } from '@/lib/tasks'
import { TaskWorkspace } from './task-workspace'

export function generateStaticParams() {
  return TASK_PATHS.flatMap((p) => p.tasks.map((t) => ({ tech: p.id, task: t.id })))
}

export async function generateMetadata({ params }: PageProps<'/tasks/[tech]/[task]'>): Promise<Metadata> {
  const { tech, task } = await params
  const t = TASK_PATHS_BY_ID[tech]?.tasks.find((x) => x.id === task)
  return { title: t ? `${t.title} · ${TASK_PATHS_BY_ID[tech].title} task` : 'Task' }
}

export default async function Page({ params }: PageProps<'/tasks/[tech]/[task]'>) {
  const { tech, task } = await params
  const path = TASK_PATHS_BY_ID[tech]
  const index = path ? path.tasks.findIndex((t) => t.id === task) : -1
  if (!path || index === -1) notFound()
  // key: a fresh editor, hints and checklist for every task
  return <TaskWorkspace key={`${tech}/${task}`} path={{ id: path.id, title: path.title, blurb: path.blurb, tasks: path.tasks.map((t) => ({ id: t.id, title: t.title })) }} task={toWire(path.tasks[index])} index={index} color={NOTE_TOPICS_BY_ID[tech]?.color ?? '#0891b2'} />
}
