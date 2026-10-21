import type { SyntaxSet } from './types'

export const typescript: SyntaxSet = {
  id: 'typescript',
  title: 'TypeScript',
  snippets: [
    {
      id: 'interface-vs-type',
      title: 'interface vs type',
      lang: 'typescript',
      code: `interface User {
  id: number
  name: string
  email?: string
  readonly createdAt: Date
}

interface Admin extends User {
  permissions: string[]
}

type Id = string | number
type Point = { x: number; y: number }
type Point3D = Point & { z: number }
type Handler = (event: MouseEvent) => void`,
      note: 'Use `interface` for object shapes you may **extend** or merge; use `type` for unions, intersections, functions and aliases. A very common opener.',
    },
    {
      id: 'generic-constraints',
      title: 'Generic functions and constraints',
      lang: 'typescript',
      code: `function first<T>(items: T[]): T | undefined {
  return items[0]
}

function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b
}

function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}

const n = first([1, 2, 3])
const s = longest('abc', 'de')
const name = getProp({ name: 'Asha', age: 30 }, 'name')`,
      note: '`T` is inferred from the arguments; `extends` adds a **constraint**. `K extends keyof T` with return type `T[K]` is the pattern interviewers want to see.',
    },
    {
      id: 'generic-stack',
      title: 'Generic class: Stack<T>',
      lang: 'typescript',
      code: `class Stack<T> {
  private items: T[] = []

  push(item: T): void {
    this.items.push(item)
  }
  pop(): T | undefined {
    return this.items.pop()
  }
  peek(): T | undefined {
    return this.items[this.items.length - 1]
  }
  get size(): number {
    return this.items.length
  }
}

const stack = new Stack<number>()`,
      note: 'A **generic class** fixes `T` once per instance, so `push` and `pop` stay type safe. Often the warm-up before a queue or cache.',
    },
    {
      id: 'utility-types',
      title: 'Built-in utility types',
      lang: 'typescript',
      code: `interface Todo {
  id: number
  title: string
  done: boolean
}

type TodoPatch = Partial<Todo>
type TodoPreview = Pick<Todo, 'id' | 'title'>
type NewTodo = Omit<Todo, 'id'>
type TodosById = Record<number, Todo>
type FrozenTodo = Readonly<Required<Todo>>

function createTodo(input: NewTodo): Todo {
  return { id: Date.now(), ...input }
}
type Created = ReturnType<typeof createTodo>
type Args = Parameters<typeof createTodo>`,
      note: 'Derive types instead of copying them: `Partial` for updates, `Omit` for create payloads, `Record` for lookups. Expect to be asked how one is **implemented**.',
    },
    {
      id: 'discriminated-union',
      title: 'Discriminated union + never',
      lang: 'typescript',
      code: `type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rect'; width: number; height: number }

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2
    case 'rect':
      return shape.width * shape.height
    default: {
      const unreachable: never = shape
      throw new Error(\`Unknown shape: \${unreachable}\`)
    }
  }
}`,
      note: 'A shared literal `kind` lets TypeScript **narrow** each case. Assigning to `never` makes the compiler fail when a new shape is added but not handled.',
    },
    {
      id: 'type-guards',
      title: 'Type guards (x is T)',
      lang: 'typescript',
      code: `interface Cat {
  meow(): void
}
interface Dog {
  bark(): void
}

function isCat(pet: Cat | Dog): pet is Cat {
  return 'meow' in pet
}

function speak(pet: Cat | Dog) {
  if (isCat(pet)) pet.meow()
  else pet.bark()
}

const isString = (x: unknown): x is string => typeof x === 'string'`,
      note: 'A **user-defined type guard** returns `x is T`, so the caller narrows after the check. Pairs with `in`, `typeof` and `instanceof`.',
    },
    {
      id: 'mapped-types',
      title: 'Mapped types and keyof',
      lang: 'typescript',
      code: `type Optional<T> = { [K in keyof T]?: T[K] }
type Mutable<T> = { -readonly [K in keyof T]: T[K] }
type Nullable<T> = { [K in keyof T]: T[K] | null }
type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K]
}

interface Person {
  name: string
  age: number
}

type PersonKey = keyof Person
type PersonGetters = Getters<Person>`,
      note: 'A **mapped type** loops over `keyof T` to build a new type; this is how `Partial` and `Readonly` are written. `as` renames keys with template literals.',
    },
    {
      id: 'conditional-infer',
      title: 'Conditional types with infer',
      lang: 'typescript',
      code: `type IsString<T> = T extends string ? true : false
type ElementType<T> = T extends (infer U)[] ? U : T
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T
type Returns<T> = T extends (...args: any[]) => infer R ? R : never
type NonNull<T> = T extends null | undefined ? never : T

type A = IsString<'hi'>
type B = ElementType<number[]>
type C = UnwrapPromise<Promise<string>>
type D = Returns<() => boolean>
type E = NonNull<string | null>`,
      note: '`T extends X ? A : B` picks a type; `infer` captures a part of it. Writing your own `ReturnType` is the classic **advanced TypeScript** question.',
    },
    {
      id: 'enum-vs-as-const',
      title: 'enum vs as const union',
      lang: 'typescript',
      code: `enum Direction {
  Up = 'UP',
  Down = 'DOWN',
}

const Status = {
  Active: 'active',
  Inactive: 'inactive',
} as const
type Status = (typeof Status)[keyof typeof Status]

const ROLES = ['admin', 'editor', 'viewer'] as const
type Role = (typeof ROLES)[number]

let dir: Direction = Direction.Up
let status: Status = 'active'
let role: Role = 'editor'`,
      note: '`enum` emits runtime code; an `as const` object or array gives a **literal union** with no extra output and plain strings at call sites. Many teams prefer the latter.',
    },
    {
      id: 'function-overloads',
      title: 'Function overloads',
      lang: 'typescript',
      code: `function parse(input: string): number
function parse(input: string[]): number[]
function parse(input: string | string[]): number | number[] {
  return Array.isArray(input) ? input.map(Number) : Number(input)
}

const one = parse('42')
const many = parse(['1', '2'])`,
      note: 'Several **overload signatures**, then one implementation that handles them all. Callers only see the overloads, so `one` is `number` and `many` is `number[]`.',
    },
    {
      id: 'typed-fetch',
      title: 'Typed fetch helper',
      lang: 'typescript',
      code: `async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(\`HTTP \${res.status}: \${res.statusText}\`)
  }
  return (await res.json()) as T
}

interface Post {
  id: number
  title: string
}

const posts = await getJson<Post[]>('/api/posts')
console.log(posts[0]?.title)`,
      note: 'The caller supplies `T`; `fetch` does not reject on 404, so check `res.ok`. Say that `as T` is **trust, not validation** (use zod for that).',
    },
  ],
}
