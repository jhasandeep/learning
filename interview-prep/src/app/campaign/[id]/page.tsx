import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CAMPAIGN, CAMPAIGN_BY_ID } from '@/data/campaign'
import { CampaignPlay } from './campaign-play'

export function generateStaticParams() {
  return CAMPAIGN.map((l) => ({ id: l.id }))
}

export async function generateMetadata({ params }: PageProps<'/campaign/[id]'>): Promise<Metadata> {
  const { id } = await params
  return { title: CAMPAIGN_BY_ID[id]?.title ?? 'Level' }
}

export default async function Page({ params }: PageProps<'/campaign/[id]'>) {
  const { id } = await params
  if (!CAMPAIGN_BY_ID[id]) notFound()
  // key: a fresh play screen (editor, timer, hints) for every level
  return <CampaignPlay key={id} id={id} />
}
