import { BookOpen, Bug, ChartNoAxesColumn, House, Infinity as InfinityIcon, Layers, PenTool, SquareTerminal } from 'lucide-react'

export const NAV = [
  { href: '/', label: 'Home', icon: House },
  { href: '/compiler', label: 'Compiler', icon: SquareTerminal },
  { href: '/campaign', label: 'Bug Hunt', icon: Bug },
  { href: '/endless', label: 'Endless', icon: InfinityIcon },
  { href: '/flashcards', label: 'Flashcards', icon: Layers },
  { href: '/progress', label: 'Progress', icon: ChartNoAxesColumn },
  { href: '/notes', label: 'Notes', icon: BookOpen },
  { href: '/board', label: 'Whiteboard', icon: PenTool },
] as const

export function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}
