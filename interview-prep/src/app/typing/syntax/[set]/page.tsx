import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SYNTAX_LOOK, SYNTAX_SETS, SYNTAX_SETS_BY_ID } from '@/data/syntax'
import { SyntaxPractice } from './syntax-practice'

export function generateStaticParams() {
  return SYNTAX_SETS.map((s) => ({ set: s.id }))
}

export async function generateMetadata({ params }: PageProps<'/typing/syntax/[set]'>): Promise<Metadata> {
  const s = SYNTAX_SETS_BY_ID[(await params).set]
  return s ? { title: `${s.title} syntax · typing`, description: `Type the ${s.title} code interviewers ask for until you can write it from memory.` } : { title: 'Interview syntax' }
}

export default async function Page({ params }: PageProps<'/typing/syntax/[set]'>) {
  const set = SYNTAX_SETS_BY_ID[(await params).set]
  if (!set) notFound()
  const i = SYNTAX_SETS.indexOf(set)
  return <SyntaxPractice key={set.id} set={set} look={SYNTAX_LOOK[set.id] ?? { icon: set.id, color: '#0891b2' }} next={SYNTAX_SETS[i + 1] ? { id: SYNTAX_SETS[i + 1].id, title: SYNTAX_SETS[i + 1].title } : undefined} />
}
