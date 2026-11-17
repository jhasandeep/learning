// Small stand-ins for Node and Express, so Node/Express lessons run in the
// browser. They follow the real APIs closely enough for learning; what the
// lessons don't need is left out.

type Listener = (...args: unknown[]) => void

export class EventEmitter {
  private events = new Map<string, Listener[]>()
  on(name: string, fn: Listener) {
    this.events.set(name, [...(this.events.get(name) ?? []), fn])
    return this
  }
  addListener(name: string, fn: Listener) {
    return this.on(name, fn)
  }
  once(name: string, fn: Listener) {
    const wrap: Listener = (...a) => {
      this.off(name, wrap)
      fn(...a)
    }
    return this.on(name, wrap)
  }
  off(name: string, fn: Listener) {
    this.events.set(name, (this.events.get(name) ?? []).filter((f) => f !== fn))
    return this
  }
  removeListener(name: string, fn: Listener) {
    return this.off(name, fn)
  }
  emit(name: string, ...args: unknown[]) {
    const list = this.events.get(name) ?? []
    list.forEach((f) => f(...args))
    return list.length > 0
  }
  listenerCount(name: string) {
    return (this.events.get(name) ?? []).length
  }
}

/** An in-memory file system for `fs/promises`. */
export function memoryFs(files: Record<string, string>) {
  const store = new Map(Object.entries(files))
  const missing = (p: string) => Object.assign(new Error(`ENOENT: no such file or directory, open '${p}'`), { code: 'ENOENT' })
  return {
    async readFile(p: string) {
      if (!store.has(p)) throw missing(p)
      return store.get(p)!
    },
    async writeFile(p: string, data: string) {
      store.set(p, String(data))
    },
    async appendFile(p: string, data: string) {
      store.set(p, (store.get(p) ?? '') + String(data))
    },
    async readdir(dir: string) {
      const prefix = dir.endsWith('/') ? dir : `${dir}/`
      return [...store.keys()].filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length)).filter((k) => !k.includes('/')).sort()
    },
    async unlink(p: string) {
      if (!store.delete(p)) throw missing(p)
    },
    files: store,
  }
}

// ---------- Express ----------

type Next = (err?: unknown) => void
type Handler = (...args: never[]) => unknown
interface Layer { method: string | null; path: string; handlers: Handler[]; prefix: boolean }

export interface MiniRequest {
  method: string
  path: string
  url: string
  params: Record<string, string>
  query: Record<string, string>
  headers: Record<string, string>
  body: unknown
  rawBody?: string
  get(name: string): string | undefined
  [key: string]: unknown
}

export interface MiniResponse {
  statusCode: number
  headers: Record<string, string>
  body: unknown
  headersSent: boolean
  locals: Record<string, unknown>
  status(code: number): MiniResponse
  json(data: unknown): MiniResponse
  send(data?: unknown): MiniResponse
  set(name: string, value: string): MiniResponse
  setHeader(name: string, value: string): MiniResponse
  location(url: string): MiniResponse
  redirect(a: number | string, b?: string): MiniResponse
  sendStatus(code: number): MiniResponse
  end(data?: unknown): MiniResponse
  [key: string]: unknown
}

function match(pattern: string, path: string, prefix: boolean): Record<string, string> | null {
  const p = pattern.replace(/\/$/, '') || '/'
  const pp = p.split('/').filter(Boolean)
  const parts = path.split('/').filter(Boolean)
  if (prefix ? parts.length < pp.length : parts.length !== pp.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(':')) params[pp[i].slice(1)] = decodeURIComponent(parts[i])
    else if (pp[i] !== parts[i]) return null
  }
  return params
}

function makeRouter() {
  const layers: Layer[] = []
  const add = (method: string | null, prefix: boolean) => (path: unknown, ...handlers: Handler[]) => {
    if (typeof path === 'function') {
      handlers = [path as Handler, ...handlers]
      path = '/'
    }
    layers.push({ method, path: String(path), handlers: handlers.flat(), prefix })
    return router
  }
  const router = {
    use: add(null, true),
    get: add('GET', false),
    post: add('POST', false),
    put: add('PUT', false),
    patch: add('PATCH', false),
    delete: add('DELETE', false),
    all: add('ALL', false),
    /** Runs a request through the layers. */
    async handle(req: MiniRequest, res: MiniResponse, done: Next, base = '') {
      let i = 0
      let h = 0
      const next: Next = async (err) => {
        while (i < layers.length) {
          const layer = layers[i]
          const sub = req.path.slice(base.length) || '/'
          const params = (layer.method === null || layer.method === 'ALL' || layer.method === req.method) ? match(layer.path, sub, layer.prefix) : null
          if (!params || h >= layer.handlers.length) {
            i++
            h = 0
            continue
          }
          const fn = layer.handlers[h++] as unknown as ((...a: unknown[]) => unknown) & { handle?: unknown }
          req.params = { ...req.params, ...params }
          try {
            if (typeof fn.handle === 'function') {
              // A mounted router: strip the mount path while it handles the request.
              const mount = layer.path === '/' ? '' : layer.path.replace(/\/$/, '')
              await (fn as unknown as ReturnType<typeof makeRouter>).handle(req, res, next, base + mount)
              return
            }
            if (err !== undefined) {
              if (fn.length === 4) await fn(err, req, res, next)
              else continue
            } else if (fn.length < 4) {
              await fn(req, res, next)
            } else continue
          } catch (e) {
            await next(e)
          }
          return
        }
        done(err)
      }
      await next()
    },
  }
  return router
}

/** A small Express: routing, params, query, JSON bodies, middleware, error handlers and routers. */
export function express() {
  const app = makeRouter()
  return Object.assign(app, {
    listen(_port?: number, cb?: () => void) {
      cb?.()
      return { close() {} }
    },
  })
}
express.json = () => (req: MiniRequest, _res: MiniResponse, next: Next) => {
  if (typeof req.rawBody === 'string' && req.headers['content-type']?.includes('json')) {
    try {
      req.body = JSON.parse(req.rawBody)
    } catch (e) {
      return next(Object.assign(new Error('Invalid JSON'), { status: 400, cause: e }))
    }
  }
  next()
}
express.Router = () => makeRouter()

export interface MiniReply { status: number; body: unknown; headers: Record<string, string>; text: string }

/** Sends a fake request through an app: `await request(app).post('/users', { name: 'Ada' })`. */
export function request(app: ReturnType<typeof express> | ReturnType<typeof makeRouter>) {
  const send = async (method: string, url: string, body?: unknown, headers: Record<string, string> = {}): Promise<MiniReply> => {
    const [path, qs = ''] = url.split('?')
    const lower: Record<string, string> = {}
    for (const [k, v] of Object.entries(headers)) lower[k.toLowerCase()] = v
    if (body !== undefined && !lower['content-type']) lower['content-type'] = 'application/json'
    const req = {
      method, url, path, params: {}, headers: lower, body: undefined,
      query: Object.fromEntries(new URLSearchParams(qs)),
      rawBody: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
      get: (n: string) => lower[n.toLowerCase()],
    } as MiniRequest
    return new Promise((resolve) => {
      const finish = () => resolve({ status: res.statusCode, body: res.body, headers: res.headers, text: typeof res.body === 'string' ? res.body : JSON.stringify(res.body ?? '') })
      const res = {
        statusCode: 200, headers: {}, body: undefined, headersSent: false, locals: {},
        status(c: number) { res.statusCode = c; return res },
        set(n: string, v: string) { res.headers[n.toLowerCase()] = v; return res },
        setHeader(n: string, v: string) { return res.set(n, v) },
        location(u: string) { return res.set('location', u) },
        json(d: unknown) {
          if (res.headersSent) throw new Error('Cannot set headers after they are sent to the client')
          res.headersSent = true
          res.set('content-type', 'application/json')
          res.body = JSON.parse(JSON.stringify(d ?? null))
          finish()
          return res
        },
        send(d?: unknown) {
          if (d !== null && typeof d === 'object') return res.json(d)
          if (res.headersSent) throw new Error('Cannot set headers after they are sent to the client')
          res.headersSent = true
          res.body = d === undefined ? '' : String(d)
          finish()
          return res
        },
        sendStatus(c: number) { return res.status(c).send(String(c)) },
        redirect(a: number | string, b?: string) { return res.status(typeof a === 'number' ? a : 302).location(String(typeof a === 'number' ? b : a)).send('') },
        end(d?: unknown) { return res.send(d) },
      } as MiniResponse
      void app.handle(req, res, (err) => {
        if (res.headersSent) return
        if (err !== undefined) res.status((err as { status?: number })?.status ?? 500).send(`Error: ${err instanceof Error ? err.message : String(err)}`)
        else res.status(404).send(`Cannot ${method} ${path}`)
      })
    })
  }
  return {
    get: (url: string, headers?: Record<string, string>) => send('GET', url, undefined, headers),
    delete: (url: string, headers?: Record<string, string>) => send('DELETE', url, undefined, headers),
    post: (url: string, body?: unknown, headers?: Record<string, string>) => send('POST', url, body, headers),
    put: (url: string, body?: unknown, headers?: Record<string, string>) => send('PUT', url, body, headers),
    patch: (url: string, body?: unknown, headers?: Record<string, string>) => send('PATCH', url, body, headers),
  }
}

/** `next/server` for route handlers and middleware. */
export const nextServer = {
  NextResponse: Object.assign(
    class NextResponse extends Response {},
    {
      json: (data: unknown, init?: ResponseInit) => Response.json(data, init),
      redirect: (url: string | URL, status = 307) => new Response(null, { status, headers: { location: String(url) } }),
      next: () => new Response(null, { headers: { 'x-middleware-next': '1' } }),
      rewrite: (url: string | URL) => new Response(null, { headers: { 'x-middleware-rewrite': String(url) } }),
    },
  ),
}
