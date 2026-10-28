import type { NoteTopic } from './types'

export const nodejs: NoteTopic = {
  id: 'nodejs',
  title: 'Node.js',
  tagline: 'Runtime, event loop, modules, streams, scaling and npm',
  category: 'Backend',
  badge: 'Node',
  color: '#3c873a',
  sections: [
    {
      id: 'what',
      title: 'What Node.js is',
      blocks: [
        { type: 'def', text: '**Node.js** is a JavaScript runtime built on ==V8 + libuv==. It runs JS outside the browser with a single-threaded event loop and non-blocking I/O, so one process can serve many concurrent connections.' },
        { type: 'analogy', title: 'Think of Node.js like one fast waiter', steps: [{ icon: '🙋', who: 'Customer', tech: 'Request', text: 'Many customers arrive at once' }, { icon: '🧑‍🍳', who: 'One waiter', tech: 'Event loop', text: 'Takes every order without waiting at the kitchen' }, { icon: '👨‍🍳', who: 'Kitchen staff', tech: 'libuv / thread pool', text: 'Cook slow dishes (files, DB) in the background' }, { icon: '🍽️', who: 'Bell rings', tech: 'Callback', text: 'Waiter delivers the food when it is ready' }] },
        { type: 'flow', steps: ['Request', 'Event loop (1 JS thread)', 'libuv: OS async I/O + thread pool (fs, crypto, dns)', 'Callback queued', 'Response'] },
        { type: 'list', items: ['Great for I/O-heavy work: APIs, real-time apps, proxies.', 'Bad at long CPU work on the main thread (image processing, big loops) — it blocks every request. Use `worker_threads` or a separate service.'] },
      ],
    },
    {
      id: 'event-loop',
      title: 'The Node event loop phases',
      blocks: [
        { type: 'steps', items: ['**timers** — `setTimeout` / `setInterval` callbacks', '**pending callbacks** — some deferred system callbacks', '**poll** — wait for and run I/O callbacks', '**check** — `setImmediate` callbacks', '**close** — `socket.on("close")` etc.'] },
        {
          type: 'code', lang: 'javascript', title: 'Ordering (in a Node script)',
          code: `setTimeout(() => console.log('timeout'), 0)
setImmediate(() => console.log('immediate'))
Promise.resolve().then(() => console.log('promise'))
process.nextTick(() => console.log('nextTick'))
console.log('sync')
// sync → nextTick → promise → timeout / immediate
// (timeout vs immediate order varies at top level; inside an I/O callback, immediate runs first)`,
        },
        { type: 'tip', text: '`process.nextTick` runs before promise microtasks. Too many nextTicks can starve I/O.' },
      ],
    },
    {
      id: 'modules',
      title: 'Modules and npm',
      blocks: [
        {
          type: 'table', head: ['CommonJS', 'ES Modules'],
          rows: [
            ['`require()` / `module.exports`', '`import` / `export`'],
            ['Loaded synchronously at runtime', 'Static, analysable, top-level `await`'],
            ['Default for `.js` without `"type": "module"`', '`.mjs`, or `"type": "module"` in package.json'],
          ],
        },
        { type: 'list', items: ['`package.json`: scripts, dependencies vs devDependencies, `engines`.', 'Semver `MAJOR.MINOR.PATCH`: `^1.2.3` allows minor + patch, `~1.2.3` allows patch only.', 'Commit `package-lock.json`; use `npm ci` in CI for exact, repeatable installs.', '`npx` runs a package binary without installing it globally.'] },
      ],
    },
    {
      id: 'core',
      title: 'Core modules, streams and errors',
      blocks: [
        {
          type: 'code', lang: 'javascript', title: 'Read a big file without loading it all into memory',
          code: `import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'

const rl = createInterface({ input: createReadStream('access.log') })
let errors = 0
for await (const line of rl) {
  if (line.includes(' 500 ')) errors++
}
console.log('5xx responses:', errors)`,
        },
        { type: 'list', items: ['Core modules: `fs/promises`, `path`, `http`, `crypto`, `events`, `stream`, `os`, `child_process`, `worker_threads`.', '**Streams** process data chunk by chunk (Readable, Writable, Duplex, Transform) — use `pipeline()` for errors and back-pressure.', '`EventEmitter`: `on`, `once`, `emit` — the base of streams and servers.', 'Always handle promise rejections; log `unhandledRejection` / `uncaughtException`, then exit and let the process manager restart.'] },
        { type: 'mistake', text: 'Sync APIs in request handlers (`readFileSync`, `bcrypt.hashSync`, big `JSON.parse` loops) block every other user. Use the async versions.' },
      ],
    },
    {
      id: 'scaling',
      title: 'Scaling and production',
      blocks: [
        {
          type: 'table', head: ['Tool', 'What it does'],
          rows: [
            ['cluster / PM2', 'one process per CPU core behind a shared port'],
            ['worker_threads', 'run CPU-heavy work off the main thread'],
            ['Load balancer + stateless app', 'scale horizontally across machines'],
            ['Redis', 'shared cache, sessions, rate limits, queues (BullMQ)'],
            ['Graceful shutdown', 'on SIGTERM stop accepting, finish in-flight requests, close DB'],
          ],
        },
        { type: 'list', items: ['Config from environment variables (12-factor); never commit secrets.', 'Structured logs (pino), health checks (`/health`), metrics.', 'Cron jobs: node-cron in a single instance or a queue scheduler to avoid duplicates when scaled.'] },
        { type: 'revision', text: 'Single-threaded event loop + libuv for non-blocking I/O. nextTick → promises → timers/check. Don\'t block the loop; use streams for big data, worker_threads for CPU, cluster/PM2 + stateless design to scale.' },
      ],
    },
  ],
  qa: [
    ['Is Node.js single-threaded?', 'JavaScript runs on one thread (the event loop), but libuv uses the OS and a thread pool for I/O, crypto and DNS, so I/O doesn\'t block.'],
    ['What blocks the event loop?', 'Long synchronous work: CPU-heavy loops, sync file/crypto APIs, huge JSON parsing. Every request waits.'],
    ['process.nextTick vs setImmediate vs setTimeout?', 'nextTick runs before other microtasks; setImmediate runs in the check phase after I/O; setTimeout(0) runs in the timers phase.'],
    ['What are streams and why use them?', 'Chunk-by-chunk processing of data (files, HTTP bodies) with low memory and back-pressure handling.'],
    ['CommonJS vs ES Modules?', 'CommonJS uses require/module.exports and loads synchronously; ESM uses import/export, is statically analysable and supports top-level await.'],
    ['How do you scale a Node app?', 'cluster/PM2 to use all cores, stateless servers behind a load balancer, Redis for shared state, worker_threads or queues for CPU work.'],
    ['dependencies vs devDependencies?', 'dependencies are needed at runtime; devDependencies only for building and testing.'],
    ['^ vs ~ in package versions?', '^1.2.3 allows minor and patch updates; ~1.2.3 allows patch updates only.'],
    ['What is graceful shutdown?', 'On SIGTERM: stop accepting connections, finish in-flight requests, close DB connections, then exit.'],
  ],
}
