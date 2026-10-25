import type { LearnTrack } from './types'

export const javascript: LearnTrack = {
  id: 'javascript',
  intro: 'From variables and functions to closures, array methods, objects, classes and async code: the JavaScript every interview builds on.',
  kind: 'js',
  lang: 'javascript',
  steps: [
    {
      id: 'functions',
      title: 'Your first function',
      learn: `A **function** takes inputs (parameters) and gives back a value with \`return\`.

\`\`\`
function double(n) {
  return n * 2
}
\`\`\`

Arrow functions are a shorter way to write the same thing: \`const double = (n) => n * 2\`.`,
      task: 'Write a function `greet(name)` that returns `"Hello, <name>!"`. For example `greet("Ada")` returns `"Hello, Ada!"`.',
      starter: `function greet(name) {
  // return the greeting
}
`,
      solution: `function greet(name) {
  return \`Hello, \${name}!\`
}
`,
      tests: [
        ['greet("Ada") is "Hello, Ada!"', 'expect(greet("Ada")).toBe("Hello, Ada!")'],
        ['works for any name', 'expect(greet("Linus")).toBe("Hello, Linus!")'],
      ],
      hints: ['Use `return` to send the value back; without it the function returns `undefined`.', 'A template literal builds the string: wrap the text in backticks and insert the name with `${name}`.'],
    },
    {
      id: 'conditions',
      title: 'Conditions',
      learn: `\`if / else if / else\` picks a branch. Compare with \`===\` (strict: no type conversion), never \`==\`.

The remainder operator \`%\` tells you if a number divides evenly: \`10 % 3\` is \`1\`, \`9 % 3\` is \`0\`.`,
      task: 'Write `fizzBuzz(n)`: return `"FizzBuzz"` if `n` divides by 3 and 5, `"Fizz"` if only by 3, `"Buzz"` if only by 5, otherwise the number as a string.',
      starter: `function fizzBuzz(n) {

}
`,
      solution: `function fizzBuzz(n) {
  if (n % 15 === 0) return 'FizzBuzz'
  if (n % 3 === 0) return 'Fizz'
  if (n % 5 === 0) return 'Buzz'
  return String(n)
}
`,
      tests: [
        ['3 → "Fizz"', 'expect(fizzBuzz(3)).toBe("Fizz")'],
        ['10 → "Buzz"', 'expect(fizzBuzz(10)).toBe("Buzz")'],
        ['30 → "FizzBuzz" (checked first)', 'expect(fizzBuzz(30)).toBe("FizzBuzz")'],
        ['7 → "7" as a string', 'expect(fizzBuzz(7)).toBe("7")'],
      ],
      hints: ['Check the "both" case first, otherwise 15 stops at the "Fizz" branch.', '`String(n)` turns the number into text.'],
    },
    {
      id: 'loops',
      title: 'Loops',
      learn: `A \`for…of\` loop visits each item of an array:

\`\`\`
let total = 0
for (const x of [1, 2, 3]) total += x
\`\`\`

Keep a running value (an **accumulator**) outside the loop and update it inside.`,
      task: 'Write `maxOf(nums)` that returns the largest number in a non-empty array, using a loop (no `Math.max`).',
      starter: `function maxOf(nums) {
  let best = 0
  for (const n of nums) {
    // update best
  }
  return best
}
`,
      solution: `function maxOf(nums) {
  let best = nums[0]
  for (const n of nums) {
    if (n > best) best = n
  }
  return best
}
`,
      tests: [
        ['finds the largest', 'expect(maxOf([3, 9, 2])).toBe(9)'],
        ['works with negatives', 'expect(maxOf([-5, -2, -9])).toBe(-2)'],
        ['does not use Math.max', 'expect(code).not.toMatch(/Math\\.max/)'],
      ],
      hints: ['Starting at 0 is wrong when every number is negative.', 'Start with `nums[0]`, then replace `best` whenever `n > best`.'],
    },
    {
      id: 'array-methods',
      title: 'map, filter and reduce',
      learn: `Array methods replace most loops:

- \`map\` transforms each item: \`[1, 2].map((x) => x * 2)\` → \`[2, 4]\`
- \`filter\` keeps items that pass a test
- \`reduce\` folds the array into one value: \`nums.reduce((sum, x) => sum + x, 0)\`

They don't change the original array.`,
      task: 'Write `totalOfPaid(orders)`: the sum of `amount` for orders whose `paid` is `true`. Use `filter` and `reduce`.',
      starter: `function totalOfPaid(orders) {

}
`,
      solution: `function totalOfPaid(orders) {
  return orders.filter((o) => o.paid).reduce((sum, o) => sum + o.amount, 0)
}
`,
      tests: [
        ['sums paid orders only', 'expect(totalOfPaid([{ amount: 10, paid: true }, { amount: 5, paid: false }, { amount: 7, paid: true }])).toBe(17)'],
        ['an empty list is 0', 'expect(totalOfPaid([])).toBe(0)'],
        ['uses filter and reduce', 'expect(code).toMatch(/\\.filter\\(/); expect(code).toMatch(/\\.reduce\\(/)'],
      ],
      hints: ['`orders.filter((o) => o.paid)` keeps the paid ones.', 'Give `reduce` a starting value of `0`, or an empty array throws.'],
    },
    {
      id: 'objects',
      title: 'Objects and counting',
      learn: `Objects map keys to values. Read with \`obj.key\` or \`obj[key]\` when the key is in a variable.

Counting things is a classic: \`counts[word] = (counts[word] ?? 0) + 1\`. The \`??\` gives a default when the key isn't there yet.`,
      task: 'Write `countWords(text)` that returns an object counting each lower-cased word. Words are separated by spaces.',
      starter: `function countWords(text) {
  const counts = {}

  return counts
}
`,
      solution: `function countWords(text) {
  const counts = {}
  for (const word of text.toLowerCase().split(' ').filter(Boolean)) {
    counts[word] = (counts[word] ?? 0) + 1
  }
  return counts
}
`,
      tests: [
        ['counts words', 'expect(countWords("the cat the hat")).toEqual({ the: 2, cat: 1, hat: 1 })'],
        ['ignores case', 'expect(countWords("Go go GO")).toEqual({ go: 3 })'],
        ['skips extra spaces', 'expect(countWords("a  b")).toEqual({ a: 1, b: 1 })'],
      ],
      hints: ['`text.toLowerCase().split(" ")` gives the words.', 'Two spaces in a row make an empty string: `.filter(Boolean)` removes it.'],
    },
    {
      id: 'closures',
      title: 'Closures',
      learn: `A function remembers the variables of the place it was **created**. That's a closure:

\`\`\`
function makeCounter() {
  let count = 0
  return () => ++count
}
\`\`\`

Each call to \`makeCounter()\` gets its own private \`count\`.`,
      task: 'Write `once(fn)`: it returns a new function that calls `fn` only the first time and returns that first result on every later call.',
      starter: `function once(fn) {
  return (...args) => fn(...args)
}
`,
      solution: `function once(fn) {
  let called = false
  let result
  return (...args) => {
    if (!called) {
      called = true
      result = fn(...args)
    }
    return result
  }
}
`,
      tests: [
        ['calls fn only once', 'const spy = fn(() => 42); const f = once(spy); f(); f(); f(); expect(spy).toHaveBeenCalledTimes(1)'],
        ['returns the first result every time', 'let n = 0; const f = once(() => ++n); expect(f()).toBe(1); expect(f()).toBe(1)'],
        ['passes the arguments', 'const f = once((a, b) => a + b); expect(f(2, 3)).toBe(5)'],
      ],
      hints: ['Keep `called` and `result` in variables outside the returned function.', 'Only call `fn` when `called` is still false; always return `result`.'],
    },
    {
      id: 'classes',
      title: 'Classes',
      learn: `A class bundles data and methods. \`constructor\` sets up each new instance; methods use \`this\`.

\`#private\` fields can't be touched from outside the class.`,
      task: 'Write a class `Stack` with `push(x)`, `pop()` (returns the last item, or `undefined` when empty), `peek()` and a `size` getter.',
      starter: `class Stack {

}
`,
      solution: `class Stack {
  #items = []
  push(x) {
    this.#items.push(x)
  }
  pop() {
    return this.#items.pop()
  }
  peek() {
    return this.#items[this.#items.length - 1]
  }
  get size() {
    return this.#items.length
  }
}
`,
      tests: [
        ['push and pop are last-in, first-out', 'const s = new Stack(); s.push(1); s.push(2); expect(s.pop()).toBe(2); expect(s.pop()).toBe(1); expect(s.pop()).toBeUndefined()'],
        ['peek does not remove', 'const s = new Stack(); s.push("a"); expect(s.peek()).toBe("a"); expect(s.size).toBe(1)'],
        ['size is a getter', 'const s = new Stack(); s.push(1); s.push(1); expect(s.size).toBe(2)'],
      ],
      hints: ['Store items in an array field: `#items = []`.', 'A getter looks like `get size() { return this.#items.length }`.'],
    },
    {
      id: 'async',
      title: 'Promises and async/await',
      learn: `Slow work (network, timers) returns a **Promise**. Inside an \`async\` function, \`await\` waits for it.

Run independent work in parallel with \`Promise.all([...])\`. Catch failures with \`try / catch\`.`,
      task: '`fetchUser(id)` is given (it returns a Promise of `{ id, name }` and rejects for unknown ids). Write `async function names(ids)` that loads all users in parallel and returns their names, or `[]` if any load fails.',
      starter: `const db = { 1: 'Ada', 2: 'Linus' }
const fetchUser = (id) => new Promise((resolve, reject) =>
  setTimeout(() => (db[id] ? resolve({ id, name: db[id] }) : reject(new Error('not found'))), 10))

async function names(ids) {

}
`,
      solution: `const db = { 1: 'Ada', 2: 'Linus' }
const fetchUser = (id) => new Promise((resolve, reject) =>
  setTimeout(() => (db[id] ? resolve({ id, name: db[id] }) : reject(new Error('not found'))), 10))

async function names(ids) {
  try {
    const users = await Promise.all(ids.map((id) => fetchUser(id)))
    return users.map((u) => u.name)
  } catch {
    return []
  }
}
`,
      tests: [
        ['returns the names in order', 'expect(await names([2, 1])).toEqual(["Linus", "Ada"])'],
        ['returns [] when one fails', 'expect(await names([1, 99])).toEqual([])'],
        ['loads in parallel with Promise.all', 'expect(code).toMatch(/Promise\\.all/)'],
      ],
      hints: ['`ids.map((id) => fetchUser(id))` starts every request at once.', 'Wrap the `await Promise.all(...)` in `try { } catch { return [] }`.'],
    },
  ],
}
