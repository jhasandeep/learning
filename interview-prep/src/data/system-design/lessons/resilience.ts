import type { SdLesson } from '../types'

export const resilience: SdLesson = {
  id: 'retries-circuit-breaker',
  title: 'Retries and circuit breaker',
  topic: 'Surviving failures',
  blurb: 'Retry safely with backoff, and stop calling a broken service so one failure does not spread to everything.',
  why: {
    story: 'In a system made of many services, something is **always** failing: a network blip, a slow database, a service being deployed. Two bad reactions turn a small problem into an outage. If you **retry instantly and forever**, you pile more load on a service that is already struggling. If you **keep waiting** on a dead service, your own threads fill up waiting and your service dies too: a **cascading failure**. The cure: retry carefully, and stop calling a service that is clearly down.',
    pains: ['Instant retries from thousands of clients create a **retry storm**.', 'Calls to a dead service hang until a long timeout, tying up resources.', 'A failure in one service spreads to the services that depend on it.', 'Retrying a non-idempotent action (like charging a card) can do it twice.'],
  },
  before: {
    title: 'Without protection: a failure cascades',
    nodes: [
      { id: 'u', label: 'Users', kind: 'user', x: 10, y: 28 },
      { id: 'a', label: 'Service A', kind: 'service', x: 40, y: 28 },
      { id: 'b', label: 'Service B', kind: 'service', x: 72, y: 28, sub: 'struggling' },
    ],
    edges: [{ from: 'u', to: 'a' }, { from: 'a', to: 'b' }],
    frames: [
      { caption: 'Service B becomes slow. Service A keeps calling it.', active: ['a', 'b'], flow: [['a', 'b']], bad: ['b'], badges: { b: 'SLOW' } },
      { caption: 'Calls to B time out and A **retries instantly**, doubling the load on an already struggling service.', active: ['a'], flow: [['a', 'b']], bad: ['b'], badges: { b: 'OVERLOAD' } },
      { caption: 'A\'s threads are all stuck waiting for B. A cannot serve its own users any more.', bad: ['a', 'b'], badges: { a: 'STUCK' } },
      { caption: 'The failure has cascaded: users see errors from A, although A itself had no bug.', bad: ['u', 'a', 'b'] },
    ],
  },
  how: {
    title: 'With a circuit breaker between A and B',
    nodes: [
      { id: 'u', label: 'Users', kind: 'user', x: 8, y: 28 },
      { id: 'a', label: 'Service A', kind: 'service', x: 34, y: 28 },
      { id: 'cb', label: 'Circuit breaker', kind: 'gateway', x: 58, y: 28 },
      { id: 'b', label: 'Service B', kind: 'service', x: 86, y: 28 },
    ],
    edges: [{ from: 'u', to: 'a' }, { from: 'a', to: 'cb' }, { from: 'cb', to: 'b' }],
    frames: [
      { caption: '**Closed** (normal): calls pass through to B. The breaker counts failures.', active: ['a', 'cb', 'b'], flow: [['a', 'cb'], ['cb', 'b']], badges: { cb: 'CLOSED' } },
      { caption: 'B starts failing. After several failures in a row, the breaker **trips**.', active: ['cb'], bad: ['b'], badges: { cb: 'TRIPPED' } },
      { caption: '**Open**: calls to B are rejected **instantly** without waiting. A can return a fallback (cached data, a friendly message).', active: ['a', 'cb'], flow: [['a', 'cb']], badges: { cb: 'OPEN' } },
      { caption: 'After a cool-down the breaker goes **half-open** and lets one trial call through to see if B has recovered.', active: ['cb', 'b'], flow: [['cb', 'b']], badges: { cb: 'HALF-OPEN' } },
      { caption: 'The trial succeeds, so the breaker **closes** again and normal traffic resumes.', active: ['a', 'cb', 'b'], flow: [['a', 'cb'], ['cb', 'b']], badges: { cb: 'CLOSED' } },
    ],
  },
  realWorld: [
    { name: 'Resilience4j and Hystrix', text: 'Java libraries that provide circuit breakers, retries and timeouts. Netflix popularised the pattern with Hystrix.' },
    { name: 'Service meshes and proxies', text: 'Envoy, Istio and similar tools add timeouts, retries with backoff and circuit breaking to calls between services, without changing the application code.' },
    { name: 'Cloud SDKs', text: 'AWS and Google client libraries retry failed requests with **exponential backoff and jitter** by default.' },
    { name: 'Payment APIs', text: 'Stripe lets you send an **idempotency key** with a request so that retrying a charge after a timeout cannot charge the customer twice.' },
  ],
  tradeoffs: {
    gain: ['Gives a struggling service room to recover.', 'Fails fast instead of hanging, which keeps your own service healthy.', 'Stops one failure from spreading across the system.', 'Lets you serve a fallback instead of an error.'],
    cost: ['More settings to tune (thresholds, timeouts, backoff).', 'The breaker can open when the failure was only brief.', 'You must decide what a fallback should be.'],
    useWhen: ['Calling another service or API over a network.', 'A dependency is critical but sometimes flaky.', 'Many clients call the same dependency.'],
    avoidWhen: ['Calls inside one process that cannot half-fail.', 'The operation is not safe to repeat and has no idempotency protection (do not auto-retry it).'],
  },
  steps: [
    {
      title: 'Retry with exponential backoff and jitter',
      tag: 'idea',
      idea: 'When a call fails, wait before trying again, and wait **longer each time**: 1 s, 2 s, 4 s, 8 s… (**exponential backoff**). Add a random amount (**jitter**) so thousands of clients do not all retry at the same instant. Cap the delay and the number of attempts. Retry only operations that are safe to repeat.',
      walk: ['Delay for attempt `n` is `min(cap, base * 2^n)`.', 'Pick a random value between 0 and that delay (**full jitter**).', 'Stop after a maximum number of attempts and return the error.'],
      only: [],
      code: {
        python: `import random


def retry_delays(attempts, base=0.5, cap=30.0):
    """The wait before each retry: exponential, capped, with full jitter."""
    return [random.uniform(0, min(cap, base * 2 ** n)) for n in range(attempts)]


class CircuitBreaker:
    pass
`,
        javascript: `function retryDelays(attempts, base = 0.5, cap = 30) {
  // The wait before each retry: exponential, capped, with full jitter.
  const delays = [];
  for (let n = 0; n < attempts; n++) {
    delays.push(Math.random() * Math.min(cap, base * 2 ** n));
  }
  return delays;
}

class CircuitBreaker {}
`,
      },
      time: 'O(1) per attempt',
      space: 'O(1)',
      verdict: 'Retries fix short blips. But if the service is truly down, every client keeps retrying: add a circuit breaker so they stop.',
    },
    {
      title: 'A circuit breaker with three states',
      tag: 'best',
      idea: 'The breaker is a small state machine. **Closed**: calls pass; count consecutive failures. After `failure_threshold` failures in a row it becomes **open**: calls are rejected at once. After `reset_timeout` seconds it becomes **half-open** and lets **one trial call** through. If the trial succeeds the breaker closes; if it fails it opens again.',
      walk: ['`allow(now)`: if open and the timeout has passed, switch to half-open and allow; if still open, reject; otherwise allow.', '`record(success, now)`: a success closes the breaker and resets the failure count.', 'A failure increments the count; if half-open, or the count reaches the threshold, the breaker opens and remembers `now`.'],
      code: {
        python: `class CircuitBreaker:
    def __init__(self, failure_threshold, reset_timeout):
        self.threshold = failure_threshold
        self.timeout = reset_timeout
        self.state = "closed"
        self.failures = 0
        self.opened_at = 0

    def allow(self, now):
        if self.state == "open":
            if now - self.opened_at >= self.timeout:
                self.state = "half_open"
                return True
            return False
        return True

    def record(self, success, now):
        if success:
            self.state = "closed"
            self.failures = 0
            return
        self.failures += 1
        if self.state == "half_open" or self.failures >= self.threshold:
            self.state = "open"
            self.opened_at = now
`,
        javascript: `class CircuitBreaker {
  constructor(failureThreshold, resetTimeout) {
    this.threshold = failureThreshold;
    this.timeout = resetTimeout;
    this.state = "closed";
    this.failures = 0;
    this.openedAt = 0;
  }

  allow(now) {
    if (this.state === "open") {
      if (now - this.openedAt >= this.timeout) {
        this.state = "half_open";
        return true;
      }
      return false;
    }
    return true;
  }

  record(success, now) {
    if (success) {
      this.state = "closed";
      this.failures = 0;
      return;
    }
    this.failures++;
    if (this.state === "half_open" || this.failures >= this.threshold) {
      this.state = "open";
      this.openedAt = now;
    }
  }
}
`,
      },
      time: 'O(1) per call',
      space: 'O(1)',
      verdict: 'In real systems, combine timeouts, retries with backoff, a circuit breaker and a fallback. Each protects against a different failure.',
    },
  ],
  sim: {
    id: 'breaker',
    intro: 'The other service starts out failing. Call it a few times and watch the breaker trip. Tick the box to make it healthy, wait for the cool-down and see the breaker recover.',
    tryThis: ['Press **Call the service** three times while it is failing: the third failure opens the breaker.', 'Call again: the request is rejected instantly, without touching the service.', 'Press "5 seconds pass", tick **healthy**, and call: the breaker is half-open, the trial works and it closes.'],
  },
  practice: {
    fn: { python: 'simulate_breaker', javascript: 'simulateBreaker' },
    symbol: { python: 'class CircuitBreaker', javascript: 'class CircuitBreaker' },
    driver: {
      python: `def simulate_breaker(threshold, timeout, ops):
    breaker = CircuitBreaker(threshold, timeout)
    out = []
    for kind, t in ops:
        if not breaker.allow(t):
            out.append("rejected")
            continue
        ok = kind == "ok"
        breaker.record(ok, t)
        out.append("ok" if ok else "failed")
    return out
`,
      javascript: `function simulateBreaker(threshold, timeout, ops) {
  const breaker = new CircuitBreaker(threshold, timeout);
  const out = [];
  for (const [kind, t] of ops) {
    if (!breaker.allow(t)) {
      out.push("rejected");
      continue;
    }
    const ok = kind === "ok";
    breaker.record(ok, t);
    out.push(ok ? "ok" : "failed");
  }
  return out;
}
`,
    },
    starter: {
      python: `class CircuitBreaker:
    def __init__(self, failure_threshold, reset_timeout):
        self.threshold = failure_threshold
        self.timeout = reset_timeout

    def allow(self, now):
        # may a call be made right now?
        pass

    def record(self, success, now):
        # tell the breaker how the call went
        pass
`,
      javascript: `class CircuitBreaker {
  constructor(failureThreshold, resetTimeout) {
    this.threshold = failureThreshold;
    this.timeout = resetTimeout;
  }

  allow(now) {
    // may a call be made right now?
  }

  record(success, now) {
    // tell the breaker how the call went
  }
}
`,
    },
    cases: [
      { label: 'stays closed while calls succeed', args: [3, 10, [['ok', 0], ['ok', 1], ['ok', 2]]], expected: ['ok', 'ok', 'ok'] },
      { label: 'opens after the threshold of failures in a row', args: [3, 10, [['fail', 0], ['fail', 1], ['fail', 2], ['ok', 3]]], expected: ['failed', 'failed', 'failed', 'rejected'] },
      { label: 'a success resets the failure count', args: [3, 10, [['fail', 0], ['fail', 1], ['ok', 2], ['fail', 3], ['fail', 4], ['ok', 5]]], expected: ['failed', 'failed', 'ok', 'failed', 'failed', 'ok'] },
      { label: 'after the timeout a trial call can close the breaker', args: [2, 10, [['fail', 0], ['fail', 1], ['ok', 5], ['ok', 11], ['ok', 12]]], expected: ['failed', 'failed', 'rejected', 'ok', 'ok'] },
      { label: 'a failed trial opens the breaker again', args: [2, 10, [['fail', 0], ['fail', 1], ['fail', 11], ['ok', 12], ['ok', 21]]], expected: ['failed', 'failed', 'failed', 'rejected', 'ok'] },
      { label: 'only one trial call is allowed while half-open', args: [1, 5, [['fail', 0], ['fail', 5], ['ok', 5]]], expected: ['failed', 'failed', 'rejected'] },
    ],
    hints: ['Keep a `state` ("closed", "open" or "half_open"), a count of failures in a row and the time the breaker opened.', '`allow`: when open, compare `now - opened_at` with the timeout. If it has passed, move to half-open and allow one call.', '`record`: success closes the breaker and clears the count. A failure while half-open, or reaching the threshold, opens it and stores `now`.'],
  },
  quiz: [
    { q: 'Why add random jitter to retry delays?', options: ['To make retries slower', 'So many clients do not all retry at exactly the same moment', 'To avoid using a timer'], answer: 1, why: 'Without jitter, clients that failed together retry together, creating repeated spikes (a retry storm). Randomising spreads the load out.' },
    { q: 'What does an OPEN circuit breaker do with a new call?', options: ['Sends it to the service and waits', 'Rejects it immediately and may return a fallback', 'Queues it forever'], answer: 1, why: 'Failing fast saves your own resources and gives the broken service a break.' },
    { q: 'Which operation is the most dangerous to retry automatically?', options: ['Reading a user profile', 'Charging a credit card without an idempotency key', 'Fetching a static image'], answer: 1, why: 'If the first charge actually succeeded but the response was lost, a retry charges twice. Use idempotency keys or only retry safe (idempotent) operations.' },
  ],
  interview: [
    { q: 'How do you stop a failure in one service from taking down the callers?', a: 'Layer defences: **timeouts** on every network call, **retries with exponential backoff and jitter** (only for idempotent operations), a **circuit breaker** to fail fast, **bulkheads** (separate thread/connection pools per dependency) so one slow dependency cannot use all resources, and **fallbacks** such as cached or default data.' },
    { q: 'Explain the three states of a circuit breaker.', a: '**Closed**: normal, calls pass and failures are counted. **Open**: too many failures, calls are rejected immediately for a cool-down period. **Half-open**: after the cool-down one trial call is allowed; success closes the breaker, failure opens it again.' },
    { q: 'What is idempotency and why does it matter for retries?', a: 'An operation is idempotent if doing it twice has the same effect as once (for example "set status to paid", or a request carrying an **idempotency key** the server remembers). Retries can deliver an operation more than once, so it must be safe to repeat.' },
  ],
  mistakes: ['Retrying immediately and without a limit.', 'Retrying operations that are not idempotent.', 'No timeout on network calls, so a hung service blocks your threads.', 'Setting the breaker threshold so low that it trips on a single hiccup.'],
  recap: 'Retry with growing, randomised delays, and trip a circuit breaker when a dependency is down: fail fast so failures stay small.',
}
