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

export const CODING: CodingQuestion[] = [aggregate, retry, debounce, cursor, rateLimit, route, validate, peak, ttlCache, pool, sse]
export const CODING_BY_ID: Record<string, CodingQuestion> = Object.fromEntries(CODING.map((c) => [c.id, c]))
