import type { SpotSet } from './types'

export const testing: SpotSet = {
  id: 'testing',
  bugs: [
    {
      id: 'no-await',
      title: 'The test that cannot fail',
      task: '`fetchUser` was broken for a week, yet this test stayed green.',
      lang: 'javascript',
      code: `test('loads the user', () => {
  fetchUser(1).then((user) => {
    expect(user.name).toBe('Ada')
  })
})`,
      line: 2,
      fixed: `test('loads the user', async () => {
  const user = await fetchUser(1)
  expect(user.name).toBe('Ada')
})`,
      also: [1],
      explain: 'The promise is neither awaited nor returned, so the test ==finishes before the assertion runs==.',
      difficulty: 'Easy',
    },
    {
      id: 'tobe-object',
      title: 'Equal but not the same',
      task: 'The function returns exactly `{ x: 1, y: 2 }`, but the test fails.',
      lang: 'javascript',
      code: `test('creates a point', () => {
  expect(makePoint(1, 2)).toBe({ x: 1, y: 2 })
})`,
      line: 2,
      fix: '  expect(makePoint(1, 2)).toEqual({ x: 1, y: 2 })',
      explain: '`toBe` checks ==identity== (`Object.is`); two object literals are never the same object. `toEqual` compares the contents.',
      difficulty: 'Easy',
    },
    {
      id: 'shared-state',
      title: 'Passes alone, fails together',
      task: 'Each test passes on its own, but the second fails when the file runs in order.',
      lang: 'javascript',
      code: `const cart = new Cart()

test('adds an item', () => {
  cart.add('apple')
  expect(cart.count()).toBe(1)
})

test('starts empty', () => {
  expect(cart.count()).toBe(0)
})`,
      line: 1,
      fixed: `let cart
beforeEach(() => {
  cart = new Cart()
})

test('adds an item', () => {
  cart.add('apple')
  expect(cart.count()).toBe(1)
})

test('starts empty', () => {
  expect(cart.count()).toBe(0)
})`,
      explain: 'Both tests share one cart, so they depend on ==order==. Create fresh state in `beforeEach`.',
      difficulty: 'Medium',
    },
    {
      id: 'getby-async',
      title: 'Unable to find "Welcome, Ada"',
      task: 'The greeting appears after the profile loads, but the test fails immediately.',
      lang: 'jsx',
      code: `test('greets the user', async () => {
  render(<Profile id={1} />)
  expect(screen.getByText('Welcome, Ada')).toBeInTheDocument()
})`,
      line: 3,
      fix: "  expect(await screen.findByText('Welcome, Ada')).toBeInTheDocument()",
      explain: '`getBy*` checks once, right now. ==`findBy*`== retries until the element appears (or times out).',
      difficulty: 'Medium',
    },
    {
      id: 'real-timer',
      title: 'A 30-second test',
      task: 'Testing that a session expires after 30 seconds makes the suite slow and flaky.',
      lang: 'javascript',
      code: `test('expires the session', async () => {
  const session = startSession()
  await new Promise((r) => setTimeout(r, 30_000))
  expect(session.expired).toBe(true)
})`,
      line: 3,
      fixed: `test('expires the session', () => {
  vi.useFakeTimers()
  const session = startSession()
  vi.advanceTimersByTime(30_000)
  expect(session.expired).toBe(true)
  vi.useRealTimers()
})`,
      explain: 'Real waiting is slow and timing-dependent. ==Fake timers== jump the clock instantly.',
      difficulty: 'Medium',
    },
    {
      id: 'mock-not-called',
      title: 'Green, but nothing was checked',
      task: 'The email is never sent in production, but this test passes.',
      lang: 'javascript',
      code: `test('sends a welcome email', async () => {
  const send = vi.fn()
  await registerUser({ email: 'a@b.co' }, { send })
  expect(send).toBeDefined()
})`,
      line: 4,
      fix: "  expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: 'a@b.co' }))",
      explain: '`toBeDefined` only checks that the mock exists, which it always does. Assert ==how it was called==.',
      difficulty: 'Easy',
    },
  ],
}
