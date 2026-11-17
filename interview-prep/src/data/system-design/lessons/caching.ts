import type { SdLesson } from '../types'

export const caching: SdLesson = {
  id: 'caching',
  title: 'Caching',
  topic: 'Speed and database load',
  blurb: 'Keep popular answers in fast memory so most requests never touch the slow database.',
  why: {
    story: 'Reading from a database means going over the network, finding rows on disk and building a result: **milliseconds** each time. If a million people open the same popular product page, the database repeats the exact same work a million times. A cache keeps the answer in **fast memory** after the first request, so the next requests are answered in a fraction of the time and the database stays calm.',
    pains: ['The database becomes the bottleneck as traffic grows.', 'Popular data is fetched and rebuilt again and again.', 'Slow pages make users leave.'],
  },
  before: {
    title: 'Without a cache: every request reaches the database',
    nodes: [
      { id: 'c', label: 'Users', kind: 'user', x: 12, y: 28 },
      { id: 'app', label: 'App server', kind: 'server', x: 46, y: 28 },
      { id: 'db', label: 'Database', kind: 'db', x: 84, y: 28 },
    ],
    edges: [{ from: 'c', to: 'app' }, { from: 'app', to: 'db' }],
    frames: [
      { caption: 'A user asks for a popular product page.', active: ['c', 'app'], flow: [['c', 'app']] },
      { caption: 'The app queries the database. It is slow (about 50 ms).', active: ['app', 'db'], flow: [['app', 'db']] },
      { caption: 'Another thousand users ask for the **same page**. The database repeats the same query a thousand times and starts to struggle.', active: ['c', 'app'], flow: [['app', 'db']], bad: ['db'], badges: { db: 'OVERLOAD' } },
    ],
  },
  how: {
    title: 'Cache-aside: check the cache first',
    nodes: [
      { id: 'c', label: 'Users', kind: 'user', x: 10, y: 28 },
      { id: 'app', label: 'App server', kind: 'server', x: 38, y: 28 },
      { id: 'cache', label: 'Cache', kind: 'cache', x: 72, y: 12, sub: 'in memory' },
      { id: 'db', label: 'Database', kind: 'db', x: 72, y: 44 },
    ],
    edges: [{ from: 'c', to: 'app' }, { from: 'app', to: 'cache' }, { from: 'app', to: 'db' }],
    frames: [
      { caption: 'A user asks for product 42. The app **checks the cache first**.', active: ['c', 'app', 'cache'], flow: [['app', 'cache']] },
      { caption: 'Cache **miss**: the cache does not have it yet.', active: ['cache'], badges: { cache: 'MISS' } },
      { caption: 'The app reads product 42 from the database (slow, but only this once).', active: ['app', 'db'], flow: [['app', 'db']] },
      { caption: 'The app **stores the answer in the cache** (with an expiry time) and returns it to the user.', active: ['app', 'cache'], flow: [['app', 'cache']] },
      { caption: 'The next user asks for product 42. The cache has it: **hit**. The database is not touched.', active: ['c', 'app', 'cache'], flow: [['app', 'cache']], badges: { cache: 'HIT' } },
    ],
  },
  realWorld: [
    { name: 'Redis and Memcached', text: 'The two most common in-memory caches. Applications store things like user profiles, product details and rendered pages in them.' },
    { name: 'Your browser', text: 'Browsers cache images, scripts and stylesheets, so a page you visited yesterday loads without downloading them again.' },
    { name: 'CPU caches', text: 'The same idea at the smallest scale: processors keep recently used memory in tiny, very fast caches.' },
    { name: 'CDN', text: 'A content delivery network is a cache spread around the world, so users get files from a nearby location.' },
  ],
  tradeoffs: {
    gain: ['Much faster responses for popular data.', 'Far fewer database queries, so the database scales further.', 'Can keep the site partly working if the database is slow.'],
    cost: ['Data can be **stale** (out of date) until it expires or is updated.', '"Cache invalidation" is hard: when data changes you must refresh or remove the cached copy.', 'More memory to pay for, and one more system to operate.'],
    useWhen: ['Data is read much more often than it changes.', 'The same items are requested again and again.', 'A little staleness is acceptable (a product description, a profile, a feed).'],
    avoidWhen: ['Data must always be perfectly current (an account balance during a transfer).', 'Every request asks for something different, so almost nothing is reused (a low hit rate).'],
  },
  steps: [
    {
      title: 'A small cache that drops the oldest item',
      tag: 'slow',
      idea: 'A cache cannot hold everything, so it needs a rule for what to throw away when it is full. The simplest rule is **FIFO**: drop whatever was added first. It is easy to build, but it can throw away an item that is requested all the time.',
      walk: ['Keep a dictionary of items and the order they were added.', '`put` stores the item; if the cache is over its capacity, remove the oldest key.', '`get` returns the value or None. It never changes the order.'],
      only: [1, 2, 4],
      code: {
        python: `class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.data = {}
        self.order = []

    def get(self, key):
        return self.data.get(key)

    def put(self, key, value):
        if key not in self.data:
            self.order.append(key)
        self.data[key] = value
        if len(self.order) > self.capacity:
            oldest = self.order.pop(0)
            del self.data[oldest]
`,
        javascript: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.data = new Map();
  }

  get(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  }

  put(key, value) {
    this.data.set(key, value);
    if (this.data.size > this.capacity) {
      const oldest = this.data.keys().next().value;
      this.data.delete(oldest);
    }
  }
}
`,
      },
      time: 'O(1) (O(n) for the list pop in Python)',
      space: 'O(capacity)',
      verdict: 'Works, but a popular item read all day is still evicted once it becomes the oldest. We want to keep what is **used**, not what is oldest.',
    },
    {
      title: 'LRU: drop the least recently used',
      tag: 'best',
      idea: 'Every time an item is read **or** written, move it to the "most recent" end. When the cache is full, evict from the other end: the item that has not been touched for the longest time. In Python an `OrderedDict` and in JavaScript a `Map` both remember insertion order, so moving an item means deleting and re-adding it.',
      walk: ['`get`: if the key exists, move it to the most recent end and return the value; otherwise return None.', '`put`: if the key exists, remove it first so it moves to the end; then store it.', 'If the size is over capacity, remove the item at the **oldest** end.'],
      code: {
        python: `from collections import OrderedDict


class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.data = OrderedDict()

    def get(self, key):
        if key not in self.data:
            return None
        self.data.move_to_end(key)
        return self.data[key]

    def put(self, key, value):
        if key in self.data:
            self.data.move_to_end(key)
        self.data[key] = value
        if len(self.data) > self.capacity:
            self.data.popitem(last=False)
`,
        javascript: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.data = new Map();
  }

  get(key) {
    if (!this.data.has(key)) return null;
    const value = this.data.get(key);
    this.data.delete(key);
    this.data.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.data.has(key)) this.data.delete(key);
    this.data.set(key, value);
    if (this.data.size > this.capacity) {
      const oldest = this.data.keys().next().value;
      this.data.delete(oldest);
    }
  }
}
`,
      },
      time: 'O(1) per get and put',
      space: 'O(capacity)',
      verdict: 'This is the classic **LRU cache**. Redis offers LRU-style eviction as a setting. Real caches also add a **TTL** (time to live) so entries expire on their own.',
    },
  ],
  sim: {
    id: 'cache',
    intro: 'Request items A to H and watch the cache. Items A, B and C are "popular" in the random-requests button, like trending products.',
    tryThis: ['Set the size to 3 and press the random button a few times: LRU keeps A, B and C and the hit rate climbs.', 'Switch the rule to **FIFO** and repeat: the hit rate is lower because popular items get evicted when they become the oldest.', 'Make the cache size 1: almost everything misses. A cache that is too small is nearly useless.'],
  },
  practice: {
    fn: { python: 'simulate_lru', javascript: 'simulateLru' },
    symbol: { python: 'class LRUCache', javascript: 'class LRUCache' },
    driver: {
      python: `def simulate_lru(capacity, ops):
    cache = LRUCache(capacity)
    out = []
    for op in ops:
        if op[0] == "put":
            cache.put(op[1], op[2])
            out.append(None)
        else:
            out.append(cache.get(op[1]))
    return out
`,
      javascript: `function simulateLru(capacity, ops) {
  const cache = new LRUCache(capacity);
  const out = [];
  for (const op of ops) {
    if (op[0] === "put") {
      cache.put(op[1], op[2]);
      out.push(null);
    } else {
      const value = cache.get(op[1]);
      out.push(value === undefined ? null : value);
    }
  }
  return out;
}
`,
    },
    starter: {
      python: `class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity

    def get(self, key):
        # return the value, or None if it is not cached
        pass

    def put(self, key, value):
        # store the value; if the cache is full, evict the least recently used key
        pass
`,
      javascript: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
  }

  get(key) {
    // return the value, or null if it is not cached
  }

  put(key, value) {
    // store the value; if the cache is full, evict the least recently used key
  }
}
`,
    },
    cases: [
      { label: 'evicts the least recently used item', args: [2, [['put', 'a', 1], ['put', 'b', 2], ['get', 'a'], ['put', 'c', 3], ['get', 'b'], ['get', 'c']]], expected: [null, null, 1, null, null, 3] },
      { label: 'updating a key does not use extra space', args: [2, [['put', 'a', 1], ['put', 'a', 10], ['put', 'b', 2], ['get', 'a']]], expected: [null, null, null, 10] },
      { label: 'a miss on an empty cache gives None / null', args: [2, [['get', 'x']]], expected: [null] },
      { label: 'reading an item refreshes it', args: [2, [['put', 'a', 1], ['put', 'b', 2], ['get', 'a'], ['put', 'c', 3], ['get', 'a'], ['get', 'b']]], expected: [null, null, 1, null, 1, null] },
      { label: 'a cache of size 1', args: [1, [['put', 'a', 1], ['put', 'b', 2], ['get', 'a'], ['get', 'b']]], expected: [null, null, null, 2] },
      { label: 'writing an item refreshes it', args: [2, [['put', 'a', 1], ['put', 'b', 2], ['put', 'a', 9], ['put', 'c', 3], ['get', 'a'], ['get', 'b']]], expected: [null, null, null, null, 9, null] },
    ],
    hints: ['You need to know which key was used least recently. An ordered dictionary (`OrderedDict` / `Map`) can keep keys in order of use.', 'On every `get` hit and every `put`, move that key to the "most recent" end.', 'After a `put`, if there are more items than `capacity`, remove the key at the **oldest** end.'],
  },
  quiz: [
    { q: 'Which of these data is the best candidate for a cache?', options: ['A bank account balance during a transfer', 'A product description that changes once a week', 'A one-time password'], answer: 1, why: 'Data that is read often and changes rarely gives a high hit rate and tolerates a little staleness. Balances and one-time codes must always be current or unique.' },
    { q: 'A product price is updated in the database, but users still see the old price. What is the problem?', options: ['The cache is too small', 'The cached copy is stale: it was not invalidated or has not expired', 'The database is slow'], answer: 1, why: 'The cache still holds the old value. Fix it with a short TTL, by deleting or updating the cached key when the price changes, or both.' },
    { q: 'What does a low cache hit rate (say 10%) usually tell you?', options: ['Requests are mostly for different items, or the cache is too small or expires too fast', 'The database is too fast', 'You should cache even more data'], answer: 0, why: 'A cache only helps when items are reused. Check the key design, the TTL and the size. Sometimes the data simply is not cache-friendly.' },
  ],
  interview: [
    { q: 'Explain cache-aside, write-through and write-back.', a: '**Cache-aside**: the app checks the cache, on a miss reads the database and fills the cache (the most common). **Write-through**: every write goes to the cache and the database together, so the cache is always fresh but writes are slower. **Write-back**: writes go to the cache first and are saved to the database later: very fast, but data can be lost if the cache fails before it is saved.' },
    { q: 'What is a cache stampede and how do you prevent it?', a: 'When a very popular key expires, thousands of requests miss at the same moment and all hit the database together. Prevent it with a **lock** so only one request rebuilds the value, **jittered** (randomised) TTLs so keys do not all expire together, or by refreshing popular keys in the background before they expire.' },
    { q: 'How do you keep the cache consistent with the database?', a: 'You usually cannot make it perfect. Use a **TTL** to bound staleness, and **invalidate** (delete) the key when the data changes, so the next read refills it. For data that must never be stale, do not cache it, or read it from the primary database.' },
  ],
  mistakes: ['Caching data that changes constantly (low hit rate, lots of staleness).', 'No expiry (TTL), so stale data lives forever.', 'Forgetting to invalidate or update the cache when the data changes.', 'Treating the cache as the only copy: a cache can be emptied at any time.'],
  recap: 'A cache trades a little freshness for a lot of speed: keep popular data in memory, evict the least recently used, and expire what might be stale.',
}
