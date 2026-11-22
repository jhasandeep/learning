import type { Metadata } from 'next'
import { QUESTION_CATEGORIES, QUESTION_SETS } from '@/data/questions'
import { SPOT_BY_ID, spotKey } from '@/data/spot'
import { CampaignList, type TechHunt } from './campaign-list'

export const metadata: Metadata = { title: 'Bug Hunt campaign' }

export default function Page() {
  const techs: TechHunt[] = QUESTION_SETS.filter((s) => SPOT_BY_ID[s.id]).map((s) => ({
    id: s.id,
    title: s.title,
    category: s.category,
    color: s.color,
    badge: s.badge,
    keys: SPOT_BY_ID[s.id].bugs.map((b) => spotKey(s.id, b.id)),
    preview: SPOT_BY_ID[s.id].bugs.slice(0, 2).map((b) => b.title),
  }))
  return <CampaignList techs={techs} categories={QUESTION_CATEGORIES} />
}
