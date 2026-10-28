import type { NoteTopic } from './types'

export const nextjs: NoteTopic = {
  id: 'nextjs',
  title: 'Next.js',
  tagline: 'App Router, server components, rendering strategies, caching',
  category: 'Frontend',
  badge: 'N',
  color: '#475569',
  sections: [
    {
      id: 'what',
      title: 'What Next.js adds to React',
      blocks: [
        { type: 'def', text: '**Next.js** is a React framework: ==file-based routing, server rendering, data fetching, caching, API routes, image/font optimisation and bundling== in one tool.' },
        { type: 'analogy', title: 'Think of Next.js like a restaurant with prep cooks', steps: [{ icon: '🙋', who: 'Customer', tech: 'Browser request', text: 'Asks for a page' }, { icon: '🥗', who: 'Prepared in advance', tech: 'Static / SSG', text: 'Ready instantly from the cache' }, { icon: '🍳', who: 'Cooked to order', tech: 'Server rendering', text: 'Server builds the page with fresh data' }, { icon: '🍽️', who: 'Served + seasoned', tech: 'Hydration', text: 'HTML arrives, then JS makes it interactive' }] },
        {
          type: 'code', lang: 'text', title: 'App Router file conventions',
          code: `app/
  layout.tsx            shared UI (wraps every page), keeps state across navigation
  page.tsx              the "/" route
  loading.tsx           Suspense fallback while the route loads
  error.tsx             error boundary for the segment ('use client')
  not-found.tsx         404 UI
  blog/
    page.tsx            "/blog"
    [slug]/page.tsx     "/blog/:slug" — dynamic segment
  (marketing)/about/    route group: organises files, not part of the URL
  api/users/route.ts    Route Handler: GET/POST/… → JSON`,
        },
      ],
    },
    {
      id: 'rsc',
      title: 'Server and Client Components',
      blocks: [
        {
          type: 'table', head: ['Server Component (default)', "Client Component ('use client')"],
          rows: [
            ['Runs on the server only; its code is not sent to the browser', 'Rendered on the server for HTML, then hydrated in the browser'],
            ['Can be `async`, read the DB or secrets directly', 'Can use state, effects, event handlers, browser APIs'],
            ['No `useState`, `onClick`, `window`', 'Can\'t be `async`; can\'t import server-only code'],
          ],
        },
        {
          type: 'code', lang: 'typescript', title: 'Fetch on the server, interact on the client',
          code: `// app/products/page.tsx — Server Component
import { AddToCart } from './add-to-cart'

export default async function Page() {
  const products = await db.product.findMany()   // runs on the server
  return products.map((p) => (
    <div key={p.id}>{p.name} <AddToCart id={p.id} /></div>
  ))
}

// app/products/add-to-cart.tsx
'use client'
export function AddToCart({ id }: { id: string }) {
  const [added, setAdded] = useState(false)
  return <button onClick={() => setAdded(true)}>{added ? 'Added' : 'Add'}</button>
}`,
        },
        { type: 'tip', text: 'Push `\'use client\'` down to the leaves (buttons, forms) so most of the page stays server-rendered with zero JS.' },
      ],
    },
    {
      id: 'rendering',
      title: 'Rendering strategies',
      blocks: [
        {
          type: 'table', head: ['Strategy', 'HTML made', 'Good for'],
          rows: [
            ['CSR', 'in the browser', 'dashboards behind login'],
            ['SSR (dynamic)', 'on every request', 'personalised or always-fresh pages'],
            ['SSG (static)', 'at build time', 'marketing pages, docs, blogs'],
            ['ISR', 'at build, then regenerated after a time or on demand', 'product pages, large catalogs'],
            ['Streaming', 'shell first, slow parts stream in via Suspense', 'pages with slow data'],
          ],
        },
        { type: 'list', items: ['Hydration = React attaching event handlers to server-rendered HTML.', 'Hydration mismatch: server and client render different output (dates, `window`, random values).', 'Partial prerendering: a static shell is served instantly, and dynamic holes stream in.'] },
      ],
    },
    {
      id: 'data',
      title: 'Data fetching, caching and mutations',
      blocks: [
        {
          type: 'code', lang: 'typescript', title: 'Server Action for a form',
          code: `// app/todos/actions.ts
'use server'
import { revalidatePath } from 'next/cache'

export async function addTodo(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim()
  if (!title) return { error: 'Title is required' }   // validate on the server
  await db.todo.create({ data: { title } })
  revalidatePath('/todos')                            // refresh cached data
}

// app/todos/page.tsx
<form action={addTodo}><input name="title" /><button>Add</button></form>`,
        },
        { type: 'list', items: ['Server Actions are public endpoints — always validate input and check auth inside them.', 'Cache invalidation: `revalidatePath`, `revalidateTag` (on-demand) or time-based revalidation.', 'Newer versions make caching explicit (`\'use cache\'`, Cache Components); request APIs like `cookies()`, `headers()` and `params` are async.', 'Route Handlers (`route.ts`) for webhooks and public APIs.'] },
      ],
    },
    {
      id: 'features',
      title: 'Built-in features',
      blocks: [
        {
          type: 'table', head: ['Feature', 'Why'],
          rows: [
            ['`next/link`', 'client-side navigation + prefetching'],
            ['`next/image`', 'resizing, lazy loading, modern formats, no layout shift'],
            ['`next/font`', 'self-hosted fonts, no layout shift'],
            ['Metadata API', '`export const metadata` / `generateMetadata` for SEO tags'],
            ['Middleware / proxy', 'run before a request: auth redirects, rewrites, i18n'],
            ['`generateStaticParams`', 'pre-build dynamic routes'],
          ],
        },
        { type: 'mistake', text: 'Reading `window` or `localStorage` during render in a Client Component — it also renders on the server. Read browser-only values in effects or event handlers.' },
        { type: 'revision', text: 'App Router files = routes. Server Components by default, `\'use client\'` only for interactivity. SSG/ISR/SSR/streaming per page. Server Actions + revalidate for mutations; validate everything on the server.' },
      ],
    },
  ],
  qa: [
    ['Server Components vs Client Components?', 'Server Components run only on the server (can be async, access the DB, ship no JS). Client Components (\'use client\') can use state, effects and event handlers and are hydrated in the browser.'],
    ['SSR vs SSG vs ISR?', 'SSR renders on every request; SSG renders at build time; ISR serves static pages and regenerates them after a time or on demand.'],
    ['What is hydration?', 'React attaching event handlers and state to server-rendered HTML so it becomes interactive.'],
    ['What causes a hydration mismatch?', 'Server and client rendering different output — dates, random values, window checks or browser-only data during render.'],
    ['What are Server Actions?', 'Async server functions (\'use server\') you can call from forms or client code to mutate data; they must validate input and check auth.'],
    ['What does loading.tsx do?', 'It becomes the Suspense fallback for the route segment while its content loads.'],
    ['Why use next/image?', 'Automatic resizing, lazy loading, modern formats and reserved dimensions that prevent layout shift.'],
    ['How do you invalidate cached data after a mutation?', 'revalidatePath or revalidateTag (on demand), or time-based revalidation.'],
    ['Where should \'use client\' go?', 'As low in the tree as possible — on the interactive leaves — so most of the page stays server-rendered.'],
  ],
}
