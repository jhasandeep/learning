import type { SdLesson } from '../types'

export const acid: SdLesson = {
  id: 'acid-base',
  title: 'ACID transactions and BASE',
  topic: 'All-or-nothing updates',
  blurb: 'Moving money must either fully happen or not happen at all. Learn ACID, how rollback works, and the BASE alternative.',
  why: {
    story: 'Transferring 500 rupees means two steps: subtract from Asha, add to Ravi. If the system crashes after the first step, 500 rupees **vanish**. A **transaction** groups steps so they behave as one. Relational databases promise **ACID**: **Atomicity** (all steps or none), **Consistency** (rules such as "balance is never negative" always hold), **Isolation** (concurrent transactions do not see each other\'s half-finished work) and **Durability** (once committed, it survives crashes). Large distributed systems often relax this into **BASE**: **B**asically **A**vailable, **S**oft state, **E**ventually consistent.',
    pains: ['A crash halfway leaves money debited but never credited.', 'Two people booking the last seat at once can both succeed.', 'Partial updates leave data in a state that breaks business rules.', 'Strict guarantees across many machines are slow and fragile.'],
  },
  before: {
    title: 'Without a transaction: half-done work',
    nodes: [
      { id: 'app', label: 'Transfer service', kind: 'server', x: 14, y: 28 },
      { id: 'a', label: 'Asha: 500', kind: 'db', x: 70, y: 12 },
      { id: 'b', label: 'Ravi: 100', kind: 'db', x: 70, y: 44 },
    ],
    edges: [{ from: 'app', to: 'a' }, { from: 'app', to: 'b' }],
    frames: [
      { caption: 'Transfer 200 from Asha to Ravi: two separate updates.', active: ['app'] },
      { caption: 'Step 1: debit Asha. Her balance becomes 300.', active: ['app', 'a'], flow: [['app', 'a']], badges: { a: '300' } },
      { caption: 'The server **crashes** before step 2.', bad: ['app'], badges: { app: 'CRASH' } },
      { caption: 'Ravi never received the money. 200 rupees have disappeared, and the data is now wrong.', bad: ['b'], badges: { b: 'LOST' } },
    ],
  },
  how: {
    title: 'With a transaction: all or nothing',
    nodes: [
      { id: 'app', label: 'Transfer service', kind: 'server', x: 12, y: 28 },
      { id: 'tx', label: 'Transaction', kind: 'service', x: 46, y: 28, sub: 'BEGIN ... COMMIT' },
      { id: 'a', label: 'Asha', kind: 'db', x: 84, y: 12 },
      { id: 'b', label: 'Ravi', kind: 'db', x: 84, y: 44 },
    ],
    edges: [{ from: 'app', to: 'tx' }, { from: 'tx', to: 'a' }, { from: 'tx', to: 'b' }],
    frames: [
      { caption: '`BEGIN`: the database starts a transaction and keeps changes private for now.', active: ['app', 'tx'], flow: [['app', 'tx']], badges: { tx: 'BEGIN' } },
      { caption: 'Both updates are applied inside the transaction: debit Asha, credit Ravi.', active: ['tx', 'a', 'b'], flow: [['tx', 'a'], ['tx', 'b']] },
      { caption: 'If everything succeeds, `COMMIT` makes both changes visible together and writes them durably to disk.', active: ['tx', 'a', 'b'], badges: { tx: 'COMMIT' } },
      { caption: 'If anything fails (a crash, insufficient funds), `ROLLBACK` undoes every step. The data is exactly as before.', bad: ['tx'], badges: { tx: 'ROLLBACK' } },
    ],
  },
  realWorld: [
    { name: 'Bank transfers and UPI settlement', text: 'The debit and credit must be one atomic unit; ACID databases (PostgreSQL, MySQL InnoDB, Oracle) are used for ledgers.' },
    { name: 'E-commerce orders', text: 'Creating the order, reserving stock and recording payment happen in one transaction, or are coordinated carefully across services.' },
    { name: 'BASE systems', text: 'Amazon\'s shopping cart, social feeds and like counts accept eventual consistency to stay available and fast at huge scale.' },
    { name: 'Sagas across microservices', text: 'When one transaction cannot span several services, a **saga** runs local transactions and issues **compensating actions** (such as a refund) when a later step fails.' },
  ],
  tradeoffs: {
    gain: ['ACID: correctness you can reason about; no half-done work.', 'BASE: high availability and horizontal scale.'],
    cost: ['ACID: locking and coordination cost throughput, and cross-machine transactions are slow.', 'BASE: your application must cope with stale and out-of-order data.'],
    useWhen: ['ACID: money, inventory, anything where wrong data costs a lot.', 'BASE: feeds, counters, recommendations, analytics.'],
    avoidWhen: ['Do not use eventual consistency for balances.', 'Do not run long transactions that hold locks for minutes.'],
  },
  steps: [
    {
      title: 'Change the data as you go',
      tag: 'slow',
      idea: 'Apply each step directly to the balances. If a later step fails, report the failure, but earlier steps are already applied, so the data is left half-changed. This is the bug that transactions prevent.',
      walk: ['Walk the steps in order.', 'On a bad step (unknown account or not enough money), stop and say "rolled back".', 'But earlier changes were already made to the real balances!'],
      buggy: true,
      code: {
        python: `def run_transaction(balances, steps):
    for kind, account, amount in steps:
        if account not in balances:
            return {"status": "rolled back", "balances": balances}
        if kind == "debit":
            if balances[account] < amount:
                return {"status": "rolled back", "balances": balances}
            balances[account] -= amount
        else:
            balances[account] += amount
    return {"status": "committed", "balances": balances}
`,
        javascript: `function runTransaction(balances, steps) {
  for (const [kind, account, amount] of steps) {
    if (!(account in balances)) return { status: "rolled back", balances };
    if (kind === "debit") {
      if (balances[account] < amount) return { status: "rolled back", balances };
      balances[account] -= amount;
    } else {
      balances[account] += amount;
    }
  }
  return { status: "committed", balances };
}
`,
      },
      time: 'O(steps)',
      space: 'O(1)',
      verdict: 'It claims "rolled back" but the first debit stays applied. Atomicity is broken.',
    },
    {
      title: 'Work on a copy, then commit or roll back',
      tag: 'best',
      idea: 'Do all the work on a **private copy** of the balances. If every step succeeds, **commit**: return the new balances. If any step fails, **roll back**: return the original balances untouched. Databases achieve the same with a write-ahead log and undo information.',
      walk: ['Copy the balances.', 'Apply each step to the copy; fail on an unknown account or an overdraft.', 'On failure return the original balances with status "rolled back".', 'On success return the copy with status "committed".'],
      code: {
        python: `def run_transaction(balances, steps):
    work = dict(balances)  # private copy
    for kind, account, amount in steps:
        if account not in work:
            return {"status": "rolled back", "balances": balances}
        if kind == "debit":
            if work[account] < amount:
                return {"status": "rolled back", "balances": balances}
            work[account] -= amount
        else:
            work[account] += amount
    return {"status": "committed", "balances": work}
`,
        javascript: `function runTransaction(balances, steps) {
  const work = { ...balances }; // private copy
  for (const [kind, account, amount] of steps) {
    if (!(account in work)) return { status: "rolled back", balances };
    if (kind === "debit") {
      if (work[account] < amount) return { status: "rolled back", balances };
      work[account] -= amount;
    } else {
      work[account] += amount;
    }
  }
  return { status: "committed", balances: work };
}
`,
      },
      time: 'O(steps + accounts)',
      space: 'O(accounts)',
      verdict: 'Atomic and consistent. Isolation and durability need locks or versions and a write-ahead log; real databases handle those for you.',
    },
  ],
  practice: {
    fn: { python: 'run_transaction', javascript: 'runTransaction' },
    starter: {
      python: `def run_transaction(balances, steps):
    # steps: list of [kind, account, amount] where kind is "debit" or "credit".
    # A step fails for an unknown account, or a debit larger than the balance.
    # If every step works, return {"status": "committed", "balances": <new balances>}.
    # If any step fails, change nothing:
    #   return {"status": "rolled back", "balances": <the original balances>}.
    pass
`,
      javascript: `function runTransaction(balances, steps) {
  // steps: list of [kind, account, amount] where kind is "debit" or "credit".
  // A step fails for an unknown account, or a debit larger than the balance.
  // If every step works, return { status: "committed", balances: <new balances> }.
  // If any step fails, change nothing:
  //   return { status: "rolled back", balances: <the original balances> }.
}
`,
    },
    cases: [
      { label: 'a normal transfer commits', args: [{ a: 100, b: 50 }, [['debit', 'a', 30], ['credit', 'b', 30]]], expected: { status: 'committed', balances: { a: 70, b: 80 } } },
      { label: 'not enough money rolls everything back', args: [{ a: 100, b: 50 }, [['debit', 'a', 500], ['credit', 'b', 500]]], expected: { status: 'rolled back', balances: { a: 100, b: 50 } } },
      { label: 'a failure on a later step undoes earlier steps', args: [{ a: 100, b: 50 }, [['debit', 'a', 10], ['credit', 'zzz', 10]]], expected: { status: 'rolled back', balances: { a: 100, b: 50 } } },
      { label: 'no steps commits unchanged', args: [{ a: 1 }, []], expected: { status: 'committed', balances: { a: 1 } } },
      { label: 'a credit before a failing debit is undone', args: [{ a: 100, b: 50 }, [['credit', 'b', 20], ['debit', 'a', 1000]]], expected: { status: 'rolled back', balances: { a: 100, b: 50 } } },
      { label: 'several steps on one account', args: [{ a: 100, b: 50 }, [['debit', 'a', 10], ['debit', 'a', 10], ['credit', 'b', 20]]], expected: { status: 'committed', balances: { a: 80, b: 70 } } },
    ],
    hints: ['Never change the original `balances` until you know every step works.', 'Copy the balances and apply the steps to the copy.', 'Fail (and return the original) on an unknown account or a debit above the balance.'],
  },
  quiz: [
    { q: 'What does "Atomicity" mean?', options: ['All steps of a transaction happen, or none do', 'Data is stored in small pieces', 'Queries are fast'], answer: 0, why: 'A transaction is an indivisible unit: commit everything, or roll everything back.' },
    { q: 'Which property keeps committed data safe after a power failure?', options: ['Isolation', 'Durability', 'Availability'], answer: 1, why: 'Durability: once committed, data is written to non-volatile storage (typically through a write-ahead log).' },
    { q: 'What does BASE stand for in "BASE vs ACID"?', options: ['Basically Available, Soft state, Eventually consistent', 'Backup And Safe Encryption', 'Batch, Async, Sync, Events'], answer: 0, why: 'BASE systems stay available and accept that data may be temporarily inconsistent, converging later.' },
  ],
  interview: [
    { q: 'Explain ACID with an example.', a: 'In a money transfer: **Atomicity** debit and credit both happen or neither. **Consistency** the rule "no negative balance" and total money are preserved. **Isolation** another transaction cannot see the money "in flight" or double-spend it. **Durability** after commit, a crash does not undo it.' },
    { q: 'How do you keep data correct across several microservices without a distributed transaction?', a: 'Use a **saga**: a sequence of local transactions, each publishing an event. If a step fails, run **compensating transactions** (refund, release stock) in reverse. Combine with idempotent handlers and the outbox pattern so events are not lost.' },
    { q: 'What are isolation levels?', a: 'Settings that trade correctness for concurrency: **read committed** (no dirty reads), **repeatable read**, **serializable** (as if transactions ran one at a time). Higher levels prevent more anomalies (dirty, non-repeatable, phantom reads) but allow less parallelism.' },
  ],
  mistakes: ['Updating several tables without a transaction.', 'Holding a transaction open while calling a slow external service.', 'Assuming a distributed system gives ACID across all nodes for free.', 'Using retries on non-idempotent steps and charging twice.'],
  recap: 'ACID makes a group of steps all-or-nothing and durable; BASE trades strict guarantees for availability and scale.',
}
