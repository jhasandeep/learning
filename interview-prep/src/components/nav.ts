import { BookOpen, Bug, ChartNoAxesColumn, House, Infinity as InfinityIcon, Layers } from 'lucide-react'

export const NAV = [
  { href: '/', label: 'Home', icon: House },
  { href: '/campaign', label: 'Bug Hunt', icon: Bug },
  { href: '/endless', label: 'Endless', icon: InfinityIcon },
  { href: '/flashcards', label: 'Flashcards', icon: Layers },
  { href: '/progress', label: 'Progress', icon: ChartNoAxesColumn },
  { href: '/notes', label: 'Notes', icon: BookOpen },
] as const

export function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}
