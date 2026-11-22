import type { SpotSet } from './types'

export const typescript: SpotSet = {
  id: 'typescript',
  bugs: [
    {
      id: 'as-cast',
      title: 'Typed, but not checked',
      task: 'The API sometimes returns `{ error: "…" }`, and the app crashes later on `user.name.toUpperCase()`. The compiler never complained.',
      lang: 'typescript',
      code: `interface User { id: string; name: string }

async function getUser(id: string): Promise<User> {
  const res = await fetch(\`/api/users/\${id}\`)
  return (await res.json()) as User
}`,
      line: 5,
      fixed: `interface User { id: string; name: string }

async function getUser(id: string): Promise<User> {
  const res = await fetch(\`/api/users/\${id}\`)
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`)
  const data: unknown = await res.json()
  if (!isUser(data)) throw new Error('Unexpected response')
  return data
}

function isUser(x: unknown): x is User {
  return typeof x === 'object' && x !== null && typeof (x as User).name === 'string' && typeof (x as User).id === 'string'
}`,
      explain: '`as User` is a promise to the compiler, ==not a runtime check==, and types are erased. Treat external data as `unknown` and validate it (a type guard, or a schema library like Zod).',
      difficulty: 'Medium',
    },
    {
      id: 'optional-chain',
      title: 'Optional, then not',
      task: 'With `strictNullChecks`, this does not compile: "Object is possibly undefined".',
      lang: 'typescript',
      code: `interface Order { id: string; coupon?: { code: string } }

function couponCode(order: Order): string {
  return order.coupon.code.toUpperCase()
}`,
      line: 4,
      fix: "  return order.coupon?.code.toUpperCase() ?? ''",
      explain: '`coupon` is optional, so it may be `undefined`. Use ==optional chaining== and a fallback for the missing case.',
      difficulty: 'Easy',
    },
    {
      id: 'exhaustive',
      title: 'The forgotten shape',
      task: 'A teammate added `{ kind: "triangle" }` to `Shape`. `area` now returns `undefined` for triangles, and nothing warned anyone.',
      lang: 'typescript',
      code: `type Shape =
  | { kind: 'circle'; r: number }
  | { kind: 'square'; side: number }
  | { kind: 'triangle'; base: number; h: number }

function area(s: Shape): number | undefined {
  switch (s.kind) {
    case 'circle': return Math.PI * s.r ** 2
    case 'square': return s.side ** 2
  }
}`,
      line: 6,
      fixed: `type Shape =
  | { kind: 'circle'; r: number }
  | { kind: 'square'; side: number }
  | { kind: 'triangle'; base: number; h: number }

function area(s: Shape): number {
  switch (s.kind) {
    case 'circle': return Math.PI * s.r ** 2
    case 'square': return s.side ** 2
    case 'triangle': return (s.base * s.h) / 2
    default: {
      const unhandled: never = s
      throw new Error(\`Unknown shape: \${JSON.stringify(unhandled)}\`)
    }
  }
}`,
      explain: 'Returning `number | undefined` hides the missing case. Return `number` and add a ==`never` check== in `default`: the compiler then errors whenever a new kind is not handled.',
      difficulty: 'Hard',
    },
    {
      id: 'any-param',
      title: 'Typo goes unnoticed',
      task: '`total(cart)` returns `NaN`. The property is `price`, but the typo compiled fine.',
      lang: 'typescript',
      code: `interface Item { price: number; qty: number }

function total(items: any[]): number {
  return items.reduce((sum, it) => sum + it.prcie * it.qty, 0)
}`,
      line: 3,
      fixed: `interface Item { price: number; qty: number }

function total(items: Item[]): number {
  return items.reduce((sum, it) => sum + it.price * it.qty, 0)
}`,
      also: [4],
      explain: '`any` switches checking off, so `it.prcie` is allowed. Type the parameter as ==`Item[]`== and the compiler points at the typo.',
      difficulty: 'Easy',
    },
    {
      id: 'generic-constraint',
      title: 'Property id does not exist on T',
      task: 'This helper should work for any list of objects with an `id`, but it does not compile.',
      lang: 'typescript',
      code: `function byId<T>(items: T[]): Record<string, T> {
  const out: Record<string, T> = {}
  for (const item of items) out[item.id] = item
  return out
}`,
      line: 1,
      fix: 'function byId<T extends { id: string }>(items: T[]): Record<string, T> {',
      explain: 'An unconstrained `T` could be anything, even a number. A ==constraint== (`extends { id: string }`) guarantees the property exists.',
      difficulty: 'Medium',
    },
    {
      id: 'readonly-mutate',
      title: 'Sorting the props',
      task: 'Rendering a sorted list also reorders the parent\'s array, causing odd bugs elsewhere.',
      lang: 'typescript',
      code: `function sortedNames(names: string[]): string[] {
  return names.sort((a, b) => a.localeCompare(b))
}`,
      line: 2,
      fix: '  return [...names].sort((a, b) => a.localeCompare(b))',
      explain: '`sort` sorts ==in place== and returns the same array. Copy first (or use `toSorted`). Typing the parameter as `readonly string[]` makes the compiler catch this.',
      difficulty: 'Easy',
    },
  ],
}
