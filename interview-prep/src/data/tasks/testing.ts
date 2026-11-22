import type { TaskPath } from './types'

// A tiny test framework is provided: `test(name, fn)` and `expect(value)` with
// toBe, toEqual, toBeTruthy, toContain and toThrow. The checker runs YOUR tests against
// the correct function and against broken copies: a good test fails on the broken ones.

const MINI = `function test(name, fn) { (test.list = test.list || []).push({ name, fn }); }
function expect(actual) {
  const fail = (msg) => { throw new Error(msg); };
  return {
    toBe: (e) => { if (actual !== e) fail("expected " + JSON.stringify(e) + " but got " + JSON.stringify(actual)); },
    toEqual: (e) => { if (JSON.stringify(actual) !== JSON.stringify(e)) fail("expected " + JSON.stringify(e) + " but got " + JSON.stringify(actual)); },
    toBeTruthy: () => { if (!actual) fail("expected a truthy value"); },
    toContain: (e) => { if (!actual.includes(e)) fail("expected it to contain " + JSON.stringify(e)); },
    toThrow: () => { let threw = false; try { actual(); } catch (e) { threw = true; } if (!threw) fail("expected the function to throw"); },
  };
}
function runUserTests() {
  const list = test.list || [];
  const failed = [];
  for (const t of list) { try { t.fn(); } catch (e) { failed.push(t.name); } }
  return { count: list.length, failed };
}
`

export const testing: TaskPath = {
  id: 'testing',
  title: 'Testing',
  blurb: 'Write tests that actually catch bugs: edge cases, errors, test doubles and the Arrange-Act-Assert shape.',
  tasks: [
    {
      id: 'test-clamp',
      kind: 'run',
      language: 'javascript',
      title: 'Write tests that catch bugs',
      goal: 'Write tests for `clamp(n, min, max)` that pass on the correct code and fail on three broken versions.',
      steps: [
        'Use `test("name", () => { … })` and `expect(clamp(…)).toBe(…)`.',
        'Cover a value below the range, above the range, inside the range, and exactly on each edge.',
        'Write at least 4 tests. A test that cannot fail is worthless.',
      ],
      starter: `function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

// Write your tests below
`,
      hints: ['Think of the three zones: below `min`, between, above `max`.', 'Edge values matter: `clamp(0, 0, 10)` and `clamp(10, 0, 10)`.', 'Example: `test("limits to max", () => { expect(clamp(15, 0, 10)).toBe(10); });`'],
      solution: `function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

test("returns the number when it is inside the range", () => {
  expect(clamp(5, 0, 10)).toBe(5);
});
test("raises a number below min to min", () => {
  expect(clamp(-5, 0, 10)).toBe(0);
});
test("lowers a number above max to max", () => {
  expect(clamp(15, 0, 10)).toBe(10);
});
test("keeps values exactly on the edges", () => {
  expect(clamp(0, 0, 10)).toBe(0);
  expect(clamp(10, 0, 10)).toBe(10);
});
`,
      harness: `${MINI}const __good = clamp;
const __mutants = {
  "that ignores the maximum": (n, min, max) => Math.max(n, min),
  "that ignores the minimum": (n, min, max) => Math.min(n, max),
  "that returns the maximum for any number over or equal to the middle": (n, min, max) => (n >= (min + max) / 2 ? max : Math.max(n, min)),
};
check("You wrote at least 4 tests", () => runUserTests().count >= 4);
check("Your tests pass on the correct code", () => { clamp = __good; const r = runUserTests(); return r.count > 0 && r.failed.length === 0; });
const __catches = (m) => { clamp = m; const r = runUserTests(); clamp = __good; return r.count > 0 && r.failed.length > 0; };
check("Your tests catch a clamp that ignores the maximum", () => __catches(__mutants["that ignores the maximum"]));
check("Your tests catch a clamp that ignores the minimum", () => __catches(__mutants["that ignores the minimum"]));
check("Your tests catch a clamp that jumps to the maximum from the middle of the range", () => __catches(__mutants["that returns the maximum for any number over or equal to the middle"]));`,
      learned: 'A good test suite is judged by the bugs it catches: cover the normal case plus the edges, where off-by-one mistakes hide.',
    },
    {
      id: 'test-errors',
      kind: 'run',
      language: 'javascript',
      title: 'Test that errors are thrown',
      goal: 'Write tests for `divide(a, b)` that prove it throws when dividing by zero and divides correctly otherwise.',
      steps: [
        'Test a normal division and a result with decimals.',
        'Test that `divide(1, 0)` throws: wrap the call in a function and use `toThrow()`.',
        'Write at least 3 tests.',
      ],
      starter: `function divide(a, b) {
  if (b === 0) throw new Error("Cannot divide by zero");
  return a / b;
}

// Write your tests below
`,
      hints: ['To test a throw, pass a function: `expect(() => divide(1, 0)).toThrow()`.', 'Call the real function with simple numbers you can calculate in your head.', '`expect(divide(7, 2)).toBe(3.5)` checks decimals.'],
      solution: `function divide(a, b) {
  if (b === 0) throw new Error("Cannot divide by zero");
  return a / b;
}

test("divides two numbers", () => {
  expect(divide(10, 2)).toBe(5);
});
test("keeps decimals", () => {
  expect(divide(7, 2)).toBe(3.5);
});
test("throws when dividing by zero", () => {
  expect(() => divide(1, 0)).toThrow();
});
`,
      harness: `${MINI}const __good = divide;
const __mutants = {
  "that never throws": (a, b) => a / b,
  "that multiplies instead of dividing": (a, b) => { if (b === 0) throw new Error("zero"); return a * b; },
  "that rounds the result": (a, b) => { if (b === 0) throw new Error("zero"); return Math.floor(a / b); },
};
check("You wrote at least 3 tests", () => runUserTests().count >= 3);
check("Your tests pass on the correct code", () => { divide = __good; const r = runUserTests(); return r.count > 0 && r.failed.length === 0; });
const __catches = (m) => { divide = m; const r = runUserTests(); divide = __good; return r.count > 0 && r.failed.length > 0; };
check("Your tests catch a divide that never throws", () => __catches(__mutants["that never throws"]));
check("Your tests catch a divide that multiplies instead of dividing", () => __catches(__mutants["that multiplies instead of dividing"]));
check("Your tests catch a divide that rounds the result", () => __catches(__mutants["that rounds the result"]));`,
      learned: 'Error paths are behaviour too: test that bad input throws, using a function wrapper so the test can catch the error.',
    },
    {
      id: 'arrange-act-assert',
      kind: 'run',
      language: 'javascript',
      title: 'Test a shopping cart in three steps',
      goal: 'Write Arrange-Act-Assert tests for `cartTotal(items, couponPercent)`.',
      steps: [
        'Arrange: build a list of items like `{ price: 100, qty: 2 }`.',
        'Act: call `cartTotal(items, 10)`. Assert: check the total with `toBe`.',
        'Cover an empty cart, several items, and a coupon. Write at least 4 tests.',
      ],
      starter: `function cartTotal(items, couponPercent = 0) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  return subtotal - (subtotal * couponPercent) / 100;
}

// Write your tests below
`,
      hints: ['An empty cart is an important edge case: the total is 0.', 'Use easy numbers: 2 items of 100 = 200; with a 10% coupon = 180.', 'Test the quantity (`qty`) too, not only the price.'],
      solution: `function cartTotal(items, couponPercent = 0) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  return subtotal - (subtotal * couponPercent) / 100;
}

test("an empty cart costs nothing", () => {
  expect(cartTotal([])).toBe(0);
});
test("multiplies price by quantity", () => {
  expect(cartTotal([{ price: 100, qty: 2 }])).toBe(200);
});
test("adds several items together", () => {
  expect(cartTotal([{ price: 100, qty: 1 }, { price: 50, qty: 2 }])).toBe(200);
});
test("applies a percentage coupon", () => {
  expect(cartTotal([{ price: 100, qty: 2 }], 10)).toBe(180);
});
`,
      harness: `${MINI}const __good = cartTotal;
const __mutants = {
  "that ignores quantity": (items, c = 0) => { const s = items.reduce((a, i) => a + i.price, 0); return s - (s * c) / 100; },
  "that ignores the coupon": (items) => items.reduce((a, i) => a + i.price * i.qty, 0),
  "that only counts the first item": (items, c = 0) => { const s = items.length ? items[0].price * items[0].qty : 0; return s - (s * c) / 100; },
};
check("You wrote at least 4 tests", () => runUserTests().count >= 4);
check("Your tests pass on the correct code", () => { cartTotal = __good; const r = runUserTests(); return r.count > 0 && r.failed.length === 0; });
const __catches = (m) => { cartTotal = m; const r = runUserTests(); cartTotal = __good; return r.count > 0 && r.failed.length > 0; };
check("Your tests catch a cart that ignores quantity", () => __catches(__mutants["that ignores quantity"]));
check("Your tests catch a cart that ignores the coupon", () => __catches(__mutants["that ignores the coupon"]));
check("Your tests catch a cart that only counts the first item", () => __catches(__mutants["that only counts the first item"]));`,
      learned: 'Arrange-Act-Assert keeps tests readable: set up the data, do one thing, then check one outcome.',
    },
    {
      id: 'test-doubles',
      kind: 'run',
      language: 'javascript',
      title: 'Make code testable with a fake',
      goal: 'Write `notifyUser(user, sendEmail)` so a test can pass in a fake `sendEmail` instead of sending real mail.',
      steps: [
        'If `user.active` is true, call `sendEmail(user.email, "Welcome!")` once and return `true`.',
        'If the user is not active, do not send anything and return `false`.',
        'The function receives `sendEmail` as a parameter: that is what makes it easy to test.',
      ],
      starter: `function notifyUser(user, sendEmail) {
  // your code here
}`,
      hints: ['Dependency injection just means passing the helper in as an argument.', 'A fake is a function that records its calls: `const calls = []; const fake = (...a) => calls.push(a);`', 'Return early with `false` when the user is inactive.'],
      solution: `function notifyUser(user, sendEmail) {
  if (!user.active) return false;
  sendEmail(user.email, "Welcome!");
  return true;
}`,
      harness: `check("sends a welcome email to an active user", () => { const calls = []; notifyUser({ email: "a@x.com", active: true }, (...a) => calls.push(a)); return calls.length === 1 && calls[0][0] === "a@x.com" && calls[0][1] === "Welcome!"; });
check("returns true when it sent an email", () => notifyUser({ email: "a@x.com", active: true }, () => {}) === true);
check("sends nothing to an inactive user", () => { let n = 0; notifyUser({ email: "a@x.com", active: false }, () => n++); return n === 0; });
check("returns false for an inactive user", () => notifyUser({ email: "a@x.com", active: false }, () => {}) === false);`,
      learned: 'Passing dependencies in (instead of hard-coding them) lets tests swap in fakes: fast, safe and able to check exactly what was called.',
    },
  ],
}
