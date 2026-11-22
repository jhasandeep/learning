import type { SdLesson } from '../types'

const FNV_PY = `def fnv1a(text):
    h = 0x811C9DC5
    for ch in text:
        h ^= ord(ch)
        h = (h * 0x01000193) & 0xFFFFFFFF
    # final mixing so similar keys spread out
    h ^= h >> 16
    h = (h * 0x85EBCA6B) & 0xFFFFFFFF
    h ^= h >> 13
    h = (h * 0xC2B2AE35) & 0xFFFFFFFF
    h ^= h >> 16
    return h
`

const FNV_JS = `function fnv1a(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  // final mixing so similar keys spread out
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}
`

export const consistentHashing: SdLesson = {
  id: 'consistent-hashing',
  title: 'Consistent hashing',
  topic: 'Sharding and distributed caches',
  blurb: 'Spread data over many servers so that adding or removing a server moves only a small part of it.',
  why: {
    story: 'You have **3 cache servers** and decide which one stores a key with `hash(key) % 3`. It works until you add a fourth server: now the rule is `hash(key) % 4`, and **almost every key maps somewhere else**. Suddenly nearly every lookup misses, and all the traffic falls on the database at once. The same happens in reverse when a server dies. We need a way to add and remove servers while moving only about **1 / N** of the keys.',
    pains: ['With `hash % n`, changing `n` remaps almost every key.', 'A mass cache miss can knock over the database.', 'Rebalancing data between database shards becomes a huge, risky copy job.'],
  },
  before: {
    title: 'hash % n: adding a server reshuffles everything',
    nodes: [
      { id: 'app', label: 'App', kind: 'server', x: 12, y: 28 },
      { id: 'r', label: 'hash % 3', kind: 'lb', x: 38, y: 28 },
      { id: 'a', label: 'Cache A', kind: 'cache', x: 72, y: 10 },
      { id: 'b', label: 'Cache B', kind: 'cache', x: 72, y: 28 },
      { id: 'c', label: 'Cache C', kind: 'cache', x: 72, y: 46 },
      { id: 'd', label: 'Cache D', kind: 'cache', x: 92, y: 28, sub: 'new' },
    ],
    edges: [{ from: 'app', to: 'r' }, { from: 'r', to: 'a' }, { from: 'r', to: 'b' }, { from: 'r', to: 'c' }],
    frames: [
      { caption: 'Three cache servers. Each key is stored on `hash(key) % 3`.', active: ['r', 'a', 'b', 'c'], flow: [['app', 'r']] },
      { caption: 'We add Cache D, so the rule becomes `hash(key) % 4`.', active: ['r', 'd'], badges: { d: 'NEW' } },
      { caption: 'Now about **three out of four keys point to a different server** than before. They are not there, so they all miss.', bad: ['a', 'b', 'c'], badges: { a: 'MISS', b: 'MISS', c: 'MISS' } },
      { caption: 'Every miss goes to the database at the same moment: a **thundering herd** that can take it down.', bad: ['r'], badges: { r: 'DB FLOOD' } },
    ],
  },
  how: {
    title: 'Consistent hashing: servers and keys share one ring',
    nodes: [
      { id: 'app', label: 'App', kind: 'server', x: 12, y: 28 },
      { id: 'r', label: 'Hash ring', kind: 'lb', x: 38, y: 28, sub: 'finds the owner' },
      { id: 'a', label: 'Cache A', kind: 'cache', x: 72, y: 10 },
      { id: 'b', label: 'Cache B', kind: 'cache', x: 72, y: 28 },
      { id: 'c', label: 'Cache C', kind: 'cache', x: 72, y: 46 },
      { id: 'd', label: 'Cache D', kind: 'cache', x: 92, y: 28, sub: 'new' },
    ],
    edges: [{ from: 'app', to: 'r' }, { from: 'r', to: 'a' }, { from: 'r', to: 'b' }, { from: 'r', to: 'c' }, { from: 'r', to: 'd' }],
    frames: [
      { caption: 'Imagine a circle of numbers. Each **server** is placed on it at the hash of its name. Each **key** is placed at the hash of the key.', active: ['r'] },
      { caption: 'A key belongs to the **first server found clockwise** from its position. The key "alice" lands on Cache C.', active: ['app', 'r', 'c'], flow: [['app', 'r'], ['r', 'c']], badges: { c: 'owner' } },
      { caption: 'We add Cache D. It takes a spot on the circle and only claims the keys **between itself and the previous server**.', active: ['d'], badges: { d: 'NEW' } },
      { caption: 'All other keys stay exactly where they were: "alice" is still on Cache C and still hits.', active: ['r', 'c'], flow: [['r', 'c']], badges: { c: 'HIT' } },
      { caption: 'Only about **1 / N** of the keys moved (the ones D now owns). The database sees a small bump, not a flood.', active: ['d'], badges: { d: '~25% moved' } },
    ],
  },
  realWorld: [
    { name: 'Amazon Dynamo and DynamoDB', text: 'The Dynamo paper describes using consistent hashing to partition data across nodes. DynamoDB is built on those ideas.' },
    { name: 'Apache Cassandra', text: 'Cassandra places nodes on a token ring and assigns each row to the node that owns its token range. Virtual nodes spread each machine around the ring.' },
    { name: 'Distributed caches', text: 'Memcached clients and many cache clusters pick the server for a key with consistent hashing, so adding a cache node does not empty the whole cache.' },
    { name: 'Content delivery networks', text: 'CDNs and load balancers use the same technique to send requests for the same file to the same server, which keeps cache hit rates high.' },
  ],
  tradeoffs: {
    gain: ['Adding or removing a server moves only about 1 / N of the keys.', 'No central table of "which key lives where": any client can compute it.', 'Works well for caches and sharded databases that grow and shrink.'],
    cost: ['More complex than `hash % n`.', 'With few points per server, the load can be uneven (fixed with **virtual nodes**).', 'You still need replication and a plan for failed nodes.'],
    useWhen: ['Servers are added or removed often (auto scaling).', 'Data is spread over many cache or database nodes.', 'A mass cache miss would overload your backend.'],
    avoidWhen: ['The number of servers never changes.', 'A single database comfortably holds all your data.'],
  },
  steps: [
    {
      title: 'The simple way: hash modulo the server count',
      tag: 'slow',
      idea: 'Hash the key into a number and take the remainder when divided by the number of servers. It is one line and spreads keys evenly, but the answer changes for most keys whenever the server count changes.',
      walk: ['Compute `hash(key)`.', 'Use `hash % len(servers)` as the index of the server.', 'Add a server and the divisor changes, so most keys land on a different server.'],
      only: [],
      code: {
        python: `${FNV_PY}
class HashRing:
    def __init__(self, nodes, vnodes):
        self.nodes = list(nodes)

    def get(self, key):
        return self.nodes[fnv1a(key) % len(self.nodes)]

    def add(self, node):
        self.nodes.append(node)

    def remove(self, node):
        self.nodes.remove(node)
`,
        javascript: `${FNV_JS}
class HashRing {
  constructor(nodes, vnodes) {
    this.nodes = [...nodes];
  }

  get(key) {
    return this.nodes[fnv1a(key) % this.nodes.length];
  }

  add(node) {
    this.nodes.push(node);
  }

  remove(node) {
    this.nodes = this.nodes.filter((n) => n !== node);
  }
}
`,
      },
      time: 'O(1) per lookup',
      space: 'O(servers)',
      verdict: 'Fine for a fixed number of servers. Change the count and about **(N - 1) / N** of the keys move.',
    },
    {
      title: 'A hash ring with virtual nodes',
      tag: 'best',
      idea: 'Place each server on a ring of numbers (0 to 2³² - 1) at `hash("name#i")` for several `i`: these are its **virtual nodes**. To find a key\'s server, hash the key and walk **clockwise** to the first server point at or after it, wrapping around at the end. Keep the points in a sorted list and use binary search. Virtual nodes give each server many small slices of the ring, so the load is even.',
      walk: ['`add(node)`: for `i` in `0..vnodes-1`, add the point `(hash(node + "#" + i), node)` and keep the list sorted.', '`remove(node)`: delete all points of that node.', '`get(key)`: hash the key and binary-search for the first point whose position is >= the hash. If there is none, wrap to the first point.'],
      code: {
        python: `import bisect

${FNV_PY}
class HashRing:
    def __init__(self, nodes, vnodes):
        self.vnodes = vnodes
        self.points = []  # sorted list of (position, node)
        for node in nodes:
            self.add(node)

    def add(self, node):
        for i in range(self.vnodes):
            self.points.append((fnv1a(node + "#" + str(i)), node))
        self.points.sort()

    def remove(self, node):
        self.points = [p for p in self.points if p[1] != node]

    def get(self, key):
        positions = [p[0] for p in self.points]
        i = bisect.bisect_left(positions, fnv1a(key))
        return self.points[i % len(self.points)][1]
`,
        javascript: `${FNV_JS}
class HashRing {
  constructor(nodes, vnodes) {
    this.vnodes = vnodes;
    this.points = []; // sorted list of [position, node]
    for (const node of nodes) this.add(node);
  }

  add(node) {
    for (let i = 0; i < this.vnodes; i++) {
      this.points.push([fnv1a(node + "#" + i), node]);
    }
    this.points.sort((a, b) => a[0] - b[0]);
  }

  remove(node) {
    this.points = this.points.filter((p) => p[1] !== node);
  }

  get(key) {
    const h = fnv1a(key);
    let low = 0;
    let high = this.points.length;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (this.points[mid][0] < h) low = mid + 1;
      else high = mid;
    }
    return this.points[low % this.points.length][1];
  }
}
`,
      },
      time: 'O(log n) per lookup',
      space: 'O(servers × vnodes)',
      verdict: 'Adding a server only takes keys from its neighbours on the ring, so the other servers keep their data. Real systems store the ring and also **replicate** each key to the next few servers.',
    },
  ],
  sim: {
    id: 'hash-ring',
    intro: 'Squares are servers and dots are 30 keys, colour-coded by the server that owns them. Add or remove a server and compare how many keys move with the ring and with plain `hash % n`.',
    tryThis: ['Press **Add a server** a couple of times and watch the second counter: the ring moves far fewer keys than `hash % n`.', 'With 1 virtual node the split between servers is lumpy. Slide virtual nodes up to 10 or 20 and the key counts even out.', 'Remove a server: only the keys it owned move, to the next server clockwise.'],
  },
  practice: {
    fn: { python: 'simulate_ring', javascript: 'simulateRing' },
    symbol: { python: 'class HashRing', javascript: 'class HashRing' },
    driver: {
      python: `def simulate_ring(nodes, vnodes, keys, ops):
    ring = HashRing(nodes, vnodes)
    for op, node in ops:
        if op == "add":
            ring.add(node)
        else:
            ring.remove(node)
    return [ring.get(k) for k in keys]
`,
      javascript: `function simulateRing(nodes, vnodes, keys, ops) {
  const ring = new HashRing(nodes, vnodes);
  for (const [op, node] of ops) {
    if (op === "add") ring.add(node);
    else ring.remove(node);
  }
  return keys.map((k) => ring.get(k));
}
`,
    },
    starter: {
      python: `${FNV_PY}

class HashRing:
    def __init__(self, nodes, vnodes):
        # place each node on the ring \`vnodes\` times, at fnv1a(node + "#" + str(i))
        pass

    def add(self, node):
        pass

    def remove(self, node):
        pass

    def get(self, key):
        # the first point clockwise from fnv1a(key) (wrap around at the end)
        pass
`,
      javascript: `${FNV_JS}

class HashRing {
  constructor(nodes, vnodes) {
    // place each node on the ring \`vnodes\` times, at fnv1a(node + "#" + i)
  }

  add(node) {}

  remove(node) {}

  get(key) {
    // the first point clockwise from fnv1a(key) (wrap around at the end)
  }
}
`,
    },
    cases: [
      { label: 'three servers, one point each', args: [['A', 'B', 'C'], 1, ['alice', 'bob', 'carol', 'dave', 'erin', 'frank', 'grace', 'heidi', 'ivan', 'judy'], []], expected: ['C', 'C', 'A', 'A', 'C', 'C', 'C', 'B', 'C', 'C'] },
      { label: 'adding a server only steals some keys', args: [['A', 'B', 'C'], 1, ['alice', 'bob', 'carol', 'dave', 'erin', 'frank', 'grace', 'heidi', 'ivan', 'judy'], [['add', 'D']]], expected: ['C', 'C', 'A', 'A', 'C', 'C', 'C', 'B', 'C', 'D'] },
      { label: 'removing a server moves only its own keys', args: [['A', 'B', 'C'], 1, ['alice', 'bob', 'carol', 'dave', 'erin', 'frank', 'grace', 'heidi', 'ivan', 'judy'], [['remove', 'B']]], expected: ['C', 'C', 'A', 'A', 'C', 'C', 'C', 'A', 'C', 'C'] },
      { label: 'five virtual nodes per server', args: [['A', 'B', 'C'], 5, ['alice', 'bob', 'carol', 'dave', 'erin', 'frank', 'grace', 'heidi', 'ivan', 'judy'], []], expected: ['C', 'B', 'A', 'A', 'A', 'C', 'B', 'C', 'B', 'A'] },
      { label: 'virtual nodes plus a removal', args: [['A', 'B', 'C'], 5, ['alice', 'bob', 'carol', 'dave', 'erin', 'frank', 'grace', 'heidi', 'ivan', 'judy'], [['remove', 'B']]], expected: ['C', 'A', 'A', 'A', 'A', 'C', 'A', 'C', 'A', 'A'] },
      { label: 'virtual nodes plus an added server', args: [['A', 'B', 'C'], 5, ['alice', 'bob', 'carol', 'dave', 'erin', 'frank', 'grace', 'heidi', 'ivan', 'judy'], [['add', 'D']]], expected: ['C', 'D', 'A', 'D', 'A', 'C', 'B', 'C', 'B', 'D'] },
      { label: 'a single server owns everything', args: [['A'], 3, ['alice', 'bob', 'carol'], []], expected: ['A', 'A', 'A'] },
      { label: 'the same key always goes to the same server', args: [['A', 'B', 'C'], 3, ['alice', 'alice', 'bob'], []], expected: ['B', 'B', 'B'] },
    ],
    hints: ['Keep a **sorted list** of `(position, node)` points. Each node adds `vnodes` points at `fnv1a(node + "#" + i)`.', 'To find the owner, hash the key and find the first point whose position is >= that hash. Python: `bisect_left`. If you run past the end, wrap around to index 0.', '`remove` just deletes every point that belongs to the node. Do not move any other points.'],
  },
  quiz: [
    { q: 'You grow from 4 cache servers to 5 using `hash % n`. Roughly what share of keys move to a different server?', options: ['About 20%', 'About 80%', 'None'], answer: 1, why: 'With `hash % n` a key only stays put when both remainders happen to match, about 1 in 5 keys. So roughly 80% move. With consistent hashing only about 1/5 (20%) move.' },
    { q: 'What problem do virtual nodes solve?', options: ['They make hashing faster', 'They even out the load, because each server owns many small slices of the ring', 'They remove the need for replication'], answer: 1, why: 'With one point per server, the gaps between points can be very unequal, so one server may own much more than the others. Many virtual nodes average this out.' },
    { q: 'A server on the ring dies. What happens to its keys?', options: ['All keys on all servers move', 'They move to the next server clockwise; other keys stay', 'They are lost forever'], answer: 1, why: 'Its points disappear, so keys that belonged to it now find the next server clockwise. Without replication the data on the dead server is gone, which is why real systems keep copies.' },
  ],
  interview: [
    { q: 'Why not just use hash(key) % n to pick a shard?', a: 'It is simple and even, but when `n` changes almost every key maps to a new shard. For a cache that means a mass miss; for a database it means moving most of the data. Consistent hashing changes the mapping for only about 1/N of keys when a node joins or leaves.' },
    { q: 'How does consistent hashing deal with hot spots and uneven load?', a: 'Use many **virtual nodes** per server so the ring is divided into lots of small slices, and give bigger machines more virtual nodes. For one extremely hot key, hashing alone cannot help: replicate or cache that key, or split it.' },
    { q: 'How would you add replication on a hash ring?', a: 'Store each key on the owner **and the next R - 1 distinct servers** clockwise (skipping other virtual nodes of the same machine). Reads can then be served by any replica, and a failed node\'s data still exists elsewhere.' },
  ],
  mistakes: ['Using too few virtual nodes, so one server gets far more keys than the others.', 'Choosing a poor hash function whose outputs cluster (similar keys end up on the same server).', 'Forgetting to wrap around when the key hashes past the last point on the ring.', 'No replication: consistent hashing alone does not protect data from a failed node.'],
  recap: 'Put servers and keys on the same ring and give each key to the next server clockwise, so a server joining or leaving moves only a small slice of the data.',
}
