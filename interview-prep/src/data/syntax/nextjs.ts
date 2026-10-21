import type { SyntaxSet } from './types'

export const nextjs: SyntaxSet = {
  id: 'nextjs',
  title: 'Next.js',
  snippets: [
    {
      id: 'root-layout-metadata',
      title: 'Root layout with metadata',
      lang: 'tsx',
      code: `// app/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'Acme', template: '%s | Acme' },
  description: 'The best widgets on the web',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`,
      note: 'The **root layout** must render `<html>` and `<body>` and wraps every page. `LayoutProps` is a global type helper, and a static `metadata` export sets the head tags.',
    },
    {
      id: 'dynamic-page-params',
      title: 'Dynamic page with params',
      lang: 'tsx',
      code: `// app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  const posts = await getPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()
  return <article><h1>{post.title}</h1>{post.body}</article>
}`,
      note: 'In the App Router `params` is a ==Promise you must await==. `generateStaticParams` lists the slugs to prerender at build time.',
    },
    {
      id: 'server-component-fetch',
      title: 'Server Component fetching data',
      lang: 'tsx',
      code: `// app/products/page.tsx
export default async function ProductsPage() {
  const res = await fetch('https://api.example.com/products')
  if (!res.ok) throw new Error('Failed to fetch products')
  const products: Product[] = await res.json()

  return (
    <ul>
      {products.map((p) => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  )
}`,
      note: 'Components are **Server Components** by default, so they can be `async` and fetch directly with no `useEffect`. Fetches are not cached unless you opt in.',
    },
    {
      id: 'client-component',
      title: 'Client Component',
      lang: 'tsx',
      code: `// app/components/like-button.tsx
'use client'

import { useState } from 'react'

export function LikeButton({ initial }: { initial: number }) {
  const [likes, setLikes] = useState(initial)
  return (
    <button onClick={() => setLikes((n) => n + 1)}>
      {likes} likes
    </button>
  )
}`,
      note: '`\'use client\'` marks the **client boundary**: needed for state, effects and event handlers. Keep it on small leaf components and pass server data in as props.',
    },
    {
      id: 'server-action-form',
      title: 'Server Action form',
      lang: 'tsx',
      code: `import { revalidatePath } from 'next/cache'

async function addTodo(formData: FormData) {
  'use server'
  const title = String(formData.get('title') ?? '').trim()
  if (!title) return
  await db.todo.create({ data: { title } })
  revalidatePath('/todos')
}

export default function TodosPage() {
  return (
    <form action={addTodo}>
      <input name="title" required />
      <button type="submit">Add</button>
    </form>
  )
}`,
      note: 'A **Server Action** (`\'use server\'`) runs on the server when the form posts, then `revalidatePath` refreshes the page data. Validate input and check auth inside it.',
    },
    {
      id: 'route-handler',
      title: 'Route handler GET and POST',
      lang: 'typescript',
      code: `// app/api/posts/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Number(searchParams.get('limit') ?? 10)
  const posts = await db.post.findMany({ take: limit })
  return Response.json(posts)
}

export async function POST(request: Request) {
  const body = await request.json()
  if (!body.title) {
    return Response.json({ error: 'title required' }, { status: 400 })
  }
  const post = await db.post.create({ data: body })
  return Response.json(post, { status: 201 })
}`,
      note: 'A `route.ts` file exports one function per **HTTP method** and uses the web `Request` and `Response` APIs. Asked whenever a Next.js app needs a REST endpoint.',
    },
    {
      id: 'proxy-auth-redirect',
      title: 'proxy.ts auth redirect',
      lang: 'typescript',
      code: `// proxy.ts (replaces middleware.ts in Next.js 16)
import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const session = request.cookies.get('session')?.value
  if (!session) {
    const url = new URL('/login', request.url)
    url.searchParams.set('from', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/account/:path*'],
}`,
      note: '**Proxy** runs before a route renders, limited by `matcher`. Use it for quick optimistic checks like a missing cookie; still verify auth where the data is read.',
    },
    {
      id: 'error-and-loading',
      title: 'error.tsx and loading.tsx',
      lang: 'tsx',
      code: `// app/dashboard/error.tsx
'use client'

export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <button onClick={() => retry()}>Try again</button>
    </div>
  )
}

// app/dashboard/loading.tsx
export default function Loading() {
  return <p>Loading dashboard...</p>
}`,
      note: '`loading.tsx` wraps the segment in **Suspense**, `error.tsx` in an error boundary. The error file must be a Client Component, and `retry()` re-fetches and re-renders the segment.',
    },
    {
      id: 'generate-metadata',
      title: 'generateMetadata',
      lang: 'tsx',
      code: `// app/blog/[slug]/page.tsx
import type { Metadata } from 'next'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { images: [post.coverUrl] },
  }
}`,
      note: 'Use **generateMetadata** when the title depends on data. Wrap `getPost` in React `cache` so the page and metadata share one request.',
    },
    {
      id: 'image-and-dynamic',
      title: 'next/image and dynamic import',
      lang: 'tsx',
      code: `import Image from 'next/image'
import dynamic from 'next/dynamic'

const Map = dynamic(() => import('./map'), {
  loading: () => <p>Loading map...</p>,
})

export function Hero() {
  return (
    <>
      <Image src="/hero.jpg" alt="Mountains" width={1200} height={600}
        preload />
      <Map />
    </>
  )
}`,
      note: '`Image` resizes, lazy-loads and prevents layout shift (give `width` and `height`); `preload` is for the hero image. `dynamic` **code-splits** a heavy component.',
    },
    {
      id: 'use-cache',
      title: "'use cache' with cacheLife",
      lang: 'typescript',
      code: `// lib/products.ts (cacheComponents: true in next.config.ts)
import { cacheLife, cacheTag, updateTag } from 'next/cache'

export async function getProducts(category: string) {
  'use cache'
  cacheLife('hours')
  cacheTag('products')
  return db.product.findMany({ where: { category } })
}

export async function renameProduct(id: string, name: string) {
  'use server'
  await db.product.update({ where: { id }, data: { name } })
  updateTag('products')
}`,
      note: 'Caching is **opt-in**: `\'use cache\'` caches the function result, `cacheLife` sets how long, and `updateTag` in a Server Action expires everything tagged.',
    },
  ],
}
