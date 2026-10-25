import { LEARN_TRACKS } from '@/data/learn'
import { QUESTION_SETS, questionKey } from '@/data/questions'
import { Dashboard, type TechSummary } from './dashboard'

// Short names for the home page's technology strip.
const SHORT: Record<string, string> = { express: 'Express', security: 'Security', git: 'Git', docker: 'Docker', 'system-design': 'System Design' }

export default function Page() {
  const techs: TechSummary[] = QUESTION_SETS.map((s) => ({
    id: s.id,
    title: s.title,
    short: SHORT[s.id] ?? s.title,
    color: s.color,
    badge: s.badge,
    questions: s.questions.length,
    keys: s.questions.map((q) => questionKey(s.id, q)),
    notes: Boolean(s.notesId),
  }))
  return <Dashboard techs={techs} learn={{ tracks: LEARN_TRACKS.length, steps: LEARN_TRACKS.reduce((n, t) => n + t.steps.length, 0) }} />
}
