import type { MistakeSet } from './types'

export const express: MistakeSet = {
  id: 'express',
  title: 'Express server',
  kind: 'js',
  lang: 'javascript',
  items: [
    {
      id: 'hello-world',
      title: 'Hello World server',
      difficulty: 'Easy',
      task: 'A server with `GET /` that responds with the text `Hello World`, listening on port 3000.',
      broken: `import express from 'express'
const app = express()

app.get('/', (req, res) => {
  res.send('Hello World')

app.listen(3000, () => console.log('Server running on port 3000'))
`,
      solution: `import express from 'express'
const app = express()

app.get('/', (req, res) => {
  res.send('Hello World')
})

app.listen(3000, () => console.log('Server running on port 3000'))
`,
      requests: [['GET', '/']],
      tests: [
        ['GET / responds 200', 'const r = await request(app).get("/"); expect(r.status).toBe(200)'],
        ['the response is Hello World', 'const r = await request(app).get("/"); expect(r.text).toBe("Hello World")'],
        ['an unknown path is 404', 'const r = await request(app).get("/nope"); expect(r.status).toBe(404)'],
      ],
      explain: 'The route handler `app.get("/", (req, res) => { … })` was never closed: the `})` after `res.send(...)` is missing, so the next line is read as part of the handler and the file is a **SyntaxError**. Every `{` and `(` you open needs its partner. The fix is one line: `})`.',
      hints: ['The error mentions an unexpected token. Count the `{` and `(` of the route.', 'The route ends with `})`: a brace for the function and a parenthesis for `app.get(`.'],
    },
    {
      id: 'json-route',
      title: 'A JSON endpoint',
      difficulty: 'Easy',
      task: 'Make `GET /api/user` respond with the JSON `{ "name": "Asha", "role": "admin" }`.',
      broken: `import express from 'express'
const app = express()

app.post('/api/user', (req, res) => {
  res.json({ name: 'Asha', role: 'admin' })
})

app.listen(3000)
`,
      solution: `import express from 'express'
const app = express()

app.get('/api/user', (req, res) => {
  res.json({ name: 'Asha', role: 'admin' })
})

app.listen(3000)
`,
      requests: [['GET', '/api/user']],
      tests: [
        ['GET /api/user responds 200', 'const r = await request(app).get("/api/user"); expect(r.status).toBe(200)'],
        ['the body is the user object', 'const r = await request(app).get("/api/user"); expect(r.body).toEqual({ name: "Asha", role: "admin" })'],
        ['it is sent as JSON', 'const r = await request(app).get("/api/user"); expect(r.headers["content-type"]).toContain("json")'],
      ],
      explain: 'Routes match on **method and path**. The route was registered with `app.post`, so a normal browser request (`GET`) finds nothing and Express answers `Cannot GET /api/user` with a 404. Use `app.get` to read data and `app.post` to create it.',
      hints: ['The path looks right. What about the method name?', '`app.get(path, handler)` handles GET requests.'],
    },
    {
      id: 'route-param',
      title: 'Find one user by id',
      difficulty: 'Medium',
      task: 'Add `GET /users/:id` that returns the user with that id, or `404` with `{ "error": "User not found" }`.',
      broken: `import express from 'express'
const app = express()

const users = [
  { id: 1, name: 'Asha' },
  { id: 2, name: 'Ravi' },
]

app.get('/users/:id', (req, res) => {
  const user = users.find((u) => u.id === req.params.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json(user)
})

app.listen(3000)
`,
      solution: `import express from 'express'
const app = express()

const users = [
  { id: 1, name: 'Asha' },
  { id: 2, name: 'Ravi' },
]

app.get('/users/:id', (req, res) => {
  const user = users.find((u) => u.id === Number(req.params.id))
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json(user)
})

app.listen(3000)
`,
      requests: [['GET', '/users/2'], ['GET', '/users/9']],
      tests: [
        ['finds an existing user', 'const r = await request(app).get("/users/2"); expect(r.status).toBe(200); expect(r.body).toEqual({ id: 2, name: "Ravi" })'],
        ['404 for a missing user', 'const r = await request(app).get("/users/9"); expect(r.status).toBe(404); expect(r.body).toEqual({ error: "User not found" })'],
      ],
      explain: '`req.params.id` is always a **string** (`"2"`), but the ids in the array are **numbers**. `===` never matches a string with a number, so every request got a 404. Convert first: `Number(req.params.id)`.',
      hints: ['Add a `console.log(typeof req.params.id)` mentally: what type is it?', 'Compare like with like: `Number(req.params.id)`.'],
    },
    {
      id: 'query-string',
      title: 'Filter with a query string',
      difficulty: 'Easy',
      task: '`GET /users?role=admin` returns only the admins. Without `role` it returns everyone.',
      broken: `import express from 'express'
const app = express()

const users = [
  { name: 'Asha', role: 'admin' },
  { name: 'Ravi', role: 'user' },
  { name: 'Meera', role: 'admin' },
]

app.get('/users', (req, res) => {
  const role = req.params.role
  res.json(role ? users.filter((u) => u.role === role) : users)
})

app.listen(3000)
`,
      solution: `import express from 'express'
const app = express()

const users = [
  { name: 'Asha', role: 'admin' },
  { name: 'Ravi', role: 'user' },
  { name: 'Meera', role: 'admin' },
]

app.get('/users', (req, res) => {
  const role = req.query.role
  res.json(role ? users.filter((u) => u.role === role) : users)
})

app.listen(3000)
`,
      requests: [['GET', '/users?role=admin'], ['GET', '/users']],
      tests: [
        ['?role=admin returns the two admins', 'const r = await request(app).get("/users?role=admin"); expect(r.body.map((u) => u.name)).toEqual(["Asha", "Meera"])'],
        ['no query returns everyone', 'const r = await request(app).get("/users"); expect(r.body.length).toBe(3)'],
      ],
      explain: '`req.params` holds the **path** parts such as `/users/:id`. A query string (`?role=admin`) is in `req.query`. With `req.params.role` the value was always `undefined`, so the filter never ran.',
      hints: ['Where does Express put what comes after the `?`?', '`req.query.role`, not `req.params.role`.'],
    },
    {
      id: 'post-body',
      title: 'Create something with POST',
      difficulty: 'Medium',
      task: '`POST /names` with `{ "name": "Asha" }` adds it to the list and responds `201` with the saved item. A missing name is `400`.',
      broken: `import express from 'express'
const app = express()

const names = []

app.post('/names', (req, res) => {
  const name = (req.body.name || '').trim()
  if (!name) return res.status(400).json({ error: 'name is required' })
  const item = { id: names.length + 1, name }
  names.push(item)
  res.status(201).json(item)
})

app.get('/names', (req, res) => res.json(names))

app.listen(3000)
`,
      solution: `import express from 'express'
const app = express()

app.use(express.json())

const names = []

app.post('/names', (req, res) => {
  const name = (req.body.name || '').trim()
  if (!name) return res.status(400).json({ error: 'name is required' })
  const item = { id: names.length + 1, name }
  names.push(item)
  res.status(201).json(item)
})

app.get('/names', (req, res) => res.json(names))

app.listen(3000)
`,
      requests: [['POST', '/names', { name: 'Asha' }], ['POST', '/names', {}], ['GET', '/names']],
      tests: [
        ['201 and the saved item', 'const r = await request(app).post("/names", { name: "Asha" }); expect(r.status).toBe(201); expect(r.body).toEqual({ id: 1, name: "Asha" })'],
        ['the item shows up in GET /names', 'await request(app).post("/names", { name: "Ravi" }); const r = await request(app).get("/names"); expect(r.body.map((n) => n.name)).toContain("Ravi")'],
        ['a missing name is 400', 'const r = await request(app).post("/names", {}); expect(r.status).toBe(400)'],
      ],
      explain: 'Without a body parser `req.body` is `undefined`, so `req.body.name` throws and the server answers 500. Register **`app.use(express.json())` before the routes** so JSON bodies are parsed into `req.body`.',
      hints: ['What is `req.body` when no middleware has read the body?', '`app.use(express.json())` goes above the routes.'],
    },
    {
      id: 'status-after-send',
      title: 'Status code 201',
      difficulty: 'Medium',
      task: '`POST /todos` responds with status `201` and the new todo as JSON.',
      broken: `import express from 'express'
const app = express()
app.use(express.json())

const todos = []

app.post('/todos', (req, res) => {
  const todo = { id: todos.length + 1, title: req.body.title, done: false }
  todos.push(todo)
  res.json(todo).status(201)
})

app.listen(3000)
`,
      solution: `import express from 'express'
const app = express()
app.use(express.json())

const todos = []

app.post('/todos', (req, res) => {
  const todo = { id: todos.length + 1, title: req.body.title, done: false }
  todos.push(todo)
  res.status(201).json(todo)
})

app.listen(3000)
`,
      requests: [['POST', '/todos', { title: 'Learn Express' }]],
      tests: [
        ['status is 201', 'const r = await request(app).post("/todos", { title: "A" }); expect(r.status).toBe(201)'],
        ['the body is the new todo', 'const r = await request(app).post("/todos", { title: "A" }); expect(r.body).toMatchObject({ title: "A", done: false }); expect(typeof r.body.id).toBe("number")'],
      ],
      explain: '`res.json()` **sends** the response. Setting the status afterwards is too late: the client already got `200`. Set the status first and send last: `res.status(201).json(todo)`.',
      hints: ['The order of the chained calls matters.', 'Status first, then the method that sends.'],
    },
    {
      id: 'middleware-next',
      title: 'A logger middleware',
      difficulty: 'Medium',
      task: 'A middleware logs every request (`GET /` …) and then lets it continue to the route, which replies `ok`.',
      broken: `import express from 'express'
const app = express()

app.use((req, res, next) => {
  console.log('Request:', req.method, req.url)
})

app.get('/', (req, res) => res.send('ok'))

app.listen(3000)
`,
      solution: `import express from 'express'
const app = express()

app.use((req, res, next) => {
  console.log('Request:', req.method, req.url)
  next()
})

app.get('/', (req, res) => res.send('ok'))

app.listen(3000)
`,
      requests: [['GET', '/']],
      tests: [
        ['the route still answers ok', 'const r = await request(app).get("/"); expect(r.text).toBe("ok")'],
        ['other paths still reach Express (404, no hanging)', 'const r = await request(app).get("/other"); expect(r.status).toBe(404)'],
      ],
      explain: 'A middleware must either **end the response** or call `next()`. This one did neither, so the request waited forever (the browser spins until it times out). Add `next()` after the log.',
      hints: ['What does the middleware do with the request after logging it?', 'Call `next()` as the last line.'],
    },
    {
      id: 'error-handler',
      title: 'Error-handling middleware',
      difficulty: 'Hard',
      task: 'Any error should reach the handler at the end, which replies `500` with `{ "error": "Something broke" }`.',
      broken: `import express from 'express'
const app = express()

app.get('/boom', (req, res) => {
  throw new Error('kaboom')
})

app.use((err, req, res) => {
  console.error(err.message)
  res.status(500).json({ error: 'Something broke' })
})

app.listen(3000)
`,
      solution: `import express from 'express'
const app = express()

app.get('/boom', (req, res) => {
  throw new Error('kaboom')
})

app.use((err, req, res, next) => {
  console.error(err.message)
  res.status(500).json({ error: 'Something broke' })
})

app.listen(3000)
`,
      requests: [['GET', '/boom']],
      tests: [
        ['the error handler answers 500', 'const r = await request(app).get("/boom"); expect(r.status).toBe(500)'],
        ['with the JSON message', 'const r = await request(app).get("/boom"); expect(r.body).toEqual({ error: "Something broke" })'],
      ],
      explain: 'Express recognises an error handler **by its four parameters**: `(err, req, res, next)`. With only three it is treated as a normal middleware, so the error skipped it and Express sent its own default 500. Declare all four, even if you do not use `next`.',
      hints: ['How does Express know a function handles errors and not requests?', 'Count the parameters: it needs four.'],
    },
    {
      id: 'todo-delete',
      title: 'Delete a todo',
      difficulty: 'Hard',
      task: '`DELETE /todos/:id` removes the todo and responds `204`. An unknown id is `404`.',
      broken: `import express from 'express'
const app = express()
app.use(express.json())

let todos = [
  { id: 1, title: 'Learn Express', done: false },
  { id: 2, title: 'Build an API', done: false },
]

app.get('/todos', (req, res) => res.json(todos))

app.delete('/todos/:id', (req, res) => {
  const id = Number(req.params.id)
  if (!todos.some((t) => t.id === id)) return res.status(404).json({ error: 'not found' })
  todos.filter((t) => t.id !== id)
  res.sendStatus(204)
})

app.listen(3000)
`,
      solution: `import express from 'express'
const app = express()
app.use(express.json())

let todos = [
  { id: 1, title: 'Learn Express', done: false },
  { id: 2, title: 'Build an API', done: false },
]

app.get('/todos', (req, res) => res.json(todos))

app.delete('/todos/:id', (req, res) => {
  const id = Number(req.params.id)
  if (!todos.some((t) => t.id === id)) return res.status(404).json({ error: 'not found' })
  todos = todos.filter((t) => t.id !== id)
  res.sendStatus(204)
})

app.listen(3000)
`,
      requests: [['DELETE', '/todos/1'], ['GET', '/todos'], ['DELETE', '/todos/99']],
      tests: [
        ['responds 204', 'const r = await request(app).delete("/todos/1"); expect(r.status).toBe(204)'],
        ['the todo is really gone', 'await request(app).delete("/todos/1"); const r = await request(app).get("/todos"); expect(r.body.map((t) => t.id)).toEqual([2])'],
        ['an unknown id is 404', 'const r = await request(app).delete("/todos/99"); expect(r.status).toBe(404)'],
      ],
      explain: '`Array.filter` does **not change** the array: it returns a new one. The result was thrown away, so the todo stayed in the list although the server said 204. Assign it back: `todos = todos.filter(...)` (that is why `todos` is declared with `let`).',
      hints: ['Call `GET /todos` after deleting: is the item still there?', '`filter` returns a new array. What happened to that value?'],
    },
  ],
}
