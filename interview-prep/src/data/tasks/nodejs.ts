import type { TaskPath } from './types'

// The tasks run in the browser, so they practise the Node ideas (events, callbacks,
// the event loop) with plain JavaScript: no `require` and no files.

export const nodejs: TaskPath = {
  id: 'nodejs',
  title: 'Node.js',
  blurb: 'Practise the core Node ideas: events, callbacks, promises, the event loop and CLI arguments.',
  tasks: [
    {
      id: 'event-emitter',
      kind: 'run',
      language: 'javascript',
      title: 'Build a tiny EventEmitter',
      goal: 'Write the `Emitter` class with `on`, `off` and `emit`, the pattern behind many Node APIs.',
      steps: [
        '`on(event, fn)` stores a listener for the event name.',
        '`emit(event, ...args)` calls every listener for that event with the arguments.',
        '`off(event, fn)` removes one listener.',
      ],
      starter: `class Emitter {
  // your code here
}`,
      hints: ['Keep an object like `this.listeners = {}` that maps an event name to an array of functions.', 'In `emit`, loop over `(this.listeners[event] || [])`.', '`off` can use `filter` to drop the function.'],
      solution: `class Emitter {
  constructor() {
    this.listeners = {};
  }
  on(event, fn) {
    (this.listeners[event] ||= []).push(fn);
  }
  off(event, fn) {
    this.listeners[event] = (this.listeners[event] || []).filter((f) => f !== fn);
  }
  emit(event, ...args) {
    for (const fn of this.listeners[event] || []) fn(...args);
  }
}`,
      harness: `check("calls a listener with the arguments", () => { const e = new Emitter(); let got; e.on("hi", (a, b) => { got = a + b; }); e.emit("hi", 2, 3); return got === 5; });
check("calls every listener", () => { const e = new Emitter(); let n = 0; e.on("x", () => n++); e.on("x", () => n++); e.emit("x"); return n === 2; });
check("only listeners of that event run", () => { const e = new Emitter(); let n = 0; e.on("a", () => n++); e.emit("b"); return n === 0; });
check("off removes a listener", () => { const e = new Emitter(); let n = 0; const f = () => n++; e.on("x", f); e.off("x", f); e.emit("x"); return n === 0; });
check("emitting with no listeners does not crash", () => { new Emitter().emit("nothing"); return true; });`,
      learned: 'Node is event-driven: objects announce things with `emit`, and your code reacts with `on` listeners.',
    },
    {
      id: 'promisify',
      kind: 'run',
      language: 'javascript',
      title: 'Turn a callback API into a promise',
      goal: 'Write `promisify(fn)` for Node-style functions that take `(error, result)` callbacks.',
      steps: [
        '`promisify(fn)` returns a new function that returns a Promise.',
        'It calls `fn` with the same arguments plus a callback `(err, result)`.',
        'The Promise rejects with `err` when there is one, otherwise resolves with `result`.',
      ],
      starter: `function promisify(fn) {
  // your code here
}`,
      hints: ['Return `(...args) => new Promise((resolve, reject) => { … })`.', 'Call `fn(...args, callback)` inside the executor.', 'In the callback: `if (err) reject(err); else resolve(result);`'],
      solution: `function promisify(fn) {
  return (...args) =>
    new Promise((resolve, reject) => {
      fn(...args, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
}`,
      harness: `const addLater = (a, b, cb) => setTimeout(() => cb(null, a + b), 5);
const failLater = (cb) => setTimeout(() => cb(new Error("boom")), 5);
await checkAsync("returns a function", () => typeof promisify(addLater) === "function");
await checkAsync("returns a Promise", () => promisify(addLater)(1, 2) instanceof Promise);
await checkAsync("resolves with the result (1 + 2 = 3)", async () => (await promisify(addLater)(1, 2)) === 3);
await checkAsync("rejects with the error", async () => { try { await promisify(failLater)(); return false; } catch (e) { return e.message === "boom"; } });`,
      learned: 'Old Node APIs used error-first callbacks; wrapping them in a Promise lets you use `async/await` everywhere.',
    },
    {
      id: 'cli-args',
      kind: 'run',
      language: 'javascript',
      title: 'Parse command-line arguments',
      goal: 'Write `parseArgs(argv)` that turns `["--port", "3000", "--debug"]` into an object.',
      steps: [
        'A flag starts with `--`. If the next item is not a flag, it is the flag value.',
        'A flag with no value becomes `true`.',
        'Return an object such as `{ port: "3000", debug: true }`.',
      ],
      starter: `function parseArgs(argv) {
  // your code here
}`,
      hints: ['Loop with an index so you can look at `argv[i + 1]`.', 'Remove the leading dashes with `arg.slice(2)`.', 'If `argv[i + 1]` is missing or starts with `--`, store `true`.'],
      solution: `function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) out[key] = true;
    else {
      out[key] = next;
      i++;
    }
  }
  return out;
}`,
      harness: `check("reads a flag with a value", () => parseArgs(["--port", "3000"]).port === "3000");
check("a flag with no value is true", () => parseArgs(["--debug"]).debug === true);
check("handles several flags", () => { const a = parseArgs(["--port", "80", "--debug", "--name", "app"]); return a.port === "80" && a.debug === true && a.name === "app"; });
check("a flag followed by a flag is true", () => { const a = parseArgs(["--a", "--b", "x"]); return a.a === true && a.b === "x"; });
check("no arguments gives an empty object", () => Object.keys(parseArgs([])).length === 0);`,
      learned: 'Node scripts get their inputs from `process.argv`: a small parser turns raw strings into settings your program can use.',
    },
    {
      id: 'retry',
      kind: 'run',
      language: 'javascript',
      title: 'Retry a failing async call',
      goal: 'Write `retry(fn, times)` that calls an async function again when it fails.',
      steps: [
        'Try `await fn()`; return its result when it works.',
        'If it throws, try again until `times` attempts are used.',
        'After the last failed attempt, throw the last error.',
      ],
      starter: `async function retry(fn, times) {
  // your code here
}`,
      hints: ['Use a loop from 1 to `times`.', 'Put `try { return await fn(); } catch (err) { … }` inside the loop.', 'Remember the last error and `throw` it after the loop.'],
      solution: `async function retry(fn, times) {
  let lastError;
  for (let attempt = 1; attempt <= times; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}`,
      harness: `await checkAsync("returns the result when it works at once", async () => (await retry(async () => 42, 3)) === 42);
await checkAsync("retries until it succeeds", async () => { let n = 0; const r = await retry(async () => { n++; if (n < 3) throw new Error("no"); return "ok"; }, 5); return r === "ok" && n === 3; });
await checkAsync("stops after 'times' attempts", async () => { let n = 0; try { await retry(async () => { n++; throw new Error("fail"); }, 3); } catch (e) { return n === 3 && e.message === "fail"; } return false; });
await checkAsync("does not retry after success", async () => { let n = 0; await retry(async () => { n++; return 1; }, 5); return n === 1; });`,
      learned: 'Real servers talk to flaky networks, so wrapping calls in a retry loop with a final error is a common reliability pattern.',
    },
    {
      id: 'event-loop-order',
      kind: 'run',
      language: 'javascript',
      title: 'Order work with the event loop',
      goal: 'Write `schedule(log)` so the logs appear in this order: `sync`, `micro`, `macro`.',
      steps: [
        'Call `log("sync")` immediately.',
        'Use a Promise (`Promise.resolve().then`) for `"micro"`: microtasks run first.',
        'Use `setTimeout(..., 0)` for `"macro"`: timers run after microtasks.',
      ],
      starter: `function schedule(log) {
  // your code here
}`,
      hints: ['Code that runs right now is synchronous.', 'The event loop runs all microtasks (promises) before the next timer.', 'Write the lines in a different order than the output: the scheduling decides the order.'],
      solution: `function schedule(log) {
  setTimeout(() => log("macro"), 0);
  Promise.resolve().then(() => log("micro"));
  log("sync");
}`,
      harness: `await checkAsync("logs sync, then micro, then macro", async () => {
  const seen = [];
  schedule((m) => seen.push(m));
  await new Promise((r) => setTimeout(r, 20));
  return seen.join(",") === "sync,micro,macro";
});
await checkAsync("'sync' is logged before anything else, immediately", () => { const seen = []; schedule((m) => seen.push(m)); return seen.length === 1 && seen[0] === "sync"; });`,
      rules: [
        { label: 'Uses a promise for the microtask', match: /Promise\.resolve\(\)\.then|queueMicrotask/, hint: 'Promise.resolve().then(() => log("micro"))' },
        { label: 'Uses `setTimeout` for the macrotask', match: /setTimeout\(/, hint: 'setTimeout(() => log("macro"), 0)' },
      ],
      learned: 'The event loop runs synchronous code first, then all microtasks (promises), then the next macrotask (a timer): knowing this order explains most async surprises.',
    },
  ],
}
