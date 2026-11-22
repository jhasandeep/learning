import type { BuildStep } from '../dsa/types'
import type { CodingQuestion } from './types'

// Coding questions in the style of hiring assessments for backend and full-stack roles. They are original
// practice problems about everyday backend work (caches, rate limiting, queues, routing, streaming), not
// questions copied from any company. Each one is checked by visible samples and hidden edge cases.

const ref = (python: string, javascript: string, verdict: string): [BuildStep] => [{
  title: 'Reference solution',
  tag: 'best',
  idea: verdict,
  walk: [],
  code: { python, javascript },
  time: '',
  space: '',
}]

// ---- 1. LRU cache with expiry ------------------------------------------------------------------------

const ttlCache: CodingQuestion = {
  id: 'lru-cache-ttl',
  title: 'LRU cache with expiry',
  topic: 'Caching',
  difficulty: 'medium',
  estimated_time_minutes: 30,
  blurb: 'Build an in-memory cache that evicts the least recently used entry and forgets entries after a time limit.',
  statement: 'Implement `TtlCache(capacity, ttl)`.\n\n`put(key, value, now)` stores the value and starts its lifetime at `now`. `get(key, now)` returns the value, or `null` when the key is missing or expired. An entry is **expired** when `now - storedAt >= ttl`.\n\nThe cache holds at most `capacity` live entries. When a new key is added to a full cache, first discard every expired entry; if it is still full, evict the **least recently used** entry. Both `get` (on a hit) and `put` count as a use. Writing an existing key replaces its value and restarts its lifetime. Reading does **not** extend the lifetime.',
  input_format: '`capacity` and `ttl` are positive integers. Operations arrive in non-decreasing `now` order. Your tests call `get` and `put` through a small driver.',
  output_format: '`get` returns the stored value or `null`. `put` returns nothing.',
  constraints: ['1 <= capacity <= 10^5', '1 <= ttl <= 10^9', 'now is a non-decreasing integer', 'Values can be any JSON value'],
  examples: [
    { input: 'capacity 2, ttl 10: put(a,1,t=0); put(b,2,t=1); get(a,t=2); put(c,3,t=3); get(b,t=4)', output: '1, then null', explanation: 'Reading a at t=2 makes b the least recently used, so adding c evicts b.' },
    { input: 'capacity 2, ttl 5: put(a,1,t=0); get(a,t=4); get(a,t=5)', output: '1, then null', explanation: 'At t=5 the entry is exactly 5 old, which counts as expired.' },
  ],
  visible: 2,
  practice: {
    fn: { python: 'simulate_ttl_cache', javascript: 'simulateTtlCache' },
    symbol: { python: 'class TtlCache', javascript: 'class TtlCache' },
    driver: {
      python: `def simulate_ttl_cache(capacity, ttl, ops):
    cache = TtlCache(capacity, ttl)
    out = []
    for op in ops:
        if op[0] == "put":
            cache.put(op[1], op[2], op[3])
        else:
            out.append(cache.get(op[1], op[2]))
    return out
`,
      javascript: `function simulateTtlCache(capacity, ttl, ops) {
  const cache = new TtlCache(capacity, ttl);
  const out = [];
  for (const op of ops) {
    if (op[0] === "put") cache.put(op[1], op[2], op[3]);
    else {
      const v = cache.get(op[1], op[2]);
      out.push(v === undefined ? null : v);
    }
  }
  return out;
}
`,
    },
    starter: {
      python: `class TtlCache:
    def __init__(self, capacity, ttl):
        pass

    def put(self, key, value, now):
        pass

    def get(self, key, now):
        pass
`,
      javascript: `class TtlCache {
  constructor(capacity, ttl) {}

  put(key, value, now) {}

  get(key, now) {}
}
`,
    },
    cases: [
      { label: 'Sample 1: the least recently used entry is evicted', args: [2, 10, [['put', 'a', 1, 0], ['put', 'b', 2, 1], ['get', 'a', 2], ['put', 'c', 3, 3], ['get', 'b', 4], ['get', 'c', 5], ['get', 'a', 6]]], expected: [1, null, 3, 1] },
      { label: 'Sample 2: an entry expires exactly at its TTL', args: [2, 5, [['put', 'a', 1, 0], ['get', 'a', 4], ['get', 'a', 5]]], expected: [1, null] },
      { label: 'Hidden: rewriting a key restarts its lifetime', args: [2, 5, [['put', 'a', 1, 0], ['put', 'a', 2, 4], ['get', 'a', 8], ['get', 'a', 9]]], expected: [2, null] },
      { label: 'Hidden: expired entries are dropped before evicting a live one', args: [2, 5, [['put', 'a', 1, 0], ['put', 'b', 2, 3], ['put', 'c', 3, 6], ['get', 'b', 6], ['get', 'c', 6], ['get', 'a', 6]]], expected: [2, 3, null] },
      { label: 'Hidden: reading does not extend the lifetime', args: [3, 5, [['put', 'a', 1, 0], ['get', 'a', 3], ['get', 'a', 6]]], expected: [1, null] },
      { label: 'Hidden: a missing key and a capacity of one', args: [1, 100, [['get', 'x', 0], ['put', 'a', 1, 1], ['put', 'b', 2, 2], ['get', 'a', 3], ['get', 'b', 4]]], expected: [null, null, 2] },
    ],
    hints: ['Keep a map from key to value and the time it was stored, and keep track of the order of use (a JavaScript `Map` or a Python `OrderedDict` both remember order).', 'On a hit, move the key to the end of the order. On a put, delete the key first and insert it again so it is the newest.', 'Before evicting for capacity, walk the entries and remove every expired one.'],
  },
  steps: ref(
    `from collections import OrderedDict

class TtlCache:
    def __init__(self, capacity, ttl):
        self.capacity = capacity
        self.ttl = ttl
        self.items = OrderedDict()  # key -> (value, stored_at), oldest use first

    def _expired(self, stored_at, now):
        return now - stored_at >= self.ttl

    def put(self, key, value, now):
        if key in self.items:
            del self.items[key]
        else:
            if len(self.items) >= self.capacity:
                for k in [k for k, (_, t) in self.items.items() if self._expired(t, now)]:
                    del self.items[k]
            if len(self.items) >= self.capacity:
                self.items.popitem(last=False)  # least recently used
        self.items[key] = (value, now)

    def get(self, key, now):
        if key not in self.items:
            return None
        value, stored_at = self.items[key]
        if self._expired(stored_at, now):
            del self.items[key]
            return None
        self.items.move_to_end(key)
        return value
`,
    `class TtlCache {
  constructor(capacity, ttl) {
    this.capacity = capacity;
    this.ttl = ttl;
    this.items = new Map(); // key -> { value, storedAt }, oldest use first
  }

  expired(storedAt, now) {
    return now - storedAt >= this.ttl;
  }

  put(key, value, now) {
    if (this.items.has(key)) {
      this.items.delete(key);
    } else {
      if (this.items.size >= this.capacity) {
        for (const [k, e] of [...this.items]) {
          if (this.expired(e.storedAt, now)) this.items.delete(k);
        }
      }
      if (this.items.size >= this.capacity) {
        this.items.delete(this.items.keys().next().value); // least recently used
      }
    }
    this.items.set(key, { value, storedAt: now });
  }

  get(key, now) {
    const e = this.items.get(key);
    if (e === undefined) return null;
    if (this.expired(e.storedAt, now)) {
      this.items.delete(key);
      return null;
    }
    this.items.delete(key);
    this.items.set(key, e);
    return e.value;
  }
}
`,
    'An ordered map keeps the use order, so the first entry is always the least recently used one. Expiry is checked lazily on reads and swept before evictions.',
  ),
  complexity: { time: 'get O(1); put O(1) amortised, O(n) when it has to sweep expired entries', space: 'O(capacity)' },
  mistakes: ['Letting `get` restart the lifetime, so hot keys never expire.', 'Evicting a live entry while expired ones still take up space.', 'Using `>` instead of `>=` for the expiry check.', 'Forgetting to move an overwritten key to the most-recent position.'],
  recap: 'An ordered map gives least-recently-used eviction in O(1); expiry is checked on read and swept before a capacity eviction.',
  tags: ['cache', 'lru', 'ttl', 'data-structures'],
}

// ---- 2. Sliding window rate limiter ------------------------------------------------------------------

const rateLimit: CodingQuestion = {
  id: 'sliding-window-limiter',
  title: 'Sliding window rate limiter',
  topic: 'API protection',
  difficulty: 'medium',
  estimated_time_minutes: 25,
  blurb: 'Decide for each request whether a user is within their allowed number of calls in the last few seconds.',
  statement: 'An API allows each user at most `limit` accepted requests in any window of `window` seconds. A request arriving at time `t` is **accepted** when fewer than `limit` of that user\'s earlier **accepted** requests have a time greater than `t - window`; otherwise it is **rejected**. Rejected requests do not count towards the limit. Users are independent.\n\nGiven the requests in arrival order, return whether each one is accepted.',
  input_format: '`limit` and `window` are integers. `requests` is a list of `[user, t]` pairs with non-decreasing `t`.',
  output_format: 'A list of booleans, one per request, in the same order.',
  constraints: ['1 <= limit <= 10^5', '1 <= window <= 10^9', '0 <= requests.length <= 10^5', 'Times are non-decreasing integers'],
  examples: [
    { input: 'limit 2, window 10: a@0, a@1, a@2, a@10', output: 'true, true, false, true', explanation: 'At t=2 two accepted requests are still in the window, so it is rejected. At t=10 only the request at t=1 is newer than 0, so there is room again.' },
    { input: 'limit 1, window 5: a@0, a@3, a@5', output: 'true, false, true', explanation: 'The rejected request at t=3 does not count. At t=5 the first request (t=0) is no longer inside the window.' },
  ],
  visible: 2,
  practice: {
    fn: { python: 'rate_limit', javascript: 'rateLimit' },
    starter: {
      python: `def rate_limit(limit, window, requests):
    # return a list of booleans: True if the request is accepted
    pass
`,
      javascript: `function rateLimit(limit, window, requests) {
  // return an array of booleans: true if the request is accepted
}
`,
    },
    cases: [
      { label: 'Sample 1: the window slides forward', args: [2, 10, [['a', 0], ['a', 1], ['a', 2], ['a', 10]]], expected: [true, true, false, true] },
      { label: 'Sample 2: rejected requests are not counted', args: [1, 5, [['a', 0], ['a', 3], ['a', 5]]], expected: [true, false, true] },
      { label: 'Hidden: users are tracked separately', args: [2, 10, [['a', 0], ['b', 0], ['a', 1], ['b', 1], ['a', 2], ['b', 2]]], expected: [true, true, true, true, false, false] },
      { label: 'Hidden: no requests', args: [3, 10, []], expected: [] },
      { label: 'Hidden: a burst at the same instant', args: [3, 10, [['a', 5], ['a', 5], ['a', 5], ['a', 5], ['a', 5]]], expected: [true, true, true, false, false] },
      { label: 'Hidden: a long gap resets the user', args: [2, 3, [['a', 0], ['a', 1], ['a', 2], ['a', 100], ['a', 100], ['a', 100]]], expected: [true, true, false, true, true, false] },
    ],
    hints: ['Keep, for each user, a queue of the times of their accepted requests.', 'Before deciding, remove times from the front of the queue that are `<= t - window`.', 'Accept only if the queue is shorter than `limit`, and add `t` to the queue only when accepted.'],
  },
  steps: ref(
    `from collections import deque

def rate_limit(limit, window, requests):
    accepted = {}  # user -> deque of accepted request times
    out = []
    for user, t in requests:
        q = accepted.setdefault(user, deque())
        while q and q[0] <= t - window:
            q.popleft()
        if len(q) < limit:
            q.append(t)
            out.append(True)
        else:
            out.append(False)
    return out
`,
    `function rateLimit(limit, window, requests) {
  const accepted = new Map(); // user -> array of accepted request times
  const out = [];
  for (const [user, t] of requests) {
    if (!accepted.has(user)) accepted.set(user, { times: [], head: 0 });
    const q = accepted.get(user);
    while (q.head < q.times.length && q.times[q.head] <= t - window) q.head++;
    if (q.times.length - q.head < limit) {
      q.times.push(t);
      out.push(true);
    } else {
      out.push(false);
    }
  }
  return out;
}
`,
    'Each user keeps a queue of accepted request times. Old times are dropped from the front, so each time enters and leaves the queue once.',
  ),
  complexity: { time: 'O(n) overall: every request is added and removed at most once', space: 'O(accepted requests in the window per user)' },
  mistakes: ['Counting rejected requests, which locks a client out forever.', 'Using `<` instead of `<=` when dropping old times, which shifts the window by one.', 'Sharing one counter across all users.', 'Scanning the whole history for every request (O(n²)).'],
  recap: 'A per-user queue of accepted timestamps gives an exact sliding window in amortised O(1) per request.',
  tags: ['rate-limiting', 'queue', 'sliding-window'],
}

// ---- 3. Group and total (aggregation) ----------------------------------------------------------------

const aggregate: CodingQuestion = {
  id: 'orders-aggregation',
  title: 'Top customers by paid orders',
  topic: 'Data aggregation',
  difficulty: 'easy',
  estimated_time_minutes: 20,
  blurb: 'Do in code what a MongoDB $match, $group and $sort pipeline does: total the paid orders per customer.',
  statement: 'You are given orders as `[customer, status, amount]`. Keep only orders whose status is `"paid"`, add up the amounts for each customer and keep customers whose total is at least `min_total`. Return `[customer, total]` pairs sorted by total from highest to lowest; customers with the same total are sorted by name from A to Z.',
  input_format: '`orders` is a list of `[customer, status, amount]` with integer amounts. `min_total` is an integer.',
  output_format: 'A list of `[customer, total]` pairs.',
  constraints: ['0 <= orders.length <= 10^5', '0 <= amount <= 10^6', 'Statuses are lowercase words such as "paid", "pending" or "refunded"'],
  examples: [
    { input: 'orders: [asha paid 50], [ravi paid 80], [asha paid 40], [ravi pending 500]; min_total 60', output: '[ravi, 80], [asha, 90]... sorted: [asha, 90], [ravi, 80]', explanation: 'Only paid orders count: asha has 90 and ravi has 80. The pending order is ignored. Sorted by total, asha comes first.' },
    { input: 'orders: [meera paid 30]; min_total 50', output: '[]', explanation: 'Meera\'s total of 30 is below the minimum.' },
  ],
  visible: 2,
  practice: {
    fn: { python: 'top_customers', javascript: 'topCustomers' },
    starter: {
      python: `def top_customers(orders, min_total):
    # return a list of [customer, total] pairs
    pass
`,
      javascript: `function topCustomers(orders, minTotal) {
  // return an array of [customer, total] pairs
}
`,
    },
    cases: [
      { label: 'Sample 1: only paid orders are added up', args: [[['asha', 'paid', 50], ['ravi', 'paid', 80], ['asha', 'paid', 40], ['ravi', 'pending', 500]], 60], expected: [['asha', 90], ['ravi', 80]] },
      { label: 'Sample 2: totals below the minimum are dropped', args: [[['meera', 'paid', 30]], 50], expected: [] },
      { label: 'Hidden: equal totals are sorted by name', args: [[['zoya', 'paid', 70], ['arun', 'paid', 70], ['kiran', 'paid', 90]], 0], expected: [['kiran', 90], ['arun', 70], ['zoya', 70]] },
      { label: 'Hidden: no orders', args: [[], 10], expected: [] },
      { label: 'Hidden: a total exactly at the minimum is kept', args: [[['a', 'paid', 20], ['a', 'paid', 30], ['b', 'refunded', 100]], 50], expected: [['a', 50]] },
      { label: 'Hidden: zero-value orders and a minimum of 0', args: [[['a', 'paid', 0], ['b', 'paid', 5]], 0], expected: [['b', 5], ['a', 0]] },
    ],
    hints: ['Use a dictionary (or `Map`) from customer to running total, adding only when the status is "paid".', 'Turn the dictionary into pairs and drop those below `min_total`.', 'Sort with two keys: total descending, then name ascending.'],
  },
  steps: ref(
    `def top_customers(orders, min_total):
    totals = {}
    for customer, status, amount in orders:
        if status == "paid":
            totals[customer] = totals.get(customer, 0) + amount
    rows = [[c, t] for c, t in totals.items() if t >= min_total]
    rows.sort(key=lambda r: (-r[1], r[0]))
    return rows
`,
    `function topCustomers(orders, minTotal) {
  const totals = new Map();
  for (const [customer, status, amount] of orders) {
    if (status === "paid") totals.set(customer, (totals.get(customer) || 0) + amount);
  }
  const rows = [...totals].filter(([, t]) => t >= minTotal).map(([c, t]) => [c, t]);
  rows.sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  return rows;
}
`,
    'A single pass builds a hash map of totals (the $match and $group stages); a final sort with a tie-breaker is the $sort stage.',
  ),
  complexity: { time: 'O(n + k log k) for n orders and k customers', space: 'O(k)' },
  mistakes: ['Forgetting the tie-breaker, so equal totals come out in an arbitrary order.', 'Comparing names with a subtraction instead of a proper string comparison in JavaScript.', 'Filtering after sorting without needing to, or counting non-paid orders.', 'Applying the minimum to single orders instead of the customer total.'],
  recap: 'Aggregation is a filter, a hash-map group-by and a sort with a deterministic tie-breaker.',
  tags: ['aggregation', 'hash-map', 'sorting', 'mongodb'],
}

// ---- 4. Promise pool timing --------------------------------------------------------------------------

const pool: CodingQuestion = {
  id: 'concurrency-pool',
  title: 'Concurrency limiter finish times',
  topic: 'Async concurrency',
  difficulty: 'medium',
  estimated_time_minutes: 30,
  blurb: 'Work out when each job ends when at most N async jobs may run at the same time.',
  statement: 'A worker pool runs jobs in the order they are given and never runs more than `limit` at once, like a `Promise` pool that starts the next task as soon as a slot frees up. All slots are free at time 0. Job `i` takes `durations[i]` time units. When a job finishes, the next waiting job starts immediately at that time.\n\nReturn the time each job finishes, in the order of the input.',
  input_format: '`limit` is an integer. `durations` is a list of non-negative integers.',
  output_format: 'A list of finish times, one per job, in input order.',
  constraints: ['1 <= limit <= 10^4', '0 <= durations.length <= 10^5', '0 <= durations[i] <= 10^6'],
  examples: [
    { input: 'limit 2, durations [3, 2, 4, 1]', output: '[3, 2, 6, 4]', explanation: 'Jobs 0 and 1 start at 0 and finish at 3 and 2. Job 2 starts at 2 and ends at 6. Job 3 starts at 3 (the slot job 0 freed) and ends at 4.' },
    { input: 'limit 1, durations [2, 2, 2]', output: '[2, 4, 6]', explanation: 'With one slot the jobs run one after another.' },
  ],
  visible: 2,
  practice: {
    fn: { python: 'finish_times', javascript: 'finishTimes' },
    starter: {
      python: `def finish_times(limit, durations):
    # return the finish time of each job, in input order
    pass
`,
      javascript: `function finishTimes(limit, durations) {
  // return the finish time of each job, in input order
}
`,
    },
    cases: [
      { label: 'Sample 1: a slot is reused as soon as it frees', args: [2, [3, 2, 4, 1]], expected: [3, 2, 6, 4] },
      { label: 'Sample 2: one slot means sequential jobs', args: [1, [2, 2, 2]], expected: [2, 4, 6] },
      { label: 'Hidden: a limit larger than the number of jobs', args: [10, [5, 1, 3]], expected: [5, 1, 3] },
      { label: 'Hidden: no jobs', args: [3, []], expected: [] },
      { label: 'Hidden: several short jobs wait behind a long one', args: [3, [5, 1, 1, 1, 1]], expected: [5, 1, 1, 2, 2] },
      { label: 'Hidden: zero-length jobs finish when they start', args: [2, [0, 0, 4, 0]], expected: [0, 0, 4, 0] },
    ],
    hints: ['Keep a list with the time at which each of the `limit` slots becomes free (all start at 0).', 'For each job, take the slot that frees first. The job starts at that time and ends at `start + duration`.', 'Put the new finish time back into that slot. A heap makes finding the earliest slot fast.'],
  },
  steps: ref(
    `def finish_times(limit, durations):
    slots = [0] * min(limit, len(durations))  # when each slot becomes free
    out = []
    for d in durations:
        i = slots.index(min(slots))
        slots[i] += d
        out.append(slots[i])
    return out
`,
    `function finishTimes(limit, durations) {
  const slots = new Array(Math.min(limit, durations.length)).fill(0); // when each slot becomes free
  const out = [];
  for (const d of durations) {
    let i = 0;
    for (let j = 1; j < slots.length; j++) if (slots[j] < slots[i]) i = j;
    slots[i] += d;
    out.push(slots[i]);
  }
  return out;
}
`,
    'Track the time each slot becomes free. The next job always takes the slot that frees earliest, so its finish time is that time plus its duration.',
  ),
  complexity: { time: 'O(n × limit), or O(n log limit) with a min-heap', space: 'O(limit)' },
  mistakes: ['Starting jobs in a batch of `limit` and waiting for the whole batch, instead of reusing each slot as it frees.', 'Returning finish times in the order jobs completed instead of the input order.', 'Allocating `limit` slots when there are fewer jobs (harmless, but wasteful for a huge limit).', 'Forgetting that jobs start in input order even when a later slot frees earlier.'],
  recap: 'A concurrency limit is a set of slots, each with a free-at time; the next job always takes the earliest one.',
  tags: ['concurrency', 'promises', 'scheduling', 'heap'],
}

// ---- 5. Retry with exponential backoff ---------------------------------------------------------------

const retry: CodingQuestion = {
  id: 'retry-backoff',
  title: 'Retry with exponential backoff',
  topic: 'Resilient API calls',
  difficulty: 'easy',
  estimated_time_minutes: 20,
  blurb: 'Simulate calling a flaky API with retries and capped exponential waits, as you would for an LLM or payment API.',
  statement: 'A client calls an API. The first attempt happens immediately. If an attempt fails, the client waits and tries again, up to `max_retries` retries. The wait before retry number `k` (starting at 1) is `min(cap, base * 2^(k-1))` milliseconds. The client stops at the first success.\n\n`outcomes[i]` tells whether attempt number `i + 1` succeeds (`true`) or fails (`false`); attempts beyond the end of the list fail.\n\nReturn an object with `ok` (whether any attempt succeeded), `attempts` (how many calls were made) and `waited` (the total waiting time in milliseconds).',
  input_format: '`outcomes` is a list of booleans. `base`, `cap` and `max_retries` are non-negative integers.',
  output_format: 'An object `{ ok, attempts, waited }`.',
  constraints: ['0 <= max_retries <= 30', '1 <= base <= cap <= 10^9', '0 <= outcomes.length <= 100'],
  examples: [
    { input: 'outcomes [false, false, true], base 100, cap 1000, max_retries 5', output: '{ ok: true, attempts: 3, waited: 300 }', explanation: 'Two failures mean waits of 100 and 200 ms before the third attempt succeeds.' },
    { input: 'outcomes [], base 500, cap 1000, max_retries 4', output: '{ ok: false, attempts: 5, waited: 3500 }', explanation: 'Every attempt fails. The waits are 500, 1000 (capped), 1000, 1000.' },
  ],
  visible: 2,
  practice: {
    fn: { python: 'simulate_retry', javascript: 'simulateRetry' },
    starter: {
      python: `def simulate_retry(outcomes, base, cap, max_retries):
    # return {"ok": ..., "attempts": ..., "waited": ...}
    pass
`,
      javascript: `function simulateRetry(outcomes, base, cap, maxRetries) {
  // return { ok, attempts, waited }
}
`,
    },
    cases: [
      { label: 'Sample 1: succeeds on the third attempt', args: [[false, false, true], 100, 1000, 5], expected: { ok: true, attempts: 3, waited: 300 } },
      { label: 'Sample 2: every attempt fails and the wait is capped', args: [[], 500, 1000, 4], expected: { ok: false, attempts: 5, waited: 3500 } },
      { label: 'Hidden: success on the first try needs no waiting', args: [[true], 100, 1000, 3], expected: { ok: true, attempts: 1, waited: 0 } },
      { label: 'Hidden: no retries allowed', args: [[false, true], 100, 1000, 0], expected: { ok: false, attempts: 1, waited: 0 } },
      { label: 'Hidden: it gives up after the last retry', args: [[false, false, false, true], 100, 1000, 2], expected: { ok: false, attempts: 3, waited: 300 } },
      { label: 'Hidden: the delay doubles until it hits the cap', args: [[false, false, false, false, false, true], 100, 350, 5], expected: { ok: true, attempts: 6, waited: 1350 } },
    ],
    hints: ['Loop over attempts starting at 1. Treat an attempt past the end of `outcomes` as a failure.', 'After a failed attempt, if you still have retries left, add `min(cap, base * 2^(k-1))` to the total wait, where `k` is the retry you are about to make.', 'Stop as soon as an attempt succeeds, or when `max_retries` retries have been used.'],
  },
  steps: ref(
    `def simulate_retry(outcomes, base, cap, max_retries):
    attempts = 0
    waited = 0
    for k in range(max_retries + 1):  # attempt k + 1; k == 0 is the first call
        attempts += 1
        succeeded = outcomes[k] if k < len(outcomes) else False
        if succeeded:
            return {"ok": True, "attempts": attempts, "waited": waited}
        if k < max_retries:
            waited += min(cap, base * 2 ** k)
    return {"ok": False, "attempts": attempts, "waited": waited}
`,
    `function simulateRetry(outcomes, base, cap, maxRetries) {
  let attempts = 0;
  let waited = 0;
  for (let k = 0; k <= maxRetries; k++) { // attempt k + 1; k === 0 is the first call
    attempts += 1;
    const succeeded = k < outcomes.length ? outcomes[k] : false;
    if (succeeded) return { ok: true, attempts, waited };
    if (k < maxRetries) waited += Math.min(cap, base * 2 ** k);
  }
  return { ok: false, attempts, waited };
}
`,
    'The delay before retry k + 1 is min(cap, base × 2^k). Only wait when another retry will actually follow.',
  ),
  complexity: { time: 'O(max_retries)', space: 'O(1)' },
  mistakes: ['Waiting after the last failed attempt, when there is nothing left to retry.', 'Retrying forever or without a cap, which can overload a recovering service.', 'Using the same delay every time (no backoff) so all clients retry together; real systems also add random jitter.', 'Retrying non-idempotent requests without an idempotency key.'],
  recap: 'Capped exponential backoff spaces retries out; add jitter and only retry errors that are safe to repeat.',
  tags: ['retry', 'backoff', 'resilience', 'api'],
}

// ---- 6. Route matching -------------------------------------------------------------------------------

const route: CodingQuestion = {
  id: 'route-matcher',
  title: 'Express-style route matcher',
  topic: 'Routing',
  difficulty: 'medium',
  estimated_time_minutes: 25,
  blurb: 'Match a URL path against a pattern with :params, the way Express and React Router do.',
  statement: 'Write `match_route(pattern, path)`. A pattern is made of segments separated by `/`. A segment that starts with `:` is a **parameter** that matches any single non-empty segment and captures its text under that name. Every other segment must match exactly (case-sensitive). The number of segments must be the same. Empty segments (from a leading, trailing or doubled slash) are ignored.\n\nReturn an object of the captured parameters if the path matches (an empty object when the pattern has no parameters), or `null` if it does not match.',
  input_format: '`pattern` and `path` are strings that start with `/`.',
  output_format: 'An object mapping parameter names to strings, or `null`.',
  constraints: ['1 <= pattern.length, path.length <= 2000', 'Segments contain no query string or fragment', 'Parameter values are returned as plain strings (no decoding)'],
  examples: [
    { input: 'pattern /users/:id/posts/:postId, path /users/7/posts/9', output: '{ id: "7", postId: "9" }', explanation: 'Both parameters capture one segment each.' },
    { input: 'pattern /users/:id, path /accounts/42', output: 'null', explanation: 'The literal segment "users" does not match "accounts".' },
  ],
  visible: 2,
  practice: {
    fn: { python: 'match_route', javascript: 'matchRoute' },
    starter: {
      python: `def match_route(pattern, path):
    # return a dict of parameters, or None when the path does not match
    pass
`,
      javascript: `function matchRoute(pattern, path) {
  // return an object of parameters, or null when the path does not match
}
`,
    },
    cases: [
      { label: 'Sample 1: two parameters are captured', args: ['/users/:id/posts/:postId', '/users/7/posts/9'], expected: { id: '7', postId: '9' } },
      { label: 'Sample 2: a literal segment must match', args: ['/users/:id', '/accounts/42'], expected: null },
      { label: 'Hidden: extra segments do not match', args: ['/users/:id', '/users/42/posts'], expected: null },
      { label: 'Hidden: a trailing slash is ignored', args: ['/users/:id/', '/users/42'], expected: { id: '42' } },
      { label: 'Hidden: the root path has no parameters', args: ['/', '/'], expected: {} },
      { label: 'Hidden: a parameter can not be empty', args: ['/files/:name', '/files/'], expected: null },
      { label: 'Hidden: literals are case-sensitive', args: ['/Users/:id', '/users/1'], expected: null },
    ],
    hints: ['Split both strings on "/" and drop the empty pieces.', 'If the two lists have different lengths there is no match.', 'Walk the segments together: a `:name` segment captures the value, any other segment must be equal.'],
  },
  steps: ref(
    `def match_route(pattern, path):
    pat = [s for s in pattern.split("/") if s]
    parts = [s for s in path.split("/") if s]
    if len(pat) != len(parts):
        return None
    params = {}
    for p, s in zip(pat, parts):
        if p.startswith(":"):
            params[p[1:]] = s
        elif p != s:
            return None
    return params
`,
    `function matchRoute(pattern, path) {
  const pat = pattern.split("/").filter(Boolean);
  const parts = path.split("/").filter(Boolean);
  if (pat.length !== parts.length) return null;
  const params = {};
  for (let i = 0; i < pat.length; i++) {
    if (pat[i].startsWith(":")) params[pat[i].slice(1)] = parts[i];
    else if (pat[i] !== parts[i]) return null;
  }
  return params;
}
`,
    'Split both strings into non-empty segments, compare the counts, then walk them together capturing :params and requiring literals to be equal.',
  ),
  complexity: { time: 'O(length of pattern + path)', space: 'O(number of segments)' },
  mistakes: ['Not removing empty segments, so a trailing slash breaks the match.', 'Letting a parameter match more than one segment.', 'Comparing the segment counts too late, after indexing past the end.', 'Treating the root path `/` as a special case that crashes.'],
  recap: 'Routing is segment-by-segment comparison: equal counts, literals must match, `:name` captures.',
  tags: ['routing', 'strings', 'express'],
}

// ---- 7. Streaming (SSE) parser -----------------------------------------------------------------------

const sse: CodingQuestion = {
  id: 'sse-stream-parser',
  title: 'Parse a streamed LLM response (SSE)',
  topic: 'Streaming APIs',
  difficulty: 'hard',
  estimated_time_minutes: 40,
  blurb: 'Turn arbitrary network chunks of a server-sent events stream into the list of messages, the way an AI chat client does.',
  statement: 'A streaming API sends text in **server-sent events**. The text arrives in arbitrary chunks that can split an event anywhere. Events are separated by a blank line (`"\\n\\n"`). Inside an event:\n\n- a line starting with `data:` carries data. Remove the `data:` prefix and then **one** leading space if present. If an event has several data lines, join them with `"\\n"`.\n- a line starting with `:` is a comment. Any other line (for example `event: message`) is ignored.\n- an event with no data lines produces no message.\n\nThe event whose data is exactly `[DONE]` ends the stream: it is not included and nothing after it is read. An event that is not yet finished by a blank line when the chunks run out is ignored.\n\nReturn the list of message strings.',
  input_format: '`chunks` is a list of strings (the pieces of the response in arrival order). Lines are separated by `"\\n"` only.',
  output_format: 'A list of strings.',
  constraints: ['0 <= chunks.length <= 10^5', 'The total length is at most 10^6 characters', 'A chunk can be empty or end in the middle of a line'],
  examples: [
    { input: '["data: hel", "lo\\n", "\\ndata: x\\n\\n"]', output: '["hello", "x"]', explanation: 'The first event is split across three chunks and is completed by the blank line.' },
    { input: '["data: a\\ndata: b\\n\\n"]', output: '["a\\nb"]', explanation: 'Two data lines in one event are joined with a newline.' },
  ],
  visible: 2,
  practice: {
    fn: { python: 'parse_sse', javascript: 'parseSse' },
    starter: {
      python: `def parse_sse(chunks):
    # return the list of message strings
    pass
`,
      javascript: `function parseSse(chunks) {
  // return the array of message strings
}
`,
    },
    cases: [
      { label: 'Sample 1: an event split across chunks', args: [['data: hel', 'lo\n', '\ndata: x\n\n']], expected: ['hello', 'x'] },
      { label: 'Sample 2: several data lines are joined', args: [['data: a\ndata: b\n\n']], expected: ['a\nb'] },
      { label: 'Hidden: comments and other fields are ignored', args: [[': ping\n\nevent: message\ndata: hi\n\n']], expected: ['hi'] },
      { label: 'Hidden: [DONE] stops the stream', args: [['data: 1\n\n', 'data: [DONE]\n\n', 'data: 2\n\n']], expected: ['1'] },
      { label: 'Hidden: an unfinished event is ignored', args: [['data: a\n\ndata: b']], expected: ['a'] },
      { label: 'Hidden: no chunks', args: [[]], expected: [] },
      { label: 'Hidden: no space after the colon', args: [['data:x\n\ndata:  y\n\n']], expected: ['x', ' y'] },
    ],
    hints: ['Keep a buffer. Append each chunk, then repeatedly cut out everything up to the next blank line (`"\\n\\n"`): that is one complete event.', 'For one event, split it into lines and keep those starting with `data:`; remove the prefix and a single leading space, then join with a newline.', 'Stop when you meet an event whose data is `[DONE]`. Leave the unfinished text in the buffer; at the end it is simply ignored.'],
  },
  steps: ref(
    `def parse_sse(chunks):
    buffer = ""
    messages = []
    for chunk in chunks:
        buffer += chunk
        while True:
            end = buffer.find("\\n\\n")
            if end == -1:
                break
            event, buffer = buffer[:end], buffer[end + 2:]
            data = []
            for line in event.split("\\n"):
                if line.startswith("data:"):
                    value = line[5:]
                    if value.startswith(" "):
                        value = value[1:]
                    data.append(value)
            if not data:
                continue
            text = "\\n".join(data)
            if text == "[DONE]":
                return messages
            messages.append(text)
    return messages
`,
    `function parseSse(chunks) {
  let buffer = "";
  const messages = [];
  for (const chunk of chunks) {
    buffer += chunk;
    for (;;) {
      const end = buffer.indexOf("\\n\\n");
      if (end === -1) break;
      const event = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      const data = [];
      for (const line of event.split("\\n")) {
        if (line.startsWith("data:")) {
          let value = line.slice(5);
          if (value.startsWith(" ")) value = value.slice(1);
          data.push(value);
        }
      }
      if (data.length === 0) continue;
      const text = data.join("\\n");
      if (text === "[DONE]") return messages;
      messages.push(text);
    }
  }
  return messages;
}
`,
    'Buffer the incoming text and cut off a complete event each time a blank line appears. Whatever is left in the buffer is an unfinished event.',
  ),
  complexity: { time: 'O(total length) when the buffer is consumed incrementally (the slicing here is simple but copies; a read index avoids that)', space: 'O(longest event)' },
  mistakes: ['Splitting each chunk on blank lines on its own, which breaks events that span chunks.', 'Trimming all whitespace instead of removing exactly one space after `data:`.', 'Emitting the final `[DONE]` marker, or continuing to read after it.', 'Emitting an event for comment-only blocks.'],
  recap: 'A streaming parser keeps a buffer and only emits what is complete; the leftover waits for the next chunk.',
  tags: ['streaming', 'sse', 'llm', 'parsing'],
}


// ---- 8. Debounce ------------------------------------------------------------------------------------

const debounce: CodingQuestion = {
  id: 'debounce-timeline',
  title: 'Debounce: when does it fire?',
  topic: 'Event handling',
  difficulty: 'easy',
  estimated_time_minutes: 20,
  blurb: 'Work out when a trailing debounced search or save call really runs, given the times the user triggered it.',
  statement: 'A function is debounced with a delay of `wait` milliseconds (trailing edge). Each call schedules the real function to run at `time + wait`, and a new call made **before** that moment cancels the pending run and schedules a new one. If a call arrives at exactly the scheduled time, the pending run happens first and the new call starts a fresh timer.\n\nGiven the times at which the debounced function was called (in non-decreasing order), return the times at which the real function actually runs.',
  input_format: '`wait` is a positive integer. `times` is a list of non-negative integers in non-decreasing order.',
  output_format: 'A list of the times the real function runs.',
  constraints: ['1 <= wait <= 10^9', '0 <= times.length <= 10^5', 'Times are integers in non-decreasing order'],
  examples: [
    { input: 'wait 200, calls at [0, 50, 100, 400]', output: '[300, 600]', explanation: 'The calls at 0, 50 and 100 keep resetting the timer, so the run happens 200 after the last one (300). The call at 400 starts another timer that ends at 600.' },
    { input: 'wait 100, calls at [0, 100]', output: '[100, 200]', explanation: 'The first timer ends at exactly 100, when the second call arrives, so it runs first. The second call then runs at 200.' },
  ],
  visible: 2,
  practice: {
    fn: { python: 'debounce_fires', javascript: 'debounceFires' },
    starter: {
      python: `def debounce_fires(wait, times):
    # return the list of times the real function runs
    pass
`,
      javascript: `function debounceFires(wait, times) {
  // return the array of times the real function runs
}
`,
    },
    cases: [
      { label: 'Sample 1: a burst of calls fires once, after the last one', args: [200, [0, 50, 100, 400]], expected: [300, 600] },
      { label: 'Sample 2: a call at exactly the fire time lets the pending run happen', args: [100, [0, 100]], expected: [100, 200] },
      { label: 'Hidden: no calls', args: [10, []], expected: [] },
      { label: 'Hidden: a single call', args: [10, [5]], expected: [15] },
      { label: 'Hidden: a long burst', args: [10, [0, 1, 2, 3]], expected: [13] },
      { label: 'Hidden: well-spaced calls all fire', args: [50, [0, 100, 200]], expected: [50, 150, 250] },
    ],
    hints: ['Remember only the time of the pending run (or "none").', 'For each call at time `t`: if a run is pending and `t` is at or after its time, that run has already happened, so record it.', 'Then set the pending run to `t + wait`. When the calls end, the last pending run still happens.'],
  },
  steps: ref(
    `def debounce_fires(wait, times):
    fires = []
    pending = None
    for t in times:
        if pending is not None and t >= pending:
            fires.append(pending)
        pending = t + wait
    if pending is not None:
        fires.append(pending)
    return fires
`,
    `function debounceFires(wait, times) {
  const fires = [];
  let pending = null;
  for (const t of times) {
    if (pending !== null && t >= pending) fires.push(pending);
    pending = t + wait;
  }
  if (pending !== null) fires.push(pending);
  return fires;
}
`,
    'Only one timer can be pending. A new call either finds it already expired (it ran) or cancels it, and then sets a new one.',
  ),
  complexity: { time: 'O(n)', space: 'O(1) besides the output' },
  mistakes: ['Restarting the timer without noticing that the previous one had already fired.', 'Using `>` instead of `>=` at the boundary.', 'Forgetting the final pending run after the last call.', 'Confusing debounce with throttle (throttle runs at most once per interval, even during a burst).'],
  recap: 'A debounce keeps one pending timer: a later call either replaces it or finds it already fired.',
  tags: ['debounce', 'timers', 'frontend'],
}

// ---- 9. Cursor pagination ---------------------------------------------------------------------------

const cursor: CodingQuestion = {
  id: 'cursor-pagination',
  title: 'Cursor-based pagination',
  topic: 'API design',
  difficulty: 'easy',
  estimated_time_minutes: 20,
  blurb: 'Return the next page of an ID-ordered list using a cursor instead of page numbers, like a feed endpoint.',
  statement: 'A feed API returns items sorted by id in increasing order. Instead of page numbers it uses a **cursor**: the id of the last item the client has already seen (or `null` for the first page).\n\nImplement `next_page(ids, limit, cursor)`. Return the first `limit` ids that are **greater than** the cursor, and a `next_cursor`: the last id of the page when more ids remain after it, otherwise `null`.',
  input_format: '`ids` is a sorted list of distinct integers. `limit` is a positive integer. `cursor` is an integer or `null`. The cursor does not have to be one of the ids.',
  output_format: 'An object `{ items, next_cursor }`.',
  constraints: ['0 <= ids.length <= 10^5', '1 <= limit <= 10^5', 'ids are strictly increasing'],
  examples: [
    { input: 'ids [1,2,3,4,5], limit 2, cursor null', output: '{ items: [1, 2], next_cursor: 2 }', explanation: 'The first page holds 1 and 2, and more ids remain, so the client continues from 2.' },
    { input: 'ids [1,2,3,4,5], limit 2, cursor 4', output: '{ items: [5], next_cursor: null }', explanation: 'Only 5 is greater than 4, and nothing remains afterwards.' },
  ],
  visible: 2,
  practice: {
    fn: { python: 'next_page', javascript: 'nextPage' },
    starter: {
      python: `def next_page(ids, limit, cursor):
    # return {"items": [...], "next_cursor": id or None}
    pass
`,
      javascript: `function nextPage(ids, limit, cursor) {
  // return { items: [...], next_cursor: id or null }
}
`,
    },
    cases: [
      { label: 'Sample 1: the first page', args: [[1, 2, 3, 4, 5], 2, null], expected: { items: [1, 2], next_cursor: 2 } },
      { label: 'Sample 2: the last page has no next cursor', args: [[1, 2, 3, 4, 5], 2, 4], expected: { items: [5], next_cursor: null } },
      { label: 'Hidden: a page that fits exactly ends the list', args: [[1, 2, 3], 3, null], expected: { items: [1, 2, 3], next_cursor: null } },
      { label: 'Hidden: a cursor past the end', args: [[1, 2, 3], 2, 3], expected: { items: [], next_cursor: null } },
      { label: 'Hidden: the cursor is not one of the ids', args: [[10, 20, 30, 40], 2, 15], expected: { items: [20, 30], next_cursor: 30 } },
      { label: 'Hidden: no ids at all', args: [[], 5, null], expected: { items: [], next_cursor: null } },
    ],
    hints: ['Find the first position whose id is greater than the cursor (a binary search works because the list is sorted).', 'Take `limit` ids from that position.', 'If there are still ids after the page, the next cursor is the last id of the page; otherwise it is null.'],
  },
  steps: ref(
    `def next_page(ids, limit, cursor):
    lo, hi = 0, len(ids)
    if cursor is not None:
        while lo < hi:  # first index with ids[i] > cursor
            mid = (lo + hi) // 2
            if ids[mid] > cursor:
                hi = mid
            else:
                lo = mid + 1
    items = ids[lo:lo + limit]
    more = lo + limit < len(ids)
    return {"items": items, "next_cursor": items[-1] if items and more else None}
`,
    `function nextPage(ids, limit, cursor) {
  let lo = 0;
  let hi = ids.length;
  if (cursor !== null) {
    while (lo < hi) { // first index with ids[i] > cursor
      const mid = (lo + hi) >> 1;
      if (ids[mid] > cursor) hi = mid;
      else lo = mid + 1;
    }
  }
  const items = ids.slice(lo, lo + limit);
  const more = lo + limit < ids.length;
  return { items, next_cursor: items.length > 0 && more ? items[items.length - 1] : null };
}
`,
    'A binary search finds where the page starts, so the cost does not grow with how deep the client has scrolled, unlike an offset.',
  ),
  complexity: { time: 'O(log n + limit)', space: 'O(limit)' },
  mistakes: ['Returning a next cursor on the last page, so clients request one empty page.', 'Using `>=` and repeating the cursor item on the next page.', 'Using offsets: new items inserted while scrolling cause repeats or gaps.', 'Assuming the cursor is always present in the list.'],
  recap: 'A cursor says "continue after this id", which is stable while data changes and cheap to look up in an index.',
  tags: ['pagination', 'binary-search', 'rest'],
}

// ---- 10. Request validation -------------------------------------------------------------------------

const validate: CodingQuestion = {
  id: 'request-validation',
  title: 'Validate a request body',
  topic: 'API validation',
  difficulty: 'medium',
  estimated_time_minutes: 25,
  blurb: 'Check a JSON body against a small schema and return clear error messages, as a validation middleware would.',
  statement: 'Write `validate(schema, body)`. The schema maps each field name to rules: `type` (`"string"` or `"number"`), optional `required` (default false), and optional `min` / `max`.\n\nCheck the fields in the order they appear in the schema, producing at most one error per field:\n\n1. Missing (absent or `null`): if required, `"<field> is required"`; otherwise skip the field.\n2. Wrong type: `"<field> must be a <type>"`.\n3. Number out of range: `"<field> must be >= <min>"` or `"<field> must be <= <max>"`.\n4. String length out of range: `"<field> must be at least <min> characters"` or `"<field> must be at most <max> characters"`.\n\nFields in the body that are not in the schema are ignored. Return the list of error messages (empty when valid).',
  input_format: '`schema` is an object of rules. `body` is an object.',
  output_format: 'A list of error strings.',
  constraints: ['1 <= number of schema fields <= 100', 'min and max are integers when present', 'A boolean is not a number'],
  examples: [
    { input: 'schema {name: string required min 2, age: number min 18}; body {name: "A", age: 15}', output: '["name must be at least 2 characters", "age must be >= 18"]', explanation: 'Both fields are present with the right type, but both fail their range rule.' },
    { input: 'schema {name: string required}; body {}', output: '["name is required"]', explanation: 'A required field is missing.' },
  ],
  visible: 2,
  practice: {
    fn: { python: 'validate', javascript: 'validate' },
    starter: {
      python: `def validate(schema, body):
    # return a list of error messages in schema order
    pass
`,
      javascript: `function validate(schema, body) {
  // return an array of error messages in schema order
}
`,
    },
    cases: [
      { label: 'Sample 1: range errors on two fields', args: [{ name: { type: 'string', required: true, min: 2 }, age: { type: 'number', min: 18 } }, { name: 'A', age: 15 }], expected: ['name must be at least 2 characters', 'age must be >= 18'] },
      { label: 'Sample 2: a required field is missing', args: [{ name: { type: 'string', required: true } }, {}], expected: ['name is required'] },
      { label: 'Hidden: a valid body has no errors', args: [{ name: { type: 'string', required: true, max: 5 }, age: { type: 'number', min: 0, max: 120 } }, { name: 'Asha', age: 30, extra: 1 }], expected: [] },
      { label: 'Hidden: a wrong type is reported once, without range checks', args: [{ age: { type: 'number', min: 18 } }, { age: '15' }], expected: ['age must be a number'] },
      { label: 'Hidden: an optional missing field is skipped', args: [{ nick: { type: 'string', min: 3 } }, { nick: null }], expected: [] },
      { label: 'Hidden: upper bounds', args: [{ code: { type: 'string', max: 3 }, qty: { type: 'number', max: 10 } }, { code: 'ABCD', qty: 11 }], expected: ['code must be at most 3 characters', 'qty must be <= 10'] },
      { label: 'Hidden: errors follow the schema order', args: [{ a: { type: 'string', required: true }, b: { type: 'number', required: true } }, { b: 'x' }], expected: ['a is required', 'b must be a number'] },
    ],
    hints: ['Loop over the schema fields in order; look up each one in the body.', 'Treat a missing key and `null` the same way. Check required first, then the type, and only then the range.', 'For numbers compare the value, for strings compare the length. Report at most one error per field.'],
  },
  steps: ref(
    `def validate(schema, body):
    errors = []
    for field, rules in schema.items():
        value = body.get(field)
        if value is None:
            if rules.get("required"):
                errors.append(field + " is required")
            continue
        kind = rules["type"]
        if kind == "number":
            ok = isinstance(value, (int, float)) and not isinstance(value, bool)
        else:
            ok = isinstance(value, str)
        if not ok:
            errors.append(field + " must be a " + kind)
            continue
        size = value if kind == "number" else len(value)
        if "min" in rules and size < rules["min"]:
            errors.append(field + (" must be >= " if kind == "number" else " must be at least ") + str(rules["min"]) + ("" if kind == "number" else " characters"))
        elif "max" in rules and size > rules["max"]:
            errors.append(field + (" must be <= " if kind == "number" else " must be at most ") + str(rules["max"]) + ("" if kind == "number" else " characters"))
    return errors
`,
    `function validate(schema, body) {
  const errors = [];
  for (const [field, rules] of Object.entries(schema)) {
    const value = body[field];
    if (value === undefined || value === null) {
      if (rules.required) errors.push(field + " is required");
      continue;
    }
    const kind = rules.type;
    const ok = kind === "number" ? typeof value === "number" : typeof value === "string";
    if (!ok) {
      errors.push(field + " must be a " + kind);
      continue;
    }
    const size = kind === "number" ? value : value.length;
    if (rules.min !== undefined && size < rules.min) {
      errors.push(field + (kind === "number" ? " must be >= " : " must be at least ") + rules.min + (kind === "number" ? "" : " characters"));
    } else if (rules.max !== undefined && size > rules.max) {
      errors.push(field + (kind === "number" ? " must be <= " : " must be at most ") + rules.max + (kind === "number" ? "" : " characters"));
    }
  }
  return errors;
}
`,
    'Walk the schema in order and run the checks as a ladder: missing, then type, then range. A failed step stops the later ones for that field.',
  ),
  complexity: { time: 'O(number of fields)', space: 'O(number of errors)' },
  mistakes: ['Range-checking a value that already has the wrong type.', 'Treating `0` or an empty string as "missing" because they are falsy.', 'Reporting errors in the order of the body instead of the schema.', 'Trusting the client: validation in the browser never replaces validation on the server.'],
  recap: 'Validation is a ladder of checks per field (missing, type, range); stop at the first failure so each field reports one clear error.',
  tags: ['validation', 'api', 'strings'],
}

// ---- 11. Peak concurrent connections ----------------------------------------------------------------

const peak: CodingQuestion = {
  id: 'peak-connections',
  title: 'Peak concurrent connections',
  topic: 'Capacity planning',
  difficulty: 'medium',
  estimated_time_minutes: 25,
  blurb: 'Find the highest number of connections that were open at the same moment from a list of sessions.',
  statement: 'A server logs each session as `[start, end)`: it is open from `start` up to, but **not including**, `end`. Given all the sessions, return the largest number of sessions that were open at the same time. This number tells you how many connections the server must support.',
  input_format: '`sessions` is a list of `[start, end]` pairs with `start < end`, in any order.',
  output_format: 'An integer: the peak number of simultaneous sessions (0 if there are no sessions).',
  constraints: ['0 <= sessions.length <= 10^5', '0 <= start < end <= 10^9'],
  examples: [
    { input: '[[0, 5], [1, 3], [2, 6]]', output: '3', explanation: 'All three sessions are open at time 2.' },
    { input: '[[0, 2], [2, 4]]', output: '1', explanation: 'The first session ends at 2, exactly when the second starts, so they never overlap.' },
  ],
  visible: 2,
  practice: {
    fn: { python: 'peak_connections', javascript: 'peakConnections' },
    starter: {
      python: `def peak_connections(sessions):
    # return the maximum number of sessions open at the same time
    pass
`,
      javascript: `function peakConnections(sessions) {
  // return the maximum number of sessions open at the same time
}
`,
    },
    cases: [
      { label: 'Sample 1: three overlapping sessions', args: [[[0, 5], [1, 3], [2, 6]]], expected: 3 },
      { label: 'Sample 2: a session that starts when another ends does not overlap', args: [[[0, 2], [2, 4]]], expected: 1 },
      { label: 'Hidden: no sessions', args: [[]], expected: 0 },
      { label: 'Hidden: identical sessions', args: [[[1, 2], [1, 2], [1, 2]]], expected: 3 },
      { label: 'Hidden: a chain of back-to-back sessions', args: [[[0, 1], [1, 2], [2, 3]]], expected: 1 },
      { label: 'Hidden: unsorted input with a nested session', args: [[[5, 9], [0, 10], [6, 7], [20, 30]]], expected: 3 },
    ],
    hints: ['Turn every session into two events: +1 at `start` and -1 at `end`.', 'Sort the events by time. When a -1 and a +1 happen at the same time, process the -1 first (the end is exclusive).', 'Sweep through the events, keep a running count, and remember the largest value.'],
  },
  steps: ref(
    `def peak_connections(sessions):
    events = []
    for start, end in sessions:
        events.append((start, 1))
        events.append((end, -1))
    events.sort()  # at equal times -1 comes before +1
    current = best = 0
    for _, delta in events:
        current += delta
        best = max(best, current)
    return best
`,
    `function peakConnections(sessions) {
  const events = [];
  for (const [start, end] of sessions) {
    events.push([start, 1]);
    events.push([end, -1]);
  }
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]); // at equal times -1 comes before +1
  let current = 0;
  let best = 0;
  for (const [, delta] of events) {
    current += delta;
    best = Math.max(best, current);
  }
  return best;
}
`,
    'A sweep line over sorted start and end events keeps a running count of open sessions; the maximum of that count is the answer.',
  ),
  complexity: { time: 'O(n log n)', space: 'O(n)' },
  mistakes: ['Processing a start before an end at the same time, which overcounts back-to-back sessions.', 'Comparing every pair of sessions (O(n²)).', 'Sorting by start only and forgetting that sessions end.', 'Returning the number of sessions instead of the peak.'],
  recap: 'Turn intervals into +1 and -1 events, sort them, and sweep with a running count.',
  tags: ['sweep-line', 'intervals', 'capacity'],
}

// ---- 12. Merge sorted log streams -------------------------------------------------------------------

const mergeLogs: CodingQuestion = {
  id: 'merge-log-streams',
  title: 'Merge sorted log streams',
  topic: 'Data processing',
  difficulty: 'easy',
  estimated_time_minutes: 20,
  blurb: 'Combine timestamps from several servers, each already sorted, into one sorted timeline.',
  statement: 'Several servers each write their log timestamps in increasing order. Merge all of them into a single list that is sorted in non-decreasing order. Duplicates are kept.',
  input_format: '`streams` is a list of lists of non-negative integers. Each inner list is sorted in non-decreasing order and may be empty.',
  output_format: 'One sorted list holding every timestamp.',
  constraints: ['0 <= streams.length <= 1000', 'The total number of timestamps is at most 10^5'],
  examples: [
    { input: '[[1, 4, 7], [2, 5, 8], [3, 6, 9]]', output: '[1, 2, 3, 4, 5, 6, 7, 8, 9]', explanation: 'Always take the smallest value that is still waiting at the front of any stream.' },
    { input: '[[1, 1], [1]]', output: '[1, 1, 1]', explanation: 'Equal timestamps are all kept.' },
  ],
  visible: 2,
  practice: {
    fn: { python: 'merge_logs', javascript: 'mergeLogs' },
    starter: {
      python: `def merge_logs(streams):
    # return one sorted list with all timestamps
    pass
`,
      javascript: `function mergeLogs(streams) {
  // return one sorted array with all timestamps
}
`,
    },
    cases: [
      { label: 'Sample 1: three interleaved streams', args: [[[1, 4, 7], [2, 5, 8], [3, 6, 9]]], expected: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
      { label: 'Sample 2: duplicates are kept', args: [[[1, 1], [1]]], expected: [1, 1, 1] },
      { label: 'Hidden: no streams', args: [[]], expected: [] },
      { label: 'Hidden: empty streams are skipped', args: [[[], [5], [], [2, 9]]], expected: [2, 5, 9] },
      { label: 'Hidden: streams of different lengths', args: [[[1, 2, 3, 4, 5], [10]]], expected: [1, 2, 3, 4, 5, 10] },
      { label: 'Hidden: one stream is entirely before another', args: [[[10, 11], [1, 2]]], expected: [1, 2, 10, 11] },
    ],
    hints: ['Keep one pointer per stream, pointing at its next unread timestamp.', 'Repeatedly pick the stream whose next value is smallest, append that value and advance its pointer.', 'Stop when every pointer is at the end of its stream. (A heap makes picking the smallest faster.)'],
  },
  steps: ref(
    `def merge_logs(streams):
    pointers = [0] * len(streams)
    out = []
    while True:
        best = -1
        for i, stream in enumerate(streams):
            if pointers[i] < len(stream) and (best == -1 or stream[pointers[i]] < streams[best][pointers[best]]):
                best = i
        if best == -1:
            return out
        out.append(streams[best][pointers[best]])
        pointers[best] += 1
`,
    `function mergeLogs(streams) {
  const pointers = streams.map(() => 0);
  const out = [];
  for (;;) {
    let best = -1;
    for (let i = 0; i < streams.length; i++) {
      if (pointers[i] < streams[i].length && (best === -1 || streams[i][pointers[i]] < streams[best][pointers[best]])) best = i;
    }
    if (best === -1) return out;
    out.push(streams[best][pointers[best]]);
    pointers[best] += 1;
  }
}
`,
    'A k-way merge: one pointer per stream, always take the smallest front value. Using a min-heap of the fronts brings the cost down to O(N log k).',
  ),
  complexity: { time: 'O(N × k) with a scan, O(N log k) with a heap', space: 'O(k) besides the output' },
  mistakes: ['Concatenating and sorting everything, which ignores the fact that the inputs are sorted.', 'Crashing on empty streams.', 'Dropping duplicate timestamps.', 'Mutating the input lists (for example with `shift()`, which is also slow).'],
  recap: 'To merge sorted lists, always take the smallest front element; a heap makes that step fast.',
  tags: ['merge', 'k-way', 'heap', 'logs'],
}

// ---- 13. Top endpoints ------------------------------------------------------------------------------

const topEndpoints: CodingQuestion = {
  id: 'top-endpoints',
  title: 'Busiest endpoints',
  topic: 'Analytics',
  difficulty: 'easy',
  estimated_time_minutes: 15,
  blurb: 'Count requests per endpoint from an access log and report the k busiest ones.',
  statement: 'Given a list of requested paths from an access log, return the `k` most requested paths as `[path, count]` pairs. Sort by count from highest to lowest and break ties by path in alphabetical order. If there are fewer than `k` distinct paths, return all of them.',
  input_format: '`paths` is a list of strings. `k` is a non-negative integer.',
  output_format: 'A list of `[path, count]` pairs.',
  constraints: ['0 <= paths.length <= 10^5', '0 <= k <= 10^5'],
  examples: [
    { input: '["/a", "/b", "/a", "/c", "/a", "/b"], k = 2', output: '[["/a", 3], ["/b", 2]]', explanation: '/a was requested 3 times and /b twice; /c only once.' },
    { input: '["/x", "/y"], k = 5', output: '[["/x", 1], ["/y", 1]]', explanation: 'There are only two distinct paths, and the tie is broken alphabetically.' },
  ],
  visible: 2,
  practice: {
    fn: { python: 'top_endpoints', javascript: 'topEndpoints' },
    starter: {
      python: `def top_endpoints(paths, k):
    # return the k most requested [path, count] pairs
    pass
`,
      javascript: `function topEndpoints(paths, k) {
  // return the k most requested [path, count] pairs
}
`,
    },
    cases: [
      { label: 'Sample 1: the two busiest paths', args: [['/a', '/b', '/a', '/c', '/a', '/b'], 2], expected: [['/a', 3], ['/b', 2]] },
      { label: 'Sample 2: fewer paths than k, ties by name', args: [['/y', '/x'], 5], expected: [['/x', 1], ['/y', 1]] },
      { label: 'Hidden: no requests', args: [[], 3], expected: [] },
      { label: 'Hidden: k is zero', args: [['/a'], 0], expected: [] },
      { label: 'Hidden: ties are broken alphabetically', args: [['/c', '/a', '/b', '/b', '/a', '/c'], 2], expected: [['/a', 2], ['/b', 2]] },
      { label: 'Hidden: one path repeated', args: [['/h', '/h', '/h'], 1], expected: [['/h', 3]] },
    ],
    hints: ['Count the requests per path in a dictionary (or `Map`).', 'Sort the pairs by count descending and then by path ascending.', 'Return the first `k` pairs.'],
  },
  steps: ref(
    `def top_endpoints(paths, k):
    counts = {}
    for path in paths:
        counts[path] = counts.get(path, 0) + 1
    rows = [[path, n] for path, n in counts.items()]
    rows.sort(key=lambda r: (-r[1], r[0]))
    return rows[:k]
`,
    `function topEndpoints(paths, k) {
  const counts = new Map();
  for (const path of paths) counts.set(path, (counts.get(path) || 0) + 1);
  const rows = [...counts].map(([path, n]) => [path, n]);
  rows.sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  return rows.slice(0, k);
}
`,
    'Count with a hash map, then sort by count (descending) with the path as a tie-breaker. A heap would give O(n log k) for very large inputs.',
  ),
  complexity: { time: 'O(n + d log d) for d distinct paths', space: 'O(d)' },
  mistakes: ['Forgetting the alphabetical tie-breaker.', 'Sorting the raw log instead of the counts.', 'Returning more than `k` rows, or crashing when `k` is larger than the number of paths.', 'Comparing JavaScript strings with `-`.'],
  recap: 'Count in a hash map, then sort by (count descending, name ascending) and cut at k.',
  tags: ['hash-map', 'sorting', 'logs'],
}

// ---- 14. Balanced brackets --------------------------------------------------------------------------

const brackets: CodingQuestion = {
  id: 'balanced-brackets',
  title: 'Balanced brackets in a config',
  topic: 'Parsing',
  difficulty: 'easy',
  estimated_time_minutes: 15,
  blurb: 'Check that every bracket in a JSON-like text is closed in the right order.',
  statement: 'Given a text, return `true` if every `(`, `[` and `{` is closed by the matching bracket in the correct order, and `false` otherwise. All other characters are ignored.',
  input_format: '`text` is a string.',
  output_format: 'A boolean.',
  constraints: ['0 <= text.length <= 10^5'],
  examples: [
    { input: '{"a": [1, (2)]}', output: 'true', explanation: 'Each bracket is closed in the reverse order of opening.' },
    { input: '([)]', output: 'false', explanation: 'The square bracket is closed while the round bracket is still open.' },
  ],
  visible: 2,
  practice: {
    fn: { python: 'is_balanced', javascript: 'isBalanced' },
    starter: {
      python: `def is_balanced(text):
    # return True when all brackets match in the right order
    pass
`,
      javascript: `function isBalanced(text) {
  // return true when all brackets match in the right order
}
`,
    },
    cases: [
      { label: 'Sample 1: nested brackets in a JSON-like text', args: ['{"a": [1, (2)]}'], expected: true },
      { label: 'Sample 2: wrong closing order', args: ['([)]'], expected: false },
      { label: 'Hidden: empty text', args: [''], expected: true },
      { label: 'Hidden: an opening bracket is never closed', args: ['(('], expected: false },
      { label: 'Hidden: a closing bracket with nothing open', args: ['a(b)c]'], expected: false },
      { label: 'Hidden: closing before opening', args: ['}{'], expected: false },
      { label: 'Hidden: text without brackets', args: ['hello world'], expected: true },
    ],
    hints: ['Use a stack: push every opening bracket.', 'On a closing bracket, the stack must not be empty and its top must be the matching opening bracket; pop it.', 'At the end the stack must be empty.'],
  },
  steps: ref(
    `def is_balanced(text):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in text:
        if ch in "([{":
            stack.append(ch)
        elif ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
    return not stack
`,
    `function isBalanced(text) {
  const pairs = { ")": "(", "]": "[", "}": "{" };
  const stack = [];
  for (const ch of text) {
    if ("([{".includes(ch)) stack.push(ch);
    else if (ch in pairs) {
      if (stack.length === 0 || stack.pop() !== pairs[ch]) return false;
    }
  }
  return stack.length === 0;
}
`,
    'A stack remembers the open brackets; the most recent one must be closed first.',
  ),
  complexity: { time: 'O(n)', space: 'O(n)' },
  mistakes: ['Only counting brackets, which accepts `([)]`.', 'Popping from an empty stack.', 'Forgetting to check the stack is empty at the end.', 'Treating other characters (such as quotes) as brackets.'],
  recap: 'Matching nested brackets is a stack problem: last opened, first closed.',
  tags: ['stack', 'parsing', 'strings'],
}

// ---- 15. Flatten JSON -------------------------------------------------------------------------------

const flatten: CodingQuestion = {
  id: 'flatten-json',
  title: 'Flatten a nested JSON object',
  topic: 'Data transformation',
  difficulty: 'medium',
  estimated_time_minutes: 25,
  blurb: 'Turn a nested object into one level with dotted keys, as done for logging, CSV export and form fields.',
  statement: 'Write `flatten(obj)` that turns a nested object into a flat object. The key of a nested value is the path of keys joined with `"."`; list items use their index as the key part. Empty objects and empty lists are kept as values at their path. Other values (numbers, strings, booleans, null) are kept as they are.',
  input_format: '`obj` is a JSON object (it may contain nested objects and lists).',
  output_format: 'A flat object whose keys are dotted paths.',
  constraints: ['The nesting depth is at most 100', 'Keys do not contain dots', 'The total number of values is at most 10^5'],
  examples: [
    { input: '{"a": {"b": 1, "c": 2}, "d": 3}', output: '{"a.b": 1, "a.c": 2, "d": 3}', explanation: 'The nested keys are joined with a dot.' },
    { input: '{"a": [1, {"b": 2}]}', output: '{"a.0": 1, "a.1.b": 2}', explanation: 'List positions become parts of the path.' },
  ],
  visible: 2,
  practice: {
    fn: { python: 'flatten', javascript: 'flatten' },
    starter: {
      python: `def flatten(obj):
    # return a flat dict with dotted keys
    pass
`,
      javascript: `function flatten(obj) {
  // return a flat object with dotted keys
}
`,
    },
    cases: [
      { label: 'Sample 1: nested objects', args: [{ a: { b: 1, c: 2 }, d: 3 }], expected: { 'a.b': 1, 'a.c': 2, d: 3 } },
      { label: 'Sample 2: lists use their index', args: [{ a: [1, { b: 2 }] }], expected: { 'a.0': 1, 'a.1.b': 2 } },
      { label: 'Hidden: an empty object', args: [{}], expected: {} },
      { label: 'Hidden: empty containers are kept as values', args: [{ a: {}, b: [], c: { d: {} } }], expected: { a: {}, b: [], 'c.d': {} } },
      { label: 'Hidden: null and false are real values', args: [{ a: null, b: { c: false } }], expected: { a: null, 'b.c': false } },
      { label: 'Hidden: deep nesting', args: [{ a: { b: { c: { d: 'x' } } } }], expected: { 'a.b.c.d': 'x' } },
    ],
    hints: ['Write a helper that takes the current path prefix and a value, and calls itself for each child.', 'For an object use the key, for a list use the index; join with a dot unless the prefix is empty.', 'When the value is not a non-empty object or list, store it under the current path.'],
  },
  steps: ref(
    `def flatten(obj):
    out = {}

    def walk(value, path):
        if isinstance(value, dict) and value:
            for key, child in value.items():
                walk(child, key if path == "" else path + "." + key)
        elif isinstance(value, list) and value:
            for i, child in enumerate(value):
                walk(child, str(i) if path == "" else path + "." + str(i))
        else:
            out[path] = value

    for key, child in obj.items():
        walk(child, key)
    return out
`,
    `function flatten(obj) {
  const out = {};
  function walk(value, path) {
    if (Array.isArray(value) && value.length > 0) {
      value.forEach((child, i) => walk(child, path === "" ? String(i) : path + "." + i));
    } else if (value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0) {
      for (const [key, child] of Object.entries(value)) walk(child, path === "" ? key : path + "." + key);
    } else {
      out[path] = value;
    }
  }
  for (const [key, child] of Object.entries(obj)) walk(child, key);
  return out;
}
`,
    'A recursive walk carries the path so far. Containers with content recurse; everything else (including empty containers) is a leaf.',
  ),
  complexity: { time: 'O(total size of the output keys and values)', space: 'O(depth) for the recursion plus the output' },
  mistakes: ['Dropping empty objects and lists, which silently loses data.', 'Treating `null` as an object (`typeof null` is `"object"` in JavaScript).', 'Starting every key with a leading dot.', 'Forgetting that lists are objects too in Python-style checks.'],
  recap: 'Flattening is a recursive walk that builds the key path on the way down and stores leaves.',
  tags: ['recursion', 'json', 'objects'],
}

// ---- 16. Deep merge ---------------------------------------------------------------------------------

const deepMerge: CodingQuestion = {
  id: 'deep-merge-config',
  title: 'Merge configuration objects',
  topic: 'Configuration',
  difficulty: 'medium',
  estimated_time_minutes: 25,
  blurb: 'Combine default settings with user overrides, merging nested objects but replacing everything else.',
  statement: 'Implement `deep_merge(base, override)` that returns a new object. For each key in `override`: if both values are objects (not lists, not null), merge them recursively; otherwise the value from `override` replaces the one in `base` (including lists and `null`). Keys that appear only in `base` are kept. The inputs must not be changed.',
  input_format: '`base` and `override` are JSON objects.',
  output_format: 'A new merged object.',
  constraints: ['The nesting depth is at most 100', 'Total size at most 10^5 values'],
  examples: [
    { input: 'base {"db": {"host": "a", "port": 1}, "debug": false}, override {"db": {"port": 2}}', output: '{"db": {"host": "a", "port": 2}, "debug": false}', explanation: 'The db objects are merged, so host stays and port changes.' },
    { input: 'base {"tags": ["x", "y"]}, override {"tags": ["z"]}', output: '{"tags": ["z"]}', explanation: 'Lists are replaced, not merged.' },
  ],
  visible: 2,
  practice: {
    fn: { python: 'deep_merge', javascript: 'deepMerge' },
    starter: {
      python: `def deep_merge(base, override):
    # return a new merged dict; do not change the inputs
    pass
`,
      javascript: `function deepMerge(base, override) {
  // return a new merged object; do not change the inputs
}
`,
    },
    cases: [
      { label: 'Sample 1: nested objects are merged', args: [{ db: { host: 'a', port: 1 }, debug: false }, { db: { port: 2 } }], expected: { db: { host: 'a', port: 2 }, debug: false } },
      { label: 'Sample 2: lists are replaced', args: [{ tags: ['x', 'y'] }, { tags: ['z'] }], expected: { tags: ['z'] } },
      { label: 'Hidden: new keys are added', args: [{ a: 1 }, { b: { c: 2 } }], expected: { a: 1, b: { c: 2 } } },
      { label: 'Hidden: null replaces an object', args: [{ a: { b: 1 } }, { a: null }], expected: { a: null } },
      { label: 'Hidden: an object replaces a plain value', args: [{ a: 1 }, { a: { b: 2 } }], expected: { a: { b: 2 } } },
      { label: 'Hidden: empty override changes nothing', args: [{ a: { b: [1] } }, {}], expected: { a: { b: [1] } } },
    ],
    hints: ['Start from a copy of `base`.', 'For each key in `override`: if the base value and the override value are both objects, call `deep_merge` on them; otherwise take the override value.', 'Be careful: lists and `null` are not "objects" for this purpose.'],
  },
  steps: ref(
    `def deep_merge(base, override):
    def is_obj(v):
        return isinstance(v, dict)

    out = dict(base)
    for key, value in override.items():
        if key in out and is_obj(out[key]) and is_obj(value):
            out[key] = deep_merge(out[key], value)
        else:
            out[key] = value
    return out
`,
    `function deepMerge(base, override) {
  const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
  const out = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (key in out && isObj(out[key]) && isObj(value)) out[key] = deepMerge(out[key], value);
    else out[key] = value;
  }
  return out;
}
`,
    'Copy the base, then for each override key either recurse (both sides are plain objects) or replace.',
  ),
  complexity: { time: 'O(size of override plus the objects it touches)', space: 'O(size of the result)' },
  mistakes: ['Mutating `base` so later calls see changed defaults.', 'Merging lists by position or by concatenation when the rule says replace.', 'Treating `null` as an object and crashing on it.', 'Using a shallow spread, which replaces whole nested objects.'],
  recap: 'Deep merge recurses only when both sides are plain objects; everything else is replaced by the override.',
  tags: ['recursion', 'config', 'objects'],
}

// ---- 17. Query string parser ------------------------------------------------------------------------

const query: CodingQuestion = {
  id: 'query-string-parser',
  title: 'Parse a query string',
  topic: 'HTTP',
  difficulty: 'medium',
  estimated_time_minutes: 25,
  blurb: 'Turn the part of a URL after the question mark into an object, handling repeated keys and encoded characters.',
  statement: 'Write `parse_query(qs)` for a string like `"a=1&b=2&a=3"` (no leading `?`). Pairs are separated by `&` and each pair is `key=value`. Rules:\n\n- Decode `+` as a space and `%XX` as the character with that hexadecimal code (in both keys and values).\n- A key that appears once maps to its string value; a key that appears several times maps to a list of values in order.\n- A pair without `=` has the value `""`. Empty pairs (for example from `&&`) are ignored.\n\nReturn an object of the keys and values.',
  input_format: '`qs` is a string that contains only valid percent-encoding.',
  output_format: 'An object whose values are strings or lists of strings.',
  constraints: ['0 <= qs.length <= 10^5', 'Percent escapes are valid and decode to plain characters'],
  examples: [
    { input: '"a=1&b=2&a=3"', output: '{"a": ["1", "3"], "b": "2"}', explanation: 'The repeated key a becomes a list.' },
    { input: '"q=hello+world&x=%26"', output: '{"q": "hello world", "x": "&"}', explanation: '+ is a space and %26 is the ampersand character.' },
  ],
  visible: 2,
  practice: {
    fn: { python: 'parse_query', javascript: 'parseQuery' },
    starter: {
      python: `def parse_query(qs):
    # return a dict: a string value, or a list of strings for repeated keys
    pass
`,
      javascript: `function parseQuery(qs) {
  // return an object: a string value, or an array of strings for repeated keys
}
`,
    },
    cases: [
      { label: 'Sample 1: a repeated key becomes a list', args: ['a=1&b=2&a=3'], expected: { a: ['1', '3'], b: '2' } },
      { label: 'Sample 2: plus signs and percent escapes are decoded', args: ['q=hello+world&x=%26'], expected: { q: 'hello world', x: '&' } },
      { label: 'Hidden: an empty string', args: [''], expected: {} },
      { label: 'Hidden: a key without a value', args: ['flag&a=1'], expected: { flag: '', a: '1' } },
      { label: 'Hidden: empty pairs are ignored', args: ['&&a=1&&'], expected: { a: '1' } },
      { label: 'Hidden: an equals sign inside a value', args: ['expr=1%2B1=2'], expected: { expr: '1+1=2' } },
      { label: 'Hidden: three values for one key', args: ['t=a&t=b&t=c'], expected: { t: ['a', 'b', 'c'] } },
    ],
    hints: ['Split on "&" and skip empty pieces.', 'Split each piece at the FIRST "=" only: the rest (even other "=" signs) belongs to the value.', 'Decode "+" to a space first, then decode the percent escapes. Collect repeated keys in a list.'],
  },
  steps: ref(
    `from urllib.parse import unquote

def parse_query(qs):
    def decode(text):
        return unquote(text.replace("+", " "))

    out = {}
    for pair in qs.split("&"):
        if pair == "":
            continue
        key, _, value = pair.partition("=")
        key, value = decode(key), decode(value)
        if key in out:
            if isinstance(out[key], list):
                out[key].append(value)
            else:
                out[key] = [out[key], value]
        else:
            out[key] = value
    return out
`,
    `function parseQuery(qs) {
  const decode = (text) => decodeURIComponent(text.replace(/\\+/g, " "));
  const out = {};
  for (const pair of qs.split("&")) {
    if (pair === "") continue;
    const at = pair.indexOf("=");
    const key = decode(at === -1 ? pair : pair.slice(0, at));
    const value = at === -1 ? "" : decode(pair.slice(at + 1));
    if (Object.prototype.hasOwnProperty.call(out, key)) {
      if (Array.isArray(out[key])) out[key].push(value);
      else out[key] = [out[key], value];
    } else {
      out[key] = value;
    }
  }
  return out;
}
`,
    'Split into pairs, split each pair at the first "=", decode "+" and percent escapes, and promote a key to a list when it repeats.',
  ),
  complexity: { time: 'O(length of the string)', space: 'O(length of the string)' },
  mistakes: ['Splitting a pair on every "=", which breaks values that contain "=".', 'Decoding before splitting, so an encoded "&" or "=" is treated as a separator.', 'Forgetting that "+" means a space in form-encoded data.', 'Overwriting repeated keys instead of collecting them.'],
  recap: 'Split first, decode second; and a repeated key turns its value into a list.',
  tags: ['http', 'parsing', 'url'],
}

// ---- 18. Semver compare -----------------------------------------------------------------------------

const semver: CodingQuestion = {
  id: 'compare-versions',
  title: 'Compare version numbers',
  topic: 'Dependencies',
  difficulty: 'easy',
  estimated_time_minutes: 15,
  blurb: 'Decide which of two dotted version strings is newer, the way a package manager does.',
  statement: 'Compare two version strings made of dot-separated non-negative integers, such as `"1.2.10"`. Compare the numbers from left to right as integers (so `10` is greater than `9`). If one version is shorter, treat the missing parts as `0`. Return `1` if `a` is newer, `-1` if `b` is newer and `0` if they are equal.',
  input_format: '`a` and `b` are strings of integers separated by dots.',
  output_format: '`-1`, `0` or `1`.',
  constraints: ['1 <= a.length, b.length <= 200', 'Each part fits in a 32-bit integer', 'No pre-release tags such as "-beta"'],
  examples: [
    { input: '"1.2.10" and "1.2.9"', output: '1', explanation: 'The last parts are compared as numbers: 10 is greater than 9.' },
    { input: '"1.0" and "1.0.0"', output: '0', explanation: 'The missing part counts as 0, so the versions are equal.' },
  ],
  visible: 2,
  practice: {
    fn: { python: 'compare_versions', javascript: 'compareVersions' },
    starter: {
      python: `def compare_versions(a, b):
    # return 1, -1 or 0
    pass
`,
      javascript: `function compareVersions(a, b) {
  // return 1, -1 or 0
}
`,
    },
    cases: [
      { label: 'Sample 1: parts are compared as numbers', args: ['1.2.10', '1.2.9'], expected: 1 },
      { label: 'Sample 2: missing parts count as zero', args: ['1.0', '1.0.0'], expected: 0 },
      { label: 'Hidden: the older version comes first', args: ['0.9.9', '1.0.0'], expected: -1 },
      { label: 'Hidden: a longer version with a non-zero tail is newer', args: ['2', '2.0.1'], expected: -1 },
      { label: 'Hidden: equal versions', args: ['3.4.5', '3.4.5'], expected: 0 },
      { label: 'Hidden: the first difference decides', args: ['1.10', '1.9.9.9'], expected: 1 },
    ],
    hints: ['Split both strings on "." and convert every part to an integer.', 'Walk up to the longer length, using 0 when a version has no part at that position.', 'Return as soon as two parts differ.'],
  },
  steps: ref(
    `def compare_versions(a, b):
    x = [int(p) for p in a.split(".")]
    y = [int(p) for p in b.split(".")]
    for i in range(max(len(x), len(y))):
        left = x[i] if i < len(x) else 0
        right = y[i] if i < len(y) else 0
        if left != right:
            return 1 if left > right else -1
    return 0
`,
    `function compareVersions(a, b) {
  const x = a.split(".").map(Number);
  const y = b.split(".").map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const left = i < x.length ? x[i] : 0;
    const right = i < y.length ? y[i] : 0;
    if (left !== right) return left > right ? 1 : -1;
  }
  return 0;
}
`,
    'Compare part by part as integers, padding the shorter version with zeros.',
  ),
  complexity: { time: 'O(length of the strings)', space: 'O(number of parts)' },
  mistakes: ['Comparing the strings alphabetically, which says "1.10" < "1.9".', 'Not padding, so "1.0" and "1.0.0" look different.', 'Returning the difference of the numbers instead of -1, 0 or 1.', 'Stopping at the length of the shorter version.'],
  recap: 'Version parts are numbers, not text, and missing parts mean zero.',
  tags: ['strings', 'versions', 'comparison'],
}

// ---- 19. Event deduplication ------------------------------------------------------------------------

const dedupe: CodingQuestion = {
  id: 'dedupe-events',
  title: 'Drop duplicate events',
  topic: 'Event processing',
  difficulty: 'medium',
  estimated_time_minutes: 25,
  blurb: 'Ignore repeats of the same event that arrive within a time window, as a webhook or notification system does.',
  statement: 'Events arrive as `[time, key]` in non-decreasing time order. An event is **kept** unless the same key was **kept** less than `window` time units earlier (that is, `time - lastKeptTime < window`). A dropped event does not extend the window. Return the kept events in order.',
  input_format: '`events` is a list of `[time, key]` pairs with integer times and string keys. `window` is a positive integer.',
  output_format: 'The list of kept `[time, key]` pairs.',
  constraints: ['0 <= events.length <= 10^5', '1 <= window <= 10^9'],
  examples: [
    { input: 'window 10, events [0 a], [5 a], [10 a], [12 b]', output: '[0 a], [10 a], [12 b]', explanation: 'The a at 5 is a repeat (5 < 10). The a at 10 is exactly 10 after the kept one, so it is kept.' },
    { input: 'window 10, events [0 a], [9 a], [15 a]', output: '[0 a], [15 a]', explanation: 'The a at 9 is dropped and does not extend the window, so the a at 15 is kept.' },
  ],
  visible: 2,
  practice: {
    fn: { python: 'dedupe_events', javascript: 'dedupeEvents' },
    starter: {
      python: `def dedupe_events(window, events):
    # return the kept [time, key] events
    pass
`,
      javascript: `function dedupeEvents(window, events) {
  // return the kept [time, key] events
}
`,
    },
    cases: [
      { label: 'Sample 1: a repeat inside the window is dropped', args: [10, [[0, 'a'], [5, 'a'], [10, 'a'], [12, 'b']]], expected: [[0, 'a'], [10, 'a'], [12, 'b']] },
      { label: 'Sample 2: a dropped event does not extend the window', args: [10, [[0, 'a'], [9, 'a'], [15, 'a']]], expected: [[0, 'a'], [15, 'a']] },
      { label: 'Hidden: no events', args: [5, []], expected: [] },
      { label: 'Hidden: different keys never clash', args: [100, [[0, 'a'], [1, 'b'], [2, 'c']]], expected: [[0, 'a'], [1, 'b'], [2, 'c']] },
      { label: 'Hidden: events at the same time with the same key', args: [5, [[3, 'x'], [3, 'x'], [3, 'y']]], expected: [[3, 'x'], [3, 'y']] },
      { label: 'Hidden: a steady stream keeps every window-th event', args: [3, [[0, 'k'], [1, 'k'], [2, 'k'], [3, 'k'], [4, 'k'], [5, 'k'], [6, 'k']]], expected: [[0, 'k'], [3, 'k'], [6, 'k']] },
    ],
    hints: ['Remember, for each key, the time of the last event you kept.', 'For a new event, keep it if the key is new or `time - last >= window`.', 'Update the remembered time only when you keep the event.'],
  },
  steps: ref(
    `def dedupe_events(window, events):
    last_kept = {}
    kept = []
    for t, key in events:
        if key not in last_kept or t - last_kept[key] >= window:
            last_kept[key] = t
            kept.append([t, key])
    return kept
`,
    `function dedupeEvents(window, events) {
  const lastKept = new Map();
  const kept = [];
  for (const [t, key] of events) {
    if (!lastKept.has(key) || t - lastKept.get(key) >= window) {
      lastKept.set(key, t);
      kept.push([t, key]);
    }
  }
  return kept;
}
`,
    'One map from key to the time of its last kept event is enough; only kept events move the window.',
  ),
  complexity: { time: 'O(n)', space: 'O(distinct keys)' },
  mistakes: ['Updating the last time for dropped events, which makes the window slide forever.', 'Using `>` instead of `>=` at the boundary.', 'Treating different keys as duplicates of each other.', 'Keeping all events in memory forever (real systems expire old keys).'],
  recap: 'Deduplication needs one remembered timestamp per key, updated only when an event is kept.',
  tags: ['dedupe', 'webhooks', 'hash-map'],
}

// ---- 20. Token bucket -------------------------------------------------------------------------------

const tokenBucket: CodingQuestion = {
  id: 'token-bucket-limiter',
  title: 'Token bucket rate limiter',
  topic: 'API protection',
  difficulty: 'medium',
  estimated_time_minutes: 25,
  blurb: 'Allow short bursts but a steady average rate, by spending tokens that refill over time.',
  statement: 'A token bucket holds at most `capacity` tokens and starts full. It gains `rate` tokens per time unit (whole tokens, capped at `capacity`). Each request at time `t` first adds the tokens earned since the previous request, then needs **1 token**: if at least 1 is available the request is allowed and one token is removed, otherwise it is rejected (and no token is removed).\n\nGiven the request times in non-decreasing order, return whether each request is allowed.',
  input_format: '`capacity` and `rate` are positive integers. `times` is a list of integers in non-decreasing order (the bucket is full at time 0).',
  output_format: 'A list of booleans.',
  constraints: ['1 <= capacity, rate <= 10^6', '0 <= times.length <= 10^5', 'Times are integers between 0 and 10^9'],
  examples: [
    { input: 'capacity 2, rate 1, times [0, 0, 0, 1, 2]', output: '[true, true, false, true, true]', explanation: 'Two requests at time 0 empty the bucket and the third is rejected. One token is earned by time 1 and another by time 2.' },
    { input: 'capacity 1, rate 1, times [0, 0, 5]', output: '[true, false, true]', explanation: 'After a long pause the bucket refills, but never above its capacity.' },
  ],
  visible: 2,
  practice: {
    fn: { python: 'token_bucket', javascript: 'tokenBucket' },
    starter: {
      python: `def token_bucket(capacity, rate, times):
    # return a list of booleans, one per request
    pass
`,
      javascript: `function tokenBucket(capacity, rate, times) {
  // return an array of booleans, one per request
}
`,
    },
    cases: [
      { label: 'Sample 1: a burst, then a steady refill', args: [2, 1, [0, 0, 0, 1, 2]], expected: [true, true, false, true, true] },
      { label: 'Sample 2: the bucket never holds more than its capacity', args: [1, 1, [0, 0, 5]], expected: [true, false, true] },
      { label: 'Hidden: no requests', args: [3, 1, []], expected: [] },
      { label: 'Hidden: a faster refill rate', args: [5, 2, [0, 0, 0, 0, 0, 0, 1, 1, 1]], expected: [true, true, true, true, true, false, true, true, false] },
      { label: 'Hidden: rejected requests do not spend tokens', args: [1, 1, [0, 0, 0, 1]], expected: [true, false, false, true] },
      { label: 'Hidden: a long gap refills only up to the capacity', args: [3, 1, [0, 0, 0, 0, 100, 100, 100, 100]], expected: [true, true, true, false, true, true, true, false] },
    ],
    hints: ['Track the number of tokens and the time of the previous request.', 'Before each request add `(t - last) * rate` tokens, but never go above `capacity`.', 'If `tokens >= 1`, allow the request and subtract 1; otherwise reject without changing the tokens.'],
  },
  steps: ref(
    `def token_bucket(capacity, rate, times):
    tokens = capacity
    last = 0
    out = []
    for t in times:
        tokens = min(capacity, tokens + (t - last) * rate)
        last = t
        if tokens >= 1:
            tokens -= 1
            out.append(True)
        else:
            out.append(False)
    return out
`,
    `function tokenBucket(capacity, rate, times) {
  let tokens = capacity;
  let last = 0;
  const out = [];
  for (const t of times) {
    tokens = Math.min(capacity, tokens + (t - last) * rate);
    last = t;
    if (tokens >= 1) {
      tokens -= 1;
      out.push(true);
    } else {
      out.push(false);
    }
  }
  return out;
}
`,
    'Refill lazily when a request arrives: add the tokens earned since the last request (capped), then spend one if available.',
  ),
  complexity: { time: 'O(n)', space: 'O(1) besides the output' },
  mistakes: ['Refilling with a timer instead of computing the tokens from the elapsed time.', 'Letting the bucket grow past its capacity.', 'Spending a token on a rejected request.', 'Forgetting to update the last time when a request is rejected.'],
  recap: 'A token bucket is two numbers (tokens and last time); refill lazily, cap at capacity, spend on success.',
  tags: ['rate-limiting', 'token-bucket', 'simulation'],
}

// ---- 21. Circuit breaker ----------------------------------------------------------------------------

const breaker: CodingQuestion = {
  id: 'circuit-breaker',
  title: 'Circuit breaker state machine',
  topic: 'Resilience',
  difficulty: 'hard',
  estimated_time_minutes: 35,
  blurb: 'Stop calling a failing service for a while, then test it with a single trial call, as libraries like Resilience4j do.',
  statement: 'A circuit breaker protects calls to a service.\n\n- **Closed:** calls are allowed. Count consecutive failures (a success resets the count to 0). When the count reaches `threshold`, the breaker **opens** at that call\'s time.\n- **Open:** calls are **blocked** (the service is not called) until `cooldown` time units have passed since it opened. A call at time `>= opened_at + cooldown` is a **trial**.\n- **Trial (half-open):** the call is allowed. If it succeeds the breaker closes (failures reset to 0). If it fails the breaker opens again at this call\'s time.\n\nYou get each call as `[time, ok]`, where `ok` says whether the service would succeed if called (ignored when the call is blocked). Return `"allowed"` or `"blocked"` for every call.',
  input_format: '`threshold` and `cooldown` are positive integers. `calls` is a list of `[time, ok]` with non-decreasing integer times.',
  output_format: 'A list of the strings `"allowed"` and `"blocked"`.',
  constraints: ['1 <= threshold <= 10^5', '1 <= cooldown <= 10^9', '0 <= calls.length <= 10^5'],
  examples: [
    { input: 'threshold 2, cooldown 10, calls [0 fail], [1 fail], [2 ok], [11 ok], [12 fail]', output: 'allowed, allowed, blocked, allowed, allowed', explanation: 'Two failures open the breaker at time 1. The call at 2 is blocked. At 11 (= 1 + 10) a trial is allowed and succeeds, closing the breaker.' },
    { input: 'threshold 1, cooldown 5, calls [0 fail], [5 fail], [9 ok], [10 ok]', output: 'allowed, allowed, blocked, allowed', explanation: 'The trial at 5 fails and reopens the breaker at 5. The call at 9 is blocked; the call at 10 is a new trial.' },
  ],
  visible: 2,
  practice: {
    fn: { python: 'circuit_breaker', javascript: 'circuitBreaker' },
    starter: {
      python: `def circuit_breaker(threshold, cooldown, calls):
    # return "allowed" or "blocked" for every call
    pass
`,
      javascript: `function circuitBreaker(threshold, cooldown, calls) {
  // return "allowed" or "blocked" for every call
}
`,
    },
    cases: [
      { label: 'Sample 1: it opens, blocks, then a trial closes it', args: [2, 10, [[0, false], [1, false], [2, true], [11, true], [12, false]]], expected: ['allowed', 'allowed', 'blocked', 'allowed', 'allowed'] },
      { label: 'Sample 2: a failed trial opens the breaker again', args: [1, 5, [[0, false], [5, false], [9, true], [10, true]]], expected: ['allowed', 'allowed', 'blocked', 'allowed'] },
      { label: 'Hidden: no calls', args: [3, 10, []], expected: [] },
      { label: 'Hidden: a success resets the failure count', args: [2, 10, [[0, false], [1, true], [2, false], [3, true], [4, false]]], expected: ['allowed', 'allowed', 'allowed', 'allowed', 'allowed'] },
      { label: 'Hidden: calls just before the cooldown ends are blocked', args: [1, 10, [[0, false], [9, true], [10, true]]], expected: ['allowed', 'blocked', 'allowed'] },
      { label: 'Hidden: after closing, failures count from zero again', args: [2, 5, [[0, false], [1, false], [6, true], [7, false], [8, true], [9, false], [10, false], [11, true]]], expected: ['allowed', 'allowed', 'allowed', 'allowed', 'allowed', 'allowed', 'allowed', 'blocked'] },
    ],
    hints: ['Keep three things: the current state (closed or open), the failure count and the time the breaker opened.', 'When open and `time < opened_at + cooldown`, the call is blocked and changes nothing. Otherwise it is a trial.', 'After an allowed call: success closes the breaker and resets the count; a failure either adds to the count (when closed) or reopens at this time (after a trial).'],
  },
  steps: ref(
    `def circuit_breaker(threshold, cooldown, calls):
    failures = 0
    opened_at = None  # None means closed
    out = []
    for t, ok in calls:
        if opened_at is not None and t < opened_at + cooldown:
            out.append("blocked")
            continue
        out.append("allowed")
        if ok:
            failures = 0
            opened_at = None
        elif opened_at is not None:
            opened_at = t  # a failed trial reopens it
        else:
            failures += 1
            if failures >= threshold:
                opened_at = t
    return out
`,
    `function circuitBreaker(threshold, cooldown, calls) {
  let failures = 0;
  let openedAt = null; // null means closed
  const out = [];
  for (const [t, ok] of calls) {
    if (openedAt !== null && t < openedAt + cooldown) {
      out.push("blocked");
      continue;
    }
    out.push("allowed");
    if (ok) {
      failures = 0;
      openedAt = null;
    } else if (openedAt !== null) {
      openedAt = t; // a failed trial reopens it
    } else {
      failures += 1;
      if (failures >= threshold) openedAt = t;
    }
  }
  return out;
}
`,
    'The whole state machine is a failure count and an optional "opened at" time. A call is blocked only while the cooldown has not passed.',
  ),
  complexity: { time: 'O(n)', space: 'O(1) besides the output' },
  mistakes: ['Counting failures that are not consecutive.', 'Forgetting to reset the count when the trial succeeds.', 'Letting blocked calls change the state or the failure count.', 'Using `>` instead of `>=` for the end of the cooldown.'],
  recap: 'A circuit breaker is closed, open or in a trial: it trips after consecutive failures and heals through one trial call.',
  tags: ['circuit-breaker', 'resilience', 'state-machine'],
}

// ---- 22. Autocomplete -------------------------------------------------------------------------------

const autocomplete: CodingQuestion = {
  id: 'autocomplete-suggestions',
  title: 'Autocomplete suggestions',
  topic: 'Search',
  difficulty: 'easy',
  estimated_time_minutes: 15,
  blurb: 'Return the first few words that start with what the user has typed, in alphabetical order.',
  statement: 'Given a list of words (it may contain duplicates), a typed `prefix` and a number `k`, return up to `k` **distinct** words that start with the prefix, in alphabetical order. Matching is case-sensitive.',
  input_format: '`words` is a list of strings. `prefix` is a string (possibly empty). `k` is a non-negative integer.',
  output_format: 'A list of at most `k` strings.',
  constraints: ['0 <= words.length <= 10^5', '0 <= k <= 10^5'],
  examples: [
    { input: 'words ["car", "cat", "dog", "cart", "car"], prefix "ca", k 2', output: '["car", "cart"]', explanation: 'The matching distinct words are car, cart and cat; the first two alphabetically are returned.' },
    { input: 'words ["a", "b"], prefix "", k 5', output: '["a", "b"]', explanation: 'An empty prefix matches every word.' },
  ],
  visible: 2,
  practice: {
    fn: { python: 'autocomplete', javascript: 'autocomplete' },
    starter: {
      python: `def autocomplete(words, prefix, k):
    # return up to k distinct matching words in alphabetical order
    pass
`,
      javascript: `function autocomplete(words, prefix, k) {
  // return up to k distinct matching words in alphabetical order
}
`,
    },
    cases: [
      { label: 'Sample 1: the first two matches in order', args: [['car', 'cat', 'dog', 'cart', 'car'], 'ca', 2], expected: ['car', 'cart'] },
      { label: 'Sample 2: an empty prefix matches everything', args: [['b', 'a'], '', 5], expected: ['a', 'b'] },
      { label: 'Hidden: nothing matches', args: [['apple'], 'z', 3], expected: [] },
      { label: 'Hidden: k is zero', args: [['apple'], 'a', 0], expected: [] },
      { label: 'Hidden: matching is case-sensitive', args: [['Apple', 'apple', 'apricot'], 'ap', 5], expected: ['apple', 'apricot'] },
      { label: 'Hidden: duplicates are listed once', args: [['go', 'go', 'goal', 'go'], 'go', 5], expected: ['go', 'goal'] },
    ],
    hints: ['Keep only words that start with the prefix.', 'Remove duplicates, for example with a set.', 'Sort alphabetically and return the first `k`.'],
  },
  steps: ref(
    `def autocomplete(words, prefix, k):
    matches = sorted({w for w in words if w.startswith(prefix)})
    return matches[:k]
`,
    `function autocomplete(words, prefix, k) {
  const matches = [...new Set(words.filter((w) => w.startsWith(prefix)))];
  matches.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return matches.slice(0, k);
}
`,
    'Filter by prefix, remove duplicates, sort and cut. For huge dictionaries a trie (or a sorted array with binary search) avoids scanning every word.',
  ),
  complexity: { time: 'O(n × L + m log m) for n words of length L and m matches', space: 'O(m)' },
  mistakes: ['Returning duplicates.', 'Using the default JavaScript sort for words with capital letters without a plain comparison.', 'Matching the prefix anywhere in the word instead of at the start.', 'Not handling `k` larger than the number of matches.'],
  recap: 'Autocomplete is filter by prefix, deduplicate, sort and take k; a trie speeds it up at scale.',
  tags: ['strings', 'search', 'sorting'],
}

// ---- 23. JSON diff ----------------------------------------------------------------------------------

const jsonDiff: CodingQuestion = {
  id: 'json-diff',
  title: 'Diff two JSON objects',
  topic: 'Data comparison',
  difficulty: 'hard',
  estimated_time_minutes: 35,
  blurb: 'List which fields were added, removed or changed between two versions of a record, like an audit log does.',
  statement: 'Write `json_diff(a, b)` that compares two JSON objects and returns a list of `[kind, path]` entries, sorted by `path` (plain string order). `path` is the keys joined with `"."`.\n\n- `"added"`: the key exists only in `b`.\n- `"removed"`: the key exists only in `a`.\n- `"changed"`: the key exists in both with different values.\n\nWhen both values are objects, compare them recursively and report the inner paths. Lists and other values are compared as whole values (deeply equal means unchanged). Report an added or removed object as one entry for its own path.',
  input_format: '`a` and `b` are JSON objects.',
  output_format: 'A list of `[kind, path]` pairs sorted by path.',
  constraints: ['The nesting depth is at most 50', 'Keys do not contain dots', 'The total number of values is at most 10^5'],
  examples: [
    { input: 'a {"name": "Asha", "age": 30}, b {"name": "Asha", "age": 31, "city": "Pune"}', output: '[["changed", "age"], ["added", "city"]]', explanation: 'age changed, city is new and name is the same.' },
    { input: 'a {"x": {"y": 1}}, b {"x": {"y": 2}}', output: '[["changed", "x.y"]]', explanation: 'Objects are compared recursively, so the path of the inner key is reported.' },
  ],
  visible: 2,
  practice: {
    fn: { python: 'json_diff', javascript: 'jsonDiff' },
    starter: {
      python: `def json_diff(a, b):
    # return a list of [kind, path] sorted by path
    pass
`,
      javascript: `function jsonDiff(a, b) {
  // return an array of [kind, path] sorted by path
}
`,
    },
    cases: [
      { label: 'Sample 1: changed and added fields', args: [{ name: 'Asha', age: 30 }, { name: 'Asha', age: 31, city: 'Pune' }], expected: [['changed', 'age'], ['added', 'city']] },
      { label: 'Sample 2: a nested change is reported by its full path', args: [{ x: { y: 1 } }, { x: { y: 2 } }], expected: [['changed', 'x.y']] },
      { label: 'Hidden: identical objects', args: [{ a: [1, 2], b: { c: null } }, { a: [1, 2], b: { c: null } }], expected: [] },
      { label: 'Hidden: removed fields', args: [{ a: 1, b: 2 }, { a: 1 }], expected: [['removed', 'b']] },
      { label: 'Hidden: lists are compared as whole values', args: [{ tags: ['a', 'b'] }, { tags: ['a', 'c'] }], expected: [['changed', 'tags']] },
      { label: 'Hidden: an added object is one entry', args: [{}, { user: { name: 'x', age: 1 } }], expected: [['added', 'user']] },
      { label: 'Hidden: a value changes type', args: [{ a: 1, b: { c: 1 } }, { a: { z: 1 }, b: 5 }], expected: [['changed', 'a'], ['changed', 'b']] },
    ],
    hints: ['Write a helper that compares two objects with a path prefix and fills a result list.', 'For each key: only in `b` is added, only in `a` is removed; if both values are objects recurse, otherwise compare them for deep equality.', 'Sort the result by path at the end.'],
  },
  steps: ref(
    `def json_diff(a, b):
    out = []

    def is_obj(v):
        return isinstance(v, dict)

    def walk(x, y, prefix):
        for key in set(x) | set(y):
            path = prefix + key
            if key not in y:
                out.append(["removed", path])
            elif key not in x:
                out.append(["added", path])
            elif is_obj(x[key]) and is_obj(y[key]):
                walk(x[key], y[key], path + ".")
            elif x[key] != y[key] or type(x[key]) is not type(y[key]):
                out.append(["changed", path])

    walk(a, b, "")
    out.sort(key=lambda e: e[1])
    return out
`,
    `function jsonDiff(a, b) {
  const out = [];
  const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
  const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);

  function walk(x, y, prefix) {
    const keys = new Set([...Object.keys(x), ...Object.keys(y)]);
    for (const key of keys) {
      const path = prefix + key;
      if (!(key in y)) out.push(["removed", path]);
      else if (!(key in x)) out.push(["added", path]);
      else if (isObj(x[key]) && isObj(y[key])) walk(x[key], y[key], path + ".");
      else if (!same(x[key], y[key])) out.push(["changed", path]);
    }
  }

  walk(a, b, "");
  out.sort((p, q) => (p[1] < q[1] ? -1 : p[1] > q[1] ? 1 : 0));
  return out;
}
`,
    'Walk both objects together, building the path. Objects on both sides recurse; anything else is compared as a whole value. Sort the paths at the end.',
  ),
  complexity: { time: 'O(size of both objects + r log r) for r reported changes', space: 'O(depth + r)' },
  mistakes: ['Reporting every inner key of an added or removed object instead of one entry.', 'Comparing lists element by element and reporting indexes (the rule says whole values).', 'Treating `null` as an object and crashing in the recursion.', 'Forgetting the final sort, so the order depends on key order.'],
  recap: 'A diff walks both structures together: missing keys are added or removed, objects recurse, everything else is compared whole.',
  tags: ['diff', 'recursion', 'json'],
}

// ---- 24. Cart total ---------------------------------------------------------------------------------

const cart: CodingQuestion = {
  id: 'cart-total',
  title: 'Shopping cart total',
  topic: 'E-commerce',
  difficulty: 'medium',
  estimated_time_minutes: 25,
  blurb: 'Compute subtotal, coupon discount, tax and total with whole-number money (paise or cents) so rounding is exact.',
  statement: 'All money is in whole minor units (paise or cents), so there are no decimals. Given cart `items` as `[price, quantity]` and an optional `coupon`:\n\n1. `subtotal` = sum of `price × quantity`.\n2. `discount`: for `["percent", p]` it is `subtotal × p // 100` (rounded down); for `["fixed", amount]` it is `min(amount, subtotal)`; for `null` it is 0.\n3. `tax` is 18% of `(subtotal - discount)`, rounded half up: `((subtotal - discount) × 18 + 50) // 100`.\n4. `total` = `subtotal - discount + tax`.\n\nReturn an object with `subtotal`, `discount`, `tax` and `total`.',
  input_format: '`items` is a list of `[price, quantity]` with non-negative integers. `coupon` is `null`, `["percent", p]` with `0 <= p <= 100`, or `["fixed", amount]`.',
  output_format: 'An object `{ subtotal, discount, tax, total }` of integers.',
  constraints: ['0 <= items.length <= 10^4', 'All values fit comfortably in 53-bit integers'],
  examples: [
    { input: 'items [[1000, 2], [550, 1]], coupon ["percent", 10]', output: '{ subtotal: 2550, discount: 255, tax: 413, total: 2708 }', explanation: 'Subtotal 2550; 10% discount is 255; tax is 18% of 2295 = 413.1, rounded to 413.' },
    { input: 'items [[500, 1]], coupon ["fixed", 900]', output: '{ subtotal: 500, discount: 500, tax: 0, total: 0 }', explanation: 'The fixed discount can not be more than the subtotal.' },
  ],
  visible: 2,
  practice: {
    fn: { python: 'cart_total', javascript: 'cartTotal' },
    starter: {
      python: `def cart_total(items, coupon):
    # return {"subtotal": ..., "discount": ..., "tax": ..., "total": ...}
    pass
`,
      javascript: `function cartTotal(items, coupon) {
  // return { subtotal, discount, tax, total }
}
`,
    },
    cases: [
      { label: 'Sample 1: a percentage coupon', args: [[[1000, 2], [550, 1]], ['percent', 10]], expected: { subtotal: 2550, discount: 255, tax: 413, total: 2708 } },
      { label: 'Sample 2: a fixed coupon larger than the subtotal', args: [[[500, 1]], ['fixed', 900]], expected: { subtotal: 500, discount: 500, tax: 0, total: 0 } },
      { label: 'Hidden: an empty cart', args: [[], null], expected: { subtotal: 0, discount: 0, tax: 0, total: 0 } },
      { label: 'Hidden: no coupon', args: [[[999, 3]], null], expected: { subtotal: 2997, discount: 0, tax: 539, total: 3536 } },
      { label: 'Hidden: the percentage discount is rounded down', args: [[[333, 1]], ['percent', 50]], expected: { subtotal: 333, discount: 166, tax: 30, total: 197 } },
      { label: 'Hidden: a fixed coupon smaller than the subtotal', args: [[[2000, 1], [100, 5]], ['fixed', 300]], expected: { subtotal: 2500, discount: 300, tax: 396, total: 2596 } },
    ],
    hints: ['Use integer arithmetic only: `//` in Python, and `Math.floor` in JavaScript for the percentage discount.', 'Tax is charged on the amount after the discount, and is rounded half up with the `+ 50` trick.', 'The total is the discounted amount plus the tax.'],
  },
  steps: ref(
    `def cart_total(items, coupon):
    subtotal = sum(price * qty for price, qty in items)
    if coupon is None:
        discount = 0
    elif coupon[0] == "percent":
        discount = subtotal * coupon[1] // 100
    else:
        discount = min(coupon[1], subtotal)
    taxable = subtotal - discount
    tax = (taxable * 18 + 50) // 100
    return {"subtotal": subtotal, "discount": discount, "tax": tax, "total": taxable + tax}
`,
    `function cartTotal(items, coupon) {
  const subtotal = items.reduce((sum, [price, qty]) => sum + price * qty, 0);
  let discount = 0;
  if (coupon !== null) {
    discount = coupon[0] === "percent" ? Math.floor((subtotal * coupon[1]) / 100) : Math.min(coupon[1], subtotal);
  }
  const taxable = subtotal - discount;
  const tax = Math.floor((taxable * 18 + 50) / 100);
  return { subtotal, discount, tax, total: taxable + tax };
}
`,
    'Keep money in whole minor units so there is no floating-point error; follow the order: subtotal, discount, tax on the discounted amount, total.',
  ),
  complexity: { time: 'O(number of items)', space: 'O(1)' },
  mistakes: ['Using floating-point numbers for money (0.1 + 0.2 problems).', 'Charging tax on the amount before the discount.', 'Letting a fixed coupon make the total negative.', 'Rounding the percentage discount up instead of down.'],
  recap: 'Store money as integers of the smallest unit and apply the steps in a fixed order.',
  tags: ['money', 'integers', 'e-commerce'],
}

// ---- 25. LFU cache ----------------------------------------------------------------------------------

const lfu: CodingQuestion = {
  id: 'lfu-cache',
  title: 'LFU cache',
  topic: 'Caching',
  difficulty: 'hard',
  estimated_time_minutes: 40,
  blurb: 'Evict the least frequently used entry, using recency to break ties.',
  statement: 'Implement `LFUCache(capacity)` with `get(key)` and `put(key, value)`.\n\nEvery entry has a **use count**. A new entry starts with 1. Each successful `get` and each `put` that updates an existing key increases the count by 1. When a new key is added to a full cache, evict the entry with the **lowest use count**; if several have the lowest count, evict the **least recently used** of them. `get` returns the value, or `null` if the key is missing. A cache with capacity 0 stores nothing.',
  input_format: '`capacity` is a non-negative integer. Operations are given as `["put", key, value]` and `["get", key]` through a small driver.',
  output_format: '`get` returns the value or `null`; `put` returns nothing.',
  constraints: ['0 <= capacity <= 10^5', 'Keys are strings, values are integers'],
  examples: [
    { input: 'capacity 2: put a 1; put b 2; get a; put c 3; get b; get a', output: '1, null, 1', explanation: 'a has been used twice and b once, so adding c evicts b.' },
    { input: 'capacity 2: put a 1; put b 2; put c 3; get a', output: 'null', explanation: 'a and b both have count 1; a is the least recently used, so it is evicted when c arrives.' },
  ],
  visible: 2,
  practice: {
    fn: { python: 'simulate_lfu', javascript: 'simulateLfu' },
    symbol: { python: 'class LFUCache', javascript: 'class LFUCache' },
    driver: {
      python: `def simulate_lfu(capacity, ops):
    cache = LFUCache(capacity)
    out = []
    for op in ops:
        if op[0] == "put":
            cache.put(op[1], op[2])
        else:
            out.append(cache.get(op[1]))
    return out
`,
      javascript: `function simulateLfu(capacity, ops) {
  const cache = new LFUCache(capacity);
  const out = [];
  for (const op of ops) {
    if (op[0] === "put") cache.put(op[1], op[2]);
    else {
      const v = cache.get(op[1]);
      out.push(v === undefined ? null : v);
    }
  }
  return out;
}
`,
    },
    starter: {
      python: `class LFUCache:
    def __init__(self, capacity):
        pass

    def get(self, key):
        pass

    def put(self, key, value):
        pass
`,
      javascript: `class LFUCache {
  constructor(capacity) {}

  get(key) {}

  put(key, value) {}
}
`,
    },
    cases: [
      { label: 'Sample 1: the less used entry is evicted', args: [2, [['put', 'a', 1], ['put', 'b', 2], ['get', 'a'], ['put', 'c', 3], ['get', 'b'], ['get', 'a']]], expected: [1, null, 1] },
      { label: 'Sample 2: ties go to the least recently used', args: [2, [['put', 'a', 1], ['put', 'b', 2], ['put', 'c', 3], ['get', 'a'], ['get', 'b'], ['get', 'c']]], expected: [null, 2, 3] },
      { label: 'Hidden: a capacity of zero stores nothing', args: [0, [['put', 'a', 1], ['get', 'a']]], expected: [null] },
      { label: 'Hidden: updating a key counts as a use', args: [2, [['put', 'a', 1], ['put', 'b', 2], ['put', 'a', 10], ['put', 'c', 3], ['get', 'a'], ['get', 'b'], ['get', 'c']]], expected: [10, null, 3] },
      { label: 'Hidden: a new entry can be evicted by the next newcomer', args: [1, [['put', 'a', 1], ['get', 'a'], ['put', 'b', 2], ['get', 'a'], ['get', 'b']]], expected: [1, null, 2] },
      { label: 'Hidden: counts beat recency', args: [2, [['put', 'a', 1], ['get', 'a'], ['get', 'a'], ['put', 'b', 2], ['put', 'c', 3], ['get', 'a'], ['get', 'b'], ['get', 'c']]], expected: [1, 1, 1, null, 3] },
    ],
    hints: ['Store for each key its value, its use count and the "time" of its last use (a counter that goes up on every operation).', 'To evict, find the entry with the smallest (count, last use) pair and delete it. A simple scan is fine for the tests.', 'Remember: `get` on a missing key changes nothing, and `put` on an existing key increases its count.'],
  },
  steps: ref(
    `class LFUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.entries = {}  # key -> [value, count, last_use]
        self.clock = 0

    def _touch(self, key):
        self.clock += 1
        entry = self.entries[key]
        entry[1] += 1
        entry[2] = self.clock

    def get(self, key):
        if key not in self.entries:
            return None
        self._touch(key)
        return self.entries[key][0]

    def put(self, key, value):
        if self.capacity == 0:
            return
        if key in self.entries:
            self.entries[key][0] = value
            self._touch(key)
            return
        if len(self.entries) >= self.capacity:
            victim = min(self.entries, key=lambda k: (self.entries[k][1], self.entries[k][2]))
            del self.entries[victim]
        self.clock += 1
        self.entries[key] = [value, 1, self.clock]
`,
    `class LFUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.entries = new Map(); // key -> { value, count, lastUse }
    this.clock = 0;
  }

  touch(key) {
    const entry = this.entries.get(key);
    this.clock += 1;
    entry.count += 1;
    entry.lastUse = this.clock;
  }

  get(key) {
    if (!this.entries.has(key)) return null;
    this.touch(key);
    return this.entries.get(key).value;
  }

  put(key, value) {
    if (this.capacity === 0) return;
    if (this.entries.has(key)) {
      this.entries.get(key).value = value;
      this.touch(key);
      return;
    }
    if (this.entries.size >= this.capacity) {
      let victim = null;
      for (const [k, e] of this.entries) {
        const v = victim === null ? null : this.entries.get(victim);
        if (v === null || e.count < v.count || (e.count === v.count && e.lastUse < v.lastUse)) victim = k;
      }
      this.entries.delete(victim);
    }
    this.clock += 1;
    this.entries.set(key, { value, count: 1, lastUse: this.clock });
  }
}
`,
    'Each entry carries its use count and the time of its last use; the eviction victim is the smallest (count, last use) pair. This scan is O(n) per eviction; an O(1) design keeps one ordered list per count.',
  ),
  complexity: { time: 'get O(1); put O(n) when it must evict (O(1) with a list per count)', space: 'O(capacity)' },
  mistakes: ['Forgetting that updating an existing key also counts as a use.', 'Breaking ties by insertion order instead of last use.', 'Evicting before checking whether the key already exists.', 'Not handling a capacity of zero.'],
  recap: 'LFU evicts by (use count, last use); remember to count both reads and updates.',
  tags: ['cache', 'lfu', 'data-structures'],
}

export const CODING: CodingQuestion[] = [aggregate, topEndpoints, brackets, mergeLogs, autocomplete, semver, retry, debounce, cursor, rateLimit, tokenBucket, dedupe, route, validate, peak, flatten, deepMerge, query, cart, ttlCache, pool, breaker, jsonDiff, lfu, sse]
export const CODING_BY_ID: Record<string, CodingQuestion> = Object.fromEntries(CODING.map((c) => [c.id, c]))
