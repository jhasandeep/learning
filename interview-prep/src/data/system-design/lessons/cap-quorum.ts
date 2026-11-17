import type { SdLesson } from '../types'

export const capQuorum: SdLesson = {
  id: 'cap-quorum',
  title: 'CAP theorem and quorums',
  topic: 'Consistency vs availability',
  blurb: 'When the network splits, a distributed system must choose between answering and being correct. Learn quorum reads, the practical answer.',
  why: {
    story: 'The moment data lives on more than one machine, **networks can fail**: some machines cannot talk to others (a **partition**). The **CAP theorem** says that during a partition you can have only one of two things: **Consistency** (every read sees the latest write, or an error) or **Availability** (every request gets an answer, even if it may be old). Partition tolerance is not optional, because networks do fail. So real systems choose **CP** (refuse some requests to stay correct) or **AP** (always answer, maybe with stale data). A **quorum** lets you tune that choice.',
    pains: ['A network split leaves two groups of servers that cannot agree.', 'Answering from a stale copy can show wrong balances or stock.', 'Refusing to answer makes the service look down.', 'Reading and writing to every replica is slow and breaks when one is down.'],
  },
  before: {
    title: 'A partition forces a choice',
    nodes: [
      { id: 'a', label: 'Replica A', kind: 'db', x: 14, y: 28, sub: 'x = 5' },
      { id: 'b', label: 'Replica B', kind: 'db', x: 50, y: 28, sub: 'x = 5' },
      { id: 'c', label: 'Replica C', kind: 'db', x: 86, y: 28, sub: 'x = 5' },
    ],
    edges: [{ from: 'a', to: 'b', label: 'link' }, { from: 'b', to: 'c', label: 'link' }],
    frames: [
      { caption: 'Three replicas all hold `x = 5`. Everything is consistent and available.', active: ['a', 'b', 'c'] },
      { caption: 'The link to replica C breaks: a **network partition**. C is alive but cannot hear A and B.', bad: ['c'], badges: { c: 'CUT OFF' } },
      { caption: 'A client writes `x = 9` to A. It reaches A and B, but not C.', active: ['a', 'b'], flow: [['a', 'b']], badges: { a: 'x = 9', b: 'x = 9' } },
      { caption: 'Now a client reads from C. **CP**: C refuses (error) to avoid returning the old 5. **AP**: C answers 5 (stale) to stay available. You cannot have both.', active: ['c'], bad: ['c'], badges: { c: 'x = 5?' } },
    ],
  },
  how: {
    title: 'Quorum: read and write to enough replicas',
    nodes: [
      { id: 'cl', label: 'Client', kind: 'client', x: 10, y: 28 },
      { id: 'a', label: 'Replica A', kind: 'db', x: 52, y: 8, sub: 'v2 new' },
      { id: 'b', label: 'Replica B', kind: 'db', x: 52, y: 28, sub: 'v2 new' },
      { id: 'c', label: 'Replica C', kind: 'db', x: 52, y: 48, sub: 'v1 old' },
    ],
    edges: [{ from: 'cl', to: 'a' }, { from: 'cl', to: 'b' }, { from: 'cl', to: 'c' }],
    frames: [
      { caption: 'There are **N = 3** replicas. A write is confirmed once **W = 2** of them have it. Here A and B have version 2; C missed it.', active: ['a', 'b'], flow: [['cl', 'a'], ['cl', 'b']], badges: { a: 'W OK', b: 'W OK' } },
      { caption: 'A read asks **R = 2** replicas. It might hear from B and C: versions 2 and 1.', active: ['b', 'c'], flow: [['b', 'cl'], ['c', 'cl']] },
      { caption: 'The client takes the answer with the **highest version**: version 2. A stale replica is outvoted.', active: ['cl'], badges: { cl: 'v2' } },
      { caption: 'The rule `R + W > N` (2 + 2 > 3) guarantees that every read overlaps with at least one replica that saw the latest write. If fewer than R replicas answer, the read fails: that is the CP choice.', active: ['cl'] },
    ],
  },
  tabs: ['The CAP choice', 'Quorum'],
  sim: {
    id: 'quorum',
    intro: 'Choose R and W, take replicas down, then write and read. See when reads are fresh, stale or refused.',
    tryThis: ['Set N=3, W=2, R=2, write a value and read it: always fresh.', 'Set W=1 and R=1: fast, but reads can be stale.', 'Take two replicas down with R=2: the read is refused (consistency over availability).'],
  },
  realWorld: [
    { name: 'Cassandra and DynamoDB', text: 'Let you choose consistency per request: for example `ONE`, `QUORUM` or `ALL` (R and W settings).' },
    { name: 'Banks and ticket booking (CP)', text: 'Better to show an error than a wrong balance or sell the same seat twice.' },
    { name: 'Likes, view counts, feeds (AP)', text: 'It is fine if a like count is a few seconds late; the page must stay up.' },
    { name: 'ZooKeeper, etcd, Raft', text: 'Consensus systems are CP: they stop accepting writes when a majority cannot be reached.' },
  ],
  tradeoffs: {
    gain: ['Tunable balance between safety and speed.', 'Tolerates some failed replicas.', 'Simple rule: `R + W > N` means strongly consistent reads.'],
    cost: ['Higher R or W means slower requests and less availability.', 'Quorums do not remove all anomalies (concurrent writes need version vectors or timestamps).', 'More replicas increase cost.'],
    useWhen: ['CP: money, inventory, locks, configuration.', 'AP: social feeds, counters, carts, caches.'],
    avoidWhen: ['Never promise "all three" of consistency, availability and partition tolerance.'],
  },
  steps: [
    {
      title: 'Ask the first replica that answers',
      tag: 'slow',
      idea: 'The fastest read takes the first replica that is up. It is available, but the first replica may be behind, so the answer can be stale.',
      walk: ['Each response is `[version, value]`, or `None` if the replica is unreachable.', 'Return the value of the first reachable replica.', 'If none is reachable, return "unavailable".'],
      only: [0, 3, 5],
      code: {
        python: `def quorum_read(responses, r):
    for resp in responses:
        if resp is not None:
            return resp[1]
    return "unavailable"
`,
        javascript: `function quorumRead(responses, r) {
  for (const resp of responses) {
    if (resp !== null) return resp[1];
  }
  return "unavailable";
}
`,
      },
      time: 'O(replicas)',
      space: 'O(1)',
      verdict: 'Available, but possibly stale. Add a quorum requirement and compare versions.',
    },
    {
      title: 'Require R answers and take the newest version',
      tag: 'best',
      idea: 'Collect the replies that arrived. If **fewer than R** replicas answered, refuse: we cannot guarantee freshness. Otherwise return the value with the **highest version number**. Combined with `R + W > N` on writes, this always returns the latest acknowledged write.',
      walk: ['Keep only reachable responses.', 'If there are fewer than `r`, return "unavailable".', 'Return the value belonging to the largest version.'],
      code: {
        python: `def quorum_read(responses, r):
    alive = [resp for resp in responses if resp is not None]
    if len(alive) < r:
        return "unavailable"
    return max(alive, key=lambda resp: resp[0])[1]
`,
        javascript: `function quorumRead(responses, r) {
  const alive = responses.filter((resp) => resp !== null);
  if (alive.length < r) return "unavailable";
  return alive.reduce((best, resp) => (resp[0] > best[0] ? resp : best))[1];
}
`,
      },
      time: 'O(replicas)',
      space: 'O(replicas)',
      verdict: 'Real systems also repair the stale replicas afterwards (read repair) and resolve concurrent writes with version vectors.',
    },
  ],
  practice: {
    fn: { python: 'quorum_read', javascript: 'quorumRead' },
    starter: {
      python: `def quorum_read(responses, r):
    # responses: one entry per replica, either [version, value] or None (unreachable).
    # If fewer than r replicas answered, return "unavailable".
    # Otherwise return the value with the highest version.
    pass
`,
      javascript: `function quorumRead(responses, r) {
  // responses: one entry per replica, either [version, value] or null (unreachable).
  // If fewer than r replicas answered, return "unavailable".
  // Otherwise return the value with the highest version.
}
`,
    },
    cases: [
      { label: 'all replicas agree', args: [[[2, 'new'], [2, 'new'], [2, 'new']], 2], expected: 'new' },
      { label: 'the newest version wins over a stale replica', args: [[[1, 'old'], [2, 'new'], [2, 'new']], 2], expected: 'new' },
      { label: 'too few replicas answered', args: [[null, null, [1, 'x']], 2], expected: 'unavailable' },
      { label: 'a single replica with r = 1', args: [[[1, 'a']], 1], expected: 'a' },
      { label: 'a down replica is ignored when a quorum is still reached', args: [[[1, 'old'], [2, 'new'], null], 2], expected: 'new' },
      { label: 'every replica is down', args: [[null, null, null], 1], expected: 'unavailable' },
    ],
    hints: ['Throw away the `None` / `null` responses first.', 'If fewer than `r` remain, return "unavailable".', 'Otherwise pick the response with the largest version and return its value.'],
  },
  quiz: [
    { q: 'A payments service must never show a wrong balance, even if it means errors during a network split. Which choice is this?', options: ['CP', 'AP', 'Neither'], answer: 0, why: 'It sacrifices availability (returns errors) to preserve consistency.' },
    { q: 'With N = 5 replicas, which settings guarantee fresh reads?', options: ['W = 2, R = 2', 'W = 3, R = 3', 'W = 1, R = 1'], answer: 1, why: 'R + W must be greater than N: 3 + 3 = 6 > 5, so every read overlaps the latest write.' },
    { q: 'Why is "CA without partition tolerance" not a realistic choice for distributed systems?', options: ['Because partitions happen in real networks, so you must handle them', 'Because CA is faster', 'Because databases cannot store data'], answer: 0, why: 'Networks fail. Once data is on several machines, partition tolerance is a given, and the real choice is between C and A during a partition.' },
  ],
  interview: [
    { q: 'Explain the CAP theorem.', a: 'In a distributed data store, during a **network partition** you must choose between **consistency** (every read gets the latest write or an error) and **availability** (every request gets a non-error answer). Partition tolerance is required in practice, so systems are CP or AP. Without a partition you can have both consistency and availability.' },
    { q: 'What do N, R and W mean in a quorum system?', a: '**N** is the number of replicas, **W** is how many must acknowledge a write, **R** is how many must answer a read. If `R + W > N`, a read set always overlaps a write set, so reads see the latest write. Lower values give lower latency and higher availability with weaker guarantees.' },
    { q: 'What is eventual consistency?', a: 'If no new updates arrive, all replicas will **eventually** hold the same value. In between, reads can be stale. It is the model of many AP systems (DNS, Dynamo-style stores) and suits data where small delays are acceptable.' },
  ],
  mistakes: ['Saying "my system is CA".', 'Using eventual consistency for money or stock.', 'Setting W = N, so one failed replica blocks all writes.', 'Forgetting that concurrent writes need a conflict rule (last write wins, version vectors).'],
  recap: 'During a network partition you choose consistency or availability; quorums (R + W > N) let you tune the balance.',
}
