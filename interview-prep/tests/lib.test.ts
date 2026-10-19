import { describe, expect, it } from 'vitest'
import { diffLines } from '@/lib/diff'
import { applyMutation, findMutations } from '@/lib/mutate'
import { campaignXp, dayStreak, endlessXp, levelFromXp } from '@/lib/progress'
import { addDays, buildSession, dayKey, nextState } from '@/lib/srs'
import { compile, deepEqual, formatValue, runCases } from '@/lib/testing'

describe('testing core', () => {
  it('deepEqual handles arrays, objects, undefined and NaN', () => {
    expect(deepEqual([1, [2, { a: 3 }]], [1, [2, { a: 3 }]])).toBe(true)
    expect(deepEqual([1, 2], [2, 1])).toBe(false)
    expect(deepEqual(undefined, null)).toBe(false)
    expect(deepEqual(NaN, NaN)).toBe(true)
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false)
  })

  it('formats values for display', () => {
    expect(formatValue(undefined)).toBe('undefined')
    expect(formatValue('x')).toBe('"x"')
    expect(formatValue([1, undefined])).toBe('[1,undefined]')
    expect(formatValue(-Infinity)).toBe('-Infinity')
  })

  it('reports thrown errors per case and does not mutate test inputs', () => {
    const tests = [{ args: [[3, 1, 2]], expected: [1, 2, 3] }, { args: [null], expected: 0 }]
    const fn = compile('function f(a) { return a.sort(); }', 'f')
    const [ok, bad] = runCases(fn, tests)
    expect(ok.passed).toBe(true)
    expect(tests[0].args[0]).toEqual([3, 1, 2])
    expect(bad.passed).toBe(false)
    expect(bad.error).toMatch(/TypeError/)
  })

  it('explains a renamed function', () => {
    expect(() => compile('function g() {}', 'f')).toThrow(/not found/)
  })
})

describe('mutations', () => {
  it('finds comparison sites without touching arrow functions', () => {
    const code = 'const f = (a) => a < 1 && a >= 0;'
    const muts = findMutations(code).map((m) => applyMutation(code, m))
    expect(muts).toContain('const f = (a) => a <= 1 && a >= 0;')
    expect(muts.every((m) => m.includes('=>'))).toBe(true)
  })
})

describe('spaced repetition', () => {
  const today = '2026-10-19'
  it('moves cards up boxes and schedules them', () => {
    expect(nextState(undefined, 'good', today)).toEqual({ box: 1, due: '2026-10-20' })
    expect(nextState({ box: 1, due: today }, 'easy', today)).toEqual({ box: 3, due: '2026-10-23' })
    expect(nextState({ box: 5, due: today }, 'again', today)).toEqual({ box: 1, due: today })
  })

  it('adds days across month boundaries', () => {
    expect(addDays('2026-10-30', 3)).toBe('2026-11-02')
  })

  it('puts due cards before new ones', () => {
    const cards = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const session = buildSession(cards, { c: { box: 2, due: '2026-10-01' }, b: { box: 1, due: '2026-12-01' } }, today)
    expect(session.map((c) => c.id)).toEqual(['c', 'a'])
  })
})

describe('progress maths', () => {
  it('levels grow quadratically', () => {
    expect(levelFromXp(0).level).toBe(1)
    expect(levelFromXp(100).level).toBe(2)
    expect(levelFromXp(399).level).toBe(2)
    expect(levelFromXp(400).level).toBe(3)
  })

  it('rewards fewer hints and never rewards a reveal', () => {
    expect(campaignXp(0, false, 1)).toBe(100)
    expect(campaignXp(2, false, 1)).toBe(60)
    expect(campaignXp(3, false, 1)).toBe(40)
    expect(campaignXp(0, true, 1)).toBe(0)
    expect(endlessXp(0, false, 3)).toBe(65)
  })

  it('counts a day streak that is still alive from yesterday', () => {
    const d = new Date()
    const t = dayKey(d)
    d.setDate(d.getDate() - 1)
    const y = dayKey(d)
    d.setDate(d.getDate() - 1)
    const y2 = dayKey(d)
    expect(dayStreak({ [y]: 2, [y2]: 1 }, t)).toBe(2)
    expect(dayStreak({ [t]: 1, [y]: 1 }, t)).toBe(2)
    expect(dayStreak({}, t)).toBe(0)
  })
})

describe('diff', () => {
  it('marks the changed line', () => {
    expect(diffLines('a\nb\nc', 'a\nB\nc')).toEqual([
      { type: 'same', text: 'a' },
      { type: 'del', text: 'b' },
      { type: 'add', text: 'B' },
      { type: 'same', text: 'c' },
    ])
  })
})
