import type { LearnTrack } from './types'

export const nodejs: LearnTrack = {
  id: 'nodejs',
  intro: 'Server-side JavaScript: modules, callbacks to promises, the file system, events, configuration, retries, streaming data and limiting concurrency.',
  kind: 'js',
  lang: 'javascript',
  steps: [
    {
      id: 'modules',
      title: 'Modules',
      learn: `Node has two module systems:

- **ES modules**: \`export function f() {}\` and \`import { f } from './f.js'\` (with \`"type": "module"\` in package.json)
- **CommonJS**: \`module.exports = { f }\` and \`const { f } = require('./f')\`

New code uses ES modules. A file's named exports are its public API; everything else stays private.`,
      task: 'Export a named function `slugify(text)` that lower-cases, trims, replaces runs of non-letters/digits with "-", and removes "-" from the ends. Keep the helper `clean` private.',
      starter: `function clean(text) {
  return text.trim().toLowerCase()
}

function slugify(text) {
  return clean(text)
}
`,
      solution: `function clean(text) {
  return text.trim().toLowerCase()
}

export function slugify(text) {
  return clean(text).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}
`,
      tests: [
        ['slugify is exported', 'expect(typeof module.exports.slugify).toBe("function")'],
        ['makes slugs', 'expect(module.exports.slugify("  Hello, World!  ")).toBe("hello-world"); expect(module.exports.slugify("Node.js 22 -- tips")).toBe("node-js-22-tips")'],
        ['clean stays private', 'expect(module.exports.clean).toBeUndefined()'],
      ],
      hints: ['Put `export` in front of `function slugify`.', '`.replace(/[^a-z0-9]+/g, "-")` then `.replace(/^-+|-+$/g, "")`.'],
    },
    {
      id: 'promisify',
      title: 'From callbacks to promises',
      learn: `Older Node APIs take an **error-first callback**: \`(err, result) => {}\`. Wrap one in a Promise so you can \`await\` it:

\`\`\`
const p = new Promise((resolve, reject) => {
  api((err, value) => (err ? reject(err) : resolve(value)))
})
\`\`\`

(\`util.promisify\` does this for you in real Node.)`,
      task: '`readConfig(name, cb)` is a callback API. Write `readConfigAsync(name)` that returns a Promise of the config (rejecting on error).',
      starter: `const CONFIGS = { app: { port: 3000 } }
function readConfig(name, cb) {
  setTimeout(() => (CONFIGS[name] ? cb(null, CONFIGS[name]) : cb(new Error('No config ' + name))), 5)
}

function readConfigAsync(name) {

}
`,
      solution: `const CONFIGS = { app: { port: 3000 } }
function readConfig(name, cb) {
  setTimeout(() => (CONFIGS[name] ? cb(null, CONFIGS[name]) : cb(new Error('No config ' + name))), 5)
}

function readConfigAsync(name) {
  return new Promise((resolve, reject) => {
    readConfig(name, (err, config) => (err ? reject(err) : resolve(config)))
  })
}
`,
      tests: [
        ['resolves with the config', 'expect(await readConfigAsync("app")).toEqual({ port: 3000 })'],
        ['rejects on error', 'await expect(readConfigAsync("nope")).rejects.toMatch(/No config nope/)'],
        ['returns a Promise', 'expect(readConfigAsync("app")).toBeInstanceOf(Promise)'],
      ],
      hints: ['Return `new Promise((resolve, reject) => { … })`.', 'Inside, call `readConfig` and use `err ? reject(err) : resolve(config)`.'],
    },
    {
      id: 'fs',
      title: 'Reading files',
      learn: `\`node:fs/promises\` has promise versions of the file APIs:

\`\`\`
import { readFile, writeFile } from 'node:fs/promises'
const text = await readFile('data.json', 'utf8')
\`\`\`

A missing file throws an error whose \`code\` is \`'ENOENT'\`. Handle the cases you expect; let unexpected errors through.`,
      task: 'Write `async function loadSettings()`: read and parse `settings.json`. If the file does not exist, return `{ theme: "light" }`. Other errors (like bad JSON) should still throw.',
      starter: `import { readFile } from 'node:fs/promises'

export async function loadSettings() {
  return JSON.parse(await readFile('settings.json', 'utf8'))
}
`,
      solution: `import { readFile } from 'node:fs/promises'

export async function loadSettings() {
  try {
    return JSON.parse(await readFile('settings.json', 'utf8'))
  } catch (err) {
    if (err.code === 'ENOENT') return { theme: 'light' }
    throw err
  }
}
`,
      tests: [
        ['defaults when the file is missing', 'files.delete("settings.json"); expect(await module.exports.loadSettings()).toEqual({ theme: "light" })'],
        ['reads the file when it exists', 'files.set("settings.json", \'{"theme":"dark"}\'); expect(await module.exports.loadSettings()).toEqual({ theme: "dark" })'],
        ['still throws on bad JSON', 'files.set("settings.json", "{oops"); await expect(module.exports.loadSettings()).rejects.toBeTruthy()'],
      ],
      hints: ['Wrap the read in `try/catch`.', 'Return the default only when `err.code === "ENOENT"`; otherwise `throw err`.'],
    },
    {
      id: 'events',
      title: 'EventEmitter',
      learn: `Much of Node is event-driven. An \`EventEmitter\` lets objects announce things:

\`\`\`
import { EventEmitter } from 'node:events'
class Job extends EventEmitter {}
job.on('done', (result) => …)
job.emit('done', 42)
\`\`\`

\`once\` listens a single time. Remove listeners you no longer need, or they leak.`,
      task: 'Write `class Order extends EventEmitter` with `pay(amount)`: it sets `paid` to true and emits `"paid"` with the amount. Paying twice throws `Error("Already paid")`.',
      starter: `import { EventEmitter } from 'node:events'

class Order {
  paid = false
}
`,
      solution: `import { EventEmitter } from 'node:events'

class Order extends EventEmitter {
  paid = false

  pay(amount) {
    if (this.paid) throw new Error('Already paid')
    this.paid = true
    this.emit('paid', amount)
  }
}
`,
      tests: [
        ['emits "paid" with the amount', 'const o = new Order(); const spy = fn(); o.on("paid", spy); o.pay(25); expect(spy).toHaveBeenCalledWith(25); expect(o.paid).toBe(true)'],
        ['refuses to pay twice', 'const o = new Order(); o.pay(1); expect(() => o.pay(1)).toThrow("Already paid")'],
        ['is an EventEmitter', 'expect(new Order()).toBeInstanceOf(EventEmitter)'],
      ],
      hints: ['`class Order extends EventEmitter`.', 'In `pay`: check `this.paid`, set it, then `this.emit("paid", amount)`.'],
    },
    {
      id: 'config',
      title: 'Configuration from the environment',
      learn: `Configuration (ports, URLs, secrets) comes from **environment variables**, so one build runs anywhere. Everything in \`process.env\` is a string or \`undefined\`.

Read it once at start-up, convert types, apply defaults, and **fail fast** when something required is missing.`,
      task: 'Write `loadConfig(env)`: `port` is `Number(env.PORT)` (default 3000), `databaseUrl` is required (throw `Error("DATABASE_URL is required")`), and `debug` is true only when `env.DEBUG === "1"`.',
      starter: `function loadConfig(env) {
  return { port: env.PORT, databaseUrl: env.DATABASE_URL, debug: env.DEBUG }
}
`,
      solution: `function loadConfig(env) {
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is required')
  return {
    port: env.PORT ? Number(env.PORT) : 3000,
    databaseUrl: env.DATABASE_URL,
    debug: env.DEBUG === '1',
  }
}
`,
      tests: [
        ['reads and converts values', 'expect(loadConfig({ PORT: "8080", DATABASE_URL: "postgres://db", DEBUG: "1" })).toEqual({ port: 8080, databaseUrl: "postgres://db", debug: true })'],
        ['applies defaults', 'expect(loadConfig({ DATABASE_URL: "x" })).toEqual({ port: 3000, databaseUrl: "x", debug: false })'],
        ['fails fast without DATABASE_URL', 'expect(() => loadConfig({})).toThrow("DATABASE_URL is required")'],
      ],
      hints: ['Check `DATABASE_URL` first and throw.', '`env.DEBUG === "1"` is a real boolean; `env.DEBUG` alone would be the string.'],
    },
    {
      id: 'retry',
      title: 'Retrying with backoff',
      learn: `Network calls fail sometimes. Retry a few times, waiting longer each time (**exponential backoff**: 100ms, 200ms, 400ms…), and give up with the last error:

\`\`\`
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
\`\`\`

Only retry operations that are safe to repeat.`,
      task: 'Write `retry(task, attempts = 3, baseMs = 1)`: call the async `task`; on failure wait `baseMs * 2 ** i` and try again, up to `attempts` calls in total. Rethrow the last error.',
      starter: `const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function retry(task, attempts = 3, baseMs = 1) {
  return task()
}
`,
      solution: `const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function retry(task, attempts = 3, baseMs = 1) {
  let lastError
  for (let i = 0; i < attempts; i++) {
    try {
      return await task()
    } catch (err) {
      lastError = err
      if (i < attempts - 1) await sleep(baseMs * 2 ** i)
    }
  }
  throw lastError
}
`,
      tests: [
        ['succeeds after failures', 'let n = 0; const task = async () => { if (++n < 3) throw new Error("flaky"); return "ok" }; expect(await retry(task, 3)).toBe("ok"); expect(n).toBe(3)'],
        ['gives up after the attempts, with the last error', 'let n = 0; const task = async () => { n++; throw new Error("down " + n) }; await expect(retry(task, 2)).rejects.toMatch("down 2"); expect(n).toBe(2)'],
        ['does not retry a success', 'const task = fn(async () => 1); await retry(task); expect(task).toHaveBeenCalledTimes(1)'],
      ],
      hints: ['Loop `attempts` times; `return await task()` inside `try`.', 'Remember the error in `catch`, sleep, and `throw lastError` after the loop.'],
    },
    {
      id: 'stream-lines',
      title: 'Processing streams',
      learn: `Streams deliver data in **chunks**, so a big file never sits in memory at once. Chunks don't line up with lines: a line can be split across two chunks.

An \`async function*\` (async generator) can turn chunks into lines, and \`for await…of\` consumes them one by one.`,
      task: 'Write `async function* lines(chunks)`: given an async iterable of text chunks, yield each complete line (without "\\n"), and the last line if the input doesn\'t end with a newline.',
      starter: `async function* lines(chunks) {
  for await (const chunk of chunks) {
    yield chunk
  }
}
`,
      solution: `async function* lines(chunks) {
  let buffer = ''
  for await (const chunk of chunks) {
    buffer += chunk
    let i
    while ((i = buffer.indexOf('\\n')) >= 0) {
      yield buffer.slice(0, i)
      buffer = buffer.slice(i + 1)
    }
  }
  if (buffer) yield buffer
}
`,
      tests: [
        ['joins lines split across chunks', 'async function* src() { yield "ab"; yield "c\\nde"; yield "f\\ng" } const out = []; for await (const l of lines(src())) out.push(l); expect(out).toEqual(["abc", "def", "g"])'],
        ['handles a trailing newline', 'async function* src() { yield "x\\ny\\n" } const out = []; for await (const l of lines(src())) out.push(l); expect(out).toEqual(["x", "y"])'],
      ],
      hints: ['Keep a `buffer`; add each chunk to it.', 'While the buffer has a "\\n", yield up to it and keep the rest; after the loop, yield what\'s left.'],
    },
    {
      id: 'concurrency',
      title: 'Limiting concurrency',
      learn: `\`Promise.all(items.map(work))\` starts **everything** at once: fine for 10 items, a problem for 10,000 (rate limits, memory, open sockets).

A pool runs at most N tasks at a time: start N workers that each take the next item until none are left.`,
      task: 'Write `mapLimit(items, limit, worker)`: like `Promise.all(items.map(worker))` (results in input order) but with at most `limit` workers running at once.',
      starter: `async function mapLimit(items, limit, worker) {
  return Promise.all(items.map(worker))
}
`,
      solution: `async function mapLimit(items, limit, worker) {
  const results = new Array(items.length)
  let next = 0
  async function run() {
    while (next < items.length) {
      const i = next++
      results[i] = await worker(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run))
  return results
}
`,
      tests: [
        ['keeps the input order', 'const out = await mapLimit([30, 10, 20], 2, (ms) => new Promise((r) => setTimeout(() => r(ms), ms))); expect(out).toEqual([30, 10, 20])'],
        ['never runs more than the limit', 'let active = 0, peak = 0; await mapLimit([1, 2, 3, 4, 5, 6], 2, async () => { active++; peak = Math.max(peak, active); await new Promise((r) => setTimeout(r, 5)); active-- }); expect(peak).toBe(2)'],
        ['handles an empty list', 'expect(await mapLimit([], 3, async (x) => x)).toEqual([])'],
      ],
      hints: ['Share an index `next` between `limit` worker loops.', 'Each loop: `const i = next++; results[i] = await worker(items[i])`.'],
    },
  ],
}
