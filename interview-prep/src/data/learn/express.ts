import type { LearnTrack } from './types'

export const express: LearnTrack = {
  id: 'express',
  intro: 'Build a REST API with Express: routes, params and query, JSON bodies and validation, middleware, routers, error handling and full CRUD.',
  kind: 'js',
  lang: 'javascript',
  steps: [
    {
      id: 'first-route',
      title: 'Your first route',
      learn: `An Express app maps **method + path** to a handler that gets the request and the response:

\`\`\`
app.get('/hello', (req, res) => {
  res.json({ message: 'Hi' })
})
\`\`\`

\`res.json\` sends JSON with status 200 unless you set another with \`res.status(code)\`.`,
      task: 'Add `GET /health` that responds with JSON `{ status: "ok" }`.',
      starter: `import express from 'express'

export const app = express()
`,
      solution: `import express from 'express'

export const app = express()

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})
`,
      tests: [
        ['GET /health → 200', 'const r = await request(app).get("/health"); expect(r.status).toBe(200)'],
        ['responds { status: "ok" }', 'const r = await request(app).get("/health"); expect(r.body).toEqual({ status: "ok" })'],
      ],
      hints: ['`app.get("/health", (req, res) => { … })`.', 'Inside, `res.json({ status: "ok" })`.'],
    },
    {
      id: 'params-query',
      title: 'Params and query strings',
      learn: `\`/users/:id\` captures part of the path in \`req.params.id\`. Query strings like \`?sort=name\` arrive in \`req.query\`. Both are **strings**: convert them.

Return **404** when the thing asked for doesn't exist.`,
      task: 'Add `GET /users/:id` returning the user from `USERS` (404 with `{ error: "User not found" }` otherwise). Add `GET /users` that filters by `?role=` when given.',
      starter: `import express from 'express'

const USERS = [
  { id: 1, name: 'Ada', role: 'admin' },
  { id: 2, name: 'Linus', role: 'user' },
  { id: 3, name: 'Grace', role: 'admin' },
]

export const app = express()
`,
      solution: `import express from 'express'

const USERS = [
  { id: 1, name: 'Ada', role: 'admin' },
  { id: 2, name: 'Linus', role: 'user' },
  { id: 3, name: 'Grace', role: 'admin' },
]

export const app = express()

app.get('/users', (req, res) => {
  const { role } = req.query
  res.json(role ? USERS.filter((u) => u.role === role) : USERS)
})

app.get('/users/:id', (req, res) => {
  const user = USERS.find((u) => u.id === Number(req.params.id))
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json(user)
})
`,
      tests: [
        ['GET /users/2 returns Linus', 'const r = await request(app).get("/users/2"); expect(r.status).toBe(200); expect(r.body.name).toBe("Linus")'],
        ['unknown id → 404', 'const r = await request(app).get("/users/42"); expect(r.status).toBe(404); expect(r.body).toEqual({ error: "User not found" })'],
        ['?role=admin filters', 'const r = await request(app).get("/users?role=admin"); expect(r.body.map((u) => u.name)).toEqual(["Ada", "Grace"])'],
        ['no filter returns everyone', 'expect((await request(app).get("/users")).body).toHaveLength(3)'],
      ],
      hints: ['`req.params.id` is a string: compare with `Number(req.params.id)`.', '`return res.status(404).json(…)`: the `return` stops the handler there.'],
    },
    {
      id: 'json-body',
      title: 'JSON bodies and validation',
      learn: `\`app.use(express.json())\` parses JSON request bodies into \`req.body\`. Register it **before** the routes that need it.

Validate every field. Answer **400** for bad input and **201 Created** for a successful create.`,
      task: 'Add `POST /todos`: the body needs a non-empty string `title`. Respond 201 with `{ id, title, done: false }` (ids start at 1) or 400 with `{ error: "title is required" }`.',
      starter: `import express from 'express'

export const app = express()
const todos = []

app.post('/todos', (req, res) => {
  res.json(req.body)
})
`,
      solution: `import express from 'express'

export const app = express()
app.use(express.json())
const todos = []

app.post('/todos', (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : ''
  if (!title) return res.status(400).json({ error: 'title is required' })
  const todo = { id: todos.length + 1, title, done: false }
  todos.push(todo)
  res.status(201).json(todo)
})
`,
      tests: [
        ['creates a todo with 201', 'const r = await request(app).post("/todos", { title: "Write tests" }); expect(r.status).toBe(201); expect(r.body).toEqual({ id: 1, title: "Write tests", done: false })'],
        ['ids increase', 'const a = await request(app).post("/todos", { title: "a" }); const b = await request(app).post("/todos", { title: "b" }); expect(b.body.id).toBe(a.body.id + 1)'],
        ['400 for a missing or blank title', 'for (const b of [{}, { title: "  " }, { title: 5 }]) expect((await request(app).post("/todos", b)).status).toBe(400)'],
      ],
      hints: ['`app.use(express.json())` must come before `app.post(…)`.', 'Check `typeof req.body?.title === "string"` and that it isn\'t blank after `trim()`.'],
    },
    {
      id: 'middleware',
      title: 'Middleware',
      learn: `Middleware runs before your routes: \`(req, res, next) => { … }\`. It either **responds** (and stops) or calls \`next()\` to continue. Forget both and the request hangs.

Authentication is classic middleware: check a header, answer **401** if it's missing or wrong.`,
      task: 'Write `requireApiKey` middleware: if the `x-api-key` header isn\'t `"secret"`, respond 401 `{ error: "Unauthorized" }`; otherwise continue. Use it only on `GET /admin`. `GET /public` stays open.',
      starter: `import express from 'express'

export const app = express()

function requireApiKey(req, res, next) {

}

app.get('/public', (req, res) => res.json({ ok: true }))
app.get('/admin', (req, res) => res.json({ secret: 42 }))
`,
      solution: `import express from 'express'

export const app = express()

function requireApiKey(req, res, next) {
  if (req.get('x-api-key') !== 'secret') {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

app.get('/public', (req, res) => res.json({ ok: true }))
app.get('/admin', requireApiKey, (req, res) => res.json({ secret: 42 }))
`,
      tests: [
        ['401 without the key', 'const r = await request(app).get("/admin"); expect(r.status).toBe(401); expect(r.body).toEqual({ error: "Unauthorized" })'],
        ['passes with the key', 'const r = await request(app).get("/admin", { "x-api-key": "secret" }); expect(r.body).toEqual({ secret: 42 })'],
        ['/public needs no key', 'expect((await request(app).get("/public")).status).toBe(200)'],
      ],
      hints: ['Read the header with `req.get("x-api-key")`.', 'Add the middleware between the path and the handler: `app.get("/admin", requireApiKey, handler)`.'],
    },
    {
      id: 'router',
      title: 'Routers',
      learn: `\`express.Router()\` groups related routes into a mini app you can mount under a prefix:

\`\`\`
const books = express.Router()
books.get('/', list)        // GET /api/books
books.get('/:id', getOne)   // GET /api/books/7
app.use('/api/books', books)
\`\`\`

Inside the router, paths are relative to the mount point.`,
      task: 'Create a `books` router with `GET /` (all books) and `GET /:id` (one book or 404 `{ error: "Not found" }`), mounted at `/api/books`.',
      starter: `import express from 'express'

const BOOKS = [{ id: 1, title: 'SICP' }, { id: 2, title: 'CLRS' }]
export const app = express()
`,
      solution: `import express from 'express'

const BOOKS = [{ id: 1, title: 'SICP' }, { id: 2, title: 'CLRS' }]
export const app = express()

const books = express.Router()
books.get('/', (req, res) => res.json(BOOKS))
books.get('/:id', (req, res) => {
  const book = BOOKS.find((b) => b.id === Number(req.params.id))
  if (!book) return res.status(404).json({ error: 'Not found' })
  res.json(book)
})

app.use('/api/books', books)
`,
      tests: [
        ['GET /api/books lists them', 'expect((await request(app).get("/api/books")).body).toHaveLength(2)'],
        ['GET /api/books/2', 'expect((await request(app).get("/api/books/2")).body).toEqual({ id: 2, title: "CLRS" })'],
        ['404 for an unknown book', 'expect((await request(app).get("/api/books/9")).status).toBe(404)'],
        ['uses express.Router()', 'expect(code).toMatch(/express\\.Router\\(\\)/)'],
      ],
      hints: ['`const books = express.Router()`, then `books.get(…)`.', 'Mount it with `app.use("/api/books", books)`.'],
    },
    {
      id: 'errors',
      title: 'Error-handling middleware',
      learn: `Pass errors to \`next(err)\` (or throw in an async handler, Express 5) and handle them **once**, in error middleware with **four** parameters, registered after the routes:

\`\`\`
app.use((err, req, res, next) => {
  res.status(err.status ?? 500).json({ error: err.message })
})
\`\`\`

Don't leak stack traces to clients.`,
      task: 'Make `GET /divide?a=&b=` throw an `HttpError(400, "b must not be zero")` when b is 0, and add error middleware that responds with the error\'s status (default 500) and `{ error: message }`.',
      starter: `import express from 'express'

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export const app = express()

app.get('/divide', (req, res) => {
  res.json({ result: Number(req.query.a) / Number(req.query.b) })
})

app.get('/crash', () => {
  throw new Error('Something broke')
})
`,
      solution: `import express from 'express'

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export const app = express()

app.get('/divide', (req, res) => {
  const b = Number(req.query.b)
  if (b === 0) throw new HttpError(400, 'b must not be zero')
  res.json({ result: Number(req.query.a) / b })
})

app.get('/crash', () => {
  throw new Error('Something broke')
})

app.use((err, req, res, next) => {
  res.status(err.status ?? 500).json({ error: err.message })
})
`,
      tests: [
        ['divides', 'expect((await request(app).get("/divide?a=10&b=4")).body).toEqual({ result: 2.5 })'],
        ['400 for b = 0', 'const r = await request(app).get("/divide?a=1&b=0"); expect(r.status).toBe(400); expect(r.body).toEqual({ error: "b must not be zero" })'],
        ['500 JSON for unexpected errors', 'const r = await request(app).get("/crash"); expect(r.status).toBe(500); expect(r.body).toEqual({ error: "Something broke" })'],
      ],
      hints: ['Throw `new HttpError(400, "b must not be zero")` in the route.', 'The error handler needs all four parameters `(err, req, res, next)` and goes last.'],
    },
    {
      id: 'async-routes',
      title: 'Async routes',
      learn: `Real handlers await a database. In Express 5 a rejected promise goes to your error middleware automatically; in Express 4 you must \`try/catch\` and call \`next(err)\`.

Writing the \`try/catch\` yourself works in both, so it's a good habit.`,
      task: '`db.findOrder(id)` is async and throws for id 0 (database down). Write `GET /orders/:id` that awaits it: 404 `{ error: "Not found" }` for `null`, and pass thrown errors to `next` so the error middleware answers 503.',
      starter: `import express from 'express'

const db = {
  async findOrder(id) {
    if (id === 0) throw Object.assign(new Error('Database unavailable'), { status: 503 })
    return id === 1 ? { id: 1, total: 30 } : null
  },
}

export const app = express()

app.get('/orders/:id', async (req, res) => {
  const order = await db.findOrder(Number(req.params.id))
  res.json(order)
})

app.use((err, req, res, next) => res.status(err.status ?? 500).json({ error: err.message }))
`,
      solution: `import express from 'express'

const db = {
  async findOrder(id) {
    if (id === 0) throw Object.assign(new Error('Database unavailable'), { status: 503 })
    return id === 1 ? { id: 1, total: 30 } : null
  },
}

export const app = express()

app.get('/orders/:id', async (req, res, next) => {
  try {
    const order = await db.findOrder(Number(req.params.id))
    if (!order) return res.status(404).json({ error: 'Not found' })
    res.json(order)
  } catch (err) {
    next(err)
  }
})

app.use((err, req, res, next) => res.status(err.status ?? 500).json({ error: err.message }))
`,
      tests: [
        ['returns the order', 'expect((await request(app).get("/orders/1")).body).toEqual({ id: 1, total: 30 })'],
        ['404 when missing', 'expect((await request(app).get("/orders/7")).status).toBe(404)'],
        ['database errors become 503 JSON', 'const r = await request(app).get("/orders/0"); expect(r.status).toBe(503); expect(r.body).toEqual({ error: "Database unavailable" })'],
      ],
      hints: ['Make the handler `async` and `await db.findOrder(…)`; without `await` you send a Promise.', 'Wrap it in `try { … } catch (err) { next(err) }`.'],
    },
    {
      id: 'crud',
      title: 'Update and delete',
      learn: `REST maps actions to methods on one resource URL:

- \`PATCH /notes/:id\`: change some fields → 200 with the updated note
- \`DELETE /notes/:id\`: remove it → **204 No Content** (no body)

Both answer 404 for an unknown id.`,
      task: 'Add `PATCH /notes/:id` (update `text` if it\'s a non-empty string, else 400 `{ error: "text is required" }`) and `DELETE /notes/:id` (204). Both 404 `{ error: "Not found" }` for unknown ids.',
      starter: `import express from 'express'

export const app = express()
app.use(express.json())
const notes = [{ id: 1, text: 'Buy milk' }, { id: 2, text: 'Call Ada' }]

app.get('/notes', (req, res) => res.json(notes))
`,
      solution: `import express from 'express'

export const app = express()
app.use(express.json())
const notes = [{ id: 1, text: 'Buy milk' }, { id: 2, text: 'Call Ada' }]

app.get('/notes', (req, res) => res.json(notes))

app.patch('/notes/:id', (req, res) => {
  const note = notes.find((n) => n.id === Number(req.params.id))
  if (!note) return res.status(404).json({ error: 'Not found' })
  const { text } = req.body ?? {}
  if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'text is required' })
  note.text = text.trim()
  res.json(note)
})

app.delete('/notes/:id', (req, res) => {
  const i = notes.findIndex((n) => n.id === Number(req.params.id))
  if (i < 0) return res.status(404).json({ error: 'Not found' })
  notes.splice(i, 1)
  res.status(204).end()
})
`,
      tests: [
        ['PATCH updates the text', 'const r = await request(app).patch("/notes/1", { text: "Buy oat milk" }); expect(r.status).toBe(200); expect(r.body).toEqual({ id: 1, text: "Buy oat milk" })'],
        ['PATCH validates', 'expect((await request(app).patch("/notes/1", { text: "" })).status).toBe(400)'],
        ['DELETE answers 204 and removes it', 'expect((await request(app).delete("/notes/2")).status).toBe(204); expect((await request(app).get("/notes")).body.map((n) => n.id)).toEqual([1])'],
        ['404 for unknown ids', 'expect((await request(app).patch("/notes/9", { text: "x" })).status).toBe(404); expect((await request(app).delete("/notes/9")).status).toBe(404)'],
      ],
      hints: ['Find the note by `Number(req.params.id)` first; 404 if missing.', 'For delete, `res.status(204).end()` sends no body.'],
    },
  ],
}
