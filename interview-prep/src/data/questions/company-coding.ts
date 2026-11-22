import type { QuestionSet } from './types'

// Take-home / live-coding tasks that product companies ask: "build it in a notepad-style
// editor" (no IDE help). Each question has the complete code you would type.

export const companyCoding: QuestionSet = {
  id: 'company-coding',
  title: 'Company coding rounds',
  questions: [
    {
      id: 'express-names-api',
      q: 'Build an Express server with `GET /api/names` and `POST /api/names` (in-memory list). Write the whole file.',
      a: `The classic first task: a tiny REST server you can type from memory.

Checklist the interviewer watches for:
- \`express.json()\` **before** the routes, or \`req.body\` is \`undefined\`
- \`cors()\` so the React dev server (another port) can call it
- validate input and return **400** for bad data, **201** for created
- listen on a port from \`process.env.PORT\` with a fallback

Install once: \`npm i express cors\`. Run with \`node server.js\`.`,
      difficulty: 'Easy',
      freq: 3,
      tags: ['express', 'rest', 'machine-coding'],
      code: { lang: 'javascript', code: `// server.js
const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())            // allow http://localhost:5173 (Vite) or :3000 (CRA)
app.use(express.json())    // parse JSON bodies

let nextId = 4
const names = [
  { id: 1, name: 'Asha' },
  { id: 2, name: 'Ravi' },
  { id: 3, name: 'Meera' },
]

app.get('/api/names', (req, res) => {
  res.json(names)
})

app.post('/api/names', (req, res) => {
  const name = (req.body.name || '').trim()
  if (!name) return res.status(400).json({ error: 'name is required' })
  const item = { id: nextId++, name }
  names.push(item)
  res.status(201).json(item)
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log('API on http://localhost:' + PORT))` },
      followUp: 'Add `DELETE /api/names/:id` and `PUT /api/names/:id`. What status codes do you return?',
    },
    {
      id: 'react-fetch-names',
      q: 'In React, use `fetch` to load the names from your Express API and show them in a list.',
      a: `Fetch inside \`useEffect\` with an **empty dependency array** so it runs once on mount. Keep three pieces of state: data, loading, error.

Common mistakes that cost marks:
- forgetting \`res.ok\` check: \`fetch\` does **not** reject on 404/500, only on network failure
- forgetting \`res.json()\` (it returns a promise)
- setting state after unmount: use an \`AbortController\` and abort in the cleanup
- missing \`key\` on list items
- an \`async\` function passed directly to \`useEffect\` (it must return a cleanup function or nothing, not a promise)`,
      difficulty: 'Easy',
      freq: 3,
      tags: ['react', 'fetch', 'useEffect', 'machine-coding'],
      code: { lang: 'jsx', code: `import { useEffect, useState } from 'react'

const API = 'http://localhost:5000/api/names'

export default function Names() {
  const [names, setNames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const ctrl = new AbortController()
    fetch(API, { signal: ctrl.signal })
      .then((res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status)
        return res.json()
      })
      .then(setNames)
      .catch((e) => { if (e.name !== 'AbortError') setError(e.message) })
      .finally(() => setLoading(false))
    return () => ctrl.abort()
  }, [])

  if (loading) return <p>Loading…</p>
  if (error) return <p style={{ color: 'red' }}>{error}</p>
  return (
    <ul>
      {names.map((n) => <li key={n.id}>{n.name}</li>)}
    </ul>
  )
}` },
      followUp: 'Why does React 18 StrictMode call your effect twice in development, and how does the abort cleanup help?',
    },
    {
      id: 'react-axios-set-names',
      q: 'Use `axios` to load the names, then add a form that POSTs a new name and shows it in the list (set the data).',
      a: `\`axios\` differs from \`fetch\` in ways interviewers like to ask about:
- it **parses JSON for you**: the payload is in \`res.data\`
- it **rejects on 4xx/5xx**, so \`catch\` sees them (\`e.response.status\`)
- you pass the object straight to \`axios.post(url, body)\` with no \`JSON.stringify\` or headers

After the POST, add the **server's returned item** to state with the functional form \`setNames(prev => [...prev, res.data])\`, so you never mutate state and never read a stale list.

Create a shared instance with \`axios.create({ baseURL })\` so the URL lives in one place. Install with \`npm i axios\`.`,
      difficulty: 'Easy',
      freq: 3,
      tags: ['react', 'axios', 'forms', 'machine-coding'],
      code: { lang: 'jsx', code: `import { useEffect, useState } from 'react'
import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:5000/api' })

export default function NamesApp() {
  const [names, setNames] = useState([])
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/names')
      .then((res) => setNames(res.data))
      .catch((e) => setError(e.message))
  }, [])

  const add = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/names', { name: text })
      setNames((prev) => [...prev, res.data])   // add what the server returned
      setText('')
      setError('')
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    }
  }

  return (
    <div>
      <form onSubmit={add}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Name" />
        <button disabled={!text.trim()}>Add</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>{names.map((n) => <li key={n.id}>{n.name}</li>)}</ul>
    </div>
  )
}` },
      followUp: 'How would you make the new name appear instantly, before the server responds (optimistic update), and roll back on failure?',
    },
    {
      id: 'fetch-vs-axios',
      q: 'What is the difference between `fetch` and `axios`? When would you pick each?',
      a: `Both make HTTP calls; \`axios\` is a library, \`fetch\` is built into browsers and Node 18+.

- **JSON body**: fetch needs \`JSON.stringify\` plus a header; axios does it automatically
- **JSON response**: fetch needs \`await res.json()\`; axios gives \`res.data\`
- **4xx / 5xx**: fetch **resolves** (check \`res.ok\`); axios **rejects**
- **Timeout**: fetch uses \`AbortSignal.timeout(ms)\`; axios has a \`timeout\` option
- **Interceptors**: none in fetch (wrap it yourself); built in for axios (auth header, token refresh)
- **Bundle size**: 0 KB for fetch; about 13 KB for axios

Pick \`fetch\` for small apps and Next.js (it extends \`fetch\` with caching). Pick \`axios\` when you want **interceptors**, a shared base instance and uniform error handling across a big app.`,
      difficulty: 'Easy',
      freq: 3,
      tags: ['fetch', 'axios', 'http'],
      followUp: 'Show how an axios interceptor attaches a JWT to every request.',
    },
    {
      id: 'custom-use-fetch',
      q: 'Write a reusable `useFetch(url)` hook that returns `{ data, loading, error }`.',
      a: `Put the effect, the three states and the abort logic in one hook so every component stays small.

Details worth saying out loud:
- depend on \`[url]\`, so changing the URL re-fetches
- reset \`loading\` to true at the start of each fetch
- **abort** the previous request in the cleanup to avoid a slow old response overwriting a newer one (a race condition)
- ignore the \`AbortError\``,
      difficulty: 'Medium',
      freq: 3,
      tags: ['react', 'hooks', 'machine-coding'],
      code: { lang: 'jsx', code: `import { useEffect, useState } from 'react'

export function useFetch(url) {
  const [state, setState] = useState({ data: null, loading: true, error: null })

  useEffect(() => {
    const ctrl = new AbortController()
    setState({ data: null, loading: true, error: null })

    fetch(url, { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status)
        return r.json()
      })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ data: null, loading: false, error })
      })

    return () => ctrl.abort()
  }, [url])

  return state
}

// usage
// const { data, loading, error } = useFetch('/api/names')` },
      followUp: 'How would you add caching or request de-duplication (and what does React Query give you for free)?',
    },
    {
      id: 'delete-update-endpoints',
      q: 'Add `PUT /api/names/:id` and `DELETE /api/names/:id` to the Express server. What status codes do you return?',
      a: `Read the id from \`req.params\` (always a **string**, so convert it) and look the item up first.

- not found → **404**
- updated → **200** with the updated item
- deleted → **204 No Content** (no body) or 200 with the deleted item
- invalid body → **400**

\`PUT\` replaces the whole resource, \`PATCH\` changes part of it. Many teams use \`PUT\` loosely, so mention the difference.`,
      difficulty: 'Easy',
      freq: 3,
      tags: ['express', 'rest', 'crud'],
      code: { lang: 'javascript', code: `app.put('/api/names/:id', (req, res) => {
  const id = Number(req.params.id)
  const item = names.find((n) => n.id === id)
  if (!item) return res.status(404).json({ error: 'not found' })

  const name = (req.body.name || '').trim()
  if (!name) return res.status(400).json({ error: 'name is required' })

  item.name = name
  res.json(item)
})

app.delete('/api/names/:id', (req, res) => {
  const index = names.findIndex((n) => n.id === Number(req.params.id))
  if (index === -1) return res.status(404).json({ error: 'not found' })
  names.splice(index, 1)
  res.sendStatus(204)
})` },
      followUp: 'Is DELETE idempotent? What should a second DELETE on the same id return?',
    },
    {
      id: 'react-delete-edit-names',
      q: 'Extend the React names list with Delete and inline Edit buttons that call the API.',
      a: `After each API call, update state **immutably**:
- delete: \`prev.filter(n => n.id !== id)\`
- edit: \`prev.map(n => n.id === id ? updated : n)\`

Keep the id of the row being edited in state (\`editingId\`) plus the draft text. Only one row is in edit mode at a time. Disable the button while the request is in flight to avoid double submits.`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['react', 'axios', 'crud', 'machine-coding'],
      code: { lang: 'jsx', code: `function NameRow({ item, onDelete, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.name)

  const save = async () => {
    await onSave(item.id, draft)
    setEditing(false)
  }

  return (
    <li>
      {editing ? (
        <>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} />
          <button onClick={save}>Save</button>
          <button onClick={() => { setDraft(item.name); setEditing(false) }}>Cancel</button>
        </>
      ) : (
        <>
          {item.name}
          <button onClick={() => setEditing(true)}>Edit</button>
          <button onClick={() => onDelete(item.id)}>Delete</button>
        </>
      )}
    </li>
  )
}

// in the parent
const remove = async (id) => {
  await api.delete('/names/' + id)
  setNames((prev) => prev.filter((n) => n.id !== id))
}
const save = async (id, name) => {
  const res = await api.put('/names/' + id, { name })
  setNames((prev) => prev.map((n) => (n.id === id ? res.data : n)))
}` },
      followUp: 'Why is `key={index}` a bug here when rows can be deleted?',
    },
    {
      id: 'search-debounce-names',
      q: 'Add a search box that filters names from the server as the user types, without firing a request on every keystroke.',
      a: `**Debounce** the input: wait until the user pauses (say 300 ms) before calling the API.

In React the clean way is an effect that sets a timer and **clears it in the cleanup**. Each keystroke cancels the previous timer, so only the last one fires.

Server side, filter with \`req.query.q\` (case-insensitive). Also abort the previous request so an old, slower response cannot overwrite a newer one.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['react', 'debounce', 'express', 'machine-coding'],
      code: { lang: 'javascript', code: `// server.js
app.get('/api/names', (req, res) => {
  const q = (req.query.q || '').toLowerCase()
  res.json(names.filter((n) => n.name.toLowerCase().includes(q)))
})

// React
function SearchNames() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])

  useEffect(() => {
    const ctrl = new AbortController()
    const timer = setTimeout(() => {
      axios.get('http://localhost:5000/api/names', { params: { q }, signal: ctrl.signal })
        .then((res) => setResults(res.data))
        .catch(() => {})
    }, 300)
    return () => { clearTimeout(timer); ctrl.abort() }
  }, [q])

  return (
    <>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" />
      <ul>{results.map((n) => <li key={n.id}>{n.name}</li>)}</ul>
    </>
  )
}` },
      followUp: 'What is the difference between debounce and throttle? Give a use case for each.',
    },
    {
      id: 'pagination-api',
      q: 'Add pagination: `GET /api/names?page=2&limit=5` and a Next/Prev UI in React.',
      a: `Server: parse \`page\` and \`limit\` as numbers with defaults, slice the array, and return the **total** so the client knows when to disable "Next".

Client: keep \`page\` in state and put it in the effect's dependency array, so changing the page re-fetches.

For large tables, mention **cursor pagination** (\`?after=<id>\`): offset pagination gets slow and skips or repeats rows when data changes between requests.`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['express', 'react', 'pagination'],
      code: { lang: 'javascript', code: `// server.js
app.get('/api/names', (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(50, Number(req.query.limit) || 5)
  const start = (page - 1) * limit
  res.json({
    items: names.slice(start, start + limit),
    total: names.length,
    page,
    pages: Math.ceil(names.length / limit),
  })
})

// React
const [page, setPage] = useState(1)
const [data, setData] = useState({ items: [], pages: 1 })

useEffect(() => {
  axios.get('/api/names', { params: { page, limit: 5 } }).then((r) => setData(r.data))
}, [page])

// <button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
// <button disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>` },
      followUp: 'Why does offset pagination get slow on a table with millions of rows?',
    },
    {
      id: 'cors-proxy',
      q: 'Your React app on port 5173 gets a CORS error calling the Express API on port 5000. Explain and fix it.',
      a: `The browser blocks a response when the **origin** (scheme + host + port) differs and the server did not send \`Access-Control-Allow-Origin\`. It is the browser enforcing it: Postman and curl work fine.

Two fixes:
- **Server**: \`app.use(cors({ origin: 'http://localhost:5173' }))\`. In production allow only your real domain, never \`*\` together with credentials.
- **Dev proxy**: configure the dev server to forward \`/api\` to port 5000, so the browser sees one origin and no CORS is involved.

Non-simple requests (JSON \`Content-Type\`, \`Authorization\` header, PUT/DELETE) trigger a **preflight** \`OPTIONS\` request first; the \`cors\` package answers it for you.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['cors', 'express', 'vite', 'proxy'],
      code: { lang: 'javascript', code: `// vite.config.js — dev proxy, no CORS needed
export default {
  server: {
    proxy: { '/api': 'http://localhost:5000' },
  },
}
// React then calls fetch('/api/names') with a relative URL.

// server.js — explicit CORS
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,          // needed to send cookies
}))` },
      followUp: 'Why can you not use `Access-Control-Allow-Origin: *` together with cookies?',
    },
    {
      id: 'jwt-login-middleware',
      q: 'Write login and an auth middleware with JWT in Express, and call a protected route from React.',
      a: `Flow: \`POST /login\` checks credentials, signs a token, returns it. The client sends it as \`Authorization: Bearer <token>\`. A middleware verifies it and puts the user on \`req.user\`.

Points to mention:
- never store plain passwords: **bcrypt** hash and compare
- keep the secret in an **env var**
- short expiry (\`15m\`) plus a refresh token
- storage: an **httpOnly cookie** is safer from XSS than \`localStorage\`
- send **401** when the token is missing or invalid, **403** when the user is known but not allowed`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['jwt', 'auth', 'express', 'middleware'],
      code: { lang: 'javascript', code: `const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const SECRET = process.env.JWT_SECRET

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body
  const user = users.find((u) => u.email === email)
  if (!user || !(await bcrypt.compare(password, user.hash))) {
    return res.status(401).json({ error: 'invalid credentials' })
  }
  const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '15m' })
  res.json({ token })
})

function auth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'missing token' })
  try {
    req.user = jwt.verify(token, SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'invalid or expired token' })
  }
}

app.get('/api/me', auth, (req, res) => res.json(req.user))

// React: axios.get('/api/me', { headers: { Authorization: 'Bearer ' + token } })` },
      followUp: 'How do refresh tokens work, and where would you store each token?',
    },
    {
      id: 'axios-interceptor',
      q: 'How do you attach the auth token to every request and handle a 401 globally with axios interceptors?',
      a: `An **interceptor** is middleware for the client. A request interceptor runs before every call (add the header); a response interceptor sees every response or error (handle 401 in one place instead of every component).

Typical use: on 401, try to refresh the token once and retry the original request; if that fails, clear state and redirect to login.`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['axios', 'auth', 'react'],
      code: { lang: 'javascript', code: `import axios from 'axios'

export const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = 'Bearer ' + token
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)` },
      followUp: 'Two requests fail with 401 at the same time. How do you avoid refreshing the token twice?',
    },
    {
      id: 'error-handler-async',
      q: 'Write a central error handler for Express and make async route errors reach it.',
      a: `Error middleware has **four** parameters and goes **last**. Synchronous throws reach it automatically. In Express 4, a rejected promise in an \`async\` handler does **not**: you must \`try/catch\` and call \`next(err)\`, or wrap the handler. Express 5 forwards rejections for you.

Return a consistent JSON shape, log the real error, and never leak the stack trace in production.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['express', 'errors', 'middleware'],
      code: { lang: 'javascript', code: `// wrapper (needed in Express 4)
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status }
}

app.get('/api/names/:id', wrap(async (req, res) => {
  const item = await db.findName(req.params.id)
  if (!item) throw new HttpError(404, 'not found')
  res.json(item)
}))

// 404 for unknown routes
app.use((req, res) => res.status(404).json({ error: 'route not found' }))

// error handler: 4 params, registered last
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({
    error: err.status ? err.message : 'internal server error',
  })
})` },
      followUp: 'What happens if you call `next(err)` after the response headers were already sent?',
    },
    {
      id: 'validation-middleware',
      q: 'Write a reusable request-validation middleware for Express.',
      a: `Never trust \`req.body\`. Validate **shape, type and range** before touching the database, and return **400** with a message per field.

Production code uses a schema library (zod, joi, express-validator). In an interview, show you can build the tiny version: a function that takes a schema and returns a middleware.`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['express', 'validation', 'middleware'],
      code: { lang: 'javascript', code: `const validate = (rules) => (req, res, next) => {
  const errors = {}
  for (const [field, check] of Object.entries(rules)) {
    const message = check(req.body[field])
    if (message) errors[field] = message
  }
  if (Object.keys(errors).length) return res.status(400).json({ errors })
  next()
}

const userRules = {
  name: (v) => (typeof v === 'string' && v.trim().length >= 2 ? '' : 'min 2 characters'),
  age: (v) => (Number.isInteger(v) && v >= 0 && v < 130 ? '' : 'age must be 0-129'),
}

app.post('/api/users', validate(userRules), (req, res) => {
  res.status(201).json(req.body)
})` },
      followUp: 'How do you validate `req.query` and `req.params` the same way, and why does validating only in React not protect you?',
    },
    {
      id: 'rate-limiter',
      q: 'Write a simple rate-limiting middleware (max N requests per minute per IP) without a library.',
      a: `Keep a \`Map\` from IP to \`{ count, resetAt }\`. On each request: reset the window if it expired, increment, and reject with **429 Too Many Requests** (plus a \`Retry-After\` header) once the count passes the limit.

This is a **fixed window**: simple but allows a burst at the window edge. Better algorithms: sliding window or token bucket.

An in-memory Map only works for **one server process**. With several instances you need a shared store such as Redis (\`express-rate-limit\` + \`rate-limit-redis\`).`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['express', 'rate-limit', 'middleware'],
      code: { lang: 'javascript', code: `function rateLimit({ windowMs = 60_000, max = 100 } = {}) {
  const hits = new Map()           // ip -> { count, resetAt }
  return (req, res, next) => {
    const now = Date.now()
    let entry = hits.get(req.ip)
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs }
      hits.set(req.ip, entry)
    }
    entry.count++
    if (entry.count > max) {
      res.set('Retry-After', Math.ceil((entry.resetAt - now) / 1000))
      return res.status(429).json({ error: 'too many requests' })
    }
    next()
  }
}

app.use('/api', rateLimit({ windowMs: 60_000, max: 100 }))` },
      followUp: 'How does the token-bucket algorithm differ, and why does the Map grow forever in this version?',
    },
    {
      id: 'mongo-mongoose-crud',
      q: 'Connect Express to MongoDB with Mongoose and write the names API against a real database.',
      a: `Define a **schema** and **model**, connect once at startup (not per request), then use the async model methods. Always \`await\` and handle errors; invalid ObjectIds throw a \`CastError\`, which you should map to 400.

Remember the stack order: connect to the database, then start listening, so you never serve requests before the DB is ready.`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['mongodb', 'mongoose', 'express'],
      code: { lang: 'javascript', code: `const mongoose = require('mongoose')

const nameSchema = new mongoose.Schema(
  { name: { type: String, required: true, trim: true, minlength: 2 } },
  { timestamps: true }
)
const Name = mongoose.model('Name', nameSchema)

app.get('/api/names', async (req, res, next) => {
  try { res.json(await Name.find().sort({ createdAt: -1 })) } catch (e) { next(e) }
})

app.post('/api/names', async (req, res, next) => {
  try {
    const doc = await Name.create({ name: req.body.name })
    res.status(201).json(doc)
  } catch (e) {
    if (e.name === 'ValidationError') return res.status(400).json({ error: e.message })
    next(e)
  }
})

mongoose.connect(process.env.MONGO_URL).then(() => {
  app.listen(5000, () => console.log('ready'))
})` },
      followUp: 'What is an index, and which field would you index for a "find by email" login?',
    },
    {
      id: 'optimistic-update',
      q: 'Implement an optimistic update when adding a name: show it immediately and roll back if the server fails.',
      a: `1. Add a **temporary item** (negative or random id) to state right away.
2. Call the API.
3. On success, **replace** the temp item with the server's item (it has the real id).
4. On failure, **remove** the temp item and show an error.

This makes the UI feel instant. Use it only for actions that rarely fail. Libraries like React Query have \`onMutate\`/\`onError\` hooks for exactly this.`,
      difficulty: 'Hard',
      freq: 1,
      tags: ['react', 'optimistic-ui', 'axios'],
      code: { lang: 'jsx', code: `const add = async (name) => {
  const temp = { id: 'tmp-' + Date.now(), name }
  setNames((prev) => [...prev, temp])                       // 1. show now

  try {
    const res = await api.post('/names', { name })          // 2. save
    setNames((prev) => prev.map((n) => (n.id === temp.id ? res.data : n)))   // 3. swap
  } catch (e) {
    setNames((prev) => prev.filter((n) => n.id !== temp.id))                 // 4. roll back
    setError('Could not save "' + name + '"')
  }
}` },
      followUp: 'What if the user clicks delete on the temporary item before the POST returns?',
    },
    {
      id: 'infinite-scroll',
      q: 'Build infinite scroll in React that loads the next page when the user reaches the bottom.',
      a: `Use an **IntersectionObserver** on a sentinel element at the end of the list, not a scroll listener (no manual maths, no jank). When the sentinel becomes visible and there is more data, fetch the next page and **append** it.

Guard against duplicate loads with a \`loading\` flag, stop when the server says there are no more pages, and disconnect the observer in the effect cleanup.`,
      difficulty: 'Hard',
      freq: 2,
      tags: ['react', 'intersection-observer', 'machine-coding'],
      code: { lang: 'jsx', code: `function Feed() {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const sentinel = useRef(null)

  useEffect(() => {
    setLoading(true)
    axios.get('/api/names', { params: { page, limit: 10 } })
      .then((r) => {
        setItems((prev) => [...prev, ...r.data.items])
        setHasMore(page < r.data.pages)
      })
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loading) setPage((p) => p + 1)
    })
    if (sentinel.current) obs.observe(sentinel.current)
    return () => obs.disconnect()
  }, [hasMore, loading])

  return (
    <>
      {items.map((n) => <p key={n.id}>{n.name}</p>)}
      <div ref={sentinel} />
      {loading && <p>Loading…</p>}
    </>
  )
}` },
      followUp: 'How would you virtualise a list of 100,000 rows so only the visible ones are in the DOM?',
    },
    {
      id: 'polling-sse',
      q: 'The names list must update live. Compare polling, Server-Sent Events and WebSockets, and write the simplest version.',
      a: `- **Polling**: client asks every N seconds. Trivial, wasteful, delayed.
- **SSE** (Server-Sent Events): one long-lived HTTP response, server → client only, auto-reconnect built in. Best for feeds and notifications.
- **WebSocket**: full duplex, both directions. Best for chat and games.

For "show new names as they are added", SSE is the lightest correct answer. The server keeps a list of open responses and writes to all of them when data changes.`,
      difficulty: 'Hard',
      freq: 1,
      tags: ['sse', 'websocket', 'express', 'react'],
      code: { lang: 'javascript', code: `// server.js
const clients = new Set()

app.get('/api/stream', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' })
  res.flushHeaders()
  clients.add(res)
  req.on('close', () => clients.delete(res))
})

// call after a successful POST
const broadcast = (item) => {
  for (const res of clients) res.write('data: ' + JSON.stringify(item) + '\\n\\n')
}

// React
useEffect(() => {
  const es = new EventSource('http://localhost:5000/api/stream')
  es.onmessage = (e) => setNames((prev) => [...prev, JSON.parse(e.data)])
  return () => es.close()
}, [])` },
      followUp: 'How does this scale to several server instances?',
    },
    {
      id: 'file-upload-multer',
      q: 'Upload an image from React to Express using `multer`.',
      a: `The browser sends **multipart/form-data**; \`express.json()\` cannot parse that, so use \`multer\`.

On the client build a \`FormData\` object and let the browser set the \`Content-Type\` (with the boundary) itself: do **not** set it manually.

On the server limit **size** and **type**, store with a generated name (never trust \`originalname\`), and in production send files to object storage (S3) instead of local disk.`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['multer', 'express', 'react', 'upload'],
      code: { lang: 'javascript', code: `// server.js
const multer = require('multer')
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 2 * 1024 * 1024 },                       // 2 MB
  fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
})

app.post('/api/avatar', upload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'image required' })
  res.status(201).json({ path: '/' + req.file.path })
})

// React
const send = async (file) => {
  const form = new FormData()
  form.append('avatar', file)
  await axios.post('/api/avatar', form)      // axios sets the multipart header
}
// <input type="file" accept="image/*" onChange={(e) => send(e.target.files[0])} />` },
      followUp: 'How would you show an upload progress bar?',
    },
    {
      id: 'folder-structure-layers',
      q: 'How do you structure an Express project beyond one file? Explain routes, controllers and services.',
      a: `Split by **responsibility**, so each layer is small and testable:
- **routes**: map URL + method to a controller (and attach middleware)
- **controllers**: read the request, call a service, send the response
- **services**: business rules and database access, no \`req\` or \`res\` at all
- **middleware**: auth, validation, error handler
- **config**: env variables, database connection

\`app.js\` builds and exports the app; \`server.js\` calls \`listen\`. Keeping them apart lets tests import the app without opening a port.`,
      difficulty: 'Easy',
      freq: 2,
      tags: ['express', 'architecture'],
      code: { lang: 'javascript', code: `// src/app.js
const express = require('express')
const namesRouter = require('./routes/names')
const { errorHandler } = require('./middleware/error')

const app = express()
app.use(express.json())
app.use('/api/names', namesRouter)
app.use(errorHandler)
module.exports = app

// src/routes/names.js
const router = require('express').Router()
const ctrl = require('../controllers/names')
router.get('/', ctrl.list)
router.post('/', ctrl.create)
module.exports = router

// server.js
require('./src/app').listen(process.env.PORT || 5000)` },
      followUp: 'How would you test the POST route without starting a real server?',
    },
    {
      id: 'env-and-graceful-shutdown',
      q: 'How do you handle configuration and shut an Express server down gracefully?',
      a: `**Config**: read secrets and ports from environment variables (\`dotenv\` in development), never commit \`.env\`, and fail fast at startup if a required variable is missing.

**Graceful shutdown**: on \`SIGTERM\` (what Docker and Kubernetes send), stop accepting new connections with \`server.close()\`, let in-flight requests finish, close the database, then exit. Add a timeout so a stuck request cannot block the exit forever.`,
      difficulty: 'Medium',
      freq: 1,
      tags: ['express', 'config', 'devops'],
      code: { lang: 'javascript', code: `require('dotenv').config()
for (const key of ['MONGO_URL', 'JWT_SECRET']) {
  if (!process.env[key]) throw new Error('Missing env var ' + key)
}

const server = app.listen(process.env.PORT || 5000)

function shutdown(signal) {
  console.log(signal + ' received, closing')
  server.close(async () => {
    await mongoose.connection.close()
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10_000).unref()   // force after 10 s
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))` },
      followUp: 'What does a health-check endpoint return, and who calls it?',
    },
    {
      id: 'util-debounce-throttle',
      q: 'Implement `debounce` and `throttle` from scratch.',
      a: `Both rely on a **closure** that remembers a timer.
- **debounce**: restart the timer on every call; run once after the calls stop. (search box, window resize end)
- **throttle**: run at most once per interval; ignore calls in between. (scroll handler, button spam)

Keep \`this\` and arguments with \`fn.apply(this, args)\`. Mention \`leading\`/\`trailing\` options and a \`cancel()\` method for bonus marks.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['javascript', 'closures', 'utility'],
      code: { lang: 'javascript', run: true, code: `function debounce(fn, wait) {
  let timer
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), wait)
  }
}

function throttle(fn, wait) {
  let last = 0
  return function (...args) {
    const now = Date.now()
    if (now - last >= wait) {
      last = now
      fn.apply(this, args)
    }
  }
}

const d = debounce((x) => console.log('debounced', x), 50)
d(1); d(2); d(3)                       // only 3 runs

const t = throttle((x) => console.log('throttled', x), 1000)
t('a'); t('b'); t('c')                 // only 'a' runs` },
      followUp: 'Add a `cancel()` method and a `leading: true` option.',
    },
    {
      id: 'util-promise-retry-pool',
      q: 'Write `retry(fn, times)` with delay, and a function that runs async tasks with a concurrency limit.',
      a: `**Retry**: loop, \`await\` the call, and on failure wait before trying again. Real systems use **exponential backoff** (delay doubles) plus random jitter so many clients do not retry at the same instant. Only retry errors that can succeed later (network, 503), never a 400.

**Concurrency pool**: start \`limit\` workers; each worker repeatedly takes the next task from a shared index until none are left. \`Promise.all\` over the workers gives the results, and writing to \`results[i]\` keeps the original order.`,
      difficulty: 'Hard',
      freq: 2,
      tags: ['javascript', 'promises', 'async'],
      code: { lang: 'javascript', run: true, code: `const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function retry(fn, times = 3, delay = 10) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn(attempt)
    } catch (err) {
      if (attempt >= times) throw err
      await sleep(delay * 2 ** (attempt - 1))
    }
  }
}

async function pool(tasks, limit) {
  const results = new Array(tasks.length)
  let next = 0
  const worker = async () => {
    while (next < tasks.length) {
      const i = next++
      results[i] = await tasks[i]()
    }
  }
  await Promise.all(Array.from({ length: limit }, worker))
  return results
}

retry(async (n) => {
  if (n < 3) throw new Error('fail ' + n)
  return 'ok on attempt ' + n
}).then(console.log)

pool([1, 2, 3, 4].map((n) => async () => { await sleep(10); return n * n }), 2).then(console.log)` },
      followUp: 'Implement `Promise.all` and `Promise.allSettled` yourself.',
    },
    {
      id: 'util-lru-cache',
      q: 'Implement an LRU cache with O(1) `get` and `put`.',
      a: `LRU = **Least Recently Used**: when full, evict the item that was used longest ago.

The trick in JavaScript: a \`Map\` remembers **insertion order**. On \`get\`, delete the key and set it again, which moves it to the "newest" end. When size exceeds capacity, delete the first key (\`map.keys().next().value\`), the oldest. Everything is O(1).

The textbook answer is a hash map plus a **doubly linked list**; the Map trick is the same idea built in.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['javascript', 'cache', 'data-structures'],
      code: { lang: 'javascript', run: true, code: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity
    this.map = new Map()
  }
  get(key) {
    if (!this.map.has(key)) return -1
    const value = this.map.get(key)
    this.map.delete(key)
    this.map.set(key, value)          // now the most recent
    return value
  }
  put(key, value) {
    this.map.delete(key)
    this.map.set(key, value)
    if (this.map.size > this.capacity) {
      this.map.delete(this.map.keys().next().value)   // evict the oldest
    }
  }
}

const c = new LRUCache(2)
c.put(1, 'a'); c.put(2, 'b')
console.log(c.get(1))     // a
c.put(3, 'c')             // evicts key 2
console.log(c.get(2))     // -1
console.log([...c.map.keys()])` },
      followUp: 'Add a TTL (expiry time) to each entry.',
    },
    {
      id: 'react-todo-reducer',
      q: 'Build a todo app with add, toggle, delete and filter (All / Active / Done) using `useReducer`.',
      a: `The most common live-coding task. Show these habits:
- state in one place (\`useReducer\` when several actions change the same object)
- **never mutate**: return new arrays/objects from the reducer
- derive the filtered list during render instead of storing it in state
- stable \`id\` for keys (\`Date.now()\` or a counter), never the index
- \`aria-label\`s and a controlled input`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['react', 'useReducer', 'machine-coding'],
      code: { lang: 'jsx', code: `import { useReducer, useState } from 'react'

function reducer(todos, action) {
  switch (action.type) {
    case 'add':    return [...todos, { id: Date.now(), text: action.text, done: false }]
    case 'toggle': return todos.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t))
    case 'delete': return todos.filter((t) => t.id !== action.id)
    default:       return todos
  }
}

export default function Todos() {
  const [todos, dispatch] = useReducer(reducer, [])
  const [text, setText] = useState('')
  const [filter, setFilter] = useState('all')

  const shown = todos.filter((t) =>
    filter === 'all' ? true : filter === 'done' ? t.done : !t.done)

  const submit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    dispatch({ type: 'add', text: text.trim() })
    setText('')
  }

  return (
    <div>
      <form onSubmit={submit}>
        <input value={text} onChange={(e) => setText(e.target.value)} />
        <button>Add</button>
      </form>
      {['all', 'active', 'done'].map((f) => (
        <button key={f} disabled={filter === f} onClick={() => setFilter(f)}>{f}</button>
      ))}
      <ul>
        {shown.map((t) => (
          <li key={t.id}>
            <input type="checkbox" checked={t.done} onChange={() => dispatch({ type: 'toggle', id: t.id })} />
            <span style={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
            <button onClick={() => dispatch({ type: 'delete', id: t.id })}>x</button>
          </li>
        ))}
      </ul>
    </div>
  )
}` },
      followUp: 'Persist the todos to localStorage and restore them on reload.',
    },
    {
      id: 'react-form-validation',
      q: 'Build a signup form (name, email, password) with validation errors shown per field.',
      a: `Use **controlled inputs** with one \`values\` object and one \`errors\` object. Validate on submit (and on blur for good UX); block the request when \`errors\` is non-empty.

Say clearly that client validation is for **usability only**; the server must validate again because anyone can call the API directly.`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['react', 'forms', 'validation', 'machine-coding'],
      code: { lang: 'jsx', code: `function validate({ name, email, password }) {
  const e = {}
  if (name.trim().length < 2) e.name = 'Name is too short'
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) e.email = 'Enter a valid email'
  if (password.length < 8) e.password = 'Min 8 characters'
  return e
}

export default function Signup() {
  const [values, setValues] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})

  const change = (e) => setValues({ ...values, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length) return
    await axios.post('/api/signup', values)
  }

  return (
    <form onSubmit={submit} noValidate>
      {['name', 'email', 'password'].map((f) => (
        <div key={f}>
          <input name={f} type={f === 'password' ? 'password' : 'text'} value={values[f]} onChange={change} placeholder={f} />
          {errors[f] && <small style={{ color: 'red' }}>{errors[f]}</small>}
        </div>
      ))}
      <button>Sign up</button>
    </form>
  )
}` },
      followUp: 'Controlled vs uncontrolled inputs: when would you use `useRef` or `FormData` instead?',
    },
  ],
}
