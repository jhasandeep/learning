import type { SyntaxSet } from './types'

export const testing: SyntaxSet = {
  id: 'testing',
  title: 'Testing',
  snippets: [
    {
      id: 'describe-it-expect',
      title: 'Unit test with describe and it',
      lang: 'typescript',
      code: `import { describe, it, expect } from 'vitest'
import { formatPrice } from './format'

describe('formatPrice', () => {
  it('formats cents as dollars', () => {
    expect(formatPrice(1999)).toBe('$19.99')
  })

  it('handles zero', () => {
    expect(formatPrice(0)).toBe('$0.00')
  })

  it('throws on negative input', () => {
    expect(() => formatPrice(-1)).toThrow('must be positive')
  })
})`,
      note: 'The **arrange, act, assert** basics. Note that `toThrow` needs a function wrapper, otherwise the error is thrown before `expect` can catch it.',
    },
    {
      id: 'test-each',
      title: 'Table tests with it.each',
      lang: 'typescript',
      code: `describe('isPalindrome', () => {
  it.each([
    ['racecar', true],
    ['Level', true],
    ['hello', false],
    ['', true],
  ])('isPalindrome(%j) returns %s', (input, expected) => {
    expect(isPalindrome(input)).toBe(expected)
  })
})`,
      note: '`it.each` runs one test per row, with `%j` and `%s` filling the name. A tidy way to show you think about **edge cases** like the empty string.',
    },
    {
      id: 'mock-module',
      title: 'Mock a module and a function',
      lang: 'typescript',
      code: `import { vi, it, expect } from 'vitest'
import { getUser } from './api'
import { greetUser } from './greet'

vi.mock('./api')

it('greets the fetched user', async () => {
  vi.mocked(getUser).mockResolvedValue({ id: 1, name: 'Asha' })
  await expect(greetUser(1)).resolves.toBe('Hello, Asha')
  expect(getUser).toHaveBeenCalledWith(1)
})

it('calls the callback once', () => {
  const onDone = vi.fn()
  runTask(onDone)
  expect(onDone).toHaveBeenCalledTimes(1)
})`,
      note: '`vi.mock` replaces every export of a module (Jest: `jest.mock`), `mockResolvedValue` fakes an async result and `vi.fn()` creates a **spy** you can assert on.',
    },
    {
      id: 'async-rejects',
      title: 'Async tests and rejects',
      lang: 'typescript',
      code: `it('resolves with data', async () => {
  const data = await fetchData()
  expect(data).toEqual({ ok: true })
})

it('rejects when the request fails', async () => {
  await expect(fetchData('bad')).rejects.toThrow('Not found')
})

it('waits for a timer', async () => {
  vi.useFakeTimers()
  const promise = delay(1000)
  vi.advanceTimersByTime(1000)
  await expect(promise).resolves.toBeUndefined()
  vi.useRealTimers()
})`,
      note: 'Always `await` (or return) the assertion, or the test ==passes before the promise settles==. Fake timers make time-based code fast and deterministic.',
    },
    {
      id: 'setup-teardown',
      title: 'beforeEach and afterEach',
      lang: 'typescript',
      code: `describe('UserRepository', () => {
  let db: TestDb
  let repo: UserRepository
  beforeAll(async () => {
    db = await createTestDb()
  })
  beforeEach(async () => {
    await db.reset()
    repo = new UserRepository(db)
  })
  afterEach(() => vi.restoreAllMocks())
  afterAll(() => db.close())

  it('saves a user', async () => {
    await repo.save({ name: 'Asha' })
    expect(await repo.count()).toBe(1)
  })
})`,
      note: '`beforeAll` for expensive setup, `beforeEach` to give every test a **fresh state**, and the `after` hooks to clean up. Tests must not depend on each other.',
    },
    {
      id: 'rtl-click',
      title: 'React Testing Library click',
      lang: 'tsx',
      code: `import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Counter } from './Counter'

it('increments when clicked', async () => {
  const user = userEvent.setup()
  render(<Counter />)
  await user.click(screen.getByRole('button', { name: /increment/i }))
  expect(screen.getByText('Count: 1')).toBeInTheDocument()
})

it('shows the user after loading', async () => {
  render(<Profile id="1" />)
  expect(await screen.findByText('Asha')).toBeInTheDocument()
})`,
      note: 'Query like a user: prefer `getByRole` with a name. `getBy` throws if missing, `findBy` **waits** for async UI, and `userEvent` simulates real clicks.',
    },
    {
      id: 'rtl-form',
      title: 'Test a form submit',
      lang: 'tsx',
      code: `it('submits the email', async () => {
  const user = userEvent.setup()
  const onSubmit = vi.fn()
  render(<SignupForm onSubmit={onSubmit} />)

  await user.type(screen.getByLabelText(/email/i), 'a@b.com')
  await user.click(screen.getByRole('button', { name: /sign up/i }))

  expect(onSubmit).toHaveBeenCalledWith('a@b.com')
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})`,
      note: 'Pass a `vi.fn()` as the callback prop and assert what it received. Use `queryBy` when checking that something is **not** there.',
    },
    {
      id: 'render-hook',
      title: 'Test a custom hook',
      lang: 'typescript',
      code: `import { renderHook, act } from '@testing-library/react'

it('increments the counter', () => {
  const { result } = renderHook(() => useCounter(5))
  act(() => result.current.increment())
  expect(result.current.count).toBe(6)
})

it('debounces the value', () => {
  vi.useFakeTimers()
  const { result, rerender } = renderHook(
    ({ value }) => useDebounce(value, 300),
    { initialProps: { value: 'a' } },
  )
  rerender({ value: 'ab' })
  act(() => vi.advanceTimersByTime(300))
  expect(result.current).toBe('ab')
})`,
      note: '`renderHook` runs a hook inside a test component; read it through `result.current`. Wrap state changes in **act** and use `rerender` to pass new props.',
    },
    {
      id: 'snapshot',
      title: 'Snapshot tests',
      lang: 'tsx',
      code: `import { render } from '@testing-library/react'

it('matches the snapshot', () => {
  const { asFragment } = render(<Badge label="New" tone="info" />)
  expect(asFragment()).toMatchSnapshot()
})

it('builds the order summary', () => {
  expect(buildSummary(order)).toMatchInlineSnapshot(\`
    "2 items, total $19.98"
  \`)
})`,
      note: 'The first run writes the **snapshot**, later runs compare against it. Keep them small and review the diff; a huge snapshot nobody reads catches nothing.',
    },
    {
      id: 'supertest-api',
      title: 'API test with supertest',
      lang: 'typescript',
      code: `import request from 'supertest'
import { app } from '../src/app'

describe('POST /api/users', () => {
  it('creates a user', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Asha', email: 'asha@example.com' })
      .expect(201)
    expect(res.body).toMatchObject({ name: 'Asha' })
  })

  it('rejects a missing email', async () => {
    const res = await request(app).post('/api/users').send({})
    expect(res.status).toBe(400)
  })
})`,
      note: '**supertest** calls an Express app in memory, no running server needed. Test the happy path and at least one validation error.',
    },
    {
      id: 'playwright-e2e',
      title: 'Playwright end-to-end test',
      lang: 'typescript',
      code: `import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/login')
})

test('user can log in', async ({ page }) => {
  await page.getByLabel('Email').fill('asha@example.com')
  await page.getByLabel('Password').fill('secret123')
  await page.getByRole('button', { name: 'Log in' }).click()

  await expect(page).toHaveURL(/dashboard/)
  await expect(page.getByRole('heading')).toHaveText('Welcome, Asha')
})`,
      note: 'An **end-to-end** test drives a real browser. Playwright locators and `expect` auto-wait, so no manual sleeps.',
    },
  ],
}
