import { Briefcase, BookOpen, ClipboardList, GraduationCap, Server, Bug, ChartNoAxesColumn, House, Infinity as InfinityIcon, Keyboard, Layers, ListTodo, ListChecks, MessageCircleQuestion, Network, PenTool, SquareTerminal } from 'lucide-react'

export const NAV = [
  { href: '/', label: 'Home', icon: House },
  { href: '/learn', label: 'Learn', icon: GraduationCap },
  { href: '/compiler', label: 'Compiler', icon: SquareTerminal },
  { href: '/dsa', label: 'DSA course', icon: GraduationCap },
  { href: '/system-design', label: 'System design', icon: Server },
  { href: '/assess', label: 'Company prep', icon: Briefcase },
  { href: '/tasks', label: 'Tasks', icon: ListTodo },
  { href: '/campaign', label: 'Bug Hunt', icon: Bug },
  { href: '/endless', label: 'Endless', icon: InfinityIcon },
  { href: '/flashcards', label: 'Flashcards', icon: Layers },
  { href: '/typing', label: 'Typing', icon: Keyboard },
  { href: '/progress', label: 'Progress', icon: ChartNoAxesColumn },
  { href: '/questions', label: 'Questions', icon: MessageCircleQuestion },
  { href: '/quiz', label: 'Quiz', icon: ListChecks },
  { href: '/notes', label: 'Notes', icon: BookOpen },
  { href: '/cheatsheet', label: 'Cheat sheet', icon: ClipboardList },
  { href: '/map', label: 'Mind map', icon: Network },
  { href: '/board', label: 'Whiteboard', icon: PenTool },
] as const

export function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}
