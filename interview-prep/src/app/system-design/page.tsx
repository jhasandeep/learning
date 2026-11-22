import type { Metadata } from 'next'
import { SD_MODULES } from '@/data/system-design'
import { SdIndex, type SdModuleCard } from './sd-index'

export const metadata: Metadata = {
  title: 'System design course',
  description: 'Learn system design building blocks (load balancers, caches, consistent hashing, rate limiters, queues, circuit breakers) with animated diagrams, real-world examples, working code in Python and JavaScript, simulators and practice.',
}

export default function Page() {
  const modules: SdModuleCard[] = SD_MODULES.map((m) => ({
    id: m.id,
    title: m.title,
    blurb: m.blurb,
    color: m.color,
    lessons: m.lessons.map((l) => ({ id: l.id, title: l.title, topic: l.topic, blurb: l.blurb, key: `sd/${m.id}/${l.id}` })),
  }))
  return <SdIndex modules={modules} />
}
