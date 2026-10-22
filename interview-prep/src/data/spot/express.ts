import type { SpotSet } from './types'

export const express: SpotSet = {
  id: 'express',
  bugs: [
    {
      id: 'json-order',
      title: 'req.body is undefined',
      task: '`POST /users` with a JSON body crashes with "Cannot destructure property \'name\' of req.body".',
      lang: 'javascript',
      code: `const app = express()

app.post('/users', (req, res) => {
  const { name } = req.body
  res.status(201).json({ name })
})

app.use(express.json())`,
      line: 8,
      fixed: `const app = express()
app.use(express.json())

app.post('/users', (req, res) => {
  const { name } = req.body
  res.status(201).json({ name })
})`,
      explain: 'Middleware runs in ==registration order==. The JSON parser must be registered before the routes that read `req.body`.',
      difficulty: 'Easy',
    },
    {
      id: 'missing-return',
      title: 'Cannot set headers after they are sent',
      task: 'Requests without a token log "ERR_HTTP_HEADERS_SENT" and the handler keeps running.',
      lang: 'javascript',
      code: `function requireAuth(req, res, next) {
  if (!req.headers.authorization) {
    res.status(401).json({ error: 'Login required' })
  }
  next()
}`,
      line: 3,
      fix: "    return res.status(401).json({ error: 'Login required' })",
      explain: 'After responding, the code still falls through to `next()`, so the route also tries to respond. ==`return`== after sending.',
      difficulty: 'Easy',
    },
    {
      id: 'error-handler-arity',
      title: 'The error handler that never runs',
      task: 'Errors show Express\'s default HTML page instead of the JSON error.',
      lang: 'javascript',
      code: `app.get('/boom', () => {
  throw new Error('Boom')
})

app.use((err, req, res) => {
  res.status(500).json({ error: err.message })
})`,
      line: 5,
      fix: 'app.use((err, req, res, next) => {',
      explain: 'Express recognises error handlers by their ==four parameters==. With three it is treated as normal middleware (and `err` is actually `req`).',
      difficulty: 'Medium',
    },
    {
      id: 'async-unhandled',
      title: 'The request that hangs',
      task: 'On Express 4, when the database is down, the request hangs until it times out instead of returning 500.',
      lang: 'javascript',
      code: `app.get('/orders', async (req, res) => {
  const orders = await db.orders.findAll()
  res.json(orders)
})`,
      line: 1,
      fixed: `app.get('/orders', async (req, res, next) => {
  try {
    const orders = await db.orders.findAll()
    res.json(orders)
  } catch (err) {
    next(err)
  }
})`,
      explain: 'Express 4 does not handle ==rejected promises== from handlers, so the error never reaches the error middleware. Catch and call `next(err)` (Express 5 does this for you).',
      difficulty: 'Medium',
    },
    {
      id: 'status-code',
      title: 'Created, says 200',
      task: 'API clients expect the right status when a resource is created.',
      lang: 'javascript',
      code: `app.post('/projects', async (req, res) => {
  const project = await Project.create(req.body)
  res.status(200).json(project)
})`,
      line: 3,
      fix: '  res.status(201).location(`/projects/${project.id}`).json(project)',
      explain: 'A successful create is ==201 Created==, ideally with a `Location` header pointing at the new resource. (Also validate `req.body` instead of passing it straight to the model.)',
      difficulty: 'Easy',
    },
    {
      id: 'route-order',
      title: '/users/me returns "user not found"',
      task: '`GET /users/me` should return the logged-in user, but it looks up a user whose id is "me".',
      lang: 'javascript',
      code: `router.get('/users/:id', getUserById)
router.get('/users/me', getCurrentUser)`,
      line: 1,
      fixed: `router.get('/users/me', getCurrentUser)
router.get('/users/:id', getUserById)`,
      explain: 'Routes match ==in order==, and `/users/:id` also matches `/users/me`. Register the specific route first.',
      difficulty: 'Medium',
    },
  ],
}
