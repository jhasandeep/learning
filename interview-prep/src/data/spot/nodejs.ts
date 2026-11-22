import type { SpotSet } from './types'

export const nodejs: SpotSet = {
  id: 'nodejs',
  bugs: [
    {
      id: 'sync-read',
      title: 'One slow user blocks everyone',
      task: 'Under load, every request waits whenever someone downloads a report.',
      lang: 'javascript',
      code: `import http from 'node:http'
import fs from 'node:fs'

http.createServer((req, res) => {
  const data = fs.readFileSync('./reports/big.csv')
  res.end(data)
}).listen(3000)`,
      line: 5,
      fixed: `import http from 'node:http'
import fs from 'node:fs'
import { pipeline } from 'node:stream/promises'

http.createServer(async (req, res) => {
  await pipeline(fs.createReadStream('./reports/big.csv'), res)
}).listen(3000)`,
      explain: '`readFileSync` ==blocks the event loop== until the whole file is read, so no other request runs. Stream it (with backpressure) instead.',
      difficulty: 'Medium',
    },
    {
      id: 'missing-await',
      title: 'An empty user',
      task: '`/users/1` responds with `{}` instead of the user, and unknown ids never get a 404.',
      lang: 'javascript',
      code: `app.get('/users/:id', async (req, res) => {
  const user = db.users.findById(req.params.id)
  if (!user) return res.status(404).json({ error: 'Not found' })
  res.json(user)
})`,
      line: 2,
      fix: '  const user = await db.users.findById(req.params.id)',
      explain: 'Without `await`, `user` is a pending ==Promise==: always truthy (so the 404 never fires), and it serialises to `{}`. Await the query.',
      difficulty: 'Easy',
    },
    {
      id: 'listener-leak',
      title: 'MaxListenersExceededWarning',
      task: 'After a few hours the logs show "11 message listeners added" and memory keeps growing.',
      lang: 'javascript',
      code: `function waitForReply(socket, id) {
  return new Promise((resolve) => {
    socket.on('message', (msg) => {
      if (msg.id === id) resolve(msg)
    })
  })
}`,
      line: 3,
      fixed: `function waitForReply(socket, id) {
  return new Promise((resolve) => {
    const onMessage = (msg) => {
      if (msg.id !== id) return
      socket.off('message', onMessage)
      resolve(msg)
    }
    socket.on('message', onMessage)
  })
}`,
      explain: 'Every call adds a listener that is ==never removed==, even after it resolves. Remove it once the reply arrives.',
      difficulty: 'Hard',
    },
    {
      id: 'json-parse',
      title: 'One bad request crashes the server',
      task: 'A client sent malformed JSON and the whole process exited.',
      lang: 'javascript',
      code: `server.on('request', (req, res) => {
  let body = ''
  req.on('data', (chunk) => (body += chunk))
  req.on('end', () => {
    const payload = JSON.parse(body)
    res.end(JSON.stringify({ ok: true, got: payload.name }))
  })
})`,
      line: 5,
      fixed: `server.on('request', (req, res) => {
  let body = ''
  req.on('data', (chunk) => (body += chunk))
  req.on('end', () => {
    let payload
    try {
      payload = JSON.parse(body)
    } catch {
      res.statusCode = 400
      return res.end('Invalid JSON')
    }
    res.end(JSON.stringify({ ok: true, got: payload.name }))
  })
})`,
      explain: 'An exception thrown inside an event callback is ==uncaught== and kills the process. Parse untrusted input inside `try/catch` and reply 400.',
      difficulty: 'Medium',
    },
    {
      id: 'env-port',
      title: 'Works locally, not in the cloud',
      task: 'The platform sets `PORT=8080`; the health check fails because the app listens elsewhere.',
      lang: 'javascript',
      code: `import express from 'express'
const app = express()
app.get('/health', (req, res) => res.send('ok'))
app.listen(3000)`,
      line: 4,
      fix: 'app.listen(Number(process.env.PORT) || 3000)',
      explain: 'Read configuration from the ==environment== so the same build runs anywhere.',
      difficulty: 'Easy',
    },
    {
      id: 'path-join',
      title: 'Path traversal',
      task: 'A request for `/files?name=../../etc/passwd` returned the server\'s password file.',
      lang: 'javascript',
      code: `import path from 'node:path'
const ROOT = path.resolve('uploads')

app.get('/files', (req, res) => {
  const file = path.join(ROOT, req.query.name)
  res.sendFile(file)
})`,
      line: 5,
      fixed: `import path from 'node:path'
const ROOT = path.resolve('uploads')

app.get('/files', (req, res) => {
  const file = path.resolve(ROOT, String(req.query.name))
  if (!file.startsWith(ROOT + path.sep)) return res.status(400).end()
  res.sendFile(file)
})`,
      explain: '`path.join` happily follows `..`. Resolve the path and check it is ==still inside== the allowed folder.',
      difficulty: 'Hard',
    },
  ],
}
