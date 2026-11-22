import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { highlight } from '@/components/notes/highlight'
import { CODING, CODING_BY_ID } from '@/data/assess'
import { practiceSolution } from '@/lib/dsa'
import { CodingView } from './coding-view'

export function generateStaticParams() {
  return CODING.map((c) => ({ id: c.id }))
}

export async function generateMetadata({ params }: PageProps<'/assess/coding/[id]'>): Promise<Metadata> {
  const { id } = await params
  const c = CODING_BY_ID[id]
  return c ? { title: `${c.title}: coding question`, description: `${c.blurb} Run your code in the browser against sample and hidden tests.` } : { title: 'Coding question' }
}

export default async function Page({ params }: PageProps<'/assess/coding/[id]'>) {
  const { id } = await params
  const index = CODING.findIndex((c) => c.id === id)
  if (index === -1) notFound()
  const q = CODING[index]
  const sol = practiceSolution(q)
  const solutionHtml = { python: await highlight(sol.python, 'python'), javascript: await highlight(sol.javascript, 'javascript') }
  const prev = CODING[index - 1]
  const next = CODING[index + 1]
  return <CodingView key={q.id} q={q} index={index} total={CODING.length} solutionHtml={solutionHtml} prev={prev ? { id: prev.id, title: prev.title } : undefined} next={next ? { id: next.id, title: next.title } : undefined} />
}
