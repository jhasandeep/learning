import type { SpotSet } from './types'

export const nextjs: SpotSet = {
  id: 'nextjs',
  bugs: [
    {
      id: 'use-client',
      title: 'useState only works in Client Components',
      task: 'The build fails: "You\'re importing a component that needs useState. It only works in a Client Component."',
      lang: 'tsx',
      code: `import { useState } from 'react'

export default function LikeButton() {
  const [likes, setLikes] = useState(0)
  return <button onClick={() => setLikes(likes + 1)}>♥ {likes}</button>
}`,
      line: 1,
      fix: "'use client'\n\nimport { useState } from 'react'",
      explain: 'App Router components are Server Components by default. State and event handlers need the ==`"use client"`== directive at the top of the file.',
      difficulty: 'Easy',
    },
    {
      id: 'secret-env',
      title: 'Secret in the bundle',
      task: 'A security scan finds the Stripe secret key in the browser\'s JavaScript.',
      lang: 'tsx',
      code: `'use client'

const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY!)

export function Checkout() {
  return <button onClick={() => stripe.charge()}>Pay</button>
}`,
      line: 3,
      fixed: `'use client'

import { createCheckout } from './actions' // a 'use server' action reads STRIPE_SECRET_KEY on the server

export function Checkout() {
  return <button onClick={() => createCheckout()}>Pay</button>
}`,
      explain: 'Anything prefixed `NEXT_PUBLIC_` is inlined into client bundles. Keep secrets in server-only variables and call them from a ==Server Action== or route handler.',
      difficulty: 'Medium',
    },
    {
      id: 'params-await',
      title: 'slug is undefined',
      task: 'The post page logs `undefined` for the slug in Next.js 15+.',
      lang: 'tsx',
      code: `export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = params
  const post = await getPost(slug)
  return <article>{post.title}</article>
}`,
      line: 2,
      fix: '  const { slug } = await params',
      explain: 'In Next.js 15+, `params` is a ==Promise==. Destructuring the promise itself gives `undefined`.',
      difficulty: 'Medium',
    },
    {
      id: 'a-tag',
      title: 'Full reload on every click',
      task: 'Navigating between pages flashes white and loses client state.',
      lang: 'tsx',
      code: `import Link from 'next/link'

export function Nav() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <a href="/pricing">Pricing</a>
    </nav>
  )
}`,
      line: 7,
      fix: '      <Link href="/pricing">Pricing</Link>',
      explain: 'A plain `<a>` does a full page load. ==`<Link>`== navigates on the client and prefetches.',
      difficulty: 'Easy',
    },
    {
      id: 'action-auth',
      title: 'Anyone can delete',
      task: 'Only admins see the Delete button, yet a regular user deleted a post with a crafted request.',
      lang: 'tsx',
      code: `'use server'

export async function deletePost(id: string) {
  await db.post.delete({ where: { id } })
  revalidatePath('/posts')
}`,
      line: 4,
      fixed: `'use server'

export async function deletePost(id: string) {
  const user = await getCurrentUser()
  if (user?.role !== 'admin') throw new Error('Forbidden')
  await db.post.delete({ where: { id } })
  revalidatePath('/posts')
}`,
      explain: 'Server Actions are ==public endpoints==: hiding a button does not protect them. Check authentication and authorisation inside every action.',
      difficulty: 'Hard',
    },
    {
      id: 'metadata-client',
      title: 'Title never changes',
      task: 'The page title stays the default even though `metadata` is exported.',
      lang: 'tsx',
      code: `'use client'

export const metadata = { title: 'Dashboard' }

export default function Dashboard() {
  return <Charts />
}`,
      line: 1,
      fixed: `export const metadata = { title: 'Dashboard' }

export default function Dashboard() {
  return <Charts /> // Charts is the 'use client' component
}`,
      explain: '`metadata` is only read from ==Server Components==. Keep the page on the server and move the interactive parts into a separate client component.',
      difficulty: 'Medium',
    },
  ],
}
