import { useSyncExternalStore } from 'react'
import { addDays, dayKey, nextState, type CardState, type Grade } from './srs'

// All progress lives in localStorage (no account needed). Components read it
// through useProgress(); the server render uses EMPTY and the client switches
// to the saved snapshot right after hydration.

export interface LevelResult {
  solvedAt: string
  hints: number
  revealed: boolean
  ms: number
}

export interface Progress {
  version: 1
  xp: number
  campaign: Record<string, LevelResult>
  endless: { solved: Record<string, LevelResult>; streak: number; best: number; last: number }
  cards: Record<string, CardState>
  reviews: number
  activity: Record<string, number>
  dailyGoal: number
  /** Note topic id → ISO date it was marked as read. */
  notesRead: Record<string, string>
  /** "<set>/<question id>" → how well you know a most-asked interview question. */
  questions: Record<string, QuestionStatus>
}

export type QuestionStatus = 'known' | 'review'

const KEY = 'prep-arena:progress:v1'

export const EMPTY: Progress = {
  version: 1,
  xp: 0,
  campaign: {},
  endless: { solved: {}, streak: 0, best: 0, last: 0 },
  cards: {},
  reviews: 0,
  activity: {},
  dailyGoal: 3,
  notesRead: {},
  questions: {},
}

let state: Progress = EMPTY
let loaded = false
const listeners = new Set<() => void>()

function load(): Progress {
  if (loaded) return state
  loaded = true
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) state = normalise(JSON.parse(raw))
  } catch {
    state = EMPTY
  }
  return state
}

function normalise(raw: unknown): Progress {
  if (!raw || typeof raw !== 'object' || (raw as Progress).version !== 1) throw new Error('Not a progress file')
  const p = raw as Partial<Progress>
  return {
    ...EMPTY,
    ...p,
    endless: { ...EMPTY.endless, ...p.endless },
  } as Progress
}

function commit(next: Progress) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // storage full or blocked: keep working in memory for this session
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      loaded = false
      load()
      listener()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

/** Current progress outside React's render (e.g. inside effects and event handlers). */
export function readProgress(): Progress {
  return load()
}

export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, load, () => EMPTY)
}

// ---------- derived values ----------

export function levelFromXp(xp: number) {
  const level = Math.floor(Math.sqrt(xp / 100)) + 1
  const floor = 100 * (level - 1) ** 2
  const ceil = 100 * level ** 2
  return { level, into: xp - floor, span: ceil - floor, pct: (xp - floor) / (ceil - floor) }
}

/** Consecutive active days ending today. `today` is '' before it is known. */
export function dayStreak(activity: Record<string, number>, today: string): number {
  if (!today) return 0
  // A streak is still alive if today has no activity yet but yesterday did.
  let d = activity[today] ? today : addDays(today, -1)
  let streak = 0
  while (activity[d]) {
    streak++
    d = addDays(d, -1)
  }
  return streak
}

// ---------- actions ----------

function bump(p: Progress, xpGain: number): Progress {
  const today = dayKey()
  return { ...p, xp: p.xp + xpGain, activity: { ...p.activity, [today]: (p.activity[today] ?? 0) + 1 } }
}

export function campaignXp(hints: number, revealed: boolean, bugs: number): number {
  if (revealed) return 0
  return Math.max(40, 100 * bugs - 20 * hints)
}

export function recordCampaignSolve(id: string, hints: number, revealed: boolean, ms: number, bugs: number): number {
  const p = load()
  const prev = p.campaign[id]
  // Re-solving only pays the difference if you did better than last time.
  const gain = Math.max(0, campaignXp(hints, revealed, bugs) - (prev ? campaignXp(prev.hints, prev.revealed, bugs) : 0))
  const result: LevelResult = { solvedAt: new Date().toISOString(), hints, revealed, ms }
  const best = !prev || campaignXp(hints, revealed, bugs) > campaignXp(prev.hints, prev.revealed, bugs)
    ? result
    : { ...prev, ms: Math.min(prev.ms, ms) }
  commit(bump({ ...p, campaign: { ...p.campaign, [id]: best } }, gain))
  return gain
}

export function endlessXp(hints: number, revealed: boolean, streak: number): number {
  if (revealed) return 0
  return Math.max(15, 50 - 10 * hints) + 5 * Math.min(streak, 10)
}

export function recordEndlessSolve(n: number, hints: number, revealed: boolean, ms: number): { gain: number; streak: number } {
  const p = load()
  const streak = revealed ? 0 : p.endless.streak + 1
  const already = Boolean(p.endless.solved[n])
  const gain = already ? 0 : endlessXp(hints, revealed, streak)
  commit(bump({
    ...p,
    endless: {
      solved: { ...p.endless.solved, [n]: p.endless.solved[n] ?? { solvedAt: new Date().toISOString(), hints, revealed, ms } },
      streak,
      best: Math.max(p.endless.best, streak),
      last: Math.max(p.endless.last, n),
    },
  }, gain))
  return { gain, streak }
}

export function breakEndlessStreak() {
  const p = load()
  if (p.endless.streak !== 0) commit({ ...p, endless: { ...p.endless, streak: 0 } })
}

export function recordReview(cardId: string, grade: Grade): number {
  const p = load()
  const gain = grade === 'again' ? 1 : grade === 'good' ? 3 : 4
  commit(bump({ ...p, cards: { ...p.cards, [cardId]: nextState(p.cards[cardId], grade, dayKey()) }, reviews: p.reviews + 1 }, gain))
  return gain
}

export const NOTE_READ_XP = 25

/** Mark a notes topic as read (one-way, so the XP can't be farmed). */
export function markNoteRead(id: string): number {
  const p = load()
  if (p.notesRead[id]) return 0
  commit(bump({ ...p, notesRead: { ...p.notesRead, [id]: new Date().toISOString() } }, NOTE_READ_XP))
  return NOTE_READ_XP
}

export const QUESTION_KNOWN_XP = 5

/**
 * Marks an interview question as known or to-review. XP is paid only the first
 * time a question gets any status, and a status is never removed, so toggling
 * can't farm XP.
 */
export function setQuestionStatus(key: string, status: QuestionStatus): number {
  const p = load()
  if (p.questions[key] === status) return 0
  const next = { ...p, questions: { ...p.questions, [key]: status } }
  if (p.questions[key]) {
    commit(next) // changing an existing status is free, and isn't daily activity
    return 0
  }
  const gain = status === 'known' ? QUESTION_KNOWN_XP : 0
  commit(bump(next, gain))
  return gain
}

export function setDailyGoal(goal: number) {
  commit({ ...load(), dailyGoal: Math.min(20, Math.max(1, Math.round(goal))) })
}

export function exportProgress(): string {
  return JSON.stringify(load(), null, 2)
}

export function importProgress(json: string) {
  commit(normalise(JSON.parse(json)))
}

export function resetProgress() {
  commit(EMPTY)
}

// ---------- badges ----------

export interface Badge {
  id: string
  title: string
  description: string
  earned: (p: Progress, ctx: { campaignTotal: number; today: string }) => boolean
}

export const BADGES: Badge[] = [
  { id: 'first-fix', title: 'First Blood', description: 'Fix your first bug.', earned: (p) => Object.keys(p.campaign).length + Object.keys(p.endless.solved).length > 0 },
  { id: 'no-hints', title: 'Clean Fix', description: 'Solve a campaign level without hints.', earned: (p) => Object.values(p.campaign).some((r) => r.hints === 0 && !r.revealed) },
  { id: 'speedrun', title: 'Speedrunner', description: 'Fix a campaign bug in under 60 seconds.', earned: (p) => Object.values(p.campaign).some((r) => !r.revealed && r.ms < 60_000) },
  { id: 'campaign', title: 'Campaign Cleared', description: 'Solve every campaign level.', earned: (p, { campaignTotal }) => Object.keys(p.campaign).length >= campaignTotal },
  { id: 'streak-5', title: 'On a Roll', description: 'Reach a 5-bug streak in Endless.', earned: (p) => p.endless.best >= 5 },
  { id: 'streak-15', title: 'Bug Exterminator', description: 'Reach a 15-bug streak in Endless.', earned: (p) => p.endless.best >= 15 },
  { id: 'cards-50', title: 'Flash Learner', description: 'Review 50 flashcards.', earned: (p) => p.reviews >= 50 },
  { id: 'mastered', title: 'Long-Term Memory', description: 'Move 10 cards to box 4 or higher.', earned: (p) => Object.values(p.cards).filter((c) => c.box >= 4).length >= 10 },
  { id: 'week', title: 'Week Warrior', description: 'Practise 7 days in a row.', earned: (p, { today }) => dayStreak(p.activity, today) >= 7 },
  { id: 'interview-ready', title: 'Interview Ready', description: 'Know 100 most-asked interview questions.', earned: (p) => Object.values(p.questions).filter((s) => s === 'known').length >= 100 },
  { id: 'reader', title: 'Full-Stack Reader', description: 'Mark 10 notes topics as read.', earned: (p) => Object.keys(p.notesRead).length >= 10 },
  { id: 'level-5', title: 'Level 5', description: 'Earn 1,600 XP.', earned: (p) => p.xp >= 1600 },
]
