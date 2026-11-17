import type { SdLesson } from '../types'

export const rateLimiter: SdLesson = {
  id: 'rate-limiter',
  title: 'Rate limiter',
  topic: 'Protecting your system',
  blurb: 'Cap how many requests a client can make, so one noisy user or a bug cannot take everyone down.',
  why: {
    story: 'A public API has no manners. One customer\'s script has a bug and sends **10,000 requests a second**, or an attacker tries every password. Your servers spend their capacity on that one client and everyone else gets slow responses or errors. A **rate limiter** puts a cap on each client (per user, API key or IP address): requests within the limit pass, requests over the limit get a quick `429 Too Many Requests`.',
    pains: ['One client can use up the capacity that all clients share.', 'Bugs such as retry loops create accidental traffic floods.', 'Attackers can brute-force logins or scrape data.', 'Paid plans need different limits for different customers.'],
  },
  before: {
    title: 'Without a limit: one client floods the service',
    nodes: [
      { id: 'a', label: 'Noisy client', kind: 'client', x: 12, y: 14 },
      { id: 'b', label: 'Normal users', kind: 'user', x: 12, y: 42 },
      { id: 's', label: 'API server', kind: 'server', x: 58, y: 28 },
      { id: 'db', label: 'Database', kind: 'db', x: 90, y: 28 },
    ],
    edges: [{ from: 'a', to: 's', label: '10,000/s' }, { from: 'b', to: 's', label: '5/s' }, { from: 's', to: 'db' }],
    frames: [
      { caption: 'A buggy client sends thousands of requests per second. Normal users send a few.', active: ['a', 'b'], flow: [['a', 's'], ['b', 's']] },
      { caption: 'The server is busy with the flood. It slows down and starts failing **for everyone**.', bad: ['s'], badges: { s: 'OVERLOAD' } },
      { caption: 'Normal users now get timeouts, even though they did nothing wrong.', bad: ['b', 's'], badges: { b: 'TIMEOUT' } },
    ],
  },
  how: {
    title: 'With a rate limiter in front of the API',
    nodes: [
      { id: 'a', label: 'Noisy client', kind: 'client', x: 10, y: 14 },
      { id: 'b', label: 'Normal users', kind: 'user', x: 10, y: 42 },
      { id: 'g', label: 'Rate limiter', kind: 'gateway', x: 40, y: 28, sub: 'API gateway' },
      { id: 'r', label: 'Redis', kind: 'cache', x: 40, y: 50, sub: 'counters' },
      { id: 's', label: 'API server', kind: 'server', x: 72, y: 28 },
      { id: 'db', label: 'Database', kind: 'db', x: 92, y: 28 },
    ],
    edges: [{ from: 'a', to: 'g' }, { from: 'b', to: 'g' }, { from: 'g', to: 'r' }, { from: 'g', to: 's' }, { from: 's', to: 'db' }],
    frames: [
      { caption: 'Every request passes the **rate limiter** first. It keeps a counter (or token bucket) per client in a fast shared store such as Redis.', active: ['g', 'r'], flow: [['g', 'r']] },
      { caption: 'A normal user is **under the limit**: the request is forwarded to the API.', active: ['b', 'g', 's'], flow: [['b', 'g'], ['g', 's']], badges: { g: 'ALLOW' } },
      { caption: 'The noisy client sends a burst. The first requests pass, then its allowance runs out.', active: ['a', 'g'], flow: [['a', 'g']] },
      { caption: 'Extra requests are **rejected immediately with 429**. They never reach the API server or the database.', active: ['a', 'g'], bad: ['a'], badges: { g: '429 REJECT' } },
      { caption: 'The API stays healthy and normal users are unaffected. The noisy client can try again later, once its tokens refill.', active: ['b', 'g', 's'], flow: [['b', 'g'], ['g', 's']] },
    ],
  },
  realWorld: [
    { name: 'Public APIs', text: 'GitHub, Stripe, Twitter/X and many others limit requests per key or per user and tell you with a `429` response and headers such as `Retry-After`.' },
    { name: 'Login protection', text: 'Websites limit failed login attempts per account and per IP address to slow down password guessing.' },
    { name: 'API gateways and CDNs', text: 'Gateways such as Kong or Nginx, and CDN services such as Cloudflare, offer built-in rate limiting so you do not write it yourself.' },
    { name: 'Pricing tiers', text: 'A free plan might allow 60 requests a minute and a paid plan 6,000. The limiter looks up the limit for each customer.' },
  ],
  tradeoffs: {
    gain: ['Protects your servers and your other users.', 'Stops accidental and malicious floods early and cheaply.', 'Lets you offer different plans with different limits.'],
    cost: ['Needs shared state (a counter store) when you have many servers.', 'A limit that is too strict blocks real users.', 'Adds a small delay to every request.'],
    useWhen: ['You expose a public or partner API.', 'Login, signup and search endpoints that attackers love.', 'You need fair usage between customers.'],
    avoidWhen: ['An internal call between two services you fully control (use backpressure or queues instead).', 'A tiny app with a handful of users.'],
  },
  steps: [
    {
      title: 'Fixed window counter',
      tag: 'slow',
      idea: 'Count requests in fixed time windows (for example each minute). If the count passes the limit, reject until the next window starts. It is the simplest limiter, but it has a famous flaw: a client can send the full limit at the very end of one window and again at the start of the next, **doubling the allowed burst**.',
      walk: ['`window = floor(now / window_size)` tells you which window you are in.', 'If the window changed, reset the count to 0.', 'Allow the request if the count is below the limit, and count it.'],
      only: [],
      code: {
        python: `class FixedWindowLimiter:
    def __init__(self, limit, window):
        self.limit = limit
        self.window = window
        self.current = None
        self.count = 0

    def allow(self, now):
        window = int(now // self.window)
        if window != self.current:
            self.current = window
            self.count = 0
        if self.count < self.limit:
            self.count += 1
            return True
        return False
`,
        javascript: `class FixedWindowLimiter {
  constructor(limit, window) {
    this.limit = limit;
    this.window = window;
    this.current = null;
    this.count = 0;
  }

  allow(now) {
    const window = Math.floor(now / this.window);
    if (window !== this.current) {
      this.current = window;
      this.count = 0;
    }
    if (this.count < this.limit) {
      this.count++;
      return true;
    }
    return false;
  }
}
`,
      },
      time: 'O(1) per request',
      space: 'O(1) per client',
      verdict: 'Tiny and fast, but the boundary burst can let through up to twice the limit in a short time.',
    },
    {
      title: 'Sliding window log',
      tag: 'better',
      idea: 'Remember the **timestamp of every recent request**. On each request, forget timestamps older than the window, then allow the request only if fewer than `limit` timestamps remain. This is exact and has no boundary burst, but it stores one timestamp per request.',
      walk: ['Keep a list of request times for the client.', 'Drop times older than `now - window`.', 'If fewer than `limit` remain, add `now` and allow; otherwise reject.'],
      only: [],
      code: {
        python: `class SlidingWindowLog:
    def __init__(self, limit, window):
        self.limit = limit
        self.window = window
        self.times = []

    def allow(self, now):
        self.times = [t for t in self.times if t > now - self.window]
        if len(self.times) < self.limit:
            self.times.append(now)
            return True
        return False
`,
        javascript: `class SlidingWindowLog {
  constructor(limit, window) {
    this.limit = limit;
    this.window = window;
    this.times = [];
  }

  allow(now) {
    this.times = this.times.filter((t) => t > now - this.window);
    if (this.times.length < this.limit) {
      this.times.push(now);
      return true;
    }
    return false;
  }
}
`,
      },
      time: 'O(limit) per request',
      space: 'O(limit) per client',
      verdict: 'Accurate, but memory grows with the limit. For millions of clients that adds up.',
    },
    {
      title: 'Token bucket',
      tag: 'best',
      idea: 'Picture a bucket that holds up to `capacity` tokens and **refills at a steady rate**. Each request needs one token. If the bucket has a token, take it and allow the request; if it is empty, reject. This allows short bursts (a full bucket) while enforcing the long-run average rate, and it only needs two numbers per client: the token count and the time of the last refill.',
      walk: ['Start with a full bucket: `tokens = capacity`, remember `last = None`.', 'On each request, add `(now - last) * refill_rate` tokens, but never above `capacity`.', 'If `tokens >= 1`, subtract 1 and allow; otherwise reject.', 'Update `last = now`.'],
      code: {
        python: `class TokenBucket:
    def __init__(self, capacity, refill_rate):
        self.capacity = capacity
        self.refill_rate = refill_rate  # tokens added per second
        self.tokens = capacity
        self.last = None

    def allow(self, now):
        if self.last is not None:
            elapsed = now - self.last
            self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
        self.last = now
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False
`,
        javascript: `class TokenBucket {
  constructor(capacity, refillRate) {
    this.capacity = capacity;
    this.refillRate = refillRate; // tokens added per second
    this.tokens = capacity;
    this.last = null;
  }

  allow(now) {
    if (this.last !== null) {
      const elapsed = now - this.last;
      this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);
    }
    this.last = now;
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }
}
`,
      },
      time: 'O(1) per request',
      space: 'O(1) per client',
      verdict: 'Used by many real APIs. In production the two numbers live in Redis and are updated atomically (for example with a Lua script) so several servers share one bucket.',
    },
  ],
  sim: {
    id: 'rate-limiter',
    intro: 'A token bucket: each request costs one token, and tokens refill over time. Time only moves when you press "1 second passes".',
    tryThis: ['Press **Burst of 10** with a full bucket of 5: five are allowed and five are rejected.', 'Press "1 second passes" and send again: you get exactly as many requests as tokens refilled.', 'Raise the bucket size to allow bigger bursts, or raise the refill rate to allow a higher sustained rate. They are two separate dials.'],
  },
  practice: {
    fn: { python: 'simulate_bucket', javascript: 'simulateBucket' },
    symbol: { python: 'class TokenBucket', javascript: 'class TokenBucket' },
    driver: {
      python: `def simulate_bucket(capacity, rate, times):
    bucket = TokenBucket(capacity, rate)
    return [bucket.allow(t) for t in times]
`,
      javascript: `function simulateBucket(capacity, rate, times) {
  const bucket = new TokenBucket(capacity, rate);
  return times.map((t) => bucket.allow(t));
}
`,
    },
    starter: {
      python: `class TokenBucket:
    def __init__(self, capacity, refill_rate):
        # the bucket starts full; refill_rate is tokens added per second
        self.capacity = capacity
        self.refill_rate = refill_rate

    def allow(self, now):
        # \`now\` is the time in seconds. Return True if the request may go through.
        pass
`,
      javascript: `class TokenBucket {
  constructor(capacity, refillRate) {
    // the bucket starts full; refillRate is tokens added per second
    this.capacity = capacity;
    this.refillRate = refillRate;
  }

  allow(now) {
    // \`now\` is the time in seconds. Return true if the request may go through.
  }
}
`,
    },
    cases: [
      { label: 'a burst up to the bucket size', args: [3, 1, [0, 0, 0, 0]], expected: [true, true, true, false] },
      { label: 'one token refills after a second', args: [2, 1, [0, 0, 0, 1]], expected: [true, true, false, true] },
      { label: 'the bucket never holds more than its capacity', args: [2, 1, [0, 10, 10, 10]], expected: [true, true, true, false] },
      { label: 'a faster refill rate', args: [4, 2, [0, 0, 0, 0, 0, 1, 1, 1]], expected: [true, true, true, true, false, true, true, false] },
      { label: 'a bucket of one', args: [1, 1, [0, 0, 1, 1, 2]], expected: [true, false, true, false, true] },
      { label: 'fractional refill (half a token per second)', args: [1, 0.5, [0, 1, 2]], expected: [true, false, true] },
    ],
    hints: ['Remember the number of tokens and the time of the last request.', 'Before deciding, add `elapsed * refill_rate` tokens, but never go above `capacity`. The first call has no earlier time to measure from.', 'If `tokens >= 1`, subtract 1 and return True. Otherwise return False (do not go negative).'],
  },
  quiz: [
    { q: 'A client sends 100 requests in the last second of a minute and 100 more in the first second of the next. With a limit of 100 per minute using fixed windows, what happens?', options: ['Both bursts are blocked', 'Both bursts are allowed: 200 requests in two seconds', 'Only the first burst is allowed'], answer: 1, why: 'Each burst falls in a different window, so each is within its limit. That boundary flaw is why sliding windows and token buckets are often preferred.' },
    { q: 'Which algorithm allows short bursts but limits the long-run average?', options: ['Token bucket', 'Fixed window counter', 'A single global counter that never resets'], answer: 0, why: 'A full bucket allows a burst up to its capacity, while the refill rate caps the average.' },
    { q: 'You run 10 API servers behind a load balancer. Where should the counters live?', options: ['In each server\'s memory', 'In a shared store such as Redis', 'In the browser'], answer: 1, why: 'If each server counts separately, a client can get 10 times the limit by being spread across servers. Counters must be shared (and updated atomically).' },
  ],
  interview: [
    { q: 'Design a rate limiter for an API with millions of users.', a: 'Clarify what is limited (user, key, IP) and the rules. Put the limiter in an **API gateway** or middleware. Use a **token bucket** per key stored in **Redis**, updated atomically with a Lua script (or `INCR` with expiry for fixed windows). Return `429` with `Retry-After`. Handle Redis failure by **failing open** or closed depending on the risk, and shard the counters by key. Mention different limits per plan and logging/metrics.' },
    { q: 'What do you return when a request is rate limited?', a: 'HTTP status **429 Too Many Requests**, usually with a `Retry-After` header and headers that say the limit and how many requests remain. Clients should then back off instead of retrying immediately.' },
    { q: 'What are the downsides of the sliding window log?', a: 'It stores a timestamp for every request in the window, so memory per client is O(limit). A sliding window **counter** (counts for the current and previous window, weighted) approximates it with far less memory.' },
  ],
  mistakes: ['Keeping counters in each server\'s memory when you have many servers.', 'Non-atomic read-then-write on the counter, so two requests both think there is room.', 'Using only the IP address: many users can share one IP (offices, mobile networks).', 'Not telling clients when to retry, which leads to retry storms.'],
  recap: 'Give every client a budget and reject requests beyond it early; a token bucket allows small bursts while enforcing a steady average.',
}
