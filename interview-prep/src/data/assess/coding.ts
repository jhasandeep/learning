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

export const CODING: CodingQuestion[] = [aggregate, retry, rateLimit, route, ttlCache, pool, sse]
export const CODING_BY_ID: Record<string, CodingQuestion> = Object.fromEntries(CODING.map((c) => [c.id, c]))
