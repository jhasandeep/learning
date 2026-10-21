import type { SyntaxSet } from './types'

export const express: SyntaxSet = {
  id: 'express',
  title: 'Express',
  snippets: [
    {
      id: 'basic-server',
      title: 'Basic server',
      lang: 'javascript',
      code: `import express from 'express'

const app = express()
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

const PORT = process.env.PORT ?? 3000
app.listen(PORT, () => {
  console.log(\`Listening on port \${PORT}\`)
})`,
      note: 'The warm-up: create the app, add the **JSON body parser** so `req.body` is filled, register a route and `listen`.',
    },
    {
      id: 'crud-routes',
      title: 'REST CRUD routes',
      lang: 'javascript',
      code: `app.get('/users', async (req, res) => res.json(await db.user.list()))
app.get('/users/:id', async (req, res) => {
  const user = await db.user.findById(req.params.id)
  if (!user) return res.status(404).json({ error: 'Not found' })
  res.json(user)
})
app.post('/users', async (req, res) => {
  const user = await db.user.create(req.body)
  res.status(201).location(\`/users/\${user.id}\`).json(user)
})
app.put('/users/:id', async (req, res) => {
  res.json(await db.user.update(req.params.id, req.body))
})
app.delete('/users/:id', async (req, res) => {
  await db.user.delete(req.params.id)
  res.sendStatus(204)
})`,
      note: 'One resource, five routes. Interviewers check the **status codes**: 201 on create, 404 when missing, 204 with no body on delete.',
    },
    {
      id: 'router-module',
      title: 'express.Router module',
      lang: 'javascript',
      code: `// routes/users.js
import { Router } from 'express'
import * as users from '../controllers/users.js'

const router = Router()

router.route('/').get(users.list).post(users.create)
router
  .route('/:id')
  .get(users.getById)
  .patch(users.update)
  .delete(users.remove)

export default router

// app.js
import usersRouter from './routes/users.js'
app.use('/api/users', usersRouter)`,
      note: 'A `Router` is a mini app mounted at a prefix, so each resource lives in its own file. Asked when the question turns to **structuring** a growing API.',
    },
    {
      id: 'logger-middleware',
      title: 'Logger middleware with timing',
      lang: 'javascript',
      code: `function logger(req, res, next) {
  const start = performance.now()
  res.on('finish', () => {
    const ms = (performance.now() - start).toFixed(1)
    const { method, originalUrl } = req
    console.log(\`\${method} \${originalUrl} \${res.statusCode} \${ms}ms\`)
  })
  next()
}

app.use(logger)`,
      note: 'Middleware is `(req, res, next)`: do work, then call `next()` or the request hangs. Listen for `finish` to know the status and duration.',
    },
    {
      id: 'not-found-handler',
      title: 'Centralised 404 handler',
      lang: 'javascript',
      code: `app.use('/api/users', usersRouter)
app.use('/api/orders', ordersRouter)

// after every route: nothing matched
app.use((req, res) => {
  res.status(404).json({ error: \`Cannot \${req.method} \${req.path}\` })
})

// last of all: the error handler
app.use(errorHandler)`,
      note: 'Middleware runs **in registration order**, so a catch-all after the routes only sees unmatched requests. ==Order matters== is the point being tested.',
    },
    {
      id: 'error-handler',
      title: 'Error handler and async wrapper',
      lang: 'javascript',
      code: `const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

app.get('/orders/:id', asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order) throw new HttpError(404, 'Order not found')
  res.json(order)
}))

// 4 arguments: Express treats this as an error handler
app.use((err, req, res, next) => {
  const status = err.status ?? 500
  if (status >= 500) console.error(err)
  res.status(status).json({
    error: status >= 500 ? 'Internal Server Error' : err.message,
  })
})`,
      note: 'An **error handler** has four parameters and is registered last. Express 4 needs the wrapper to forward async rejections to `next`; Express 5 does it for you.',
    },
    {
      id: 'pagination',
      title: 'Pagination query params',
      lang: 'javascript',
      code: `app.get('/products', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(100, Number(req.query.limit) || 20)
  const offset = (page - 1) * limit

  const [items, total] = await Promise.all([
    db.product.findMany({ skip: offset, take: limit }),
    db.product.count(),
  ])
  res.json({
    data: items,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  })
})`,
      note: 'Query params are always **strings**: parse them, default them and cap `limit`. Returning `total` lets the client render page numbers.',
    },
    {
      id: 'zod-validation',
      title: 'Request validation with zod',
      lang: 'javascript',
      code: `import { z } from 'zod'

const CreateUser = z.object({
  name: z.string().min(1),
  email: z.email(),
  age: z.number().int().positive().optional(),
})

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ errors: result.error.issues })
  }
  req.body = result.data
  next()
}

app.post('/users', validate(CreateUser), createUser)`,
      note: 'Never trust `req.body`. A reusable middleware **factory** validates with `safeParse`, answers 400 with the issues, and passes clean data on.',
    },
    {
      id: 'jwt-auth',
      title: 'JWT auth middleware',
      lang: 'javascript',
      code: `import jwt from 'jsonwebtoken'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? ''
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing token' })
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

app.get('/me', requireAuth, (req, res) => res.json(req.user))`,
      note: 'Read the **Bearer** token, `jwt.verify` it (which also checks expiry) and attach the payload as `req.user`. 401 means not authenticated; 403 is for wrong role.',
    },
    {
      id: 'security-middleware',
      title: 'CORS, helmet and rate limit',
      lang: 'javascript',
      code: `import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'

app.use(helmet())
app.use(cors({
  origin: ['https://app.example.com'],
  credentials: true,
}))
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
}))
app.use(express.json({ limit: '1mb' }))`,
      note: '`helmet` sets **security headers**, `cors` allow-lists origins, and the limiter caps requests per IP. Asked as "how would you harden this API?"',
    },
    {
      id: 'multer-upload',
      title: 'File upload with multer',
      lang: 'javascript',
      code: `import multer from 'multer'

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, file.mimetype.startsWith('image/'))
  },
})

app.post('/avatar', upload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Image required' })
  }
  res.status(201).json({ path: req.file.path, size: req.file.size })
})`,
      note: '`express.json` cannot read **multipart/form-data**; multer parses it and puts the file on `req.file`. Always limit size and type.',
    },
  ],
}
