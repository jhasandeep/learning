import type { SyntaxSet } from './types'

export const nodejs: SyntaxSet = {
  id: 'nodejs',
  title: 'Node.js',
  snippets: [
    {
      id: 'cjs-vs-esm',
      title: 'CommonJS vs ES modules',
      lang: 'javascript',
      code: `// math.cjs (CommonJS)
const add = (a, b) => a + b
module.exports = { add }

// app.cjs
const { add } = require('./math.cjs')

// math.mjs (ESM)
export const multiply = (a, b) => a * b
export default function square(x) {
  return x * x
}

// app.mjs
import square, { multiply } from './math.mjs'`,
      note: '`require` is synchronous and dynamic; `import` is static, async and supports top-level await. Pick per file with `.cjs`/`.mjs` or **"type": "module"** in package.json.',
    },
    {
      id: 'path-url',
      title: 'path and URL utilities',
      lang: 'javascript',
      code: `import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const configPath = path.join(__dirname, 'config', 'app.json')
const absolute = path.resolve('src', 'index.js')
const { name, ext } = path.parse('/tmp/report.final.pdf')
const base = path.basename('/a/b/c.txt', '.txt')

const url = new URL('/search?q=node&page=2', 'https://example.com')
url.searchParams.set('page', '3')
console.log(url.pathname, url.searchParams.get('q'), url.href)`,
      note: 'ESM has no `__dirname`, so rebuild it from `import.meta.url`. Use `path.join` instead of string concatenation, and **URL** for query strings.',
    },
    {
      id: 'env-config',
      title: 'Config from process.env',
      lang: 'javascript',
      code: `const env = process.env

export const config = {
  nodeEnv: env.NODE_ENV ?? 'development',
  port: Number(env.PORT) || 3000,
  dbUrl: env.DATABASE_URL ?? 'postgres://localhost:5432/app',
  debug: env.DEBUG === 'true',
  isProd: env.NODE_ENV === 'production',
}

for (const key of ['JWT_SECRET']) {
  if (!env[key]) throw new Error(\`Missing env var \${key}\`)
}`,
      note: 'Env vars are **always strings** (or undefined): convert numbers and booleans, give defaults, and fail fast on missing secrets. Node 20+ can load a file with `--env-file=.env`.',
    },
    {
      id: 'fs-promises',
      title: 'Read and write files',
      lang: 'javascript',
      code: `import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'

async function updateConfig(file) {
  const text = await readFile(file, 'utf8')
  const config = JSON.parse(text)
  config.updatedAt = new Date().toISOString()
  await mkdir('backup', { recursive: true })
  await writeFile('backup/config.json', text)
  await writeFile(file, JSON.stringify(config, null, 2) + '\\n')
}

try {
  const entries = await readdir('.', { withFileTypes: true })
  console.log(entries.filter((e) => e.isFile()).map((e) => e.name))
} catch (err) {
  if (err.code !== 'ENOENT') throw err
}`,
      note: 'Prefer `node:fs/promises` with `await` over the callback and **Sync** versions, which block the event loop. Pass `utf8` to get a string back.',
    },
    {
      id: 'http-server',
      title: 'HTTP server with node:http',
      lang: 'javascript',
      code: `import http from 'node:http'

const server = http.createServer((req, res) => {
  const url = new URL(req.url, \`http://\${req.headers.host}\`)
  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' })
  res.end('Not found')
})

server.listen(3000, () => {
  console.log('Listening on http://localhost:3000')
})`,
      note: 'A server with no framework: route on `req.method` and the pathname, set status and headers, then **always** call `res.end`. Asked to see what Express hides.',
    },
    {
      id: 'read-json-body',
      title: 'Read a JSON request body',
      lang: 'javascript',
      code: `async function readJson(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

const server = http.createServer(async (req, res) => {
  try {
    const body = await readJson(req)
    res.writeHead(201, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ received: body }))
  } catch {
    res.writeHead(400).end('Invalid JSON')
  }
})`,
      note: 'The request is a **readable stream**: collect the Buffer chunks, join, then parse. Mention a size limit in real code, and a 400 on bad JSON.',
    },
    {
      id: 'event-emitter-subclass',
      title: 'Extend EventEmitter',
      lang: 'javascript',
      code: `import { EventEmitter } from 'node:events'

class OrderQueue extends EventEmitter {
  #orders = []
  add(order) {
    this.#orders.push(order)
    this.emit('added', order)
    if (this.#orders.length >= 10) {
      this.emit('full', this.#orders.length)
    }
  }
}

const queue = new OrderQueue()
queue.on('added', (order) => console.log('new order', order.id))
queue.once('full', (count) => console.warn('queue full:', count))
queue.on('error', (err) => console.error(err))
queue.add({ id: 1 })`,
      note: 'Streams, servers and sockets are all EventEmitters. Listeners run **synchronously** in order, and an unhandled `error` event crashes the process.',
    },
    {
      id: 'nexttick-vs-setimmediate',
      title: 'nextTick vs setImmediate',
      lang: 'javascript',
      code: `import { readFile } from 'node:fs'

console.log('1 sync')
setTimeout(() => console.log('timeout (order varies)'), 0)
setImmediate(() => console.log('immediate (order varies)'))
Promise.resolve().then(() => console.log('3 promise'))
process.nextTick(() => console.log('2 nextTick'))

readFile('package.json', () => {
  setTimeout(() => console.log('5 timeout'), 0)
  setImmediate(() => console.log('4 immediate, always first here'))
})`,
      note: '`process.nextTick` runs before promise microtasks; `setImmediate` runs in the **check phase** after I/O. Inside an I/O callback, setImmediate always beats a 0 ms timer.',
    },
    {
      id: 'streams-pipeline',
      title: 'Streams: gzip a file',
      lang: 'javascript',
      code: `import { createReadStream, createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { createGzip } from 'node:zlib'

async function gzipFile(src) {
  await pipeline(
    createReadStream(src),
    createGzip(),
    createWriteStream(\`\${src}.gz\`),
  )
}

try {
  await gzipFile('access.log')
  console.log('compressed')
} catch (err) {
  console.error('pipeline failed', err)
}`,
      note: 'Streams process big files in chunks with constant memory. `pipeline` handles ==backpressure== and destroys every stream on error, unlike chained `.pipe()`.',
    },
    {
      id: 'child-process',
      title: 'Run a child process',
      lang: 'javascript',
      code: `import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'])
console.log('commit', stdout.trim())

const child = spawn('npm', ['test'], { stdio: 'inherit' })
child.on('exit', (code) => {
  console.log(\`tests exited with \${code}\`)
})`,
      note: '`execFile` buffers output for short commands; `spawn` **streams** it for long-running ones. Avoid `exec` with user input, since it goes through a shell.',
    },
    {
      id: 'worker-threads',
      title: 'CPU work in worker_threads',
      lang: 'javascript',
      code: `import {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} from 'node:worker_threads'

const fib = (n) => (n < 2 ? n : fib(n - 1) + fib(n - 2))

if (isMainThread) {
  const worker = new Worker(new URL(import.meta.url), {
    workerData: 40,
  })
  worker.on('message', (result) => console.log('fib(40) =', result))
} else {
  parentPort.postMessage(fib(workerData))
}`,
      note: 'Move **CPU-heavy** work off the event loop so the server keeps responding. The answer to "Node is single-threaded, so how do you handle heavy computation?"',
    },
    {
      id: 'graceful-shutdown',
      title: 'Graceful shutdown',
      lang: 'javascript',
      code: `import http from 'node:http'

const server = http.createServer(app)
server.listen(3000)

function shutdown(signal) {
  console.log(\`\${signal} received, closing server\`)
  server.close(async (err) => {
    await db.end()
    process.exit(err ? 1 : 0)
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)`,
      note: 'On **SIGTERM** (Docker, Kubernetes) stop accepting connections, let in-flight requests finish, close the database, then exit. The timer forces exit if it hangs.',
    },
  ],
}
