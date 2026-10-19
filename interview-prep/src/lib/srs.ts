// Leitner-style spaced repetition: a card climbs boxes as you recall it and
// drops back to box 1 when you don't. Each box has a review interval in days.
export const INTERVAL_DAYS = [0, 1, 2, 4, 8, 16, 32]
export const MAX_BOX = INTERVAL_DAYS.length - 1

export type Grade = 'again' | 'good' | 'easy'

export interface CardState {
  box: number
  due: string // YYYY-MM-DD
}

export function dayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number)
  return dayKey(new Date(y, m - 1, d + days))
}

export function nextState(prev: CardState | undefined, grade: Grade, today: string): CardState {
  const box = prev?.box ?? 0
  const next = grade === 'again' ? 1 : Math.min(MAX_BOX, box + (grade === 'easy' ? 2 : 1))
  return { box: next, due: grade === 'again' ? today : addDays(today, INTERVAL_DAYS[next]) }
}

export function isDue(state: CardState | undefined, today: string): boolean {
  return state !== undefined && state.due <= today
}

/** Due cards first (lowest box first), then up to `newLimit` unseen cards. */
export function buildSession<T extends { id: string }>(
  cards: T[],
  states: Record<string, CardState>,
  today: string,
  newLimit = 10,
): T[] {
  const due = cards.filter((c) => isDue(states[c.id], today)).sort((a, b) => states[a.id].box - states[b.id].box)
  const fresh = cards.filter((c) => !states[c.id]).slice(0, newLimit)
  return [...due, ...fresh]
}
