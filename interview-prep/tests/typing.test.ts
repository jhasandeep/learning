import { describe, expect, it } from 'vitest'
import { CHAR_KEY, KEYBOARD, LESSONS } from '@/data/typing'
import { backspace, createSession, isDone, keyOf, lessonText, rng, starsFor, stats, testWords, typable, typeChar, wordsFrom } from '@/lib/typing'

const typeAll = (target: string, input: string, autoIndent = false) => {
  let s = createSession(target, autoIndent)
  let t = 0
  for (const ch of input) s = typeChar(s, ch, (t += 200))
  return s
}

describe('keyboard', () => {
  it('maps every printable ASCII character to a key and finger', () => {
    for (let c = 32; c < 127; c++) expect(CHAR_KEY[String.fromCharCode(c)], String.fromCharCode(c)).toBeDefined()
    expect(CHAR_KEY.A.shift).toBe(true)
    expect(CHAR_KEY.f.key.finger).toBe('li')
    expect(KEYBOARD.flat().filter((k) => k.bump).map((k) => k.base)).toEqual(['f', 'j'])
  })
  it('names the physical key', () => {
    expect([keyOf('A'), keyOf('?'), keyOf(' '), keyOf('\n')]).toEqual(['a', '/', 'space', 'enter'])
  })
})

describe('typing session', () => {
  it('counts WPM from correct characters and accuracy from keystrokes', () => {
    const s = typeAll('hello world', 'hellp world')
    expect(isDone(s)).toBe(true)
    const st = stats(s, 0)
    expect(st.correct).toBe(10)
    expect(st.incorrect).toBe(1)
    expect(st.accuracy).toBeCloseTo(90.9, 1)
    expect(st.seconds).toBeCloseTo(2, 5) // 11 strokes, 200 ms apart, from the first
    expect(st.wpm).toBe(Math.round(10 / 5 / (2 / 60)))
  })

  it('keeps a fixed mistake in accuracy but not in WPM', () => {
    let s = createSession('abc')
    s = typeChar(s, 'x', 0)
    s = backspace(s)
    s = typeChar(typeChar(typeChar(s, 'a', 100), 'b', 200), 'c', 300)
    const st = stats(s, 0)
    expect(st.correct).toBe(3)
    expect(st.accuracy).toBe(75)
    expect(s.keys.a).toEqual([1, 1])
  })

  it('deletes a whole word with ctrl+backspace', () => {
    expect(backspace(typeAll('one two three', 'one tw'), true).typed).toBe('one ')
    expect(backspace(typeAll('one two three', 'one two '), true).typed).toBe('one ')
  })

  it('types indentation after Enter in code mode, and removes it with the Enter', () => {
    const code = 'if (x) {\n  go()\n}'
    const s = typeAll(code, 'if (x) {\n', true)
    expect(s.typed).toBe('if (x) {\n  ')
    expect(backspace(s).typed).toBe('if (x) {')
    expect(isDone(typeAll(code, 'if (x) {\ngo()\n}', true))).toBe(true)
  })

  it('stops accepting input when finished', () => {
    const s = typeAll('ab', 'abcd')
    expect(s.typed).toBe('ab')
    expect(s.endedAt).not.toBeNull()
  })

  it('awards stars by accuracy and speed', () => {
    const base = { raw: 0, correct: 0, incorrect: 0, seconds: 60 }
    expect(starsFor({ ...base, wpm: 40, accuracy: 99 })).toBe(3)
    expect(starsFor({ ...base, wpm: 20, accuracy: 95 })).toBe(2)
    expect(starsFor({ ...base, wpm: 5, accuracy: 88 })).toBe(1)
    expect(starsFor({ ...base, wpm: 60, accuracy: 70 })).toBe(0)
  })
})

describe('lesson text', () => {
  const snippets = { javascript: ['const a = 1\nconsole.log(a)'], python: ['print(1)'], sql: ['SELECT 1;'] }

  for (const lesson of LESSONS) {
    it(`${lesson.id}: is typable, varied and uses only the lesson's keys`, () => {
      const a = lessonText(lesson, 1, snippets)
      expect(a.length, a).toBeGreaterThan(lesson.kind === 'code' ? 5 : 60)
      expect(typable(a), a).toBe(true)
      expect(lessonText(lesson, 1, snippets)).toBe(a) // reproducible
      if (lesson.kind !== 'code') expect(lessonText(lesson, 2, snippets)).not.toBe(a)
      if (lesson.kind === 'keys') {
        for (const c of a.replace(/ /g, '')) expect(lesson.keys, `${c} in "${a}"`).toContain(c)
        for (const c of lesson.newKeys) expect(a).toContain(c)
      }
    })
  }

  it('finds real words for the early lessons', () => {
    expect(wordsFrom('asdfghjkl')).toEqual(expect.arrayContaining(['ask', 'flask', 'glad']))
    expect(wordsFrom('asdfghjkleiru', 'ei').length).toBeGreaterThanOrEqual(6)
  })

  it('builds timed-test text', () => {
    const t = testWords('punctuation', rng(3), 40)
    expect(t.split(' ').length).toBe(40)
    expect(typable(t)).toBe(true)
  })
})

describe('code snippets', () => {
  it('has enough typable code for every code lesson', async () => {
    const { codeSnippets } = await import('@/lib/typing-snippets')
    const s = codeSnippets()
    expect(s.javascript.length).toBeGreaterThanOrEqual(10)
    expect(s.python.length).toBeGreaterThanOrEqual(8)
    expect(s.sql.length).toBeGreaterThanOrEqual(8)
    for (const list of Object.values(s)) for (const code of list) expect(typable(code), code).toBe(true)
  })
})
