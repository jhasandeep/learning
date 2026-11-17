import type { SdLesson } from '../types'

export const writeStrategies: SdLesson = {
  id: 'write-strategies',
  title: 'Write-through, write-back and write-around',
  topic: 'When does the database get the data?',
  blurb: 'A cache sits in front of the database. When you write, where does the data go first, and what happens if the cache crashes?',
  why: {
    story: 'The caching lesson covered **reading**. Writes need a policy too. With **write-through**, every write goes to the cache **and** the database before it is confirmed: safe and simple, but each write pays the database cost. With **write-back** (write-behind), the write lands in the cache only and is saved to the database **later** in a batch: very fast, but if the cache crashes before the save, the data is **lost**. With **write-around**, writes skip the cache and go straight to the database; the cache fills only on later reads.',
    pains: ['Writing every update straight to a slow database limits throughput.', 'Delaying writes risks losing them in a crash.', 'Caching data that is written once and rarely read wastes memory.', 'The cache and database can disagree if you update only one of them.'],
  },
  before: {
    title: 'Write-through: safe and simple',
    nodes: [
      { id: 'app', label: 'Application', kind: 'server', x: 10, y: 28 },
      { id: 'c', label: 'Cache', kind: 'cache', x: 48, y: 28 },
      { id: 'db', label: 'Database', kind: 'db', x: 86, y: 28 },
    ],
    edges: [{ from: 'app', to: 'c' }, { from: 'c', to: 'db' }],
    frames: [
      { caption: 'The application writes `x = 5`. The write goes to the cache.', active: ['app', 'c'], flow: [['app', 'c']] },
      { caption: 'The cache **immediately** writes to the database too.', active: ['c', 'db'], flow: [['c', 'db']], badges: { db: 'x = 5' } },
      { caption: 'Only now is the write confirmed. Cache and database always agree, and nothing is lost if the cache dies, but every write waits for the slower database.', active: ['app'], badges: { app: 'DONE' } },
    ],
  },
  how: {
    title: 'Write-back: fast now, saved later',
    nodes: [
      { id: 'app', label: 'Application', kind: 'server', x: 10, y: 28 },
      { id: 'c', label: 'Cache', kind: 'cache', x: 48, y: 28, sub: 'dirty entries' },
      { id: 'db', label: 'Database', kind: 'db', x: 86, y: 28 },
    ],
    edges: [{ from: 'app', to: 'c' }, { from: 'c', to: 'db' }],
    frames: [
      { caption: 'The application writes `x = 5`. Only the **cache** is updated and the write is confirmed at once.', active: ['app', 'c'], flow: [['app', 'c']], badges: { c: 'DIRTY' } },
      { caption: 'The database still has the old value. Many more writes can pile up in the cache (and updates to the same key are merged).', active: ['c'], badges: { c: 'DIRTY' } },
      { caption: 'Later (a timer or when full) the cache **flushes** all dirty entries to the database in one batch.', active: ['c', 'db'], flow: [['c', 'db']], badges: { db: 'x = 5' } },
      { caption: 'Danger: if the cache crashes **before** the flush, the dirty writes are lost forever.', bad: ['c'], badges: { c: 'LOST' } },
    ],
  },
  tabs: ['Write-through', 'Write-back'],
  realWorld: [
    { name: 'Write-through', text: 'Used where losing data is unacceptable, such as product prices or account settings, and by many CDN and application caches.' },
    { name: 'Write-back', text: 'Used by CPU caches, disk and RAID controllers, and counters (likes, views) that are buffered in Redis and saved in batches.' },
    { name: 'Write-around', text: 'Good for data written once and rarely read soon, such as logs or uploads, so it does not push useful items out of the cache.' },
    { name: 'Redis as a buffer', text: 'Apps often count views in Redis (fast) and flush totals to the SQL database every few seconds.' },
  ],
  tradeoffs: {
    gain: ['Write-through: strong consistency and durability.', 'Write-back: very low write latency, fewer database writes.', 'Write-around: no cache pollution.'],
    cost: ['Write-through: slower writes.', 'Write-back: data loss on crash and more complexity.', 'Write-around: the first read after a write is a cache miss.'],
    useWhen: ['Write-through: important data.', 'Write-back: high-volume, loss-tolerant data (counters, analytics).', 'Write-around: write-once data.'],
    avoidWhen: ['Never use write-back for money or orders unless the cache itself is replicated and durable.'],
  },
  steps: [
    {
      title: 'Write-through: update both immediately',
      tag: 'idea',
      idea: 'Every write updates the cache and the database at the same moment. A crash of the cache loses nothing, because the database already has everything.',
      walk: ['`write`: set the key in the cache and in the database.', '`flush`: nothing to do.', '`crash`: wipe the cache only.'],
      only: [0, 4],
      code: {
        python: `class WriteCache:
    def __init__(self, strategy):
        self.strategy = strategy
        self.cache = {}
        self.db = {}

    def write(self, key, value):
        self.cache[key] = value
        self.db[key] = value

    def flush(self):
        pass

    def crash(self):
        self.cache = {}

    def db_get(self, key):
        return self.db.get(key)
`,
        javascript: `class WriteCache {
  constructor(strategy) {
    this.strategy = strategy;
    this.cache = new Map();
    this.db = new Map();
  }

  write(key, value) {
    this.cache.set(key, value);
    this.db.set(key, value);
  }

  flush() {}

  crash() {
    this.cache = new Map();
  }

  dbGet(key) {
    return this.db.has(key) ? this.db.get(key) : null;
  }
}
`,
      },
      time: 'O(1)',
      space: 'O(keys)',
      verdict: 'Safe, but every write pays the database cost. Now add write-back for speed.',
    },
    {
      title: 'Choose the strategy: through or back',
      tag: 'best',
      idea: 'Keep a set of **dirty** keys for write-back. A write-back `write` touches only the cache and marks the key dirty. `flush` copies the dirty keys\' current cache values to the database and clears the set. A `crash` wipes the cache and the dirty set: unflushed writes vanish.',
      walk: ['`write`: always set the cache; if the strategy is "through", also set the database, otherwise mark the key dirty.', '`flush`: for each dirty key, copy the cache value to the database, then clear the dirty set.', '`crash`: clear the cache and the dirty set.'],
      code: {
        python: `class WriteCache:
    def __init__(self, strategy):
        self.strategy = strategy
        self.cache = {}
        self.db = {}
        self.dirty = set()

    def write(self, key, value):
        self.cache[key] = value
        if self.strategy == "through":
            self.db[key] = value
        else:
            self.dirty.add(key)

    def flush(self):
        for key in self.dirty:
            self.db[key] = self.cache[key]
        self.dirty = set()

    def crash(self):
        self.cache = {}
        self.dirty = set()

    def db_get(self, key):
        return self.db.get(key)
`,
        javascript: `class WriteCache {
  constructor(strategy) {
    this.strategy = strategy;
    this.cache = new Map();
    this.db = new Map();
    this.dirty = new Set();
  }

  write(key, value) {
    this.cache.set(key, value);
    if (this.strategy === "through") this.db.set(key, value);
    else this.dirty.add(key);
  }

  flush() {
    for (const key of this.dirty) this.db.set(key, this.cache.get(key));
    this.dirty = new Set();
  }

  crash() {
    this.cache = new Map();
    this.dirty = new Set();
  }

  dbGet(key) {
    return this.db.has(key) ? this.db.get(key) : null;
  }
}
`,
      },
      time: 'write O(1), flush O(dirty)',
      space: 'O(keys)',
      verdict: 'Notice that write-back merges repeated writes to one key into a single database write, and also notice what a crash costs.',
    },
  ],
  practice: {
    fn: { python: 'simulate_cache', javascript: 'simulateCache' },
    symbol: { python: 'class WriteCache', javascript: 'class WriteCache' },
    driver: {
      python: `def simulate_cache(strategy, ops):
    c = WriteCache(strategy)
    out = []
    for op in ops:
        if op[0] == "write":
            c.write(op[1], op[2])
        elif op[0] == "flush":
            c.flush()
        elif op[0] == "crash":
            c.crash()
        else:
            out.append(c.db_get(op[1]))
    return out
`,
      javascript: `function simulateCache(strategy, ops) {
  const c = new WriteCache(strategy);
  const out = [];
  for (const op of ops) {
    if (op[0] === "write") c.write(op[1], op[2]);
    else if (op[0] === "flush") c.flush();
    else if (op[0] === "crash") c.crash();
    else {
      const v = c.dbGet(op[1]);
      out.push(v === undefined ? null : v);
    }
  }
  return out;
}
`,
    },
    starter: {
      python: `class WriteCache:
    def __init__(self, strategy):
        # strategy is "through" or "back"
        pass

    def write(self, key, value):
        # through: update cache and database. back: update only the cache and remember the key is dirty.
        pass

    def flush(self):
        # save every dirty key from the cache to the database
        pass

    def crash(self):
        # the cache (and the list of dirty keys) is lost; the database survives
        pass

    def db_get(self, key):
        # read straight from the database; None if missing
        pass
`,
      javascript: `class WriteCache {
  constructor(strategy) {
    // strategy is "through" or "back"
  }

  write(key, value) {
    // through: update cache and database. back: update only the cache and remember the key is dirty.
  }

  flush() {
    // save every dirty key from the cache to the database
  }

  crash() {
    // the cache (and the list of dirty keys) is lost; the database survives
  }

  dbGet(key) {
    // read straight from the database; null if missing
  }
}
`,
    },
    cases: [
      { label: 'write-through survives a crash', args: ['through', [['write', 'a', 1], ['crash'], ['db', 'a']]], expected: [1] },
      { label: 'write-back loses unflushed writes in a crash', args: ['back', [['write', 'a', 1], ['crash'], ['db', 'a']]], expected: [null] },
      { label: 'write-back keeps flushed writes', args: ['back', [['write', 'a', 1], ['flush'], ['crash'], ['db', 'a']]], expected: [1] },
      { label: 'write-back delays the database and merges updates', args: ['back', [['write', 'a', 1], ['write', 'a', 2], ['db', 'a'], ['flush'], ['db', 'a']]], expected: [null, 2] },
      { label: 'write-through updates the database at once', args: ['through', [['write', 'a', 1], ['write', 'a', 2], ['db', 'a']]], expected: [2] },
      { label: 'only the writes after the last flush are lost', args: ['back', [['write', 'a', 1], ['flush'], ['write', 'a', 2], ['crash'], ['db', 'a']]], expected: [1] },
    ],
    hints: ['Keep a cache, a database and (for write-back) a set of dirty keys.', 'In write-back, `write` must not touch the database; `flush` copies dirty keys to it.', '`crash` clears the cache and the dirty set but never the database.'],
  },
  quiz: [
    { q: 'Which strategy is risky for an order-payment record?', options: ['Write-through', 'Write-back', 'Both are equally safe'], answer: 1, why: 'A crash before the flush would lose the order. Critical data should be written durably first.' },
    { q: 'A page counts views millions of times a minute. Which fits best?', options: ['Write-through to SQL for every view', 'Write-back: count in a cache and save totals in batches', 'No counting'], answer: 1, why: 'Losing a few seconds of view counts is acceptable, and batching removes enormous write load from the database.' },
    { q: 'What problem does write-around avoid?', options: ['Cache pollution by data that is written but rarely read', 'Slow reads of popular data', 'Network partitions'], answer: 0, why: 'Skipping the cache on writes keeps it for the data that is actually read often.' },
  ],
  interview: [
    { q: 'Compare write-through, write-back and write-around.', a: '**Write-through**: write cache and DB together, consistent but slower. **Write-back**: write the cache, flush to DB later, fastest but can lose data. **Write-around**: write only to the DB and let reads populate the cache, good for write-once data. Choose by how costly data loss and write latency are.' },
    { q: 'How would you make write-back safer?', a: 'Replicate the cache, append writes to a durable **log** (write-ahead log) before acknowledging, flush frequently, and limit how many dirty entries or how much time can pass before a flush.' },
    { q: 'What is cache invalidation and why is it hard?', a: 'Removing or updating cached entries when the source data changes. It is hard because there can be many copies and timing races between the writer and the readers. Common tactics: short TTLs, delete-on-write, versioned keys, and write-through.' },
  ],
  mistakes: ['Using write-back for data you cannot afford to lose.', 'Updating the cache but forgetting the database (or the opposite).', 'Flushing so rarely that a crash loses minutes of work.', 'Caching everything on write when most data is never read.'],
  recap: 'Write-through is safe but slower, write-back is fast but can lose recent writes, write-around keeps rarely-read data out of the cache.',
}
