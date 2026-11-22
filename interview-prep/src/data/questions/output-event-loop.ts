import type { QuestionSet } from './types'

// Predict-the-output questions: event loop, promises, async/await, closures, this, hoisting and coercion.
// `output` is the exact stdout; tests/questions.test.ts runs every snippet and compares.

export const outputEventLoop: QuestionSet = {
  id: 'output-event-loop',
  title: 'Output guessing: JS & event loop',
  questions: [
    {
      id: 'sync-timeout-basic',
      q: 'What is the output order?',
      a: `Synchronous code always finishes first. \`setTimeout\` (even with 0 ms) hands its callback to the **timer queue**, which the event loop only reads when the **call stack is empty**. So \`A\`, \`C\`, then \`B\`.`,
      difficulty: 'Easy',
      freq: 3,
      tags: ['event-loop', 'setTimeout'],
      code: { lang: 'javascript', run: true, code: `console.log('A')
setTimeout(() => console.log('B'), 0)
console.log('C')` },
      output: `A
C
B`,
      followUp: 'Does `setTimeout(fn, 0)` really fire after 0 ms?',
    },
    {
      id: 'promise-vs-timeout',
      q: 'Promise `then` against `setTimeout`: what is the order?',
      a: `After the synchronous code (\`1\`, \`4\`) the engine drains the **microtask queue** (promise callbacks) completely, and only then takes the next **macrotask** (timer). Microtasks beat macrotasks, so \`3\` comes before \`2\`.`,
      difficulty: 'Easy',
      freq: 3,
      tags: ['event-loop', 'microtask', 'promise'],
      code: { lang: 'javascript', run: true, code: `console.log('1')
setTimeout(() => console.log('2'), 0)
Promise.resolve().then(() => console.log('3'))
console.log('4')` },
      output: `1
4
3
2`,
      followUp: 'Name three things that go in the microtask queue and three that are macrotasks.',
    },
    {
      id: 'classic-event-loop',
      q: 'The classic: predict the full order.',
      a: `1. Sync: \`script start\`, \`script end\`.
2. Microtasks: \`promise1\` runs, and its \`.then\` queues \`promise2\` into the **same** microtask queue, which is drained before moving on, so \`promise2\` also runs.
3. Macrotask: \`setTimeout\`.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['event-loop', 'microtask', 'async-await'],
      code: { lang: 'javascript', run: true, code: `console.log('script start')

setTimeout(() => console.log('setTimeout'), 0)

Promise.resolve()
  .then(() => console.log('promise1'))
  .then(() => console.log('promise2'))

console.log('script end')` },
      output: `script start
script end
promise1
promise2
setTimeout`,
      followUp: 'What if `promise1` returned another promise instead of a value?',
    },
    {
      id: 'async-await-order',
      q: 'Order of an `async` function with `await`?',
      a: `An \`async\` function runs **synchronously until its first \`await\`**. So \`foo start\` and \`bar\` print immediately. \`await bar()\` pauses \`foo\`: the rest of it (\`foo end\`) becomes a **microtask**. The caller continues and prints \`end\`, then the microtask runs.

Mental model: \`await x\` is \`Promise.resolve(x).then(rest of function)\`.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['event-loop', 'async-await'],
      code: { lang: 'javascript', run: true, code: `async function foo() {
  console.log('foo start')
  await bar()
  console.log('foo end')
}
async function bar() {
  console.log('bar')
}

console.log('start')
foo()
console.log('end')` },
      output: `start
foo start
bar
end
foo end`,
      followUp: 'What changes if `bar` is a normal (non-async) function?',
    },
    {
      id: 'nested-micro-macro',
      q: 'Mix of timers, promises and sync logs. What is the order?',
      a: `- Sync: \`1\`, \`6\`.
- Microtasks: the promise callback prints \`4\` and schedules a new timer.
- Macrotask 1 (first timer): prints \`2\`, queues a microtask. The **microtask queue is drained right after each macrotask**, so \`3\` runs before the next timer.
- Macrotask 2 (second timer): \`5\`.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['event-loop', 'microtask'],
      code: { lang: 'javascript', run: true, code: `console.log(1)

setTimeout(() => {
  console.log(2)
  Promise.resolve().then(() => console.log(3))
}, 0)

Promise.resolve().then(() => {
  console.log(4)
  setTimeout(() => console.log(5), 0)
})

console.log(6)` },
      output: `1
6
4
2
3
5`,
      followUp: 'Where does `requestAnimationFrame` fit in the browser loop?',
    },
    {
      id: 'nexttick-vs-promise',
      q: 'Node.js: `process.nextTick` vs promise vs `setTimeout` vs `setImmediate`.',
      a: `1. \`sync\`: the main script.
2. \`nextTick\`: Node drains the **nextTick queue first**, before promise microtasks.
3. \`promise\`: then the microtask queue.
4. \`timeout\` and \`immediate\` are macrotask phases. From the **main module** their order is not guaranteed (it depends on process speed), but \`timeout\` usually comes first. Inside an I/O callback, \`immediate\` is always first.

Rule of thumb: sync → nextTick → promises → timers → check phase (setImmediate).`,
      difficulty: 'Hard',
      freq: 3,
      tags: ['event-loop', 'node', 'nextTick'],
      code: { lang: 'javascript', code: `setTimeout(() => console.log('timeout'), 0)
setImmediate(() => console.log('immediate'))
Promise.resolve().then(() => console.log('promise'))
process.nextTick(() => console.log('nextTick'))
console.log('sync')` },
      output: `sync
nextTick
promise
timeout
immediate`,
      followUp: 'Why can a recursive `process.nextTick` starve I/O?',
    },
    {
      id: 'immediate-in-io',
      q: 'Inside an I/O callback, which comes first: `setTimeout(0)` or `setImmediate`?',
      a: `The Node loop phases run in this order: **timers → pending → poll (I/O) → check (\`setImmediate\`) → close**. A callback from \`readFile\` runs in the **poll** phase. The next phase after poll is **check**, so \`setImmediate\` fires before the loop wraps around to the timers phase. Inside I/O callbacks the order is therefore always \`immediate\`, then \`timeout\`.`,
      difficulty: 'Hard',
      freq: 2,
      tags: ['event-loop', 'node', 'setImmediate'],
      code: { lang: 'javascript', code: `const fs = require('fs')

fs.readFile(__filename, () => {
  setTimeout(() => console.log('timeout'), 0)
  setImmediate(() => console.log('immediate'))
})` },
      output: `immediate
timeout`,
      followUp: 'Draw the phases of the Node.js event loop.',
    },
    {
      id: 'var-loop-timeout',
      q: 'What does this print, and how do you fix it?',
      a: `\`var\` is function-scoped: there is **one** \`i\` shared by all callbacks. The timers run after the loop ended, when \`i\` is \`3\`. So it prints \`3\` three times.

Fixes: use \`let\` (a fresh binding per iteration), or wrap in an IIFE that captures the value, or pass it as an argument: \`setTimeout(console.log, 0, i)\`.`,
      difficulty: 'Easy',
      freq: 3,
      tags: ['closures', 'var', 'setTimeout'],
      code: { lang: 'javascript', run: true, code: `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0)
}` },
      output: `3
3
3`,
      followUp: 'Why does `let` give a new `i` per iteration?',
    },
    {
      id: 'let-loop-timeout',
      q: 'Same loop with `let` and different delays. Output?',
      a: `\`let\` creates a new \`i\` for every iteration, so each callback keeps its own value (\`0\`, \`1\`, \`2\`). But the delays are \`30\`, \`20\`, \`10\` ms, so the **last** timer is the shortest and fires first: \`2\`, \`1\`, \`0\`. Timers run in order of **expiry time**, not creation order.`,
      difficulty: 'Easy',
      freq: 2,
      tags: ['closures', 'let', 'setTimeout'],
      code: { lang: 'javascript', run: true, code: `for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 30 - i * 10)
}` },
      output: `2
1
0`,
      followUp: 'What is the minimum delay browsers enforce for nested timers?',
    },
    {
      id: 'promise-constructor-sync',
      q: 'Is the code inside `new Promise(...)` synchronous?',
      a: `The **executor** passed to \`new Promise\` runs synchronously and immediately, so \`2\` and \`3\` print in order (calling \`resolve()\` does not stop the function). Only the \`.then\` callback is asynchronous (a microtask). Order: \`1 2 3 5 4\`.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['promise', 'event-loop'],
      code: { lang: 'javascript', run: true, code: `console.log('1')

new Promise((resolve) => {
  console.log('2')
  resolve()
  console.log('3')
}).then(() => console.log('4'))

console.log('5')` },
      output: `1
2
3
5
4`,
      followUp: 'What happens if you call `resolve` twice or call `reject` after `resolve`?',
    },
    {
      id: 'then-chain-values',
      q: 'What does this chain print?',
      a: `Each \`.then\` passes its return value on: \`1\` → \`2\`. The third callback throws, so the rejected state **skips** the next \`.then\` and lands in \`.catch\`, which prints \`boom 2\`. \`catch\` returns \`10\`, which **recovers** the chain into a fulfilled state, so the next \`.then\` prints \`after catch 10\`. \`finally\` always runs last.`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['promise', 'chaining'],
      code: { lang: 'javascript', run: true, code: `Promise.resolve(1)
  .then((x) => x + 1)
  .then((x) => { throw new Error('boom ' + x) })
  .then((x) => console.log('never', x))
  .catch((e) => { console.log(e.message); return 10 })
  .then((x) => console.log('after catch', x))
  .finally(() => console.log('finally'))` },
      output: `boom 2
after catch 10
finally`,
      followUp: 'What does `finally` pass down the chain?',
    },
    {
      id: 'then-non-function',
      q: 'Passing a non-function to `.then`. Output?',
      a: `When the argument to \`.then\` is **not a function**, it is ignored and the value passes through unchanged. First chain: \`1\`. Second chain: the callback returns \`3\`. Both chains advance one microtask at a time in parallel, so they print \`1\` then \`3\`.`,
      difficulty: 'Hard',
      freq: 1,
      tags: ['promise', 'gotcha'],
      code: { lang: 'javascript', run: true, code: `Promise.resolve(1)
  .then(2)
  .then((x) => console.log(x))

Promise.resolve(1)
  .then(() => 3)
  .then((x) => console.log(x))` },
      output: `1
3`,
      followUp: 'What is the difference between `.then(f(x))` and `.then(() => f(x))`?',
    },
    {
      id: 'promise-all-race',
      q: '`Promise.all`, `race`, `allSettled`, `any` with the same inputs. Output?',
      a: `- \`all\` rejects as soon as **one** rejects: at 20 ms with \`bad\`.
- \`race\` settles with the **first** to settle (fulfil or reject): \`fast\` at 10 ms.
- \`any\` resolves with the first **fulfilled**: \`fast\` at 10 ms (it ignores rejections unless all fail).
- \`allSettled\` waits for **all**, never rejects: at 30 ms.

Order of printing follows the time each finishes: \`race\`, \`any\`, \`all\`, \`allSettled\`.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['promise', 'combinators'],
      code: { lang: 'javascript', run: true, code: `const wait = (ms, v, fail) => new Promise((res, rej) => setTimeout(() => (fail ? rej(v) : res(v)), ms))

const tasks = () => [wait(30, 'slow'), wait(10, 'fast'), wait(20, 'bad', true)]

Promise.all(tasks()).catch((e) => console.log('all:', e))
Promise.race(tasks()).then((v) => console.log('race:', v))
Promise.allSettled(tasks()).then((r) => console.log('allSettled:', r.map((x) => x.status).join()))
Promise.any(tasks()).then((v) => console.log('any:', v))` },
      output: `race: fast
any: fast
all: bad
allSettled: fulfilled,fulfilled,rejected`,
      followUp: 'When does `Promise.any` reject, and with what error type?',
    },
    {
      id: 'await-in-loop',
      q: '`await` in a `for` loop against `Promise.all`. Which is faster and why?',
      a: `The loop waits for each call to finish before starting the next: about \`3 × 40 = 120\` ms (≈ 3 units). \`Promise.all\` starts all three at once and waits for the slowest: about \`40\` ms (≈ 1 unit). Use a sequential loop only when each step **depends on the previous** or order matters. Beware \`forEach(async ...)\`: it does **not** wait at all.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['async-await', 'performance'],
      code: { lang: 'javascript', run: true, code: `const wait = (ms, v) => new Promise((r) => setTimeout(() => r(v), ms))

async function main() {
  let t = Date.now()
  for (const n of [1, 2, 3]) await wait(40, n)
  console.log('sequential', Math.round((Date.now() - t) / 40))

  t = Date.now()
  await Promise.all([1, 2, 3].map((n) => wait(40, n)))
  console.log('parallel', Math.round((Date.now() - t) / 40))
}
main()` },
      output: `sequential 3
parallel 1`,
      followUp: 'Why does `array.forEach(async (x) => { await ... })` not wait for the iterations?',
    },
    {
      id: 'foreach-async-trap',
      q: '`forEach` with an async callback. What prints?',
      a: `\`forEach\` ignores the promise each callback returns, so it does not wait. The loop finishes instantly and \`done\` prints first; the three items print later, in order, after about 10 ms. Use \`for...of\` with \`await\` (sequential) or \`await Promise.all(arr.map(async ...))\` (parallel).`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['async-await', 'gotcha'],
      code: { lang: 'javascript', run: true, code: `const wait = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  ;[1, 2, 3].forEach(async (n) => {
    await wait(10)
    console.log('item', n)
  })
  console.log('done')
}
main()` },
      output: `done
item 1
item 2
item 3`,
      followUp: 'Rewrite it so `done` prints last, in parallel and in sequence.',
    },
    {
      id: 'async-return-timing',
      q: 'Returning a promise from an async function or a `.then`: how many extra ticks?',
      a: `Both chains start in the same tick, so \`a1\` and \`b1\` print first. Chain A then prints one line per tick: \`a2\`, \`a3\`, \`a4\`.

Chain B returned a **promise** (a "thenable"). Resolving with a thenable costs **two extra microtask ticks** before \`b2\` can run, so \`b2\` is printed **after \`a4\`**, not right after \`b1\`. This is why returning a promise from \`.then\` is slower than returning a plain value (and why \`async\` functions that \`return await\` differ subtly).`,
      difficulty: 'Hard',
      freq: 2,
      tags: ['promise', 'microtask', 'tricky'],
      code: { lang: 'javascript', run: true, code: `Promise.resolve()
  .then(() => console.log('a1'))
  .then(() => console.log('a2'))
  .then(() => console.log('a3'))
  .then(() => console.log('a4'))

Promise.resolve()
  .then(() => {
    console.log('b1')
    return Promise.resolve('b-inner')
  })
  .then((v) => console.log('b2', v))` },
      output: `a1
b1
a2
a3
a4
b2 b-inner`,
      followUp: 'Why does returning a thenable take extra ticks (hint: the spec job `NewPromiseResolveThenableJob`)?',
    },
    {
      id: 'unhandled-and-throw-timer',
      q: 'Errors in async code: which `catch` sees what?',
      a: `\`try/catch\` only guards the **current call stack**. The timer callback runs later, on a fresh stack, so the surrounding \`catch\` never sees it: the error becomes an uncaught exception (handled here by the process handler).

\`await\` turns a rejection into a throw **inside the async function**, so \`try/catch\` around it works. It prints \`caught by await\` first because the microtask runs before the timer.`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['error-handling', 'async', 'setTimeout'],
      code: { lang: 'javascript', code: `try {
  setTimeout(() => { throw new Error('in timer') }, 0)
} catch (e) {
  console.log('caught by try/catch')
}

process.on('uncaughtException', (e) => console.log('uncaught:', e.message))

;(async () => {
  try {
    await Promise.reject(new Error('rejected'))
  } catch (e) {
    console.log('caught by await:', e.message)
  }
})()` },
      output: `caught by await: rejected
uncaught: in timer`,
      followUp: 'What happens in Node 15+ with an unhandled promise rejection?',
    },
    {
      id: 'closure-counter',
      q: 'What does this closure print?',
      a: `Each call to \`counter()\` creates a **new** \`n\` captured by its own returned function. \`a\` and \`b\` do not share state. \`a()\` → 1, 2, then \`b()\` → 1 (its own counter), then \`a()\` → 3. Arguments evaluate left to right, so \`1 2 1 3\`.`,
      difficulty: 'Easy',
      freq: 3,
      tags: ['closures'],
      code: { lang: 'javascript', run: true, code: `function counter() {
  let n = 0
  return () => ++n
}
const a = counter()
const b = counter()
console.log(a(), a(), b(), a())` },
      output: `1 2 1 3`,
      followUp: 'How do closures cause memory leaks?',
    },
    {
      id: 'this-binding',
      q: 'What is `this` in each call? (Node, CommonJS file)',
      a: `- \`user.regular()\`: \`this\` is the object before the dot, so \`Asha\`.
- \`lost()\`: the method was **detached**, so there is no object before the dot. In sloppy mode \`this\` is the global object, which has no \`name\`, giving \`undefined\` (in strict mode or an ES module \`this\` is \`undefined\` and reading \`.name\` would throw a \`TypeError\`).
- \`user.arrow()\`: arrow functions have **no own \`this\`**; they use the surrounding one. At the top of a CommonJS file that is \`module.exports\`, an object, so \`typeof this\` is \`object\`.
- In \`delayed\`, the arrow inside \`setTimeout\` keeps \`this\` from \`delayed\` (the user object), so it prints \`Asha\`. A normal \`function\` callback there would lose it.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['this', 'arrow-functions'],
      code: { lang: 'javascript', code: `const user = {
  name: 'Asha',
  regular() { return this.name },
  arrow: () => typeof this,
  delayed() {
    setTimeout(() => console.log('arrow:', this.name), 0)
  },
}

console.log(user.regular())
const lost = user.regular
console.log(lost())
console.log(user.arrow())
user.delayed()` },
      output: `Asha
undefined
object
arrow: Asha`,
      followUp: 'How do `call`, `apply` and `bind` differ?',
    },
    {
      id: 'hoisting-tdz',
      q: 'Hoisting: what does each line print or throw?',
      a: `\`var\` declarations are hoisted and initialised to \`undefined\`, so the first line prints \`undefined\`. \`let\` is hoisted too, but sits in the **temporal dead zone** until its line runs, so reading it throws a \`ReferenceError\`. Function **declarations** are hoisted with their body (\`function\`); a function **expression** assigned to a \`var\` is only \`undefined\` until the assignment.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['hoisting', 'var', 'let', 'tdz'],
      code: { lang: 'javascript', run: true, code: `console.log(a)
var a = 1

try { console.log(b) } catch (e) { console.log(e.name) }
let b = 2

console.log(typeof fn, typeof fn2)
function fn() {}
var fn2 = function () {}` },
      output: `undefined
ReferenceError
function undefined`,
      followUp: 'Is `typeof` of an undeclared variable safe? What about inside the TDZ?',
    },
    {
      id: 'type-coercion',
      q: 'Coercion quiz: predict each line.',
      a: `- \`[] + []\` → both become \`''\`, result an **empty string** (the first line prints blank).
- \`[] + {}\` → \`'' + '[object Object]'\`.
- \`1 + '2'\` → \`'12'\` (\`+\` with a string concatenates); \`'3' - 1\` → \`2\` (\`-\` is numeric).
- floats: \`0.1 + 0.2\` is \`0.30000000000000004\`, so \`false\`.
- \`==\` treats \`null\` and \`undefined\` as equal; \`===\` does not.
- \`NaN\` is not equal to itself; \`Object.is\` says it is.
- \`typeof null\` is \`'object'\` (a historic bug); \`typeof NaN\` is \`'number'\`.
- \`sort()\` with no comparator compares **as strings**: \`1, 10, 9\`.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['coercion', 'equality'],
      code: { lang: 'javascript', run: true, code: `console.log([] + [])
console.log([] + {})
console.log(1 + '2', '3' - 1)
console.log(0.1 + 0.2 === 0.3)
console.log(null == undefined, null === undefined)
console.log(NaN === NaN, Object.is(NaN, NaN))
console.log(typeof null, typeof NaN)
console.log([10, 9, 1].sort())` },
      output: `
[object Object]
12 2
false
true false
false true
object number
[ 1, 10, 9 ]`,
      followUp: 'Why does `[] == ![]` evaluate to `true`?',
    },
    {
      id: 'object-reference',
      q: 'Objects are copied by reference. What prints?',
      a: `\`b = a\` copies the **reference**, so \`b.n = 2\` changes \`a\`. \`{ ...a }\` is a **shallow** copy: \`c\` gets its own top-level properties (so \`c.n\` stays \`1\`), but \`c.inner\` still points at the **same** inner object, so \`a.inner.v\` becomes \`99\`. Use \`structuredClone(a)\` for a deep copy.`,
      difficulty: 'Easy',
      freq: 3,
      tags: ['references', 'spread', 'immutability'],
      code: { lang: 'javascript', run: true, code: `const a = { n: 1, inner: { v: 1 } }
const b = a
const c = { ...a }

b.n = 2
c.inner.v = 99

console.log(a.n, c.n)
console.log(a.inner.v)
console.log(a === b, a === c)` },
      output: `2 1
99
true false`,
      followUp: 'What can `structuredClone` not copy that `JSON.parse(JSON.stringify())` also breaks?',
    },
    {
      id: 'generator-order',
      q: 'Generators: trace the output.',
      a: `The **first** \`next()\` starts the generator and its argument is thrown away: it runs to \`yield 1\` and returns \`{ value: 1, done: false }\`. The second \`next(10)\` makes the paused \`yield\` evaluate to \`10\`, so \`x = 10\`, logs \`got 10\`, then yields \`20\`. The third \`next(5)\` gives \`y = 5\`, logs \`got 5\` and hits \`return\`, so \`{ value: 'end', done: true }\`. After that: \`{ value: undefined, done: true }\`.`,
      difficulty: 'Hard',
      freq: 1,
      tags: ['generators', 'iterators'],
      code: { lang: 'javascript', run: true, code: `function* gen() {
  const x = yield 1
  console.log('got', x)
  const y = yield x * 2
  console.log('got', y)
  return 'end'
}

const g = gen()
console.log(g.next('ignored'))
console.log(g.next(10))
console.log(g.next(5))
console.log(g.next())` },
      output: `{ value: 1, done: false }
got 10
{ value: 20, done: false }
got 5
{ value: 'end', done: true }
{ value: undefined, done: true }`,
      followUp: 'How does `async/await` relate to generators and promises?',
    },
  ],
}
