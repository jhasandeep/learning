import type { SdLesson } from '../types'

export const caseUpi: SdLesson = {
  id: 'case-upi',
  title: 'Case study: UPI payments',
  topic: 'Move money safely',
  blurb: 'How a payment travels between banks, why retries must never charge twice, and how an idempotent ledger works.',
  why: {
    story: 'In a UPI payment you scan a code and money moves from your bank account to a shop\'s account in seconds, even though the two accounts may be in different banks. Behind the scenes a **payment app**, a **payment service provider (PSP)**, a central **switch** and the two **banks** cooperate. Networks time out, apps retry and phones lose signal, so the design must guarantee that a payment happens **exactly once** no matter how many times a request is repeated. That guarantee comes from **idempotency**: a unique transaction id per payment.',
    pains: ['A timeout leaves the payer unsure whether money moved.', 'A retry could debit the account twice.', 'Two banks must agree on one transfer.', 'Payments must be fast, available around the clock and auditable.'],
  },
  before: {
    title: 'The payment path',
    nodes: [
      { id: 'app', label: 'Payer app', kind: 'client', x: 8, y: 28 },
      { id: 'psp', label: 'PSP bank', kind: 'gateway', x: 30, y: 28, sub: 'checks PIN' },
      { id: 'sw', label: 'Central switch', kind: 'service', x: 56, y: 28, sub: 'routes + records' },
      { id: 'b1', label: 'Payer bank', kind: 'db', x: 82, y: 10 },
      { id: 'b2', label: 'Payee bank', kind: 'db', x: 82, y: 46 },
    ],
    edges: [{ from: 'app', to: 'psp' }, { from: 'psp', to: 'sw' }, { from: 'sw', to: 'b1' }, { from: 'sw', to: 'b2' }],
    frames: [
      { caption: 'You enter the amount and your **PIN** in the payer app. It sends a payment request with a **unique transaction id**.', active: ['app', 'psp'], flow: [['app', 'psp']] },
      { caption: 'The PSP verifies the request and forwards it to the central **switch**, which knows how to reach every bank.', active: ['psp', 'sw'], flow: [['psp', 'sw']] },
      { caption: 'The switch asks the **payer bank** to debit the account.', active: ['sw', 'b1'], flow: [['sw', 'b1']], badges: { b1: 'DEBIT' } },
      { caption: 'Then it asks the **payee bank** to credit the receiver.', active: ['sw', 'b2'], flow: [['sw', 'b2']], badges: { b2: 'CREDIT' } },
      { caption: 'Both banks confirm; the result flows back and both users get an SMS or notification. If any step fails, the debit is reversed.', active: ['app'], badges: { app: 'SUCCESS' } },
    ],
  },
  how: {
    title: 'Retries and idempotency',
    nodes: [
      { id: 'app', label: 'Payer app', kind: 'client', x: 12, y: 28 },
      { id: 'led', label: 'Payment service', kind: 'service', x: 50, y: 28, sub: 'ledger + txn ids' },
      { id: 'db', label: 'Ledger DB', kind: 'db', x: 86, y: 28 },
    ],
    edges: [{ from: 'app', to: 'led' }, { from: 'led', to: 'db' }],
    frames: [
      { caption: 'The app sends payment `T42`: pay 500. The service records `T42` and debits the account.', active: ['app', 'led', 'db'], flow: [['app', 'led'], ['led', 'db']], badges: { db: 'T42 DONE' } },
      { caption: 'The response is **lost** on the way back. The app sees a timeout and does not know if it worked.', bad: ['app'], badges: { app: 'TIMEOUT' } },
      { caption: 'The app **retries with the same id** `T42`.', active: ['app', 'led'], flow: [['app', 'led']] },
      { caption: 'The service sees `T42` already exists and **returns the stored result** without charging again. The retry is safe.', active: ['led', 'db'], badges: { led: 'SAME RESULT' } },
    ],
  },
  tabs: ['The payment path', 'Retries'],
  realWorld: [
    { name: 'UPI in India', text: 'NPCI runs the central switch; apps like PhonePe, Google Pay and Paytm are front-ends, and banks hold the accounts.' },
    { name: 'Stripe idempotency keys', text: 'Stripe lets clients send an `Idempotency-Key` header so retried charge requests are safe.' },
    { name: 'Double-entry ledgers', text: 'Banks record every movement as a debit and a matching credit, so totals always balance and can be audited.' },
    { name: 'Reconciliation', text: 'Systems compare their records with the banks\' records every day and fix or refund mismatches.' },
  ],
  tradeoffs: {
    gain: ['Exactly-once effect even with retries.', 'Clear audit trail.', 'Safe to retry on failures, so the app can be simple and persistent.'],
    cost: ['Every payment needs a stored id and result (storage and lookups).', 'Ids and results must be kept long enough to cover retries.', 'Cross-bank steps may need compensation (reversals) if one side fails.'],
    useWhen: ['Any operation with side effects that may be retried: payments, orders, emails, transfers.'],
    avoidWhen: ['Pure reads need no idempotency key.'],
  },
  steps: [
    {
      title: 'Apply every request as it arrives',
      tag: 'slow',
      idea: 'The obvious ledger moves money for every request it receives. If a client retries after a timeout, the same payment is applied again: the payer is **charged twice**.',
      walk: ['Check the accounts and the balance.', 'Move the money.', 'Return "success".'],
      buggy: true,
      code: {
        python: `def simulate_upi(balances, payments):
    results = []
    for txn_id, sender, receiver, amount in payments:
        if sender not in balances or receiver not in balances:
            results.append("unknown account")
        elif amount <= 0:
            results.append("invalid amount")
        elif balances[sender] < amount:
            results.append("insufficient funds")
        else:
            balances[sender] -= amount
            balances[receiver] += amount
            results.append("success")
    return {"results": results, "balances": balances}
`,
        javascript: `function simulateUpi(balances, payments) {
  const results = [];
  for (const [txnId, sender, receiver, amount] of payments) {
    if (!(sender in balances) || !(receiver in balances)) results.push("unknown account");
    else if (amount <= 0) results.push("invalid amount");
    else if (balances[sender] < amount) results.push("insufficient funds");
    else {
      balances[sender] -= amount;
      balances[receiver] += amount;
      results.push("success");
    }
  }
  return { results, balances };
}
`,
      },
      time: 'O(payments)',
      space: 'O(1)',
      verdict: 'A retried `T42` debits twice. We need to remember transaction ids.',
    },
    {
      title: 'Remember each transaction id and its result',
      tag: 'best',
      idea: 'Store the **result** of every transaction id. When a request arrives with an id we have seen, **return the stored result and change nothing**. New ids are validated and applied once. Failed attempts are remembered too, so a retry gets the same answer.',
      walk: ['Keep `done[txn_id] = result`.', 'If the id is already in `done`, append that stored result and skip.', 'Otherwise validate (accounts, amount, balance) and apply the transfer if valid.', 'Store the result under the id.'],
      code: {
        python: `def simulate_upi(balances, payments):
    done = {}
    results = []
    for txn_id, sender, receiver, amount in payments:
        if txn_id in done:
            results.append(done[txn_id])
            continue
        if sender not in balances or receiver not in balances:
            result = "unknown account"
        elif amount <= 0:
            result = "invalid amount"
        elif balances[sender] < amount:
            result = "insufficient funds"
        else:
            balances[sender] -= amount
            balances[receiver] += amount
            result = "success"
        done[txn_id] = result
        results.append(result)
    return {"results": results, "balances": balances}
`,
        javascript: `function simulateUpi(balances, payments) {
  const done = new Map();
  const results = [];
  for (const [txnId, sender, receiver, amount] of payments) {
    if (done.has(txnId)) {
      results.push(done.get(txnId));
      continue;
    }
    let result;
    if (!(sender in balances) || !(receiver in balances)) result = "unknown account";
    else if (amount <= 0) result = "invalid amount";
    else if (balances[sender] < amount) result = "insufficient funds";
    else {
      balances[sender] -= amount;
      balances[receiver] += amount;
      result = "success";
    }
    done.set(txnId, result);
    results.push(result);
  }
  return { results, balances };
}
`,
      },
      time: 'O(payments)',
      space: 'O(payments)',
      verdict: 'This is idempotency. In production the id check and the money movement happen in **one database transaction** (with a unique constraint on the id), so even concurrent retries cannot both succeed.',
    },
  ],
  practice: {
    fn: { python: 'simulate_upi', javascript: 'simulateUpi' },
    starter: {
      python: `def simulate_upi(balances, payments):
    # payments: list of [txn_id, sender, receiver, amount].
    # Per payment, in order, produce one of:
    #   "success", "insufficient funds", "unknown account", "invalid amount".
    # A repeated txn_id must return the SAME result as the first time and move no money.
    # Return {"results": [...], "balances": <final balances>}.
    pass
`,
      javascript: `function simulateUpi(balances, payments) {
  // payments: list of [txnId, sender, receiver, amount].
  // Per payment, in order, produce one of:
  //   "success", "insufficient funds", "unknown account", "invalid amount".
  // A repeated txnId must return the SAME result as the first time and move no money.
  // Return { results: [...], balances: <final balances> }.
}
`,
    },
    cases: [
      { label: 'a normal payment', args: [{ a: 100, b: 0 }, [['T1', 'a', 'b', 30]]], expected: { results: ['success'], balances: { a: 70, b: 30 } } },
      { label: 'a retry with the same id does not charge twice', args: [{ a: 100, b: 0 }, [['T1', 'a', 'b', 30], ['T1', 'a', 'b', 30]]], expected: { results: ['success', 'success'], balances: { a: 70, b: 30 } } },
      { label: 'a failed payment returns the same failure on retry', args: [{ a: 100, b: 0 }, [['T1', 'a', 'b', 500], ['T1', 'a', 'b', 500]]], expected: { results: ['insufficient funds', 'insufficient funds'], balances: { a: 100, b: 0 } } },
      { label: 'an unknown receiver', args: [{ a: 100, b: 0 }, [['T1', 'a', 'z', 10]]], expected: { results: ['unknown account'], balances: { a: 100, b: 0 } } },
      { label: 'a zero or negative amount is invalid', args: [{ a: 100, b: 0 }, [['T1', 'a', 'b', 0], ['T2', 'a', 'b', -5]]], expected: { results: ['invalid amount', 'invalid amount'], balances: { a: 100, b: 0 } } },
      { label: 'several different payments in a row', args: [{ a: 100, b: 0 }, [['T1', 'a', 'b', 30], ['T2', 'a', 'b', 40], ['T3', 'a', 'b', 50]]], expected: { results: ['success', 'success', 'insufficient funds'], balances: { a: 30, b: 70 } } },
    ],
    hints: ['Keep a dictionary from transaction id to its result.', 'If the id is already there, reuse the stored result and do nothing else.', 'Otherwise validate the payment, move the money only on success, and store the result.'],
  },
  quiz: [
    { q: 'A payment request times out and the app retries. What guarantees the payer is not charged twice?', options: ['An idempotency key (transaction id) that the server remembers', 'A faster network', 'Asking the user to wait'], answer: 0, why: 'The server recognises the repeated id and returns the original result without moving money again.' },
    { q: 'Where should the "have we seen this id" check and the debit happen?', options: ['In the same database transaction, with a unique constraint on the id', 'In two separate services without coordination', 'Only in the mobile app'], answer: 0, why: 'Doing both atomically prevents two concurrent retries from both debiting.' },
    { q: 'Why do banks reconcile their records daily?', options: ['To find and fix transfers where the two sides disagree', 'To compress data', 'To change interest rates'], answer: 0, why: 'Failures in the middle of cross-system flows can leave differences; reconciliation detects and resolves them.' },
  ],
  interview: [
    { q: 'How would you design a payment system like UPI?', a: 'Clients send a payment with a **unique transaction id** to a PSP, which authenticates (PIN, device binding) and forwards it to a central **switch**. The switch debits the payer bank and credits the payee bank, with timeouts, **reversals** for partial failures and **idempotent** handling everywhere. Use a double-entry **ledger**, strongly consistent databases for balances, queues for notifications, rate limits and fraud checks, and a daily **reconciliation**.' },
    { q: 'What does idempotent mean, and how do you implement it?', a: 'An operation is idempotent if repeating it has the **same effect as doing it once**. Implement with a client-generated unique key per logical operation, a unique constraint on that key, and storing the result so a retry returns it unchanged.' },
    { q: 'What happens if the debit succeeds but the credit fails?', a: 'The system must **reverse** the debit (compensating action) or retry the credit until it succeeds, keeping the transaction in a recorded intermediate state (pending). The flow is a **saga** with durable state, timeouts and reconciliation as a safety net.' },
  ],
  mistakes: ['Retrying a payment with a new id each time.', 'Checking for a duplicate and applying the payment in separate, non-atomic steps.', 'Not storing failed results, so a retry can behave differently.', 'Skipping audit logs and reconciliation.'],
  recap: 'Payments are safe to retry when every request carries a unique id and the ledger returns the stored result for repeats.',
}
