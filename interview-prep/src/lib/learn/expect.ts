// A small Jest-style `expect` for the Learn checks and for tests learners write.

export class AssertionError extends Error {
  name = 'AssertionError'
}

export function show(v: unknown): string {
  if (typeof v === 'string') return JSON.stringify(v)
  if (typeof v === 'function') return `[Function${v.name ? ` ${v.name}` : ''}]`
  if (v instanceof Error) return `${v.name}: ${v.message}`
  if (v === undefined) return 'undefined'
  if (typeof v === 'bigint') return `${v}n`
  try {
    const s = JSON.stringify(v, (_k, x) => (x === undefined ? '__undefined__' : x instanceof Map ? Object.fromEntries(x) : x instanceof Set ? [...x] : x))
    return (s ?? String(v)).replace(/"__undefined__"/g, 'undefined')
  } catch {
    return String(v)
  }
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime()
  if (a instanceof Map && b instanceof Map) return a.size === b.size && [...a].every(([k, v]) => b.has(k) && deepEqual(v, b.get(k)))
  if (a instanceof Set && b instanceof Set) return a.size === b.size && [...a].every((v) => b.has(v))
  const ka = Object.keys(a).filter((k) => (a as Record<string, unknown>)[k] !== undefined)
  const kb = Object.keys(b).filter((k) => (b as Record<string, unknown>)[k] !== undefined)
  if (ka.length !== kb.length) return false
  return ka.every((k) => deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
}

function partialMatch(actual: unknown, expected: unknown): boolean {
  if (typeof expected !== 'object' || expected === null) return deepEqual(actual, expected)
  if (typeof actual !== 'object' || actual === null) return false
  return Object.entries(expected).every(([k, v]) => partialMatch((actual as Record<string, unknown>)[k], v))
}

type Matchers = {
  toBe(x: unknown): void
  toEqual(x: unknown): void
  toMatchObject(x: object): void
  toBeTruthy(): void
  toBeFalsy(): void
  toBeNull(): void
  toBeUndefined(): void
  toBeDefined(): void
  toContain(x: unknown): void
  toHaveLength(n: number): void
  toMatch(re: RegExp | string): void
  toBeGreaterThan(n: number): void
  toBeGreaterThanOrEqual(n: number): void
  toBeLessThan(n: number): void
  toBeLessThanOrEqual(n: number): void
  toBeCloseTo(n: number, digits?: number): void
  toBeInstanceOf(c: abstract new (...a: never[]) => unknown): void
  toThrow(msg?: string | RegExp): void
  toHaveBeenCalled(): void
  toHaveBeenCalledTimes(n: number): void
  toHaveBeenCalledWith(...args: unknown[]): void
}

export type Expectation = Matchers & { not: Matchers; resolves: AsyncMatchers; rejects: AsyncMatchers }
type AsyncMatchers = { [K in keyof Matchers]: (...a: Parameters<Matchers[K]>) => Promise<void> }

/** A spy: records calls; optionally runs `impl`. */
export interface MockFn {
  (...args: unknown[]): unknown
  mock: { calls: unknown[][]; results: unknown[] }
  mockReturnValue(v: unknown): MockFn
  mockResolvedValue(v: unknown): MockFn
  mockImplementation(f: (...a: unknown[]) => unknown): MockFn
}

export function fn(impl?: (...a: unknown[]) => unknown): MockFn {
  let current = impl
  const mock = ((...args: unknown[]) => {
    mock.mock.calls.push(args)
    const r = current?.(...args)
    mock.mock.results.push(r)
    return r
  }) as MockFn
  mock.mock = { calls: [], results: [] }
  mock.mockReturnValue = (v) => ((current = () => v), mock)
  mock.mockResolvedValue = (v) => ((current = () => Promise.resolve(v)), mock)
  mock.mockImplementation = (f) => ((current = f), mock)
  return mock
}

const isMock = (v: unknown): v is MockFn => typeof v === 'function' && 'mock' in v

function matchers(actual: unknown, negate: boolean): Matchers {
  const check = (ok: boolean, msg: string) => {
    if (ok === negate) throw new AssertionError(negate ? `Expected not: ${msg}` : msg)
  }
  const callsOf = () => {
    if (!isMock(actual)) throw new AssertionError('Expected a mock function (made with fn())')
    return actual.mock.calls
  }
  return {
    toBe: (x) => check(Object.is(actual, x), `expected ${show(actual)} to be ${show(x)}`),
    toEqual: (x) => check(deepEqual(actual, x), `expected ${show(actual)} to equal ${show(x)}`),
    toMatchObject: (x) => check(partialMatch(actual, x), `expected ${show(actual)} to match ${show(x)}`),
    toBeTruthy: () => check(Boolean(actual), `expected ${show(actual)} to be truthy`),
    toBeFalsy: () => check(!actual, `expected ${show(actual)} to be falsy`),
    toBeNull: () => check(actual === null, `expected ${show(actual)} to be null`),
    toBeUndefined: () => check(actual === undefined, `expected ${show(actual)} to be undefined`),
    toBeDefined: () => check(actual !== undefined, `expected a value but got undefined`),
    toContain: (x) => check(
      typeof actual === 'string' ? actual.includes(String(x)) : Array.isArray(actual) ? actual.some((v) => deepEqual(v, x)) : false,
      `expected ${show(actual)} to contain ${show(x)}`,
    ),
    toHaveLength: (n) => check((actual as { length?: number })?.length === n, `expected length ${n} but got ${show((actual as { length?: number })?.length)} (${show(actual)})`),
    toMatch: (re) => check(typeof actual === 'string' && (typeof re === 'string' ? actual.includes(re) : re.test(actual)), `expected ${show(actual)} to match ${String(re)}`),
    toBeGreaterThan: (n) => check(Number(actual) > n, `expected ${show(actual)} > ${n}`),
    toBeGreaterThanOrEqual: (n) => check(Number(actual) >= n, `expected ${show(actual)} >= ${n}`),
    toBeLessThan: (n) => check(Number(actual) < n, `expected ${show(actual)} < ${n}`),
    toBeLessThanOrEqual: (n) => check(Number(actual) <= n, `expected ${show(actual)} <= ${n}`),
    toBeCloseTo: (n, digits = 2) => check(Math.abs(Number(actual) - n) < 10 ** -digits / 2, `expected ${show(actual)} to be close to ${n}`),
    toBeInstanceOf: (c) => check(actual instanceof c, `expected an instance of ${c.name}`),
    toThrow: (msg) => {
      if (typeof actual !== 'function') throw new AssertionError('toThrow needs a function: expect(() => …).toThrow()')
      let threw = false
      let err: unknown
      try {
        ;(actual as () => unknown)()
      } catch (e) {
        threw = true
        err = e
      }
      const text = err instanceof Error ? err.message : String(err)
      const ok = threw && (msg === undefined || (typeof msg === 'string' ? text.includes(msg) : msg.test(text)))
      check(ok, threw ? `expected the error ${show(text)} to match ${String(msg)}` : 'expected the function to throw')
    },
    toHaveBeenCalled: () => check(callsOf().length > 0, 'expected the mock to have been called'),
    toHaveBeenCalledTimes: (n) => check(callsOf().length === n, `expected ${n} calls but got ${callsOf().length}`),
    toHaveBeenCalledWith: (...args) => check(callsOf().some((c) => deepEqual(c, args)), `expected a call with ${show(args)}; calls were ${show(callsOf())}`),
  }
}

function asyncMatchers(p: unknown, negate: boolean, mode: 'resolves' | 'rejects'): AsyncMatchers {
  const sync = matchers(undefined, negate)
  return Object.fromEntries(Object.keys(sync).map((k) => [k, async (...args: unknown[]) => {
    let value: unknown
    try {
      value = await p
      if (mode === 'rejects') throw new AssertionError('expected the promise to reject')
    } catch (e) {
      if (mode === 'resolves' || e instanceof AssertionError) throw e
      value = e instanceof Error ? e.message : e
    }
    ;(matchers(value, negate) as unknown as Record<string, (...a: unknown[]) => void>)[k](...args)
  }])) as AsyncMatchers
}

export function expect(actual: unknown): Expectation {
  return Object.assign(matchers(actual, false), {
    not: matchers(actual, true),
    resolves: asyncMatchers(actual, false, 'resolves'),
    rejects: asyncMatchers(actual, false, 'rejects'),
  })
}
