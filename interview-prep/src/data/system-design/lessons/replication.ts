import type { SdLesson } from '../types'

export const replication: SdLesson = {
  id: 'replication',
  title: 'Replication',
  topic: 'Many copies of the same data',
  blurb: 'Keep copies of your database on several machines for speed and safety, and learn what replication lag means.',
  why: {
    story: 'If your only database server dies, you lose your service (and maybe your data). If it is busy, every reader waits. **Replication** keeps **copies** of the data on several servers. The usual design has one **leader** that accepts writes and several **followers** that copy those writes. Reads can go to any copy, and if the leader fails a follower takes over. The catch: copying takes time, so a follower may briefly be **behind** the leader. That delay is **replication lag**.',
    pains: ['One database server is a single point of failure.', 'Read-heavy apps overload a single server.', 'Users far away are slow to read from a distant database.', 'Disk failure can mean permanent data loss.'],
  },
  before: {
    title: 'A single database',
    nodes: [
      { id: 'app', label: 'Application', kind: 'server', x: 14, y: 28 },
      { id: 'db', label: 'Database', kind: 'db', x: 72, y: 28, sub: 'only copy' },
    ],
    edges: [{ from: 'app', to: 'db' }],
    frames: [
      { caption: 'All reads and writes go to one server.', active: ['app', 'db'], flow: [['app', 'db']] },
      { caption: 'If it crashes, the whole application is down and the data may be lost.', bad: ['db'], badges: { db: 'DOWN' } },
    ],
  },
  how: {
    title: 'Leader and followers',
    nodes: [
      { id: 'app', label: 'Application', kind: 'server', x: 10, y: 28 },
      { id: 'l', label: 'Leader', kind: 'db', x: 46, y: 28, sub: 'takes writes' },
      { id: 'f1', label: 'Follower 1', kind: 'db', x: 84, y: 12, sub: 'serves reads' },
      { id: 'f2', label: 'Follower 2', kind: 'db', x: 84, y: 44, sub: 'serves reads' },
    ],
    edges: [{ from: 'app', to: 'l' }, { from: 'l', to: 'f1' }, { from: 'l', to: 'f2' }, { from: 'app', to: 'f1' }],
    frames: [
      { caption: '**Write:** the application sends every write to the **leader**.', active: ['app', 'l'], flow: [['app', 'l']], badges: { l: 'WRITE' } },
      { caption: 'The leader records the change in a **log** and sends it to the followers.', active: ['l', 'f1', 'f2'], flow: [['l', 'f1'], ['l', 'f2']] },
      { caption: '**Read:** the application can read from any follower, spreading the read load.', active: ['app', 'f1'], flow: [['app', 'f1']] },
      { caption: 'Because copying takes time, a follower read right after a write can return **old data** (replication lag).', active: ['f2'], bad: ['f2'], badges: { f2: 'STALE' } },
      { caption: 'If the leader fails, a follower is **promoted** to leader (failover) and service continues.', active: ['f1'], badges: { f1: 'NEW LEADER' } },
    ],
  },
  realWorld: [
    { name: 'MySQL, PostgreSQL, SQL Server', text: 'Support leader-follower (primary-replica) replication; read replicas are a common first step to scale reads.' },
    { name: 'Amazon RDS and Aurora', text: 'Offer read replicas and automatic failover to a standby in another data centre.' },
    { name: 'MongoDB replica sets', text: 'A set of nodes elects a primary automatically if the current one fails.' },
    { name: 'Synchronous vs asynchronous', text: '**Synchronous** replication waits for followers before confirming a write (safe, slower). **Asynchronous** confirms immediately and copies later (fast, but recent writes can be lost on a crash and followers lag).' },
  ],
  tradeoffs: {
    gain: ['Survives machine failures.', 'Scales reads by adding followers.', 'Data can be placed near users in other regions.'],
    cost: ['Followers can return stale data.', 'Writes still go through one leader, so write scale is not improved.', 'Failover needs care to avoid two leaders at once (split brain).'],
    useWhen: ['Almost every production database.', 'Read-heavy workloads.'],
    avoidWhen: ['When you must scale writes: use sharding too.', 'When a read must always see the latest write: read from the leader.'],
  },
  steps: [
    {
      title: 'One node only',
      tag: 'slow',
      idea: 'A store with a single copy is simple: every read and write uses the same data. It never returns stale data, but there is only one copy.',
      walk: ['`write` stores the value in the one data dict.', '`read` always returns from it, whichever replica was asked.', '`sync` does nothing.'],
      only: [2, 3, 4],
      code: {
        python: `class Cluster:
    def __init__(self, followers):
        self.data = {}

    def write(self, key, value):
        self.data[key] = value

    def sync(self):
        pass

    def read(self, replica, key):
        return self.data.get(key)
`,
        javascript: `class Cluster {
  constructor(followers) {
    this.data = new Map();
  }

  write(key, value) {
    this.data.set(key, value);
  }

  sync() {}

  read(replica, key) {
    return this.data.has(key) ? this.data.get(key) : null;
  }
}
`,
      },
      time: 'O(1)',
      space: 'O(keys)',
      verdict: 'No failure protection and no read scaling. Add copies.',
    },
    {
      title: 'Leader writes, followers copy later',
      tag: 'best',
      idea: 'Replica `0` is the leader, replicas `1..n` are followers. A write changes the leader at once and is appended to a **log** of pending changes. `sync` replays the pending log on every follower (asynchronous replication). A read looks only at the chosen replica, so a follower can lag behind until the next sync.',
      walk: ['`write`: update the leader and append `(key, value)` to the log.', '`sync`: apply every logged change, in order, to every follower, then clear the log.', '`read(replica, key)`: look in that replica\'s own data only.'],
      code: {
        python: `class Cluster:
    def __init__(self, followers):
        self.nodes = [{} for _ in range(followers + 1)]  # node 0 is the leader
        self.log = []

    def write(self, key, value):
        self.nodes[0][key] = value
        self.log.append((key, value))

    def sync(self):
        for key, value in self.log:
            for node in self.nodes[1:]:
                node[key] = value
        self.log = []

    def read(self, replica, key):
        return self.nodes[replica].get(key)
`,
        javascript: `class Cluster {
  constructor(followers) {
    this.nodes = Array.from({ length: followers + 1 }, () => new Map()); // node 0 is the leader
    this.log = [];
  }

  write(key, value) {
    this.nodes[0].set(key, value);
    this.log.push([key, value]);
  }

  sync() {
    for (const [key, value] of this.log) {
      for (const node of this.nodes.slice(1)) node.set(key, value);
    }
    this.log = [];
  }

  read(replica, key) {
    const node = this.nodes[replica];
    return node.has(key) ? node.get(key) : null;
  }
}
`,
      },
      time: 'write O(1), sync O(pending x followers)',
      space: 'O(keys x copies)',
      verdict: 'This shows replication lag: between `write` and `sync`, followers are stale. Real systems also handle failover and leader election.',
    },
  ],
  sim: {
    id: 'replication',
    intro: 'Write to the leader and read from different replicas. Turn replication on and off to see lag.',
    tryThis: ['Write a value, then read it from a follower right away: stale or missing.', 'Wait for replication to catch up, then read again.', 'Crash the leader and watch a follower take over.'],
  },
  practice: {
    fn: { python: 'simulate_replication', javascript: 'simulateReplication' },
    symbol: { python: 'class Cluster', javascript: 'class Cluster' },
    driver: {
      python: `def simulate_replication(followers, ops):
    cluster = Cluster(followers)
    out = []
    for op in ops:
        if op[0] == "write":
            cluster.write(op[1], op[2])
        elif op[0] == "sync":
            cluster.sync()
        else:
            out.append(cluster.read(op[2], op[1]))
    return out
`,
      javascript: `function simulateReplication(followers, ops) {
  const cluster = new Cluster(followers);
  const out = [];
  for (const op of ops) {
    if (op[0] === "write") cluster.write(op[1], op[2]);
    else if (op[0] === "sync") cluster.sync();
    else {
      const v = cluster.read(op[2], op[1]);
      out.push(v === undefined ? null : v);
    }
  }
  return out;
}
`,
    },
    starter: {
      python: `class Cluster:
    def __init__(self, followers):
        # replica 0 is the leader, replicas 1..followers are followers
        pass

    def write(self, key, value):
        # writes go to the leader and are queued for the followers
        pass

    def sync(self):
        # copy all queued writes, in order, to every follower
        pass

    def read(self, replica, key):
        # read from that replica only; return None if it has no such key
        pass
`,
      javascript: `class Cluster {
  constructor(followers) {
    // replica 0 is the leader, replicas 1..followers are followers
  }

  write(key, value) {
    // writes go to the leader and are queued for the followers
  }

  sync() {
    // copy all queued writes, in order, to every follower
  }

  read(replica, key) {
    // read from that replica only; return null if it has no such key
  }
}
`,
    },
    cases: [
      { label: 'a follower is stale until sync', args: [1, [['write', 'a', 1], ['read', 'a', 0], ['read', 'a', 1], ['sync'], ['read', 'a', 1]]], expected: [1, null, 1] },
      { label: 'all followers catch up after sync', args: [2, [['write', 'a', 1], ['sync'], ['write', 'a', 2], ['read', 'a', 1], ['read', 'a', 0], ['sync'], ['read', 'a', 2]]], expected: [1, 2, 2] },
      { label: 'a missing key reads as null', args: [1, [['read', 'x', 0], ['read', 'x', 1]]], expected: [null, null] },
      { label: 'the leader always has the latest write', args: [1, [['write', 'a', 5], ['read', 'a', 0]]], expected: [5] },
      { label: 'overwrites replay in order', args: [1, [['write', 'a', 1], ['write', 'a', 2], ['sync'], ['read', 'a', 1]]], expected: [2] },
      { label: 'sync with nothing pending changes nothing', args: [2, [['sync'], ['write', 'k', 9], ['read', 'k', 2], ['sync'], ['read', 'k', 2]]], expected: [null, 9] },
    ],
    hints: ['Keep a list of nodes (each its own dict); index 0 is the leader.', 'On `write`, change only the leader and remember the change in a log.', 'On `sync`, replay the log on every follower and clear it. `read` looks only at the chosen node.'],
  },
  quiz: [
    { q: 'A user updates their profile, refreshes, and sees the old data. A likely cause?', options: ['The read went to a follower that has not caught up (replication lag)', 'The leader has too much memory', 'The CDN is down'], answer: 0, why: 'Asynchronous replication means followers lag. Reading your own writes from the leader avoids it.' },
    { q: 'Does adding read replicas increase write capacity?', options: ['Yes, a lot', 'No, all writes still go through the leader', 'Only with HTTPS'], answer: 1, why: 'Replicas scale reads. To scale writes you need sharding.' },
    { q: 'What is the safest but slowest replication mode?', options: ['Asynchronous', 'Synchronous', 'None'], answer: 1, why: 'Synchronous replication waits for followers to confirm before acknowledging a write, so no acknowledged write is lost, but writes are slower.' },
  ],
  interview: [
    { q: 'Replication vs sharding: what is the difference?', a: '**Replication** keeps full **copies** of the same data on several machines for availability and read scaling. **Sharding** splits the data so each machine holds a **different part** for storage and write scaling. Large systems use both: each shard is itself replicated.' },
    { q: 'What is replication lag and how do you deal with it?', a: 'The delay before a write on the leader appears on a follower. Mitigate by reading from the leader for data the user just wrote (**read-your-writes**), routing a user\'s reads consistently to one replica, or using synchronous or quorum replication for critical data.' },
    { q: 'What happens when the leader fails?', a: 'The system detects the failure (heartbeats), **elects** the most up-to-date follower as the new leader and redirects writes to it. Risks: lost writes that had not replicated, and **split brain** (two leaders) if the old one comes back, so use fencing or consensus (Raft, Paxos).' },
  ],
  mistakes: ['Assuming a follower read always shows the latest write.', 'Expecting replicas to speed up writes.', 'Failover without preventing two leaders.', 'Keeping all replicas in one rack or data centre.'],
  recap: 'Replication keeps copies for availability and read speed; asynchronous copies lag behind the leader.',
}
