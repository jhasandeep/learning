import type { LearnTrack } from './types'

const HOW = 'Your tests run against the correct code (they must all pass) and against buggy versions (each bug must make at least one test fail).'

export const testing: LearnTrack = {
  id: 'testing',
  intro: 'Write the tests yourself: assertions, edge cases, errors, objects, async code, mocks, classes and boundary values. Each lesson hides bugs your tests must catch.',
  kind: 'testing',
  lang: 'javascript',
  steps: [
    {
      id: 'first-test',
      title: 'Your first test',
      learn: `A test calls your code and **asserts** what should happen:

\`\`\`
test('adds two numbers', () => {
  expect(sum(2, 3)).toBe(5)
})
\`\`\`

\`toBe\` checks exact equality. One test can hold several assertions; name it after the behaviour.

${HOW}`,
      task: 'Write tests for `sum(a, b)`, which adds two numbers.',
      starter: `test('sum', () => {
  // expect(sum(…)).toBe(…)
})
`,
      solution: `test('adds two numbers', () => {
  expect(sum(2, 3)).toBe(5)
})

test('works with negatives and zero', () => {
  expect(sum(-4, 1)).toBe(-3)
  expect(sum(0, 0)).toBe(0)
})
`,
      tests: [],
      hints: ['`expect(sum(2, 3)).toBe(5)` catches most bugs.', 'A bug that returns the first argument still passes `sum(5, 0)`: pick inputs where it matters.'],
      setup: `{ name: 'sum', correct: (a, b) => a + b, bugs: { 'subtracts instead': (a, b) => a - b, 'returns the first number': (a) => a } }`,
    },
    {
      id: 'edge-cases',
      title: 'Edge cases',
      learn: `Happy paths are rarely where bugs hide. Test the **edges**: empty input, one item, mixed case, spaces, punctuation.

\`isPalindrome("Never odd or even")\` should be true: ignore case, spaces and punctuation.

${HOW}`,
      task: 'Test `isPalindrome(text)`: true when the letters/digits read the same both ways, ignoring case, spaces and punctuation. An empty string is a palindrome.',
      starter: `test('detects a palindrome', () => {
  expect(isPalindrome('racecar')).toBe(true)
})
`,
      solution: `test('detects simple palindromes', () => {
  expect(isPalindrome('racecar')).toBe(true)
  expect(isPalindrome('hello')).toBe(false)
})

test('ignores case, spaces and punctuation', () => {
  expect(isPalindrome('Never odd or even')).toBe(true)
  expect(isPalindrome('A man, a plan, a canal: Panama!')).toBe(true)
})

test('an empty string is a palindrome', () => {
  expect(isPalindrome('')).toBe(true)
})
`,
      tests: [],
      hints: ['One bug only fails on mixed case, another on punctuation.', 'Also assert something that is **not** a palindrome, and the empty string.'],
      setup: `{
  name: 'isPalindrome',
  correct: (t) => { const s = t.toLowerCase().replace(/[^a-z0-9]/g, ''); return s === [...s].reverse().join('') },
  bugs: {
    'is case-sensitive': (t) => { const s = t.replace(/[^a-zA-Z0-9]/g, ''); return s === [...s].reverse().join('') },
    'keeps punctuation': (t) => { const s = t.toLowerCase().replace(/ /g, ''); return s === [...s].reverse().join('') },
    'always says true': () => true,
    'empty string is false': (t) => { const s = t.toLowerCase().replace(/[^a-z0-9]/g, ''); return s.length > 0 && s === [...s].reverse().join('') },
  },
}`,
    },
    {
      id: 'errors',
      title: 'Testing errors',
      learn: `When bad input should **throw**, test that it does. Pass a function so the test can catch the error:

\`\`\`
expect(() => parseAge('abc')).toThrow('Invalid age')
\`\`\`

Without the arrow function, the error is thrown before \`expect\` runs and the test crashes.

${HOW}`,
      task: 'Test `parseAge(text)`: it returns the number for "0"–"150" and throws an error containing "Invalid age" for anything else (not a whole number, negative, above 150).',
      starter: `test('parses an age', () => {
  expect(parseAge('42')).toBe(42)
})
`,
      solution: `test('parses valid ages', () => {
  expect(parseAge('42')).toBe(42)
  expect(parseAge('0')).toBe(0)
  expect(parseAge('150')).toBe(150)
})

test('rejects bad input', () => {
  expect(() => parseAge('abc')).toThrow('Invalid age')
  expect(() => parseAge('-1')).toThrow('Invalid age')
  expect(() => parseAge('151')).toThrow('Invalid age')
  expect(() => parseAge('4.5')).toThrow('Invalid age')
})
`,
      tests: [],
      hints: ['`expect(() => parseAge("abc")).toThrow("Invalid age")`.', 'Each bug lets one kind of bad input through: test negatives, too-large and decimals too.'],
      setup: `{
  name: 'parseAge',
  correct: (t) => { if (!/^\\d+$/.test(t) || Number(t) > 150) throw new Error('Invalid age'); return Number(t) },
  bugs: {
    'returns NaN instead of throwing': (t) => { if (Number(t) > 150 || Number(t) < 0) throw new Error('Invalid age'); return Number(t) },
    'accepts negative numbers': (t) => { if (!/^-?\\d+$/.test(t) || Number(t) > 150) throw new Error('Invalid age'); return Number(t) },
    'has no upper limit': (t) => { if (!/^\\d+$/.test(t)) throw new Error('Invalid age'); return Number(t) },
    'accepts decimals': (t) => { if (!/^\\d+(\\.\\d+)?$/.test(t) || Number(t) > 150) throw new Error('Invalid age'); return Number(t) },
  },
}`,
    },
    {
      id: 'objects',
      title: 'Arrays and objects',
      learn: `\`toBe\` compares **identity**, so two equal arrays are not \`toBe\` each other. Use \`toEqual\` to compare contents.

Also check that a function doesn't **mutate** its input: keep a copy and compare afterwards.

${HOW}`,
      task: 'Test `uniqueSorted(numbers)`: it returns a new array of the distinct numbers in ascending order, and leaves the input unchanged.',
      starter: `test('sorts', () => {
  expect(uniqueSorted([3, 1, 2])).toBe([1, 2, 3])
})
`,
      solution: `test('sorts and removes duplicates', () => {
  expect(uniqueSorted([3, 1, 3, 2, 1])).toEqual([1, 2, 3])
})

test('sorts numbers numerically', () => {
  expect(uniqueSorted([10, 9, 100])).toEqual([9, 10, 100])
})

test('does not change the input', () => {
  const input = [3, 1, 2]
  uniqueSorted(input)
  expect(input).toEqual([3, 1, 2])
})
`,
      tests: [],
      hints: ['Use `toEqual` for arrays.', 'One bug sorts as strings (try 9, 10, 100); one sorts the input in place.'],
      setup: `{
  name: 'uniqueSorted',
  correct: (a) => [...new Set(a)].sort((x, y) => x - y),
  bugs: {
    'keeps duplicates': (a) => [...a].sort((x, y) => x - y),
    'sorts as text': (a) => [...new Set(a)].sort(),
    'changes the input': (a) => { a.sort((x, y) => x - y); return [...new Set(a)] },
  },
}`,
    },
    {
      id: 'async',
      title: 'Async code',
      learn: `For promises, make the test \`async\` and \`await\` the result; otherwise the test finishes before the assertion runs and always passes:

\`\`\`
test('loads', async () => {
  expect(await getScore(1)).toBe(90)
})
\`\`\`

Test rejections with \`await expect(promise).rejects.toThrow(…)\`.

${HOW}`,
      task: 'Test `getScore(id)`: it resolves to 90 for id 1 and 75 for id 2, and rejects with "Unknown player" for other ids.',
      starter: `test('gets a score', () => {
  getScore(1)
})
`,
      solution: `test('resolves scores', async () => {
  expect(await getScore(1)).toBe(90)
  expect(await getScore(2)).toBe(75)
})

test('rejects unknown players', async () => {
  await expect(getScore(99)).rejects.toMatch('Unknown player')
})
`,
      tests: [],
      hints: ['`async () => { expect(await getScore(1)).toBe(90) }`.', '`await expect(getScore(99)).rejects.toMatch("Unknown player")`.'],
      setup: `{
  name: 'getScore',
  correct: async (id) => { const s = { 1: 90, 2: 75 }[id]; if (s === undefined) throw new Error('Unknown player'); return s },
  bugs: {
    'swaps the scores': async (id) => { const s = { 1: 75, 2: 90 }[id]; if (s === undefined) throw new Error('Unknown player'); return s },
    'resolves undefined for unknown ids': async (id) => ({ 1: 90, 2: 75 })[id],
  },
}`,
    },
    {
      id: 'mocks',
      title: 'Mocks',
      learn: `When code calls something you don't want to run for real (email, payments, network), pass in a **mock** and check how it was called:

\`\`\`
const send = fn()
notify(send)
expect(send).toHaveBeenCalledWith('hello')
expect(send).not.toHaveBeenCalled()
\`\`\`

${HOW}`,
      task: 'Test `alertIfLow(stock, send)`: when `stock` is below 5 it calls `send("Low stock: <n>")` once; otherwise it does not call `send`.',
      starter: `test('alerts', () => {
  const send = fn()
  alertIfLow(2, send)
})
`,
      solution: `test('alerts when stock is low', () => {
  const send = fn()
  alertIfLow(2, send)
  expect(send).toHaveBeenCalledTimes(1)
  expect(send).toHaveBeenCalledWith('Low stock: 2')
})

test('stays quiet when stock is fine', () => {
  const send = fn()
  alertIfLow(5, send)
  alertIfLow(50, send)
  expect(send).not.toHaveBeenCalled()
})
`,
      tests: [],
      hints: ['`expect(send).toHaveBeenCalledWith("Low stock: 2")`.', 'Check the boundary: at exactly 5 nothing is sent.'],
      setup: `{
  name: 'alertIfLow',
  correct: (stock, send) => { if (stock < 5) send('Low stock: ' + stock) },
  bugs: {
    'never sends': () => {},
    'sends at 5 too': (stock, send) => { if (stock <= 5) send('Low stock: ' + stock) },
    'sends twice': (stock, send) => { if (stock < 5) { send('Low stock: ' + stock); send('Low stock: ' + stock) } },
    'wrong message': (stock, send) => { if (stock < 5) send('Low stock') },
  },
}`,
    },
    {
      id: 'classes',
      title: 'Testing a class',
      learn: `For a class, each test builds a **fresh** instance (so tests don't depend on each other), performs some actions, and checks the resulting state:

\`\`\`
const cart = new Cart()
cart.add('pen', 2, 1.5)
expect(cart.total()).toBe(3)
\`\`\`

${HOW}`,
      task: 'Test `Cart`: `add(name, qty, price)` adds or increases a line, `remove(name)` removes it, `total()` sums qty × price, and `count()` is the number of distinct items.',
      starter: `test('cart', () => {
  const cart = new Cart()
})
`,
      solution: `test('adds items and totals them', () => {
  const cart = new Cart()
  cart.add('pen', 2, 1.5)
  cart.add('book', 1, 10)
  expect(cart.total()).toBe(13)
  expect(cart.count()).toBe(2)
})

test('adding the same item increases its quantity', () => {
  const cart = new Cart()
  cart.add('pen', 1, 2)
  cart.add('pen', 2, 2)
  expect(cart.count()).toBe(1)
  expect(cart.total()).toBe(6)
})

test('removes items', () => {
  const cart = new Cart()
  cart.add('pen', 1, 2)
  cart.add('book', 1, 10)
  cart.remove('pen')
  expect(cart.total()).toBe(10)
  expect(cart.count()).toBe(1)
})
`,
      tests: [],
      hints: ['Make a `new Cart()` in each test.', 'Bugs hide in: totals that ignore quantity, re-adding an item, and remove.'],
      setup: `(() => {
  const make = (opts) => class Cart {
    lines = new Map()
    add(name, qty, price) {
      const cur = this.lines.get(name)
      if (cur && !opts.replace) cur.qty += qty
      else this.lines.set(name, { qty, price })
    }
    remove(name) { if (!opts.noRemove) this.lines.delete(name) }
    total() { let t = 0; for (const l of this.lines.values()) t += (opts.ignoreQty ? 1 : l.qty) * l.price; return t }
    count() { return this.lines.size }
  }
  return {
    name: 'Cart',
    correct: make({}),
    bugs: { 'ignores quantity in the total': make({ ignoreQty: true }), 're-adding replaces the quantity': make({ replace: true }), 'remove does nothing': make({ noRemove: true }) },
  }
})()`,
    },
    {
      id: 'boundaries',
      title: 'Boundary values',
      learn: `Off-by-one bugs live at the **boundaries**: \`>\` vs \`>=\`. For each range, test the value at the edge and the one just below it.

For grades A ≥ 90, B ≥ 80, C ≥ 70, else F: test 90 and 89, 80 and 79, 70 and 69, plus invalid input.

${HOW}`,
      task: 'Test `grade(score)`: "A" for 90–100, "B" for 80–89, "C" for 70–79, "F" below 70; scores outside 0–100 throw "Score out of range".',
      starter: `test('grades', () => {
  expect(grade(95)).toBe('A')
})
`,
      solution: `test('grades at every boundary', () => {
  expect(grade(100)).toBe('A')
  expect(grade(90)).toBe('A')
  expect(grade(89)).toBe('B')
  expect(grade(80)).toBe('B')
  expect(grade(79)).toBe('C')
  expect(grade(70)).toBe('C')
  expect(grade(69)).toBe('F')
  expect(grade(0)).toBe('F')
})

test('rejects scores out of range', () => {
  expect(() => grade(-1)).toThrow('Score out of range')
  expect(() => grade(101)).toThrow('Score out of range')
})
`,
      tests: [],
      hints: ['Test 90 and 89, 80 and 79, 70 and 69.', 'Also -1 and 101 should throw.'],
      setup: `(() => {
  const make = (a, b, c, check = true) => (s) => {
    if (check && (s < 0 || s > 100)) throw new Error('Score out of range')
    return a(s) ? 'A' : b(s) ? 'B' : c(s) ? 'C' : 'F'
  }
  return {
    name: 'grade',
    correct: make((s) => s >= 90, (s) => s >= 80, (s) => s >= 70),
    bugs: {
      '90 is a B': make((s) => s > 90, (s) => s >= 80, (s) => s >= 70),
      '80 is a C': make((s) => s >= 90, (s) => s > 80, (s) => s >= 70),
      '70 is an F': make((s) => s >= 90, (s) => s >= 80, (s) => s > 70),
      'no range check': make((s) => s >= 90, (s) => s >= 80, (s) => s >= 70, false),
    },
  }
})()`,
    },
  ],
}
