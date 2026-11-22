import type { Metadata } from 'next'
import { DSA_MODULES } from '@/data/dsa'
import { lessonKey } from '@/lib/dsa'
import { DsaIndex, type ModuleCard } from './dsa-index'

export const metadata: Metadata = {
  title: 'DSA course',
  description: 'Learn data structures and algorithms step by step in Python and JavaScript: every lesson goes from the simple idea to the best solution, with a dry run and a coding exercise, from easy to hard.',
}

export default function Page() {
  const modules: ModuleCard[] = DSA_MODULES.map((m) => ({
    id: m.id,
    title: m.title,
    level: m.level,
    blurb: m.blurb,
    color: m.color,
    lessons: m.lessons.map((l) => ({ id: l.id, title: l.title, topic: l.topic, blurb: l.blurb, steps: l.steps.length, key: lessonKey(m.id, l.id) })),
  }))
  return <DsaIndex modules={modules} />
}
