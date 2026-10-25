import type { LearnTrack } from './types'

export const typescript: LearnTrack = {
  id: 'typescript',
  intro: 'Add types to JavaScript: annotations, interfaces, unions and narrowing, generics, utility types and validating data you don\'t control.',
  kind: 'js',
  lang: 'typescript',
  typescript: true,
  steps: [
    {
      id: 'annotations',
      title: 'Type annotations',
      learn: `Annotate parameters and the return type after a colon:

\`\`\`
function area(width: number, height: number): number {
  return width * height
}
\`\`\`

Types are checked by the compiler and **erased** at runtime, so the code still runs as plain JavaScript.`,
      task: 'Add types to `fullName`: both parameters are strings and it returns a string. Make it return "Ada Lovelace" for ("Ada", "Lovelace").',
      starter: `function fullName(first, last) {
  return first + last
}
`,
      solution: `function fullName(first: string, last: string): string {
  return \`\${first} \${last}\`
}
`,
      tests: [
        ['joins with a space', 'expect(fullName("Ada", "Lovelace")).toBe("Ada Lovelace")'],
        ['parameters are typed as string', 'expect(code).toMatch(/first\\s*:\\s*string/); expect(code).toMatch(/last\\s*:\\s*string/)'],
        ['the return type is string', 'expect(code).toMatch(/\\)\\s*:\\s*string\\s*\\{/)'],
      ],
      hints: ['`first: string` annotates a parameter.', 'The return type goes after the parameter list: `(…): string {`.'],
    },
    {
      id: 'interfaces',
      title: 'Interfaces',
      learn: `An \`interface\` describes the shape of an object. \`?\` marks an optional property and \`readonly\` one that can't be reassigned:

\`\`\`
interface User {
  readonly id: number
  name: string
  email?: string
}
\`\`\``,
      task: 'Declare an interface `Product` with `id: number`, `name: string` and optional `price?: number`. Write `label(p: Product): string` returning "name ($price)", or just the name when there is no price.',
      starter: `function label(p) {
  return p.name
}
`,
      solution: `interface Product {
  id: number
  name: string
  price?: number
}

function label(p: Product): string {
  return p.price === undefined ? p.name : \`\${p.name} ($\${p.price})\`
}
`,
      tests: [
        ['with a price', 'expect(label({ id: 1, name: "Pen", price: 2 })).toBe("Pen ($2)")'],
        ['without a price', 'expect(label({ id: 2, name: "Book" })).toBe("Book")'],
        ['a price of 0 still shows', 'expect(label({ id: 3, name: "Free", price: 0 })).toBe("Free ($0)")'],
        ['declares interface Product with an optional price', 'expect(code).toMatch(/interface\\s+Product/); expect(code).toMatch(/price\\?\\s*:\\s*number/)'],
      ],
      hints: ['Check `p.price === undefined`, not `!p.price`, so 0 still counts.', 'The optional property is written `price?: number`.'],
    },
    {
      id: 'unions',
      title: 'Union types and narrowing',
      learn: `A **union** means "one of these": \`string | number\`. Before using it, **narrow** it with a check TypeScript understands:

\`\`\`
if (typeof value === 'string') { /* value is a string here */ }
\`\`\``,
      task: 'Write `formatId(id: string | number): string`: numbers are padded to 5 digits ("00042"), strings are upper-cased.',
      starter: `function formatId(id) {
  return String(id)
}
`,
      solution: `function formatId(id: string | number): string {
  if (typeof id === 'number') return String(id).padStart(5, '0')
  return id.toUpperCase()
}
`,
      tests: [
        ['pads numbers', 'expect(formatId(42)).toBe("00042")'],
        ['upper-cases strings', 'expect(formatId("ab-7")).toBe("AB-7")'],
        ['the parameter is a string | number union', 'expect(code).toMatch(/id\\s*:\\s*(string\\s*\\|\\s*number|number\\s*\\|\\s*string)/)'],
      ],
      hints: ['`typeof id === "number"` narrows the union.', '`String(42).padStart(5, "0")` is "00042".'],
    },
    {
      id: 'discriminated',
      title: 'Discriminated unions',
      learn: `Give each variant a literal \`kind\` and TypeScript can tell them apart in a \`switch\`:

\`\`\`
type Shape = { kind: 'circle'; r: number } | { kind: 'square'; side: number }
\`\`\`

In the \`default\` branch, assigning to \`never\` makes the compiler complain if a variant is ever forgotten.`,
      task: 'Add a `rect` variant (`width`, `height`) to `Shape` and handle it in `area`. Keep the `never` check in `default`.',
      starter: `type Shape =
  | { kind: 'circle'; r: number }
  | { kind: 'square'; side: number }

function area(s: Shape): number {
  switch (s.kind) {
    case 'circle': return Math.PI * s.r ** 2
    case 'square': return s.side ** 2
    default: {
      const unhandled: never = s
      throw new Error('Unknown shape ' + JSON.stringify(unhandled))
    }
  }
}
`,
      solution: `type Shape =
  | { kind: 'circle'; r: number }
  | { kind: 'square'; side: number }
  | { kind: 'rect'; width: number; height: number }

function area(s: Shape): number {
  switch (s.kind) {
    case 'circle': return Math.PI * s.r ** 2
    case 'square': return s.side ** 2
    case 'rect': return s.width * s.height
    default: {
      const unhandled: never = s
      throw new Error('Unknown shape ' + JSON.stringify(unhandled))
    }
  }
}
`,
      tests: [
        ['rect area', 'expect(area({ kind: "rect", width: 3, height: 4 })).toBe(12)'],
        ['the others still work', 'expect(area({ kind: "square", side: 3 })).toBe(9); expect(area({ kind: "circle", r: 1 })).toBeCloseTo(3.14159, 4)'],
        ['the rect variant is in the type, and the never check stays', 'expect(code).toMatch(/kind:\\s*[\'"]rect[\'"]/); expect(code).toMatch(/:\\s*never\\s*=/)'],
      ],
      hints: ['Add `| { kind: "rect"; width: number; height: number }` to the type.', 'Then a `case "rect":` returning `s.width * s.height`.'],
    },
    {
      id: 'generics',
      title: 'Generics',
      learn: `A **generic** keeps the type that goes in connected to the type that comes out:

\`\`\`
function first<T>(items: T[]): T | undefined {
  return items[0]
}
\`\`\`

\`first([1, 2])\` is a \`number | undefined\`; \`first(["a"])\` a \`string | undefined\`. A constraint like \`<T extends { id: string }>\` says what \`T\` must have.`,
      task: 'Write a generic `groupBy<T>(items: T[], key: (item: T) => string): Record<string, T[]>`.',
      starter: `function groupBy(items, key) {
  return {}
}
`,
      solution: `function groupBy<T>(items: T[], key: (item: T) => string): Record<string, T[]> {
  const out: Record<string, T[]> = {}
  for (const item of items) {
    const k = key(item)
    ;(out[k] ??= []).push(item)
  }
  return out
}
`,
      tests: [
        ['groups items', 'expect(groupBy([{ t: "a", n: 1 }, { t: "b", n: 2 }, { t: "a", n: 3 }], (x) => x.t)).toEqual({ a: [{ t: "a", n: 1 }, { t: "a", n: 3 }], b: [{ t: "b", n: 2 }] })'],
        ['an empty list gives {}', 'expect(groupBy([], String)).toEqual({})'],
        ['is generic', 'expect(code).toMatch(/groupBy\\s*<\\s*T/)'],
      ],
      hints: ['Start with `const out: Record<string, T[]> = {}`.', '`(out[k] ??= []).push(item)` creates the list the first time.'],
    },
    {
      id: 'utility-types',
      title: 'Utility types',
      learn: `Build new types from existing ones instead of repeating fields:

- \`Partial<T>\`: every property optional (great for updates)
- \`Pick<T, 'a' | 'b'>\` / \`Omit<T, 'a'>\`: a subset
- \`Readonly<T>\`, \`Record<K, V>\`, \`ReturnType<typeof fn>\``,
      task: 'Using `Partial`, write `updateUser(user: User, changes: Partial<User>): User` that returns a new user with the changes applied. Also declare `type PublicUser = Omit<User, \'password\'>`.',
      starter: `interface User {
  id: number
  name: string
  password: string
}

function updateUser(user, changes) {
  return user
}
`,
      solution: `interface User {
  id: number
  name: string
  password: string
}

type PublicUser = Omit<User, 'password'>

function updateUser(user: User, changes: Partial<User>): User {
  return { ...user, ...changes }
}
`,
      tests: [
        ['applies changes', 'expect(updateUser({ id: 1, name: "Ada", password: "x" }, { name: "Ada L." })).toEqual({ id: 1, name: "Ada L.", password: "x" })'],
        ['does not mutate the original', 'const u = { id: 1, name: "Ada", password: "x" }; updateUser(u, { name: "B" }); expect(u.name).toBe("Ada")'],
        ['uses Partial<User> and Omit<User, "password">', 'expect(code).toMatch(/Partial<\\s*User\\s*>/); expect(code).toMatch(/Omit<\\s*User\\s*,\\s*[\'"]password[\'"]\\s*>/)'],
      ],
      hints: ['Spread both objects: `{ ...user, ...changes }`.', '`type PublicUser = Omit<User, "password">`.'],
    },
    {
      id: 'unknown',
      title: 'unknown and type guards',
      learn: `Data from outside (JSON, APIs, users) is \`unknown\`: TypeScript makes you check it before use. A **type guard** is a function whose return type is \`x is T\`:

\`\`\`
function isUser(x: unknown): x is User { … }
\`\`\`

\`as User\` is not a check, just a promise to the compiler.`,
      task: 'Write the type guard `isUser(x: unknown): x is User` (an object with a string `name` and a number `age`), then `parseUser(json: string): User | null` that uses it.',
      starter: `interface User { name: string; age: number }

function parseUser(json: string): User | null {
  return JSON.parse(json) as User
}
`,
      solution: `interface User { name: string; age: number }

function isUser(x: unknown): x is User {
  return typeof x === 'object' && x !== null && typeof (x as User).name === 'string' && typeof (x as User).age === 'number'
}

function parseUser(json: string): User | null {
  try {
    const data: unknown = JSON.parse(json)
    return isUser(data) ? data : null
  } catch {
    return null
  }
}
`,
      tests: [
        ['accepts a valid user', 'expect(parseUser(\'{"name":"Ada","age":36}\')).toEqual({ name: "Ada", age: 36 })'],
        ['rejects the wrong shape', 'expect(parseUser(\'{"name":"Ada","age":"36"}\')).toBeNull(); expect(parseUser("null")).toBeNull()'],
        ['rejects invalid JSON', 'expect(parseUser("{oops")).toBeNull()'],
        ['isUser is a type guard', 'expect(code).toMatch(/x\\s+is\\s+User/)'],
      ],
      hints: ['Check `typeof x === "object" && x !== null` first, then each property\'s type.', 'Wrap `JSON.parse` in `try/catch`, since bad JSON throws.'],
    },
    {
      id: 'enums-const',
      title: 'Literal types and as const',
      learn: `Literal types allow only exact values: \`type Status = 'idle' | 'loading' | 'done'\`.

\`as const\` turns an array into a readonly tuple of literals, so you can derive a union from data:

\`\`\`
const ROLES = ['admin', 'user'] as const
type Role = (typeof ROLES)[number]   // 'admin' | 'user'
\`\`\``,
      task: 'Declare `const LEVELS = [\'debug\', \'info\', \'error\'] as const`, derive `type Level`, and write `isLevel(x: string): x is Level`.',
      starter: `function isLevel(x) {
  return true
}
`,
      solution: `const LEVELS = ['debug', 'info', 'error'] as const
type Level = (typeof LEVELS)[number]

function isLevel(x: string): x is Level {
  return (LEVELS as readonly string[]).includes(x)
}
`,
      tests: [
        ['knows the levels', 'expect(isLevel("info")).toBe(true); expect(isLevel("error")).toBe(true)'],
        ['rejects others', 'expect(isLevel("warn")).toBe(false)'],
        ['derives the type from the array', 'expect(code).toMatch(/as\\s+const/); expect(code).toMatch(/\\[number\\]/)'],
      ],
      hints: ['`type Level = (typeof LEVELS)[number]` gives the union.', '`includes` needs the array widened: `(LEVELS as readonly string[]).includes(x)`.'],
    },
  ],
}
