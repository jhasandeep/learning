import type { LearnTrack } from './types'

export const systemDesign: LearnTrack = {
  id: 'system-design',
  intro: 'Build the parts that system-design interviews talk about: an LRU cache, cache-aside with TTL, load balancing, a token bucket, consistent hashing, backoff, idempotency keys and a circuit breaker.',
  kind: 'js',
  lang: 'javascript',
  steps: [
    {
      id: 'lru-cache',
      title: 'An LRU cache',
      learn: `A cache has limited space, so it must **evict** something. LRU (least recently used) evicts the entry untouched the longest.

A JavaScript \`Map\` remembers insertion order, so it can do this in O(1): on every \`get\`/\`set\` move the key to the end (delete and re-insert); evict the **first** key (\`map.keys().next().value\`) when over capacity.`,
      task: 'Write `class LRUCache` with `constructor(capacity)`, `get(key)` (value or `undefined`) and `set(key, value)`.',
      starter: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity
    this.map = new Map()
  }
  get(key) {
    return this.map.get(key)
  }
  set(key, value) {
    this.map.set(key, value)
  }
}
`,
      solution: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity
    this.map = new Map()
  }
  get(key) {
    if (!this.map.has(key)) return undefined
    const value = this.map.get(key)
    this.map.delete(key)
    this.map.set(key, value)
    return value
  }
  set(key, value) {
    this.map.delete(key)
    this.map.set(key, value)
    if (this.map.size > this.capacity) this.map.delete(this.map.keys().next().value)
  }
}
`,
      tests: [
        ['evicts the least recently used', 'const c = new LRUCache(2); c.set("a", 1); c.set("b", 2); c.get("a"); c.set("c", 3); expect(c.get("b")).toBeUndefined(); expect(c.get("a")).toBe(1); expect(c.get("c")).toBe(3)'],
        ['updating a key refreshes it', 'const c = new LRUCache(2); c.set("a", 1); c.set("b", 2); c.set("a", 10); c.set("c", 3); expect(c.get("a")).toBe(10); expect(c.get("b")).toBeUndefined()'],
        ['never exceeds capacity', 'const c = new LRUCache(3); for (let i = 0; i < 10; i++) c.set(i, i); expect(c.map.size).toBe(3)'],
      ],
      hints: ['On `get`, delete and re-set the key so it becomes the newest.', 'When `size > capacity`, delete `this.map.keys().next().value` (the oldest).'],
    },
    {
      id: 'cache-aside',
      title: 'Cache-aside with TTL',
      learn: `**Cache-aside**: read from the cache; on a miss, load from the database and store the value. Give entries a **TTL** so stale data expires, and **invalidate** the key when the data changes.

Taking \`now()\` as a parameter makes time easy to control in tests.`,
      task: 'Write `createCache(loader, ttlMs, now = Date.now)` returning `{ get(key), invalidate(key) }`. `get` is async: it returns a cached value younger than `ttlMs`, otherwise awaits `loader(key)` and caches it.',
      starter: `function createCache(loader, ttlMs, now = Date.now) {
  return {
    async get(key) {
      return loader(key)
    },
    invalidate(key) {},
  }
}
`,
      solution: `function createCache(loader, ttlMs, now = Date.now) {
  const entries = new Map()
  return {
    async get(key) {
      const hit = entries.get(key)
      if (hit && now() - hit.at < ttlMs) return hit.value
      const value = await loader(key)
      entries.set(key, { value, at: now() })
      return value
    },
    invalidate(key) {
      entries.delete(key)
    },
  }
}
`,
      tests: [
        ['caches repeated reads', 'const load = fn(async (k) => k.toUpperCase()); const c = createCache(load, 1000, () => 0); expect(await c.get("a")).toBe("A"); expect(await c.get("a")).toBe("A"); expect(load).toHaveBeenCalledTimes(1)'],
        ['reloads after the TTL', 'let t = 0; const load = fn(async () => t); const c = createCache(load, 1000, () => t); await c.get("k"); t = 999; expect(await c.get("k")).toBe(0); t = 1000; expect(await c.get("k")).toBe(1000)'],
        ['invalidate forces a reload', 'const load = fn(async () => 1); const c = createCache(load, 1e9, () => 0); await c.get("k"); c.invalidate("k"); await c.get("k"); expect(load).toHaveBeenCalledTimes(2)'],
      ],
      hints: ['Store `{ value, at: now() }` per key in a Map.', 'A hit is valid while `now() - at < ttlMs`.'],
    },
    {
      id: 'load-balancer',
      title: 'Load balancing',
      learn: `A load balancer spreads requests across servers:

- **round robin**: take turns; simple and fair when requests cost the same
- **least connections**: pick the server with the fewest open requests; better when some requests are slow

Skip servers that fail health checks.`,
      task: 'Write `createBalancer(servers)` returning `{ next(), acquire(), release(name), setHealthy(name, ok) }`: `next` is round robin over healthy servers; `acquire` picks the healthy server with the fewest active connections (ties: list order) and counts it; `release` decrements.',
      starter: `function createBalancer(servers) {
  return {
    next() { return servers[0] },
    acquire() { return servers[0] },
    release(name) {},
    setHealthy(name, ok) {},
  }
}
`,
      solution: `function createBalancer(servers) {
  const healthy = new Map(servers.map((s) => [s, true]))
  const active = new Map(servers.map((s) => [s, 0]))
  let i = 0
  const up = () => servers.filter((s) => healthy.get(s))
  return {
    next() {
      const list = up()
      if (!list.length) throw new Error('No healthy servers')
      return list[i++ % list.length]
    },
    acquire() {
      const list = up()
      if (!list.length) throw new Error('No healthy servers')
      const pick = list.reduce((best, s) => (active.get(s) < active.get(best) ? s : best))
      active.set(pick, active.get(pick) + 1)
      return pick
    },
    release(name) {
      active.set(name, Math.max(0, active.get(name) - 1))
    },
    setHealthy(name, ok) {
      healthy.set(name, ok)
    },
  }
}
`,
      tests: [
        ['round robin takes turns', 'const b = createBalancer(["a", "b", "c"]); expect([1, 2, 3, 4].map(() => b.next())).toEqual(["a", "b", "c", "a"])'],
        ['skips unhealthy servers', 'const b = createBalancer(["a", "b", "c"]); b.setHealthy("b", false); expect([1, 2, 3].map(() => b.next())).toEqual(["a", "c", "a"])'],
        ['least connections', 'const b = createBalancer(["a", "b"]); expect(b.acquire()).toBe("a"); expect(b.acquire()).toBe("b"); expect(b.acquire()).toBe("a"); b.release("b"); expect(b.acquire()).toBe("b")'],
      ],
      hints: ['Keep a counter `i` and use `list[i++ % list.length]` over the healthy list.', 'For least connections, `reduce` to the server with the smallest active count.'],
    },
    {
      id: 'token-bucket',
      title: 'Token bucket rate limiter',
      learn: `A **token bucket** allows short bursts but limits the average rate. The bucket holds up to \`capacity\` tokens and refills at \`ratePerSec\`. Each request takes a token; with none left, it's refused (HTTP 429).

Refill lazily: when a request arrives, add \`elapsedSeconds × rate\` tokens (capped at capacity).`,
      task: 'Write `createBucket(capacity, ratePerSec)` returning `take(nowMs)`: true if a token was available (and use it), false otherwise. The bucket starts full.',
      starter: `function createBucket(capacity, ratePerSec) {
  let tokens = capacity
  return function take(nowMs) {
    tokens--
    return tokens >= 0
  }
}
`,
      solution: `function createBucket(capacity, ratePerSec) {
  let tokens = capacity
  let last = null
  return function take(nowMs) {
    if (last !== null) tokens = Math.min(capacity, tokens + ((nowMs - last) / 1000) * ratePerSec)
    last = nowMs
    if (tokens < 1) return false
    tokens -= 1
    return true
  }
}
`,
      tests: [
        ['allows a burst up to capacity', 'const take = createBucket(3, 1); expect([0, 0, 0, 0].map((t) => take(t))).toEqual([true, true, true, false])'],
        ['refills over time', 'const take = createBucket(2, 1); take(0); take(0); expect(take(500)).toBe(false); expect(take(1000)).toBe(true)'],
        ['never holds more than capacity', 'const take = createBucket(2, 10); take(0); expect([1, 1, 1].map(() => take(60000))).toEqual([true, true, false])'],
      ],
      hints: ['Remember the time of the last request and add `(now - last) / 1000 * rate` tokens.', 'Cap with `Math.min(capacity, …)`; refuse when `tokens < 1`.'],
    },
    {
      id: 'consistent-hashing',
      title: 'Consistent hashing',
      learn: `With \`hash(key) % N\`, adding one server remaps almost every key: the whole cache misses at once.

**Consistent hashing** puts servers on a ring (each at several **virtual** points for balance). A key goes to the first server point clockwise from its hash. Adding a server only moves the keys that now land on it, about 1/N.`,
      task: 'Write `createRing(nodes, vnodes = 50)` returning `{ get(key), add(node) }`. Place each node at `hash(node + "#" + i)` for i < vnodes; `get` finds the first point ≥ `hash(key)`, wrapping around. `hash` (FNV-1a) is given.',
      starter: `function hash(s) {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

function createRing(nodes, vnodes = 50) {
  return {
    get(key) { return nodes[hash(key) % nodes.length] },
    add(node) { nodes = [...nodes, node] },
  }
}
`,
      solution: `function hash(s) {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

function createRing(nodes, vnodes = 50) {
  let points = []
  const add = (node) => {
    for (let i = 0; i < vnodes; i++) points.push({ at: hash(node + '#' + i), node })
    points.sort((a, b) => a.at - b.at)
  }
  nodes.forEach(add)
  return {
    get(key) {
      const h = hash(key)
      let lo = 0, hi = points.length
      while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (points[mid].at < h) lo = mid + 1
        else hi = mid
      }
      return points[lo % points.length].node
    },
    add,
  }
}
`,
      tests: [
        ['always maps a key to the same node', 'const r = createRing(["a", "b", "c"]); expect(r.get("user:42")).toBe(r.get("user:42"))'],
        ['uses every node', 'const r = createRing(["a", "b", "c"]); const seen = new Set(); for (let i = 0; i < 300; i++) seen.add(r.get("k" + i)); expect(seen.size).toBe(3)'],
        ['adding a node moves few keys (and only to the new node)', 'const r = createRing(["a", "b", "c", "d"]); const before = Array.from({ length: 1000 }, (_, i) => r.get("key" + i)); r.add("e"); let moved = 0; for (let i = 0; i < 1000; i++) { const now = r.get("key" + i); if (now !== before[i]) { moved++; expect(now).toBe("e") } } expect(moved).toBeGreaterThan(50); expect(moved).toBeLessThan(400)'],
      ],
      hints: ['Keep a sorted array of `{ at, node }` points.', 'Binary-search for the first point with `at >= hash(key)`; wrap to index 0 past the end.'],
    },
    {
      id: 'backoff',
      title: 'Backoff with jitter',
      learn: `Retrying immediately after a failure hammers a struggling service. **Exponential backoff** waits \`base × 2^attempt\`, capped at a maximum.

If thousands of clients retry on the same schedule they stampede together, so add **jitter**: with "full jitter", wait a random time between 0 and the backoff.`,
      task: 'Write `backoffDelay(attempt, baseMs, capMs, random = Math.random)` returning `random() * min(capMs, baseMs * 2 ** attempt)`.',
      starter: `function backoffDelay(attempt, baseMs, capMs, random = Math.random) {
  return baseMs
}
`,
      solution: `function backoffDelay(attempt, baseMs, capMs, random = Math.random) {
  return random() * Math.min(capMs, baseMs * 2 ** attempt)
}
`,
      tests: [
        ['grows exponentially', 'const one = () => 1; expect([0, 1, 2, 3].map((a) => backoffDelay(a, 100, 1e9, one))).toEqual([100, 200, 400, 800])'],
        ['is capped', 'expect(backoffDelay(20, 100, 5000, () => 1)).toBe(5000)'],
        ['applies full jitter', 'expect(backoffDelay(2, 100, 1e9, () => 0.5)).toBe(200); expect(backoffDelay(2, 100, 1e9, () => 0)).toBe(0)'],
      ],
      hints: ['`baseMs * 2 ** attempt`, capped with `Math.min(capMs, …)`.', 'Multiply by `random()` for full jitter.'],
    },
    {
      id: 'idempotency',
      title: 'Idempotency keys',
      learn: `A client retries a payment after a timeout. Did the first request go through? Without protection, the customer is charged twice.

The client sends an **idempotency key** with the request. The server stores the result per key and, for a repeated key, returns the stored result **without** doing the work again. Concurrent duplicates should share the in-flight work.`,
      task: 'Write `createPayments(charge)` returning `pay(key, amount)`: the first call for a key runs `charge(amount)` (async); later or concurrent calls with the same key return the same promise/result without charging again.',
      starter: `function createPayments(charge) {
  return function pay(key, amount) {
    return charge(amount)
  }
}
`,
      solution: `function createPayments(charge) {
  const results = new Map()
  return function pay(key, amount) {
    if (!results.has(key)) results.set(key, Promise.resolve().then(() => charge(amount)))
    return results.get(key)
  }
}
`,
      tests: [
        ['charges once per key', 'const charge = fn(async (a) => ({ id: "ch_1", amount: a })); const pay = createPayments(charge); await pay("k1", 50); const again = await pay("k1", 50); expect(charge).toHaveBeenCalledTimes(1); expect(again).toEqual({ id: "ch_1", amount: 50 })'],
        ['concurrent retries share the work', 'const charge = fn(async (a) => { await new Promise((r) => setTimeout(r, 10)); return a }); const pay = createPayments(charge); await Promise.all([pay("k", 1), pay("k", 1), pay("k", 1)]); expect(charge).toHaveBeenCalledTimes(1)'],
        ['different keys are separate payments', 'const charge = fn(async (a) => a); const pay = createPayments(charge); await pay("a", 1); await pay("b", 2); expect(charge).toHaveBeenCalledTimes(2)'],
      ],
      hints: ['Store the **promise** in a Map by key, before it resolves.', 'Return the stored promise for repeated keys.'],
    },
    {
      id: 'circuit-breaker',
      title: 'A circuit breaker',
      learn: `When a dependency is down, calling it anyway wastes time and piles on load. A **circuit breaker** has three states:

- **closed**: calls go through; count consecutive failures
- **open** (after N failures): fail fast without calling, for a cool-down period
- **half-open** (after the cool-down): let one trial call through; success closes the circuit, failure opens it again`,
      task: 'Write `createBreaker(task, { threshold, cooldownMs, now })` returning `call(...args)` and `state()`. Open after `threshold` consecutive failures; while open, reject with `Error("Circuit open")`; after `cooldownMs`, allow a trial call.',
      starter: `function createBreaker(task, { threshold, cooldownMs, now }) {
  return {
    call: (...args) => task(...args),
    state: () => 'closed',
  }
}
`,
      solution: `function createBreaker(task, { threshold, cooldownMs, now }) {
  let state = 'closed'
  let failures = 0
  let openedAt = 0
  return {
    async call(...args) {
      if (state === 'open') {
        if (now() - openedAt < cooldownMs) throw new Error('Circuit open')
        state = 'half-open'
      }
      try {
        const result = await task(...args)
        state = 'closed'
        failures = 0
        return result
      } catch (err) {
        failures++
        if (state === 'half-open' || failures >= threshold) {
          state = 'open'
          openedAt = now()
        }
        throw err
      }
    },
    state: () => state,
  }
}
`,
      tests: [
        ['opens after the threshold', 'let t = 0; const task = fn(async () => { throw new Error("down") }); const b = createBreaker(task, { threshold: 2, cooldownMs: 1000, now: () => t }); await expect(b.call()).rejects.toMatch("down"); await expect(b.call()).rejects.toMatch("down"); expect(b.state()).toBe("open"); await expect(b.call()).rejects.toMatch("Circuit open"); expect(task).toHaveBeenCalledTimes(2)'],
        ['a success after the cool-down closes it', 'let t = 0, ok = false; const b = createBreaker(async () => { if (!ok) throw new Error("down"); return "fine" }, { threshold: 1, cooldownMs: 1000, now: () => t }); await expect(b.call()).rejects.toMatch("down"); t = 1000; ok = true; expect(await b.call()).toBe("fine"); expect(b.state()).toBe("closed")'],
        ['a failed trial opens it again', 'let t = 0; const b = createBreaker(async () => { throw new Error("down") }, { threshold: 1, cooldownMs: 1000, now: () => t }); await expect(b.call()).rejects.toBeTruthy(); t = 1500; await expect(b.call()).rejects.toMatch("down"); expect(b.state()).toBe("open"); t = 1600; await expect(b.call()).rejects.toMatch("Circuit open")'],
      ],
      hints: ['Track `state`, `failures` and `openedAt`.', 'When open and the cool-down has passed, switch to "half-open" and let the call through.'],
    },
  ],
}
