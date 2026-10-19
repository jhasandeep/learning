import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LANGUAGES, LANGUAGES_BY_ID } from '@/data/languages'
import { Workspace } from './workspace'

export function generateStaticParams() {
  return LANGUAGES.map((l) => ({ lang: l.id }))
}

export async function generateMetadata({ params }: PageProps<'/compiler/[lang]'>): Promise<Metadata> {
  const { lang } = await params
  const l = LANGUAGES_BY_ID[lang]
  return l
    ? { title: `Online ${l.name} Compiler`, description: `Write, run and share ${l.name} code online${l.engine === 'browser' ? ' — runs right in your browser' : ''}.` }
    : { title: 'Compiler' }
}

export default async function Page({ params }: PageProps<'/compiler/[lang]'>) {
  const { lang } = await params
  if (!LANGUAGES_BY_ID[lang]) notFound()
  return <Workspace key={lang} langId={lang} />
}
