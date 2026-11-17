import type { TaskPath } from './types'

export const javascript: TaskPath = {
  id: 'javascript',
  title: 'JavaScript',
  blurb: 'Write real functions: loops, closures, array methods, promises and a classic utility.',
  tasks: [
    {
      id: 'fizzbuzz',
      kind: 'run',
      language: 'javascript',
      title: 'FizzBuzz as a function',
      goal: 'Write `fizzbuzz(n)` that returns an array of the first `n` FizzBuzz values.',
      steps: [
        'Loop from 1 to `n`.',
        'Multiples of 3 give `"Fizz"`, of 5 give `"Buzz"`, of both give `"FizzBuzz"`.',
        'Every other number stays a number. Return the array.',
      ],
      starter: `function fizzbuzz(n) {
  // your code here
}`,
      hints: ['Check the "both" case (divisible by 15) first.', 'Use the remainder operator: `i % 3 === 0`.', 'Push each result into an array and `return` it after the loop.'],
      solution: `function fizzbuzz(n) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    if (i % 15 === 0) out.push("FizzBuzz");
    else if (i % 3 === 0) out.push("Fizz");
    else if (i % 5 === 0) out.push("Buzz");
    else out.push(i);
  }
  return out;
}`,
      harness: `check("Returns an array", () => Array.isArray(fizzbuzz(3)));
check("fizzbuzz(5) is [1, 2, 'Fizz', 4, 'Buzz']", () => JSON.stringify(fizzbuzz(5)) === JSON.stringify([1, 2, "Fizz", 4, "Buzz"]));
check("15 gives 'FizzBuzz'", () => fizzbuzz(15)[14] === "FizzBuzz");
check("Has exactly n items", () => fizzbuzz(30).length === 30);
check("Other numbers stay numbers", () => fizzbuzz(4)[3] === 4);`,
      learned: 'Order matters in `if / else if` chains: test the most specific condition (divisible by both) first.',
    },
    {
      id: 'counter-closure',
      kind: 'run',
      language: 'javascript',
      title: 'Private counters with closures',
      goal: 'Write `makeCounter()` that returns a function; every call to it adds 1 and returns the new count.',
      steps: [
        'Create a variable inside `makeCounter` to hold the count.',
        'Return a function that increases the count and returns it.',
        'Two counters must be independent: each remembers its own count.',
      ],
      starter: `function makeCounter() {
  // your code here
}`,
      hints: ['The inner function can read and change variables of the function around it.', 'Declare `let count = 0;` inside makeCounter, not outside.', '`return function () { count++; return count; }`'],
      solution: `function makeCounter() {
  let count = 0;
  return function () {
    count++;
    return count;
  };
}`,
      harness: `check("makeCounter() returns a function", () => typeof makeCounter() === "function");
check("First call returns 1", () => makeCounter()() === 1);
check("Calls count up: 1, 2, 3", () => { const c = makeCounter(); c(); c(); return c() === 3; });
check("Two counters are independent", () => { const a = makeCounter(); const b = makeCounter(); a(); a(); return b() === 1; });
check("The count is not a global variable", () => typeof count === "undefined");`,
      learned: 'A closure is a function that remembers the variables around where it was created, which gives you private state.',
    },
    {
      id: 'array-methods',
      kind: 'run',
      language: 'javascript',
      title: 'Summarise orders with array methods',
      goal: 'Use `filter`, `map` and `reduce` instead of loops to analyse a list of orders.',
      steps: [
        'Write `paidTotal(orders)`: add up `amount` of orders where `paid` is true.',
        'Write `customerNames(orders)`: the unique customer names, sorted A to Z.',
        'Use `filter`, `map` and `reduce` (no `for` loops).',
      ],
      starter: `function paidTotal(orders) {
  // your code here
}

function customerNames(orders) {
  // your code here
}`,
      hints: ['`orders.filter(o => o.paid)` keeps only paid orders.', '`reduce((sum, o) => sum + o.amount, 0)` adds numbers up.', '`[...new Set(names)]` removes duplicates; then call `.sort()`.'],
      solution: `function paidTotal(orders) {
  return orders.filter((o) => o.paid).reduce((sum, o) => sum + o.amount, 0);
}

function customerNames(orders) {
  return [...new Set(orders.map((o) => o.customer))].sort();
}`,
      harness: `const orders = [
  { customer: "Ravi", amount: 400, paid: true },
  { customer: "Asha", amount: 250, paid: false },
  { customer: "Ravi", amount: 100, paid: true },
  { customer: "Meera", amount: 50, paid: true },
];
check("paidTotal adds only the paid orders (550)", () => paidTotal(orders) === 550);
check("paidTotal of an empty list is 0", () => paidTotal([]) === 0);
check("customerNames removes duplicates", () => customerNames(orders).length === 3);
check("customerNames is sorted A to Z", () => JSON.stringify(customerNames(orders)) === JSON.stringify(["Asha", "Meera", "Ravi"]));`,
      rules: [
        { label: 'Uses `filter`', match: /\.filter\(/, hint: 'Use .filter() to keep the paid orders.' },
        { label: 'Uses `reduce`', match: /\.reduce\(/, hint: 'Use .reduce() to add the amounts.' },
        { label: 'Uses `map`', match: /\.map\(/, hint: 'Use .map() to pull out the names.' },
        { label: 'No `for` loops', match: /\bfor\s*\(/, absent: true, hint: 'Replace loops with array methods.' },
      ],
      learned: 'Array methods describe what you want (filter, transform, combine) instead of how to loop, so the code is shorter and clearer.',
    },
    {
      id: 'promises',
      kind: 'run',
      language: 'javascript',
      title: 'Wait for promises with async/await',
      goal: 'Write `delay(ms, value)` and `loadBoth()` that waits for two slow lookups at the same time.',
      steps: [
        '`delay(ms, value)` returns a Promise that resolves with `value` after `ms` milliseconds.',
        '`loadBoth()` is an `async` function that fetches the user and the cart together with `Promise.all`.',
        'It returns `{ user, cart }`.',
      ],
      starter: `function delay(ms, value) {
  // your code here
}

const getUser = () => delay(50, "Asha");
const getCart = () => delay(50, ["pen", "book"]);

async function loadBoth() {
  // your code here
}`,
      hints: ['`new Promise((resolve) => setTimeout(() => resolve(value), ms))`', 'Start both promises first, then wait for them together.', '`const [user, cart] = await Promise.all([getUser(), getCart()]);`'],
      solution: `function delay(ms, value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

const getUser = () => delay(50, "Asha");
const getCart = () => delay(50, ["pen", "book"]);

async function loadBoth() {
  const [user, cart] = await Promise.all([getUser(), getCart()]);
  return { user, cart };
}`,
      harness: `await checkAsync("delay returns a Promise", () => delay(1, 1) instanceof Promise);
await checkAsync("delay resolves with the value", async () => (await delay(5, "x")) === "x");
await checkAsync("loadBoth returns { user, cart }", async () => { const r = await loadBoth(); return r.user === "Asha" && r.cart.length === 2; });
await checkAsync("loadBoth waits for both at the same time (under 90 ms)", async () => { const t = Date.now(); await loadBoth(); return Date.now() - t < 90; });`,
      rules: [{ label: 'Uses `Promise.all`', match: /Promise\.all\(/, hint: 'Promise.all runs both lookups in parallel.' }],
      learned: '`await` pauses only your function, and `Promise.all` lets independent slow tasks run at the same time instead of one after another.',
    },
    {
      id: 'group-by',
      kind: 'run',
      language: 'javascript',
      title: 'Write a reusable groupBy',
      goal: 'Write `groupBy(items, keyFn)` that returns an object of arrays grouped by the key.',
      steps: [
        'Start with an empty object.',
        'For each item compute its key with `keyFn(item)`.',
        'Create the array for a new key, then push the item. Return the object.',
      ],
      starter: `function groupBy(items, keyFn) {
  // your code here
}`,
      hints: ['`reduce` is a good fit, with `{}` as the starting value.', 'If `groups[key]` does not exist yet, set it to `[]`.', '`(groups[key] ??= []).push(item)` does both steps in one line.'],
      solution: `function groupBy(items, keyFn) {
  const groups = {};
  for (const item of items) {
    const key = keyFn(item);
    (groups[key] ??= []).push(item);
  }
  return groups;
}`,
      harness: `const words = ["apple", "avocado", "banana", "blueberry", "cherry"];
check("Groups words by first letter", () => { const g = groupBy(words, (w) => w[0]); return g.a.length === 2 && g.b.length === 2 && g.c.length === 1; });
check("Keeps the original order inside a group", () => groupBy(words, (w) => w[0]).a[0] === "apple");
check("Works with numbers (odd / even)", () => { const g = groupBy([1, 2, 3, 4, 5], (n) => (n % 2 ? "odd" : "even")); return g.odd.length === 3 && g.even.length === 2; });
check("An empty list gives an empty object", () => Object.keys(groupBy([], (x) => x)).length === 0);
check("Does not change the input", () => { const copy = [...words]; groupBy(words, (w) => w[0]); return words.join() === copy.join(); });`,
      learned: 'Passing a function as an argument (`keyFn`) makes one helper work for any grouping rule: that is the power of first-class functions.',
    },
  ],
}
