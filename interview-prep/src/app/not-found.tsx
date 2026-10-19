import Link from 'next/link'
import { buttonClass } from '@/components/ui'

export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-md place-items-center py-24 text-center">
      <p className="font-mono text-6xl font-semibold text-accent">404</p>
      <h1 className="mt-4 text-xl font-semibold">This page has a bug we can&apos;t fix</h1>
      <p className="mt-2 text-sm text-muted">The level or page you are looking for doesn&apos;t exist.</p>
      <Link href="/" className={`${buttonClass('primary')} mt-6`}>Back home</Link>
    </div>
  )
}
