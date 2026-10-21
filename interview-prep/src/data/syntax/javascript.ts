import type { SyntaxSet } from './types'

export const javascript: SyntaxSet = {
  id: 'javascript',
  title: 'JavaScript',
  snippets: [
    {
      id: 'destructuring-spread',
      title: 'Destructuring, spread, ?. and ??',
      lang: 'javascript',
      code: `const user = { id: 1, name: 'Asha', address: { city: 'Pune' } }
const { name, address: { city }, role = 'user' } = user
const { id, ...profile } = user
const [first, , third, ...rest] = [10, 20, 30, 40, 50]

let a = 1
let b = 2
;[a, b] = [b, a]

const updated = { ...user, name: 'Ravi' }
const merged = [...rest, 60, 70]
const zip = user.address?.zip ?? 'unknown'
const tagCount = user.tags?.length ?? 0
user.onSave?.()`,
      note: 'Everyday modern syntax: nested destructuring with defaults, rest, swap, spread copies, **optional chaining** and `??`. The leading `;` stops the swap joining the line above.',
    },
    {
      id: 'closures-once-memoize',
      title: 'Closures: once and memoize',
      lang: 'javascript',
      code: `function once(fn) {
  let result
  return function (...args) {
    if (fn) result = fn.apply(this, args)
    fn = null
    return result
  }
}

function memoize(fn) {
  const cache = new Map()
  return (...args) => {
    const key = JSON.stringify(args)
    if (!cache.has(key)) cache.set(key, fn(...args))
    return cache.get(key)
  }
}`,
      note: 'A **closure** keeps private state alive between calls. `once` and `memoize` are the classic ways interviewers check you understand it.',
    },
    {
      id: 'debounce',
      title: 'debounce',
      lang: 'javascript',
      code: `function debounce(fn, wait) {
  let timer
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), wait)
  }
}

const onSearch = debounce((q) => fetchResults(q), 300)
input.addEventListener('input', (e) => onSearch(e.target.value))`,
      note: 'Run only after calls stop for `wait` ms (search boxes, resize). The most asked utility; keep `this` and the arguments with `fn.apply`.',
    },
    {
      id: 'throttle',
      title: 'throttle',
      lang: 'javascript',
      code: `function throttle(fn, wait) {
  let last = 0
  return function (...args) {
    const now = Date.now()
    if (now - last < wait) return
    last = now
    return fn.apply(this, args)
  }
}

window.addEventListener('scroll', throttle(updateHeader, 100))`,
      note: 'Run **at most once** every `wait` ms (scroll, mousemove). Usually asked right after debounce: be ready to explain the difference.',
    },
    {
      id: 'curry',
      title: 'curry',
      lang: 'javascript',
      code: `function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn.apply(this, args)
    return (...more) => curried.apply(this, [...args, ...more])
  }
}

const add = curry((a, b, c) => a + b + c)
add(1)(2)(3) // 6
add(1, 2)(3) // 6`,
      note: 'Collect arguments until there are `fn.length` of them, then call. Tests closures, recursion and rest/spread together.',
    },
    {
      id: 'flatten',
      title: 'Flatten a nested array',
      lang: 'javascript',
      code: `function flatten(arr, depth = Infinity) {
  const out = []
  for (const item of arr) {
    if (Array.isArray(item) && depth > 0) {
      out.push(...flatten(item, depth - 1))
    } else {
      out.push(item)
    }
  }
  return out
}

flatten([1, [2, [3, [4]]]]) // [1, 2, 3, 4]
flatten([1, [2, [3]]], 1) // [1, 2, [3]]`,
      note: 'A recursive version of `arr.flat(depth)`. Interviewers ask you not to use `flat`, then ask for a depth limit.',
    },
    {
      id: 'deep-clone',
      title: 'Deep clone',
      lang: 'javascript',
      code: `function deepClone(value, seen = new WeakMap()) {
  if (value === null || typeof value !== 'object') return value
  if (value instanceof Date) return new Date(value)
  if (seen.has(value)) return seen.get(value)
  const copy = Array.isArray(value) ? [] : {}
  seen.set(value, copy)
  for (const key of Object.keys(value)) {
    copy[key] = deepClone(value[key], seen)
  }
  return copy
}`,
      note: 'Recurse into objects and arrays; the `WeakMap` handles **circular references**. Mention `structuredClone` exists, then write it by hand.',
    },
    {
      id: 'bind-polyfill',
      title: 'Function.prototype.bind polyfill',
      lang: 'javascript',
      code: `Function.prototype.myBind = function (ctx, ...bound) {
  const fn = this
  return function (...args) {
    return fn.apply(ctx, [...bound, ...args])
  }
}

const greet = function (greeting) {
  return \`\${greeting}, \${this.name}\`
}
const hi = greet.myBind({ name: 'Asha' }, 'Hi')
hi() // 'Hi, Asha'`,
      note: 'Return a function that calls the original with a fixed `this` and **partially applied** arguments. Checks you know `call`, `apply` and `this`.',
    },
    {
      id: 'map-reduce-polyfill',
      title: 'Array map and reduce polyfills',
      lang: 'javascript',
      code: `Array.prototype.myMap = function (cb, thisArg) {
  const out = []
  for (let i = 0; i < this.length; i++) {
    if (i in this) out[i] = cb.call(thisArg, this[i], i, this)
  }
  return out
}

Array.prototype.myReduce = function (cb, init) {
  let i = 0
  let acc = init
  if (arguments.length < 2) {
    if (this.length === 0) throw new TypeError('Empty array')
    acc = this[i++]
  }
  for (; i < this.length; i++) acc = cb(acc, this[i], i, this)
  return acc
}`,
      note: 'The callback gets `(value, index, array)`. For `reduce`, the tricky part is **no initial value**: start from the first element, and throw on an empty array.',
    },
    {
      id: 'class-inheritance',
      title: 'Class with inheritance',
      lang: 'javascript',
      code: `class Animal {
  #name
  static kingdom = 'Animalia'
  constructor(name) {
    this.#name = name
  }
  speak() {
    return \`\${this.#name} makes a sound\`
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name)
    this.breed = breed
  }
  speak() { return \`\${super.speak()} and barks\` }
}`,
      note: 'Call `super()` before using `this` in a subclass constructor. `#name` is truly **private**; `static` lives on the class, not on instances.',
    },
    {
      id: 'event-emitter',
      title: 'EventEmitter (on / off / emit)',
      lang: 'javascript',
      code: `class EventEmitter {
  #events = new Map()
  on(name, fn) {
    if (!this.#events.has(name)) this.#events.set(name, new Set())
    this.#events.get(name).add(fn)
    return () => this.off(name, fn)
  }
  off(name, fn) {
    this.#events.get(name)?.delete(fn)
  }
  emit(name, ...args) {
    for (const fn of [...(this.#events.get(name) ?? [])]) fn(...args)
  }
}

const bus = new EventEmitter()
const unsubscribe = bus.on('login', (user) => console.log(user))
bus.emit('login', { id: 1 })`,
      note: 'A **pub/sub** map of event name to listeners. Copy the listeners before emitting so one can unsubscribe itself; the usual follow-up is `once`.',
    },
    {
      id: 'lru-cache',
      title: 'LRU cache with Map',
      lang: 'javascript',
      code: `class LRUCache {
  #map = new Map()
  constructor(capacity) {
    this.capacity = capacity
  }
  get(key) {
    if (!this.#map.has(key)) return -1
    const value = this.#map.get(key)
    this.put(key, value)
    return value
  }
  put(key, value) {
    this.#map.delete(key)
    this.#map.set(key, value)
    const [oldest] = this.#map.keys()
    if (this.#map.size > this.capacity) this.#map.delete(oldest)
  }
}`,
      note: 'A `Map` keeps insertion order, so delete and re-set a key to mark it recent, and evict the **first key**, the oldest. O(1) for both operations.',
    },
  ],
}
