import { describe, expect, it } from 'vitest'
import { LANGUAGES } from '@/data/languages'
import { FILE_NAMES } from '@/lib/exec/types'
import { PISTON_LANG } from '@/lib/exec/piston'
import { JUDGE0_NAME_PATTERNS } from '@/lib/exec/judge0'
import { decodeShare, encodeShare } from '@/lib/share'

describe('language registry', () => {
  it('has the 18 Programiz languages with unique ids and starter code', () => {
    expect(LANGUAGES).toHaveLength(18)
    expect(new Set(LANGUAGES.map((l) => l.id)).size).toBe(18)
    for (const l of LANGUAGES) expect(l.template.trim().length).toBeGreaterThan(20)
  })

  it('maps every server language for every backend', () => {
    for (const l of LANGUAGES.filter((x) => x.engine === 'server')) {
      const lang = l.runtime as keyof typeof FILE_NAMES
      expect(FILE_NAMES[lang], l.id).toBe(l.file)
      expect(PISTON_LANG[lang], l.id).toBeTruthy()
      expect(JUDGE0_NAME_PATTERNS[lang], l.id).toBeInstanceOf(RegExp)
    }
  })
})

describe('share links', () => {
  it('round-trips code and stdin, including unicode', async () => {
    const data = { code: 'print("héllo ✓")\n' + 'x = 1\n'.repeat(200), stdin: 'Sandeep\n42' }
    const token = await encodeShare(data)
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(token.length).toBeLessThan(200) // repetitive code compresses well
    expect(await decodeShare(token)).toEqual(data)
  })

  it('rejects garbage', async () => {
    expect(await decodeShare('not-a-real-token')).toBeNull()
  })
})
