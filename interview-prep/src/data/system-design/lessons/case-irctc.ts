import type { SdLesson } from '../types'

export const caseIrctc: SdLesson = {
  id: 'case-irctc',
  title: 'Case study: IRCTC Tatkal ticket booking',
  topic: 'Design for a rush',
  blurb: 'At 10 am thousands of people want the same few seats. Learn to avoid double booking while surviving a traffic spike.',
  why: {
    story: 'Train ticket booking looks simple, but **Tatkal** opens at a fixed time and a huge crowd arrives in the same minute for a limited number of seats. Three problems collide: a **traffic spike** that can crush the servers, **contention** (many people fight for the same seat, so the system must never sell a seat twice) and **payment uncertainty** (a user may pay and lose the connection). The design combines queues, a waiting list, atomic updates, temporary seat holds and idempotent payments.',
    pains: ['Thousands of requests per second hit the same few rows.', 'Two buyers could both be told "seat confirmed".', 'Users hold seats and never pay, blocking others.', 'A payment succeeds but the booking page fails to load.'],
  },
  before: {
    title: 'Naive booking: a race condition',
    nodes: [
      { id: 'u1', label: 'User A', kind: 'user', x: 10, y: 14 },
      { id: 'u2', label: 'User B', kind: 'user', x: 10, y: 42 },
      { id: 's', label: 'Booking server', kind: 'server', x: 46, y: 28 },
      { id: 'db', label: 'Seats: 1 left', kind: 'db', x: 84, y: 28 },
    ],
    edges: [{ from: 'u1', to: 's' }, { from: 'u2', to: 's' }, { from: 's', to: 'db' }],
    frames: [
      { caption: 'One seat is left. A and B both click "Book" at the same instant.', active: ['u1', 'u2', 's'], flow: [['u1', 's'], ['u2', 's']] },
      { caption: 'Both requests **read** "1 seat left" before either one has written the update.', active: ['s', 'db'], flow: [['s', 'db']], badges: { db: '1 LEFT' } },
      { caption: 'Both then write "confirmed". The seat is **double booked**. A classic race condition.', bad: ['db', 's'], badges: { db: 'DOUBLE!' } },
    ],
  },
  how: {
    title: 'A safer design: queue, atomic booking, waiting list',
    nodes: [
      { id: 'u', label: 'Users', kind: 'user', x: 6, y: 28 },
      { id: 'q', label: 'Waiting room', kind: 'queue', x: 26, y: 28, sub: 'queue + rate limit' },
      { id: 'b', label: 'Booking service', kind: 'service', x: 52, y: 28, sub: 'atomic update' },
      { id: 'db', label: 'Seat DB', kind: 'db', x: 80, y: 12, sub: 'lock / version' },
      { id: 'p', label: 'Payment', kind: 'gateway', x: 80, y: 44, sub: 'idempotent' },
    ],
    edges: [{ from: 'u', to: 'q' }, { from: 'q', to: 'b' }, { from: 'b', to: 'db' }, { from: 'b', to: 'p' }],
    frames: [
      { caption: 'At 10:00 the crowd arrives. A **waiting room** (queue and rate limiter) lets users in at a pace the system can handle instead of letting everything crash.', active: ['u', 'q'], flow: [['u', 'q']], badges: { q: 'QUEUE' } },
      { caption: 'Admitted requests reach the booking service. Seat changes are done **atomically**, using a row lock or a version check, so only one request can take the last seat.', active: ['q', 'b', 'db'], flow: [['q', 'b'], ['b', 'db']], badges: { db: 'LOCKED' } },
      { caption: 'The seat is **held** for a few minutes while the user pays. If time runs out, the hold expires and the seat goes back to the pool.', active: ['b', 'db'], badges: { b: 'HOLD' } },
      { caption: 'If no seat is left, the user joins the **waiting list** (RAC / WL); a cancellation promotes the first person automatically.', active: ['b'], badges: { b: 'WL 1' } },
      { caption: 'Payment uses a **unique transaction id**, so retries after a timeout never charge twice, and a background job reconciles unclear cases.', active: ['b', 'p'], flow: [['b', 'p']], badges: { p: 'PAID' } },
    ],
  },
  tabs: ['The race', 'The design'],
  sim: {
    id: 'booking',
    intro: 'A crowd tries to book the last seats. Compare an unsafe check-then-book with an atomic booking and a waiting list.',
    tryThis: ['Run the unsafe mode: more tickets are sold than seats exist.', 'Switch to atomic booking: exactly the seat count is confirmed.', 'Enable the waiting list and cancel a ticket to see the promotion.'],
  },
  realWorld: [
    { name: 'Virtual waiting rooms', text: 'Ticket sites for concerts and trains queue users and admit them gradually (for example Ticketmaster\'s queue, Cloudflare Waiting Room).' },
    { name: 'Row locks and optimistic concurrency', text: 'SQL `SELECT ... FOR UPDATE`, or an `UPDATE ... WHERE seats > 0` that succeeds only for one request; or a version column checked on write.' },
    { name: 'Redis atomic counters', text: 'Decrementing a seat counter with an atomic command ensures no oversell under heavy load.' },
    { name: 'Seat holds with expiry', text: 'Airlines and cinemas hold a seat for a short time during payment and release it automatically.' },
  ],
  tradeoffs: {
    gain: ['No double bookings.', 'The system survives the spike by shaping traffic.', 'Fair handling of waiting-list promotion.'],
    cost: ['Locks and queues add latency for users.', 'Holds can be abused (bots reserving seats), so add CAPTCHAs and limits.', 'More components to run and monitor.'],
    useWhen: ['Scarce inventory with simultaneous demand: tickets, flash sales, rooms.'],
    avoidWhen: ['Unlimited stock, where simple counters are enough.'],
  },
  steps: [
    {
      title: 'Confirm or reject',
      tag: 'idea',
      idea: 'A counter with a set of confirmed users. A booking is confirmed if a seat is free, otherwise rejected; a repeat booking by the same user is flagged. A cancellation frees the seat. No waiting list yet.',
      walk: ['`book`: if the user already holds a seat, return "duplicate".', 'If there is a free seat, confirm.', 'Otherwise reject.', '`cancel` frees the seat.'],
      only: [0, 3, 4, 6],
      code: {
        python: `class TicketCounter:
    def __init__(self, seats, waitlist_max):
        self.seats = seats
        self.confirmed = []

    def book(self, user):
        if user in self.confirmed:
            return "duplicate"
        if len(self.confirmed) < self.seats:
            self.confirmed.append(user)
            return "confirmed"
        return "rejected"

    def cancel(self, user):
        if user in self.confirmed:
            self.confirmed.remove(user)
        return None
`,
        javascript: `class TicketCounter {
  constructor(seats, waitlistMax) {
    this.seats = seats;
    this.confirmed = [];
  }

  book(user) {
    if (this.confirmed.includes(user)) return "duplicate";
    if (this.confirmed.length < this.seats) {
      this.confirmed.push(user);
      return "confirmed";
    }
    return "rejected";
  }

  cancel(user) {
    const i = this.confirmed.indexOf(user);
    if (i !== -1) this.confirmed.splice(i, 1);
    return null;
  }
}
`,
      },
      time: 'O(seats)',
      space: 'O(seats)',
      verdict: 'It never oversells here because each call runs one at a time. In a real multi-user system the check and the update must be **atomic** (lock or conditional update).',
    },
    {
      title: 'Add a waiting list with automatic promotion',
      tag: 'best',
      idea: 'When all seats are taken, put the user on a bounded **waiting list** and tell them their position. When a confirmed passenger cancels, the **first** waiting user is promoted into the free seat. Cancelling while waiting just removes the user from the list.',
      walk: ['`book`: duplicate check against confirmed and waiting; confirm if a seat is free; else join the waiting list if it has room (`"waiting:<position>"`); else reject.', '`cancel` of a confirmed user: free the seat and promote the first waiting user; return the promoted name (or null).', '`cancel` of a waiting user: remove them; return null.'],
      code: {
        python: `class TicketCounter:
    def __init__(self, seats, waitlist_max):
        self.seats = seats
        self.waitlist_max = waitlist_max
        self.confirmed = []
        self.waiting = []

    def book(self, user):
        if user in self.confirmed or user in self.waiting:
            return "duplicate"
        if len(self.confirmed) < self.seats:
            self.confirmed.append(user)
            return "confirmed"
        if len(self.waiting) < self.waitlist_max:
            self.waiting.append(user)
            return "waiting:" + str(len(self.waiting))
        return "rejected"

    def cancel(self, user):
        if user in self.confirmed:
            self.confirmed.remove(user)
            if self.waiting:
                promoted = self.waiting.pop(0)
                self.confirmed.append(promoted)
                return promoted
            return None
        if user in self.waiting:
            self.waiting.remove(user)
        return None
`,
        javascript: `class TicketCounter {
  constructor(seats, waitlistMax) {
    this.seats = seats;
    this.waitlistMax = waitlistMax;
    this.confirmed = [];
    this.waiting = [];
  }

  book(user) {
    if (this.confirmed.includes(user) || this.waiting.includes(user)) return "duplicate";
    if (this.confirmed.length < this.seats) {
      this.confirmed.push(user);
      return "confirmed";
    }
    if (this.waiting.length < this.waitlistMax) {
      this.waiting.push(user);
      return "waiting:" + this.waiting.length;
    }
    return "rejected";
  }

  cancel(user) {
    let i = this.confirmed.indexOf(user);
    if (i !== -1) {
      this.confirmed.splice(i, 1);
      if (this.waiting.length > 0) {
        const promoted = this.waiting.shift();
        this.confirmed.push(promoted);
        return promoted;
      }
      return null;
    }
    i = this.waiting.indexOf(user);
    if (i !== -1) this.waiting.splice(i, 1);
    return null;
  }
}
`,
      },
      time: 'O(seats + waitlist) with lists; O(1) with sets and a queue',
      space: 'O(seats + waitlist)',
      verdict: 'In production every method would run inside a database transaction or behind a lock, and payment would be confirmed before the seat is final.',
    },
  ],
  practice: {
    fn: { python: 'simulate_counter', javascript: 'simulateCounter' },
    symbol: { python: 'class TicketCounter', javascript: 'class TicketCounter' },
    driver: {
      python: `def simulate_counter(seats, waitlist_max, ops):
    counter = TicketCounter(seats, waitlist_max)
    out = []
    for op in ops:
        if op[0] == "book":
            out.append(counter.book(op[1]))
        else:
            out.append(counter.cancel(op[1]))
    return out
`,
      javascript: `function simulateCounter(seats, waitlistMax, ops) {
  const counter = new TicketCounter(seats, waitlistMax);
  const out = [];
  for (const op of ops) {
    const r = op[0] === "book" ? counter.book(op[1]) : counter.cancel(op[1]);
    out.push(r === undefined ? null : r);
  }
  return out;
}
`,
    },
    starter: {
      python: `class TicketCounter:
    def __init__(self, seats, waitlist_max):
        pass

    def book(self, user):
        # "confirmed", "waiting:<position>", "rejected" or "duplicate"
        pass

    def cancel(self, user):
        # if a confirmed user cancels, promote the first waiting user and return their name;
        # otherwise return None
        pass
`,
      javascript: `class TicketCounter {
  constructor(seats, waitlistMax) {
  }

  book(user) {
    // "confirmed", "waiting:<position>", "rejected" or "duplicate"
  }

  cancel(user) {
    // if a confirmed user cancels, promote the first waiting user and return their name;
    // otherwise return null
  }
}
`,
    },
    cases: [
      { label: 'seats run out and no waiting list exists', args: [2, 0, [['book', 'a'], ['book', 'b'], ['book', 'c']]], expected: ['confirmed', 'confirmed', 'rejected'] },
      { label: 'the waiting list fills up', args: [1, 1, [['book', 'a'], ['book', 'b'], ['book', 'c']]], expected: ['confirmed', 'waiting:1', 'rejected'] },
      { label: 'a cancellation promotes the first waiting user', args: [1, 1, [['book', 'a'], ['book', 'b'], ['cancel', 'a'], ['book', 'c']]], expected: ['confirmed', 'waiting:1', 'b', 'waiting:1'] },
      { label: 'the same user cannot book twice', args: [2, 0, [['book', 'a'], ['book', 'a']]], expected: ['confirmed', 'duplicate'] },
      { label: 'cancelling without a booking does nothing', args: [1, 0, [['cancel', 'x']]], expected: [null] },
      { label: 'cancelling while waiting moves everyone up', args: [1, 2, [['book', 'a'], ['book', 'b'], ['book', 'c'], ['cancel', 'b'], ['book', 'd']]], expected: ['confirmed', 'waiting:1', 'waiting:2', null, 'waiting:2'] },
      { label: 'a freed seat can be booked again', args: [1, 0, [['book', 'a'], ['cancel', 'a'], ['book', 'b']]], expected: ['confirmed', null, 'confirmed'] },
    ],
    hints: ['Keep two lists: confirmed users and waiting users.', 'When the confirmed list is full, `book` adds to the waiting list (if it has room) and reports the position.', 'When a confirmed user cancels, remove them and move the first waiting user into the confirmed list.'],
  },
  quiz: [
    { q: 'Two users book the last seat at the same time. What prevents double booking?', options: ['An atomic update (lock, conditional write or version check)', 'A faster server', 'A bigger cache'], answer: 0, why: 'The check and the update must happen as one indivisible step so only one request wins.' },
    { q: 'Why hold a seat for a few minutes during payment?', options: ['So the user does not lose it while paying, without blocking it forever', 'To make payment slower', 'To avoid using a database'], answer: 0, why: 'A hold with an automatic expiry balances fairness for the payer and availability for others.' },
    { q: 'What is a virtual waiting room for?', options: ['To admit users gradually so the system is not overwhelmed', 'To store payments', 'To compress images'], answer: 0, why: 'It smooths the spike and keeps the booking service healthy.' },
  ],
  interview: [
    { q: 'How do you design a ticket booking system that handles a rush?', a: 'Put a **queue / waiting room** and rate limiting in front, serve static pages from a CDN, keep seat inventory in a strongly consistent store, **book atomically** (row lock, conditional update or atomic counter), **hold seats with expiry** during payment, use **idempotent payments**, and keep a **waiting list** with automatic promotion. Scale reads with caches and replicas; keep writes on the primary or a shard per train/show.' },
    { q: 'Pessimistic vs optimistic locking?', a: '**Pessimistic**: lock the row first (`SELECT ... FOR UPDATE`), so others wait; safe under high contention. **Optimistic**: read a version, write only if the version is unchanged, otherwise retry; cheap when conflicts are rare but wasteful under heavy contention.' },
    { q: 'What if payment succeeds but the booking confirmation fails?', a: 'Make the flow **idempotent** with a unique booking/transaction id, store the payment event durably, and run a **reconciliation** job that completes or refunds unclear bookings. Show the user a "pending" status and notify them when it resolves.' },
  ],
  mistakes: ['Reading the seat count, then writing it back in a separate step.', 'Holding seats without an expiry.', 'Letting bots and scripts flood the booking endpoint.', 'Not making payments idempotent.'],
  recap: 'Handle the rush with a waiting room, book seats atomically, hold them briefly, keep a waiting list and make payments idempotent.',
}
