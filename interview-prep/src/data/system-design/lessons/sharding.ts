import type { SdLesson } from '../types'

export const sharding: SdLesson = {
  id: 'sharding',
  title: 'Sharding and partitioning',
  topic: 'Splitting a huge database',
  blurb: 'When one database cannot hold or serve all the data, split it into pieces. Learn range, hash and directory strategies.',
  why: {
    story: 'One database server has limits: disk size, memory and how many queries it can answer per second. You can buy a bigger machine for a while, but eventually you must **split the data** across several machines. Each piece is a **shard** (or partition). The key question is: given a record, **which shard holds it?** The rule you choose decides how evenly the load is spread and how painful growth will be.',
    pains: ['The table no longer fits on one disk.', 'One machine cannot handle all the reads and writes.', 'Backups and index builds take longer every month.', 'A badly chosen split puts most traffic on a single "hot" shard.'],
  },
  before: {
    title: 'One big database',
    nodes: [
      { id: 'app', label: 'Application', kind: 'server', x: 14, y: 28 },
      { id: 'db', label: 'One database', kind: 'db', x: 70, y: 28, sub: '500 M users' },
    ],
    edges: [{ from: 'app', to: 'db' }],
    frames: [
      { caption: 'All users, orders and messages live in one database server.', active: ['app', 'db'], flow: [['app', 'db']] },
      { caption: 'Growth hits the limits of the disk, memory and CPU of that one machine. Upgrading it is expensive and has a ceiling.', bad: ['db'], badges: { db: 'FULL' } },
    ],
  },
  how: {
    title: 'Sharded database with a router',
    nodes: [
      { id: 'app', label: 'Application', kind: 'server', x: 10, y: 28 },
      { id: 'r', label: 'Shard router', kind: 'gateway', x: 38, y: 28, sub: 'key to shard' },
      { id: 's0', label: 'Shard 0', kind: 'db', x: 78, y: 8, sub: 'A to H' },
      { id: 's1', label: 'Shard 1', kind: 'db', x: 78, y: 28, sub: 'I to P' },
      { id: 's2', label: 'Shard 2', kind: 'db', x: 78, y: 48, sub: 'Q to Z' },
    ],
    edges: [{ from: 'app', to: 'r' }, { from: 'r', to: 's0' }, { from: 'r', to: 's1' }, { from: 'r', to: 's2' }],
    frames: [
      { caption: 'The data is split into **shards**, each on its own server, so each holds and serves a fraction of the data.', active: ['s0', 's1', 's2'] },
      { caption: 'A request for user `maya` reaches the router, which applies the sharding rule to the **shard key**.', active: ['app', 'r'], flow: [['app', 'r']] },
      { caption: 'The rule says `maya` belongs to shard 1, so only that server is contacted.', active: ['r', 's1'], flow: [['r', 's1']], badges: { r: 'SHARD 1' } },
      { caption: 'Each shard now handles a third of the data and traffic. Add more shards to grow further.', active: ['s0', 's1', 's2'] },
    ],
  },
  realWorld: [
    { name: 'Instagram and Pinterest', text: 'Shard their relational databases by user or object ID so each server holds a slice of all users.' },
    { name: 'MongoDB, Cassandra, DynamoDB', text: 'Built-in partitioning: you choose a **partition key** and the system spreads the data (usually by hash).' },
    { name: 'Vitess (YouTube)', text: 'A layer that shards MySQL and routes queries, so applications mostly do not notice.' },
    { name: 'Range, hash, directory', text: '**Range**: key ranges per shard (good for range queries, risk of hot spots). **Hash**: hash the key then take a remainder (even spread, bad for range queries). **Directory**: a lookup table says where each key lives (flexible, but the table is a new dependency).' },
  ],
  tradeoffs: {
    gain: ['Scales storage and throughput almost without limit.', 'Each shard is smaller, faster to back up and to index.', 'A failure affects only one shard.'],
    cost: ['Queries across shards (joins, totals) are slow and complex.', 'Transactions across shards are hard.', 'Re-sharding (changing the number of shards) moves a lot of data; consistent hashing reduces this.', 'Bad shard keys create hot spots.'],
    useWhen: ['The data or traffic no longer fits one machine, even after replicas and caching.'],
    avoidWhen: ['Early on: first try indexes, caching, read replicas and a bigger machine. Sharding is a one-way door.'],
  },
  steps: [
    {
      title: 'Range: each shard owns a span of keys',
      tag: 'idea',
      idea: 'Give each shard an upper limit. A key goes to the first shard whose limit is at least the key; keys above all limits go to the last shard. Range queries stay on few shards, but if most new keys are at the top (like increasing ids), the last shard becomes hot.',
      walk: ['`config` is a list of upper bounds, for example `[100, 200]` means shard 0 is 0 to 100, shard 1 is 101 to 200, shard 2 is above.', 'Return the index of the first bound that is at least the key.', 'If none is, return the last shard (the number of bounds).'],
      only: [0, 1, 2, 3],
      code: {
        python: `def shard_for(strategy, key, config):
    if strategy == "range":
        for i, upper in enumerate(config):
            if key <= upper:
                return i
        return len(config)
    return 0
`,
        javascript: `function shardFor(strategy, key, config) {
  if (strategy === "range") {
    for (let i = 0; i < config.length; i++) {
      if (key <= config[i]) return i;
    }
    return config.length;
  }
  return 0;
}
`,
      },
      time: 'O(shards)',
      space: 'O(shards)',
      verdict: 'Good for range scans, but sequential keys can overload one shard. Next: spread keys evenly with a hash.',
    },
    {
      title: 'Hash and directory, plus range',
      tag: 'best',
      idea: '**Hash**: turn the key into a number and take the remainder by the number of shards, so keys spread evenly (`config` is the shard count; we use the sum of character codes to keep the example simple, real systems use a good hash). **Directory**: look the key up in a table (`config` is a map); unknown keys go to shard 0.',
      walk: ['range: as before.', 'hash: `sum of character codes % number of shards`.', 'directory: look the key up in the map, default 0.'],
      code: {
        python: `def shard_for(strategy, key, config):
    if strategy == "range":
        for i, upper in enumerate(config):
            if key <= upper:
                return i
        return len(config)
    if strategy == "hash":
        return sum(ord(c) for c in key) % config
    if strategy == "directory":
        return config.get(key, 0)
    raise ValueError("unknown strategy")
`,
        javascript: `function shardFor(strategy, key, config) {
  if (strategy === "range") {
    for (let i = 0; i < config.length; i++) {
      if (key <= config[i]) return i;
    }
    return config.length;
  }
  if (strategy === "hash") {
    let sum = 0;
    for (const ch of key) sum += ch.charCodeAt(0);
    return sum % config;
  }
  if (strategy === "directory") {
    return key in config ? config[key] : 0;
  }
  throw new Error("unknown strategy");
}
`,
      },
      time: 'O(1) for hash and directory',
      space: 'O(keys) for the directory',
      verdict: 'Plain modulo hashing reshuffles almost every key when the shard count changes. That is why large systems use **consistent hashing** (see that lesson).',
    },
  ],
  sim: {
    id: 'shard',
    intro: 'Insert users and watch where each strategy puts them. Compare how evenly the shards fill up.',
    tryThis: ['Use **Hash** and add many users: the shards fill evenly.', 'Switch to **Range** and add users named in alphabetical order: one shard grows faster.', 'Change the shard count with hashing and see how many keys would move.'],
  },
  practice: {
    fn: { python: 'shard_for', javascript: 'shardFor' },
    starter: {
      python: `def shard_for(strategy, key, config):
    # strategy "range": key is a number, config is a sorted list of upper bounds.
    #   return the index of the first bound >= key (or len(config) if none).
    # strategy "hash": key is a string, config is the number of shards.
    #   return (sum of character codes) % config.
    # strategy "directory": config maps keys to shards; unknown keys go to 0.
    pass
`,
      javascript: `function shardFor(strategy, key, config) {
  // strategy "range": key is a number, config is a sorted list of upper bounds.
  //   return the index of the first bound >= key (or config.length if none).
  // strategy "hash": key is a string, config is the number of shards.
  //   return (sum of character codes) % config.
  // strategy "directory": config maps keys to shards; unknown keys go to 0.
}
`,
    },
    cases: [
      { label: 'range: a key in the first span', args: ['range', 50, [100, 200]], expected: 0 },
      { label: 'range: a key in the middle span', args: ['range', 150, [100, 200]], expected: 1 },
      { label: 'range: a key exactly on a bound belongs to that shard', args: ['range', 200, [100, 200]], expected: 1 },
      { label: 'range: a key above every bound goes to the last shard', args: ['range', 201, [100, 200]], expected: 2 },
      { label: 'hash: "abc" over 4 shards', args: ['hash', 'abc', 4], expected: 2 },
      { label: 'hash: "abc" over 3 shards', args: ['hash', 'abc', 3], expected: 0 },
      { label: 'hash: "ab" over 4 shards', args: ['hash', 'ab', 4], expected: 3 },
      { label: 'directory: a known key', args: ['directory', 'bob', { alice: 2, bob: 1 }], expected: 1 },
      { label: 'directory: an unknown key goes to shard 0', args: ['directory', 'zed', { alice: 2, bob: 1 }], expected: 0 },
    ],
    hints: ['Handle each strategy in its own branch.', 'Range: walk the bounds and return the first index where `key <= bound`; if you run out, return the number of bounds.', 'Hash: add up the character codes of the key and take `% config`.'],
  },
  quiz: [
    { q: 'You shard users by sign-up date range. What problem is likely?', options: ['Queries for old users are impossible', 'The newest shard receives all new traffic (a hot shard)', 'The database cannot store dates'], answer: 1, why: 'Sequential keys concentrate new writes on the last range. Hashing spreads them out.' },
    { q: 'What is lost when you use hash sharding?', options: ['Even distribution', 'Cheap range queries (all users between A and C)', 'The ability to add shards'], answer: 1, why: 'Hashing scatters neighbouring keys, so a range query must ask every shard.' },
    { q: 'You change from 4 to 5 shards using `hash % n`. What happens?', options: ['Nothing moves', 'Most keys now map to a different shard', 'Only one key moves'], answer: 1, why: 'The remainder changes for most keys. Consistent hashing limits the movement.' },
  ],
  interview: [
    { q: 'How do you choose a shard key?', a: 'Choose a key with **high cardinality** (many different values), that **spreads load evenly** and that most queries include, so each query touches one shard. For a social app that is often the user id. Avoid keys like country or status, which create hot shards.' },
    { q: 'How do you handle a query that needs data from many shards?', a: 'Avoid it by design where possible (denormalise, or choose the key so related data sits together). Otherwise do **scatter-gather**: ask all shards in parallel and merge the results, accepting higher latency, or pre-compute the answer into a separate store.' },
    { q: 'What is the difference between sharding and partitioning?', a: 'Partitioning means splitting data into parts, often inside one database. Sharding is partitioning where the parts live on **different machines**. People use the words almost interchangeably when talking about scale.' },
  ],
  mistakes: ['Sharding too early, before trying replicas, caching and indexes.', 'Choosing a low-cardinality or monotonic shard key.', 'Using `hash % n` without a plan for adding shards.', 'Designing queries and transactions that always span shards.'],
  recap: 'Sharding splits data across machines using a shard key; range, hash and directory rules each trade evenness against query flexibility.',
}
