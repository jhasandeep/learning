import { Server, Zap } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { LangBadge } from '@/components/lang-badge'
import { LANGUAGES } from '@/data/languages'

export const metadata: Metadata = {
  title: 'Online compilers',
  description: 'Write, run and share code in 18 languages: Python, Java, C, C++, JavaScript, SQL and more.',
}

export default function Page() {
  const browser = LANGUAGES.filter((l) => l.engine === 'browser')
  const server = LANGUAGES.filter((l) => l.engine === 'server')
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <p className="text-sm font-medium text-accent">Online compilers</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Write and run code in {LANGUAGES.length} languages</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          No setup, no sign-in. Code is saved in your browser as you type, input goes in the stdin box, and you can share a link to your code.
          Press <kbd className="rounded border border-line-strong px-1 font-mono text-xs">Ctrl</kbd> + <kbd className="rounded border border-line-strong px-1 font-mono text-xs">Enter</kbd> to run.
        </p>
      </header>

      <Group title="Runs in your browser" note="Instant after the first load — your code never leaves your device." icon={<Zap size={16} className="text-good" />} langs={browser} />
      <Group title="Compiled on the server" note="Sent to a sandboxed runner, compiled and executed with time limits." icon={<Server size={16} className="text-violet" />} langs={server} />
    </div>
  )
}

function Group({ title, note, icon, langs }: { title: string; note: string; icon: React.ReactNode; langs: typeof LANGUAGES }) {
  return (
    <section>
      <h2 className="flex items-center gap-2 font-semibold">{icon}{title}</h2>
      <p className="mb-3 text-sm text-muted">{note}</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {langs.map((l) => (
          <li key={l.id}>
            <Link href={`/compiler/${l.id}`} className="group flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition hover:-translate-y-0.5 hover:border-line-strong">
              <LangBadge lang={l} size={40} />
              <span className="min-w-0">
                <span className="block truncate font-medium group-hover:underline">{l.name}</span>
                <span className="block font-mono text-xs text-muted">{l.file}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
