import type { LearnTrack } from './types'

export const nextjs: LearnTrack = {
  id: 'nextjs',
  intro: 'The App Router from the code side: route handlers, dynamic params, async Server Components, static params and metadata, middleware and Server Actions.',
  kind: 'js',
  lang: 'tsx',
  typescript: true,
  jsx: true,
  steps: [
    {
      id: 'route-handler',
      title: 'A route handler',
      learn: `In the App Router, \`app/api/hello/route.ts\` becomes the endpoint \`/api/hello\`. Export a function named after the HTTP method; it receives a standard \`Request\` and returns a \`Response\`:

\`\`\`
export async function GET() {
  return Response.json({ ok: true })
}
\`\`\``,
      task: 'Write the `GET` handler for `app/api/health/route.ts`: respond with JSON `{ status: "ok" }`.',
      starter: `// app/api/health/route.ts
export async function GET() {

}
`,
      solution: `// app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok' })
}
`,
      tests: [
        ['returns 200', 'const res = await module.exports.GET(new Request("http://x/api/health")); expect(res.status).toBe(200)'],
        ['returns { status: "ok" } as JSON', 'const res = await module.exports.GET(new Request("http://x/api/health")); expect(await res.json()).toEqual({ status: "ok" })'],
      ],
      hints: ['`Response.json(data)` builds a JSON response with the right header.', 'Remember to `return` it.'],
    },
    {
      id: 'dynamic-params',
      title: 'Dynamic segments',
      learn: `A folder in square brackets is a dynamic segment: \`app/api/users/[id]/route.ts\` matches \`/api/users/42\`.

The handler's second argument has \`params\`. Since Next.js 15 it is a **Promise**, so \`await\` it. Return 404 with \`Response.json(body, { status: 404 })\` when nothing is found.`,
      task: 'Write `GET` for `app/api/users/[id]/route.ts` using the `USERS` map: return the user as JSON, or 404 with `{ error: "Not found" }`.',
      starter: `const USERS: Record<string, { id: string; name: string }> = {
  '1': { id: '1', name: 'Ada' },
  '2': { id: '2', name: 'Linus' },
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {

}
`,
      solution: `const USERS: Record<string, { id: string; name: string }> = {
  '1': { id: '1', name: 'Ada' },
  '2': { id: '2', name: 'Linus' },
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = USERS[id]
  if (!user) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(user)
}
`,
      tests: [
        ['returns the user', 'const res = await module.exports.GET(new Request("http://x/api/users/2"), { params: Promise.resolve({ id: "2" }) }); expect(res.status).toBe(200); expect(await res.json()).toEqual({ id: "2", name: "Linus" })'],
        ['404 for an unknown id', 'const res = await module.exports.GET(new Request("http://x/api/users/9"), { params: Promise.resolve({ id: "9" }) }); expect(res.status).toBe(404); expect(await res.json()).toEqual({ error: "Not found" })'],
      ],
      hints: ['`const { id } = await params`: destructuring the promise itself gives `undefined`.', 'Pass the status as the second argument: `Response.json({ error: "Not found" }, { status: 404 })`.'],
    },
    {
      id: 'post-validation',
      title: 'POST and validation',
      learn: `Read a JSON body with \`await request.json()\`. Never trust it: check every field, answer **400** with a helpful error when it's wrong, and **201** when you create something.

Bad JSON makes \`request.json()\` throw, so catch that too.`,
      task: 'Write `POST` for `app/api/todos/route.ts`: the body must be `{ title: string }` with a non-empty trimmed title. Respond 201 with `{ id: 1, title }`, or 400 with `{ error: "Title is required" }` (also for bad JSON).',
      starter: `export async function POST(request: Request) {
  const body = await request.json()
  return Response.json({ id: 1, title: body.title }, { status: 201 })
}
`,
      solution: `export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Title is required' }, { status: 400 })
  }
  const title = typeof (body as { title?: unknown })?.title === 'string' ? (body as { title: string }).title.trim() : ''
  if (!title) return Response.json({ error: 'Title is required' }, { status: 400 })
  return Response.json({ id: 1, title }, { status: 201 })
}
`,
      tests: [
        ['201 with the trimmed title', 'const res = await module.exports.POST(new Request("http://x", { method: "POST", body: JSON.stringify({ title: "  Ship it " }) })); expect(res.status).toBe(201); expect(await res.json()).toEqual({ id: 1, title: "Ship it" })'],
        ['400 for a missing or blank title', 'for (const b of [{}, { title: "   " }, { title: 42 }]) { const res = await module.exports.POST(new Request("http://x", { method: "POST", body: JSON.stringify(b) })); expect(res.status).toBe(400) }'],
        ['400 for invalid JSON', 'const res = await module.exports.POST(new Request("http://x", { method: "POST", body: "{oops" })); expect(res.status).toBe(400); expect(await res.json()).toEqual({ error: "Title is required" })'],
      ],
      hints: ['Wrap `await request.json()` in `try/catch`.', 'Check `typeof title === "string"` and that `title.trim()` isn\'t empty.'],
    },
    {
      id: 'search-params',
      title: 'Search params',
      learn: `Query strings arrive on the URL. \`new URL(request.url).searchParams\` gives you \`get\`, \`has\` and \`getAll\`. Values are always strings (or \`null\`), so convert numbers and set defaults:

\`\`\`
const page = Number(searchParams.get('page') ?? '1')
\`\`\``,
      task: 'Write `GET` that pages through `ITEMS`: `?page=` (default 1) and `?limit=` (default 2, at most 10). Respond with `{ page, items }`.',
      starter: `const ITEMS = ['a', 'b', 'c', 'd', 'e']

export async function GET(request: Request) {
  return Response.json({ page: 1, items: ITEMS })
}
`,
      solution: `const ITEMS = ['a', 'b', 'c', 'd', 'e']

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)
  const limit = Math.min(10, Math.max(1, Number(searchParams.get('limit') ?? '2') || 2))
  const start = (page - 1) * limit
  return Response.json({ page, items: ITEMS.slice(start, start + limit) })
}
`,
      tests: [
        ['defaults to page 1 of 2', 'const r = await module.exports.GET(new Request("http://x/api/items")); expect(await r.json()).toEqual({ page: 1, items: ["a", "b"] })'],
        ['reads page and limit', 'const r = await module.exports.GET(new Request("http://x/api/items?page=2&limit=3")); expect(await r.json()).toEqual({ page: 2, items: ["d", "e"] })'],
        ['caps the limit at 10', 'const r = await module.exports.GET(new Request("http://x/api/items?limit=500")); expect((await r.json()).items).toHaveLength(5)'],
      ],
      hints: ['`const { searchParams } = new URL(request.url)`.', 'The slice starts at `(page - 1) * limit`.'],
    },
    {
      id: 'server-component',
      title: 'An async Server Component',
      learn: `Pages in \`app/\` are **Server Components** by default. They can be \`async\` and load data directly, with no \`useEffect\` and no API round trip:

\`\`\`
export default async function Page() {
  const posts = await getPosts()
  return <ul>{posts.map((p) => <li key={p.id}>{p.title}</li>)}</ul>
}
\`\`\``,
      task: 'Write the page: await `getPosts()` and render an `<h1>` "Blog" plus a `<ul>` of post titles (keyed by id). Show a `<p>` "No posts yet" when the list is empty.',
      starter: `type Post = { id: number; title: string }
let POSTS: Post[] = [{ id: 1, title: 'Hello' }, { id: 2, title: 'Server Components' }]
export const setPosts = (p: Post[]) => { POSTS = p }
const getPosts = async () => POSTS

export default function Page() {
  return <h1>Blog</h1>
}
`,
      solution: `type Post = { id: number; title: string }
let POSTS: Post[] = [{ id: 1, title: 'Hello' }, { id: 2, title: 'Server Components' }]
export const setPosts = (p: Post[]) => { POSTS = p }
const getPosts = async () => POSTS

export default async function Page() {
  const posts = await getPosts()
  return (
    <main>
      <h1>Blog</h1>
      {posts.length === 0 ? (
        <p>No posts yet</p>
      ) : (
        <ul>
          {posts.map((p) => <li key={p.id}>{p.title}</li>)}
        </ul>
      )}
    </main>
  )
}
`,
      tests: [
        ['lists the posts', 'const ui = render(await module.exports.default()); ui.getByText("Blog"); expect(ui.getAllByTag("li").map((li) => li.children.join(""))).toEqual(["Hello", "Server Components"]); expect(ui.warnings).toEqual([])'],
        ['handles no posts', 'module.exports.setPosts([]); const ui = render(await module.exports.default()); ui.getByText("No posts yet")'],
        ['the page is async', 'expect(code).toMatch(/export\\s+default\\s+async\\s+function/)'],
      ],
      hints: ['Make the component `async` and `const posts = await getPosts()`.', 'Use a ternary: `posts.length === 0 ? <p>…</p> : <ul>…</ul>`.'],
    },
    {
      id: 'static-params',
      title: 'Static params and metadata',
      learn: `For \`app/blog/[slug]/page.tsx\`:

- \`generateStaticParams()\` returns the slugs to prerender at build time: \`[{ slug: 'a' }, …]\`
- \`generateMetadata({ params })\` returns the page's \`title\` and \`description\` (\`params\` is a Promise)`,
      task: 'Using `POSTS`, write `generateStaticParams()` (one entry per slug) and `generateMetadata({ params })` that returns `{ title: post.title, description: post.excerpt }`, or `{ title: "Not found" }`.',
      starter: `const POSTS = [
  { slug: 'hello', title: 'Hello world', excerpt: 'The first post' },
  { slug: 'rsc', title: 'Server Components', excerpt: 'Why they matter' },
]

export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return {}
}
`,
      solution: `const POSTS = [
  { slug: 'hello', title: 'Hello world', excerpt: 'The first post' },
  { slug: 'rsc', title: 'Server Components', excerpt: 'Why they matter' },
]

export async function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = POSTS.find((p) => p.slug === slug)
  if (!post) return { title: 'Not found' }
  return { title: post.title, description: post.excerpt }
}
`,
      tests: [
        ['one param per post', 'expect(await module.exports.generateStaticParams()).toEqual([{ slug: "hello" }, { slug: "rsc" }])'],
        ['metadata for a post', 'expect(await module.exports.generateMetadata({ params: Promise.resolve({ slug: "rsc" }) })).toEqual({ title: "Server Components", description: "Why they matter" })'],
        ['metadata for an unknown slug', 'expect(await module.exports.generateMetadata({ params: Promise.resolve({ slug: "nope" }) })).toEqual({ title: "Not found" })'],
      ],
      hints: ['`POSTS.map((p) => ({ slug: p.slug }))`: note the parentheses around the object.', 'Await `params`, then `find` the post by slug.'],
    },
    {
      id: 'middleware',
      title: 'Middleware',
      learn: `\`middleware.ts\` runs before a request is routed. Use it for cheap checks such as redirecting signed-out users:

\`\`\`
import { NextResponse } from 'next/server'
export function middleware(request) {
  if (!request.cookies.get('session')) return NextResponse.redirect(new URL('/login', request.url))
  return NextResponse.next()
}
\`\`\`

It's not a security boundary on its own: still check auth where data is read.`,
      task: 'Protect every path under `/dashboard`: without a `session` cookie, redirect to `/login?next=<path>`. Let everything else through with `NextResponse.next()`.',
      starter: `import { NextResponse } from 'next/server'

export function middleware(request: { url: string; nextUrl: URL; cookies: { get(name: string): { value: string } | undefined } }) {
  return NextResponse.next()
}
`,
      solution: `import { NextResponse } from 'next/server'

export function middleware(request: { url: string; nextUrl: URL; cookies: { get(name: string): { value: string } | undefined } }) {
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/dashboard') && !request.cookies.get('session')) {
    const login = new URL('/login', request.url)
    login.searchParams.set('next', pathname)
    return NextResponse.redirect(login)
  }
  return NextResponse.next()
}
`,
      tests: [
        ['redirects a signed-out user', 'const req = (url, cookies = {}) => ({ url, nextUrl: new URL(url), cookies: { get: (n) => (cookies[n] ? { value: cookies[n] } : undefined) } }); const res = module.exports.middleware(req("http://x/dashboard/settings")); expect(res.status).toBe(307); expect(res.headers.get("location")).toBe("http://x/login?next=%2Fdashboard%2Fsettings")'],
        ['lets a signed-in user through', 'const req = (url, cookies = {}) => ({ url, nextUrl: new URL(url), cookies: { get: (n) => (cookies[n] ? { value: cookies[n] } : undefined) } }); const res = module.exports.middleware(req("http://x/dashboard", { session: "abc" })); expect(res.headers.get("x-middleware-next")).toBe("1")'],
        ['ignores other paths', 'const res = module.exports.middleware({ url: "http://x/about", nextUrl: new URL("http://x/about"), cookies: { get: () => undefined } }); expect(res.headers.get("x-middleware-next")).toBe("1")'],
      ],
      hints: ['`request.nextUrl.pathname.startsWith("/dashboard")`.', 'Build the URL with `new URL("/login", request.url)` and `searchParams.set("next", pathname)`.'],
    },
    {
      id: 'server-action',
      title: 'Server Actions',
      learn: `A Server Action is an async function marked \`'use server'\` that a form can call directly. It receives \`FormData\`.

It runs on the server but is reachable by anyone, like an API endpoint: **validate** the input and check permissions inside it. Return errors as data so the form can show them.`,
      task: 'Write the action `subscribe(formData)`: read `email`; if it is missing or has no "@", return `{ ok: false, error: "Enter a valid email" }`; otherwise save it with `saveEmail` (lower-cased, trimmed) and return `{ ok: true }`.',
      starter: `'use server'

export const saved: string[] = []
const saveEmail = async (email: string) => { saved.push(email) }

export async function subscribe(formData: FormData) {
  await saveEmail(String(formData.get('email')))
  return { ok: true }
}
`,
      solution: `'use server'

export const saved: string[] = []
const saveEmail = async (email: string) => { saved.push(email) }

export async function subscribe(formData: FormData) {
  const raw = formData.get('email')
  const email = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  if (!email.includes('@')) return { ok: false, error: 'Enter a valid email' }
  await saveEmail(email)
  return { ok: true }
}
`,
      tests: [
        ['saves a clean email', 'const fd = new FormData(); fd.set("email", "  Ada@Example.com "); expect(await module.exports.subscribe(fd)).toEqual({ ok: true }); expect(module.exports.saved).toEqual(["ada@example.com"])'],
        ['rejects a bad email without saving', 'const before = module.exports.saved.length; const fd = new FormData(); fd.set("email", "nope"); expect(await module.exports.subscribe(fd)).toEqual({ ok: false, error: "Enter a valid email" }); expect(module.exports.saved.length).toBe(before)'],
        ['rejects a missing email', 'expect(await module.exports.subscribe(new FormData())).toMatchObject({ ok: false })'],
      ],
      hints: ['`formData.get("email")` is `null` when the field is missing.', 'Validate before calling `saveEmail`.'],
    },
  ],
}
