import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ENDLESS_COUNT, isValidEndlessLevel } from '@/lib/endless'
import { EndlessPlay } from './endless-play'

export function generateStaticParams() {
  return Array.from({ length: ENDLESS_COUNT }, (_, i) => ({ level: String(i + 1) }))
}

export async function generateMetadata({ params }: PageProps<'/endless/[level]'>): Promise<Metadata> {
  const { level } = await params
  return { title: `Endless #${level}` }
}

export default async function Page({ params }: PageProps<'/endless/[level]'>) {
  const n = Number((await params).level)
  if (!isValidEndlessLevel(n)) notFound()
  return <EndlessPlay key={n} n={n} />
}
