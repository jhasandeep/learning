import { describe, expect, it } from 'vitest'
import { plainText, tokenize } from '@/lib/markup'

describe('mini-markup', () => {
  it('parses code, bold and highlight', () => {
    expect(tokenize('a `b` **c** ==d==')).toEqual([
      { type: 'text', text: 'a ' },
      { type: 'code', text: 'b' },
      { type: 'text', text: ' ' },
      { type: 'bold', children: [{ type: 'text', text: 'c' }] },
      { type: 'text', text: ' ' },
      { type: 'hl', children: [{ type: 'text', text: 'd' }] },
    ])
  })

  it('allows code inside highlight and bold', () => {
    expect(tokenize('==save `next` first==')).toEqual([{ type: 'hl', children: [{ type: 'text', text: 'save ' }, { type: 'code', text: 'next' }, { type: 'text', text: ' first' }] }])
    expect(plainText('**Clean up in the same `RUN`**')).toBe('Clean up in the same RUN')
  })

  it('treats markup characters inside code as literal', () => {
    expect(plainText('`==` vs `===` and `a ** b`')).toBe('== vs === and a ** b')
    expect(plainText('`a[mid] === 2`: but ==do not advance `mid`==')).toBe('a[mid] === 2: but do not advance mid')
  })

  it('leaves unmatched markers as text', () => {
    expect(plainText('2 ** 3 and a == b')).toBe('2 ** 3 and a == b')
  })
})
