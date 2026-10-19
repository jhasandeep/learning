import type { Metadata } from 'next'
import { EndlessHome } from './endless-home'

export const metadata: Metadata = { title: 'Endless mode' }

export default function Page() {
  return <EndlessHome />
}
