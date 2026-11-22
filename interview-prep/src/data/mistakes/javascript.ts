import type { MistakeSet } from './types'

export const javascript: MistakeSet = {
  id: 'javascript',
  title: 'JavaScript',
  kind: 'js',
  lang: 'javascript',
  items: [
    {
      id: 'off-by-one-sum',
      title: 'Sum of an array',
      difficulty: 'Easy',
      task: '`sum(numbers)` returns the total of all numbers in the array.',
      broken: `function sum(numbers) {
  let total = 0
  for (let i = 0; i <= numbers.length; i++) {
    total += numbers[i]
  }
  return total
}
`,
      solution: `function sum(numbers) {
  let total = 0
  for (let i = 0; i < numbers.length; i++) {
    total += numbers[i]
  }
  return total
}
`,
      demo: 'console.log(sum([1, 2, 3, 4]))',
      tests: [
        ['sum([1, 2, 3]) is 6', 'expect(sum([1, 2, 3])).toBe(6)'],
        ['an empty array is 0', 'expect(sum([])).toBe(0)'],
      ],
      explain: 'Array indexes run from `0` to `length - 1`. With `i <= numbers.length` the last pass reads `numbers[length]`, which is `undefined`, and `total + undefined` is `NaN`. Use `<` (a classic **off-by-one** error).',
      hints: ['What is `numbers[numbers.length]`?', 'The loop should stop before `i` reaches `length`: use `<`.'],
    },
    {
      id: 'map-no-return',
      title: 'Double every number',
      difficulty: 'Easy',
      task: '`double(numbers)` returns a new array with every number multiplied by 2.',
      broken: `function double(numbers) {
  return numbers.map((n) => {
    n * 2
  })
}
`,
      solution: `function double(numbers) {
  return numbers.map((n) => {
    return n * 2
  })
}
`,
      demo: 'console.log(double([1, 2, 3]))',
      tests: [
        ['[1, 2, 3] becomes [2, 4, 6]', 'expect(double([1, 2, 3])).toEqual([2, 4, 6])'],
        ['the input is not changed', 'const a = [1, 2]; double(a); expect(a).toEqual([1, 2])'],
      ],
      explain: 'An arrow function with **curly braces** needs an explicit `return`; without it the result is `undefined`. Either write `return n * 2` or drop the braces: `(n) => n * 2`.',
      hints: ['What does a function return when there is no `return`?', 'Use `return`, or an arrow function without braces.'],
    },
    {
      id: 'await-missing',
      title: 'Forgot to await',
      difficulty: 'Medium',
      task: '`getName(id)` waits for `loadUser(id)` and returns the user\'s name in capital letters.',
      setup: 'const loadUser = (id) => new Promise((resolve) => setTimeout(() => resolve({ id, name: "asha" }), 5))',
      broken: `async function getName(id) {
  const user = loadUser(id)
  return user.name.toUpperCase()
}
`,
      solution: `async function getName(id) {
  const user = await loadUser(id)
  return user.name.toUpperCase()
}
`,
      demo: 'console.log(await getName(1))',
      tests: [
        ['returns ASHA', 'expect(await getName(1)).toBe("ASHA")'],
      ],
      explain: '`loadUser` returns a **promise**. Without `await`, `user` is the pending promise, not the user, so `user.name` is `undefined` and `.toUpperCase()` throws. `await` pauses the function until the value is ready.',
      hints: ['What is `user` right after the call: the user or something else?', 'Put `await` in front of the call.'],
    },
    {
      id: 'assignment-in-if',
      title: 'One equals sign too few',
      difficulty: 'Easy',
      task: '`isAdult(age)` returns `true` for 18 and above, otherwise `false`.',
      broken: `function isAdult(age) {
  if (age = 18) {
    return true
  }
  return false
}
`,
      solution: `function isAdult(age) {
  if (age >= 18) {
    return true
  }
  return false
}
`,
      demo: 'console.log(isAdult(10), isAdult(18), isAdult(40))',
      tests: [
        ['10 is not an adult', 'expect(isAdult(10)).toBe(false)'],
        ['18 is an adult', 'expect(isAdult(18)).toBe(true)'],
        ['40 is an adult', 'expect(isAdult(40)).toBe(true)'],
      ],
      explain: '`age = 18` is an **assignment**: it overwrites `age` with 18, and 18 is truthy, so the `if` always ran. Compare with `>=` (or `===` for equality). Three signs: `=` assigns, `==` compares loosely, `===` compares strictly.',
      hints: ['Does `=` compare or assign?', 'You want "18 or more": `>=`.'],
    },
    {
      id: 'var-loop-closure',
      title: 'Counters in a loop',
      difficulty: 'Hard',
      task: '`makeCounters()` returns an array of 3 functions; calling them returns `0`, `1` and `2`.',
      broken: `function makeCounters() {
  const fns = []
  for (var i = 0; i < 3; i++) {
    fns.push(() => i)
  }
  return fns
}
`,
      solution: `function makeCounters() {
  const fns = []
  for (let i = 0; i < 3; i++) {
    fns.push(() => i)
  }
  return fns
}
`,
      demo: 'console.log(makeCounters().map((f) => f()))',
      tests: [
        ['the functions return 0, 1, 2', 'expect(makeCounters().map((f) => f())).toEqual([0, 1, 2])'],
      ],
      explain: '`var` has **one** `i` for the whole function. All three arrow functions share it, and by the time they run the loop is finished and `i` is `3`. `let` creates a **new `i` for every iteration**, so each function remembers its own value.',
      hints: ['How many variables called `i` exist with `var`?', 'Declare the loop variable with `let`.'],
    },
    {
      id: 'sort-numbers',
      title: 'Sorting numbers',
      difficulty: 'Medium',
      task: '`sortNumbers(list)` returns a new array sorted from smallest to largest.',
      broken: `function sortNumbers(list) {
  return [...list].sort()
}
`,
      solution: `function sortNumbers(list) {
  return [...list].sort((a, b) => a - b)
}
`,
      demo: 'console.log(sortNumbers([10, 9, 1, 100]))',
      tests: [
        ['[10, 9, 1] becomes [1, 9, 10]', 'expect(sortNumbers([10, 9, 1])).toEqual([1, 9, 10])'],
        ['works with larger numbers', 'expect(sortNumbers([100, 25, 3])).toEqual([3, 25, 100])'],
      ],
      explain: 'Without a comparator `sort()` converts items to **strings** and sorts alphabetically, so `10` comes before `9`. Pass a compare function: `(a, b) => a - b` for ascending order.',
      hints: ['`[10, 9, 1].sort()` gives `[1, 10, 9]`. Why?', '`.sort((a, b) => a - b)`.'],
    },
    {
      id: 'copy-object',
      title: 'Copy, do not share',
      difficulty: 'Medium',
      task: '`withAge(user, age)` returns a **new** object with the age added. The original `user` must stay unchanged.',
      broken: `function withAge(user, age) {
  const copy = user
  copy.age = age
  return copy
}
`,
      solution: `function withAge(user, age) {
  const copy = { ...user }
  copy.age = age
  return copy
}
`,
      demo: 'const user = { name: "Asha" }; console.log(withAge(user, 30), user)',
      tests: [
        ['the result has the age', 'expect(withAge({ name: "Asha" }, 30)).toEqual({ name: "Asha", age: 30 })'],
        ['the original is not changed', 'const u = { name: "Asha" }; withAge(u, 30); expect(u).toEqual({ name: "Asha" })'],
      ],
      explain: 'Objects are assigned **by reference**: `const copy = user` makes a second name for the same object, so changing `copy` changes `user`. Make a real (shallow) copy with spread: `{ ...user }`.',
      hints: ['After `const copy = user`, how many objects exist?', 'Spread: `{ ...user }`.'],
    },
    {
      id: 'arrow-returns-object',
      title: 'Arrow function returning an object',
      difficulty: 'Hard',
      task: '`toUser(name)` returns `{ name }`, written as a one-line arrow function.',
      broken: `const toUser = (name) => { name }
`,
      solution: `const toUser = (name) => ({ name })
`,
      demo: 'console.log(toUser("Asha"))',
      tests: [
        ['returns an object with the name', 'expect(toUser("Asha")).toEqual({ name: "Asha" })'],
      ],
      explain: 'After `=>` the braces `{ }` are read as the **function body**, not an object, so the function returns `undefined`. To return an object literal directly, wrap it in parentheses: `=> ({ name })`.',
      hints: ['What do the `{ }` after the arrow mean to JavaScript?', 'Wrap the object in `( )`.'],
    },
  ],
}
