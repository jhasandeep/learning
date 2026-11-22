import type { SpotSet } from './types'

// Design docs rather than code: each line is one decision; find the flawed one.
export const systemDesign: SpotSet = {
  id: 'system-design',
  bugs: [
    {
      id: 'sticky-memory',
      title: 'Logged out at random',
      task: 'A web app scales from 1 to 4 servers. Users now get logged out randomly.',
      lang: 'text',
      code: `1. Clients connect through a round-robin load balancer.
2. Four identical app servers run behind it.
3. Each server keeps login sessions in its own memory.
4. User data lives in a shared PostgreSQL primary.`,
      line: 3,
      fix: '3. Sessions live in a shared store (Redis), so any server can handle any request.',
      explain: 'Round robin sends the next request to a server that has never seen the session. Keep servers ==stateless==: shared session store or signed tokens.',
      difficulty: 'Easy',
    },
    {
      id: 'cache-update',
      title: 'Stale prices',
      task: 'Product prices sometimes stay wrong for hours after an update.',
      lang: 'text',
      code: `1. Reads: check Redis; on a miss, read Postgres and cache the product.
2. Cached entries have no expiry.
3. Writes: update the price in Postgres.
4. Done: the cache will pick it up eventually.`,
      line: 4,
      also: [2],
      fix: '4. Then delete the product\'s cache key (and give entries a TTL as a safety net).',
      explain: 'Cache-aside needs ==invalidation on write==; without it (and with no TTL) the old price is served forever.',
      difficulty: 'Medium',
    },
    {
      id: 'mod-n',
      title: 'Cache stampede after scaling',
      task: 'Adding a 5th cache node made the database fall over for an hour.',
      lang: 'text',
      code: `1. 4 cache nodes hold user profiles.
2. A key goes to node hash(key) % N.
3. Traffic grows, so we add a 5th node (N = 5).
4. Misses go to the database, which refills the cache.`,
      line: 2,
      fix: '2. Keys are placed on a consistent-hash ring (with virtual nodes).',
      explain: 'With `% N`, changing N remaps ==almost every key==, so the whole cache misses at once. Consistent hashing moves only about 1/N of the keys.',
      difficulty: 'Hard',
    },
    {
      id: 'sync-email',
      title: 'Slow signups',
      task: 'Signup takes 6 seconds and fails whenever the email provider is down.',
      lang: 'text',
      code: `1. Validate the form.
2. Insert the user row.
3. Call the email provider's API and wait for it to send the welcome email.
4. Return 201 Created.`,
      line: 3,
      fix: '3. Publish a "user.created" message to a queue; a worker sends the email with retries.',
      explain: 'Slow, unreliable side effects should not sit in the request path. A ==queue== decouples them and retries failures.',
      difficulty: 'Medium',
    },
    {
      id: 'retry-no-idempotency',
      title: 'Charged twice',
      task: 'Some customers are charged twice when the network is flaky.',
      lang: 'text',
      code: `1. The client sends POST /payments.
2. On a timeout, the client retries the same request.
3. The server charges the card for every POST it receives.
4. It returns the payment id.`,
      line: 3,
      fix: '3. The server stores the client\'s Idempotency-Key and returns the first result for a repeated key.',
      explain: 'Retries are good, but only for ==idempotent== operations. An idempotency key makes a repeated POST safe.',
      difficulty: 'Medium',
    },
    {
      id: 'shard-key',
      title: 'One hot shard',
      task: 'An events table is sharded across 8 databases, yet one shard is at 100% CPU and the rest are idle.',
      lang: 'text',
      code: `1. Events arrive at 50k writes per second.
2. Shard key: created_at (each shard owns a time range).
3. Queries usually fetch one user's recent events.
4. Each shard has 2 read replicas.`,
      line: 2,
      fix: '2. Shard key: hash(user_id), so writes spread evenly and a user\'s events stay together.',
      explain: 'A time-based key sends ==every new write== to the newest shard. Hash a high-cardinality key that matches the access pattern.',
      difficulty: 'Hard',
    },
  ],
}
