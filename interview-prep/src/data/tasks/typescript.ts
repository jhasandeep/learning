import type { TaskPath } from './types'

export const typescript: TaskPath = {
  id: 'typescript',
  title: 'TypeScript',
  blurb: 'Describe your data with types: interfaces, unions, generics and utility types.',
  tasks: [
    {
      id: 'typed-user',
      kind: 'run',
      language: 'typescript',
      title: 'Describe a user with an interface',
      goal: 'Create a `User` interface and a fully typed `greet` function.',
      steps: [
        'Declare `interface User` with `id: number`, `name: string` and an optional `email`.',
        'Type `greet(user: User)` so it returns a `string`.',
        'It returns `"Hello, <name>"`, plus ` (<email>)` when there is an email.',
      ],
      starter: `function greet(user) {
  // your code here
}`,
      hints: ['An optional property is written `email?: string`.', 'Annotate the parameter and the return: `(user: User): string`.', 'Use a ternary or `if` to add the email part only when it exists.'],
      solution: `interface User {
  id: number;
  name: string;
  email?: string;
}

function greet(user: User): string {
  return user.email ? \`Hello, \${user.name} (\${user.email})\` : \`Hello, \${user.name}\`;
}`,
      harness: `check("greets a user without email", () => greet({ id: 1, name: "Asha" }) === "Hello, Asha");
check("adds the email when present", () => greet({ id: 2, name: "Ravi", email: "r@x.com" }) === "Hello, Ravi (r@x.com)");`,
      rules: [
        { label: 'Declares `interface User`', match: /interface\s+User\s*\{/, hint: 'Write interface User { … }.' },
        { label: '`email` is optional (`email?: string`)', match: /email\?\s*:\s*string/, hint: 'A question mark makes a property optional.' },
        { label: '`greet` has a typed parameter and return type', match: /function\s+greet\(\s*user\s*:\s*User\s*\)\s*:\s*string/, hint: 'function greet(user: User): string' },
      ],
      learned: 'An interface is a contract for the shape of an object; the compiler then catches missing or misspelled fields before you run anything.',
    },
    {
      id: 'union-shapes',
      kind: 'run',
      language: 'typescript',
      title: 'Model shapes with a union',
      goal: 'Use a discriminated union so TypeScript knows which fields exist for each shape.',
      steps: [
        'Define `Shape` as a union of `{ kind: "circle"; radius: number }` and `{ kind: "square"; side: number }`.',
        'Write `area(shape: Shape): number` using a `switch` on `shape.kind`.',
        'Round the result to 2 decimals with `Number(x.toFixed(2))`.',
      ],
      starter: `function area(shape) {
  // your code here
}`,
      hints: ['A union uses `|`: `type Shape = A | B`.', 'Inside `case "circle":` TypeScript knows `shape.radius` exists.', 'Circle area is `Math.PI * r * r`; square is `side * side`.'],
      solution: `type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Number((Math.PI * shape.radius * shape.radius).toFixed(2));
    case "square":
      return shape.side * shape.side;
  }
}`,
      harness: `check("a circle with radius 1 has area 3.14", () => area({ kind: "circle", radius: 1 }) === 3.14);
check("a circle with radius 2 has area 12.57", () => area({ kind: "circle", radius: 2 }) === 12.57);
check("a square with side 3 has area 9", () => area({ kind: "square", side: 3 }) === 9);`,
      rules: [
        { label: 'Declares a `Shape` union type', match: /type\s+Shape\s*=[\s\S]*\|[\s\S]*;/, hint: 'type Shape = { … } | { … };' },
        { label: 'Each shape has a `kind` tag', match: /kind:\s*["'](circle|square)["']/, min: 2, hint: 'Add kind: "circle" and kind: "square".' },
        { label: 'Uses `switch (shape.kind)`', match: /switch\s*\(\s*shape\.kind\s*\)/, hint: 'Switch on shape.kind.' },
      ],
      learned: 'A shared literal field (`kind`) lets TypeScript narrow the union in each branch, so you can only touch fields that really exist.',
    },
    {
      id: 'generic-first',
      kind: 'run',
      language: 'typescript',
      title: 'Write your first generic function',
      goal: 'Create `first<T>` and `pair<A, B>` that keep the types of what you pass in.',
      steps: [
        'Write `first<T>(items: T[]): T | undefined` returning the first item.',
        'Write `pair<A, B>(a: A, b: B): [A, B]` returning a two-item tuple.',
      ],
      starter: `function first(items) {
  // your code here
}

function pair(a, b) {
  // your code here
}`,
      hints: ['A generic parameter goes in angle brackets right after the name: `function first<T>(…)`.', '`items[0]` is `undefined` for an empty array, which matches `T | undefined`.', 'A tuple type is written `[A, B]`.'],
      solution: `function first<T>(items: T[]): T | undefined {
  return items[0];
}

function pair<A, B>(a: A, b: B): [A, B] {
  return [a, b];
}`,
      harness: `check("first of numbers", () => first([4, 5, 6]) === 4);
check("first of an empty array is undefined", () => first([]) === undefined);
check("first works with strings", () => first(["a", "b"]) === "a");
check("pair returns both values in order", () => { const p = pair("x", 2); return p[0] === "x" && p[1] === 2; });`,
      rules: [
        { label: '`first` is generic (`<T>`) with `T[]` and `T | undefined`', match: /function\s+first<T>\(\s*items\s*:\s*T\[\]\s*\)\s*:\s*T\s*\|\s*undefined/, hint: 'function first<T>(items: T[]): T | undefined' },
        { label: '`pair` is generic with two type parameters', match: /function\s+pair<A,\s*B>\(\s*a\s*:\s*A\s*,\s*b\s*:\s*B\s*\)\s*:\s*\[A,\s*B\]/, hint: 'function pair<A, B>(a: A, b: B): [A, B]' },
      ],
      learned: 'Generics are type variables: one function works for many types while the compiler remembers exactly which type goes in and comes out.',
    },
    {
      id: 'utility-types',
      kind: 'run',
      language: 'typescript',
      title: 'Update with utility types',
      goal: 'Use `Partial` and `Pick` to build a type-safe `updateUser`.',
      steps: [
        'Given `User`, declare `type UserPatch = Partial<Pick<User, "name" | "email">>`.',
        'Write `updateUser(user: User, patch: UserPatch): User` that returns a new object.',
        'Do not change the original object.',
      ],
      starter: `interface User {
  id: number;
  name: string;
  email: string;
}

function updateUser(user, patch) {
  // your code here
}`,
      hints: ['`Pick<User, "name" | "email">` keeps only those fields.', '`Partial<…>` makes every field optional.', 'Return `{ ...user, ...patch }` to create a new object.'],
      solution: `interface User {
  id: number;
  name: string;
  email: string;
}

type UserPatch = Partial<Pick<User, "name" | "email">>;

function updateUser(user: User, patch: UserPatch): User {
  return { ...user, ...patch };
}`,
      harness: `const u = { id: 1, name: "Asha", email: "a@x.com" };
check("changes only the given fields", () => { const r = updateUser(u, { name: "Asha V" }); return r.name === "Asha V" && r.email === "a@x.com" && r.id === 1; });
check("returns a new object", () => updateUser(u, {}) !== u);
check("does not change the original", () => { updateUser(u, { name: "Zed" }); return u.name === "Asha"; });`,
      rules: [
        { label: 'Declares `UserPatch` with `Partial` and `Pick`', match: /type\s+UserPatch\s*=\s*Partial<\s*Pick<\s*User\s*,\s*["']name["']\s*\|\s*["']email["']\s*>\s*>/, hint: 'type UserPatch = Partial<Pick<User, "name" | "email">>;' },
        { label: '`updateUser` is typed `(user: User, patch: UserPatch): User`', match: /function\s+updateUser\(\s*user\s*:\s*User\s*,\s*patch\s*:\s*UserPatch\s*\)\s*:\s*User/, hint: 'Add the parameter and return types.' },
      ],
      learned: 'Utility types such as `Partial` and `Pick` build new types from existing ones, so you never copy-paste a type.',
    },
    {
      id: 'type-guard',
      kind: 'run',
      language: 'typescript',
      title: 'Narrow unknown data with a type guard',
      goal: 'Write `isRole(value)` that proves a string is one of the allowed roles.',
      steps: [
        'Declare `ROLES` with `as const` and derive `type Role = (typeof ROLES)[number]`.',
        'Write `isRole(value: string): value is Role`.',
        'Use `ROLES.includes(value as Role)` for the check.',
      ],
      starter: `const ROLES = ["admin", "editor", "viewer"];

function isRole(value) {
  // your code here
}`,
      hints: ['`as const` makes the array a readonly tuple of exact strings.', 'The special return type `value is Role` tells TypeScript what a true result means.', '`return (ROLES as readonly string[]).includes(value);` also works.'],
      solution: `const ROLES = ["admin", "editor", "viewer"] as const;
type Role = (typeof ROLES)[number];

function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}`,
      harness: `check("accepts 'admin'", () => isRole("admin") === true);
check("accepts 'viewer'", () => isRole("viewer") === true);
check("rejects 'hacker'", () => isRole("hacker") === false);
check("rejects an empty string", () => isRole("") === false);`,
      rules: [
        { label: '`ROLES` is declared `as const`', match: /ROLES\s*=\s*\[[^\]]*\]\s*as\s+const/, hint: 'Add as const after the array.' },
        { label: 'Derives `type Role` from `ROLES`', match: /type\s+Role\s*=\s*\(?\s*typeof\s+ROLES\s*\)?\s*\[number\]/, hint: 'type Role = (typeof ROLES)[number];' },
        { label: '`isRole` returns `value is Role`', match: /:\s*value\s+is\s+Role/, hint: 'Use the type predicate `value is Role`.' },
      ],
      learned: 'A type guard is a runtime check that also teaches the compiler something, so validated data becomes safely typed.',
    },
  ],
}
