import { BookOpen, Bug, ChartNoAxesColumn, House, Infinity as InfinityIcon, Keyboard, Layers, MessageCircleQuestion, Network, PenTool, SquareTerminal } from 'lucide-react'

export const NAV = [
  { href: '/', label: 'Home', icon: House },
  { href: '/compiler', label: 'Compiler', icon: SquareTerminal },
  { href: '/campaign', label: 'Bug Hunt', icon: Bug },
  { href: '/endless', label: 'Endless', icon: InfinityIcon },
  { href: '/flashcards', label: 'Flashcards', icon: Layers },
  { href: '/typing', label: 'Typing', icon: Keyboard },
  { href: '/progress', label: 'Progress', icon: ChartNoAxesColumn },
  { href: '/questions', label: 'Questions', icon: MessageCircleQuestion },
  { href: '/notes', label: 'Notes', icon: BookOpen },
  { href: '/map', label: 'Mind map', icon: Network },
  { href: '/board', label: 'Whiteboard', icon: PenTool },
] as const

export function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}
