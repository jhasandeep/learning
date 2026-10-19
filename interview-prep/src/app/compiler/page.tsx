import { ArrowUpRight, Keyboard, Link2, Save, Server, Zap } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { LangIcon } from '@/components/lang-icon'
import { LANGUAGES, type Language } from '@/data/languages'

export const metadata: Metadata = {
  title: 'Online compilers',
  description: 'Write, run and share code in 18 languages: Python, Java, C, C++, JavaScript, SQL and more.',
}

const FEATURES = [
  { icon: Zap, text: '6 run in your browser' },
  { icon: Save, text: 'Auto-saved drafts' },
  { icon: Link2, text: 'Share links' },
  { icon: Keyboard, text: 'Ctrl + Enter to run' },
]

export default function Page() {
  const browser = LANGUAGES.filter((l) => l.engine === 'browser')
  const server = LANGUAGES.filter((l) => l.engine === 'server')
  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <header className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-accent/10 blur-3xl" aria-hidden />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-medium text-accent">Online compilers</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Write and run code in {LANGUAGES.length} languages</h1>
            <p className="mt-3 max-w-xl text-sm text-muted sm:text-base">
              No setup and no sign-in. Pick a language, write code, and see the output instantly, with a stdin box for input and a link to share your code.
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {FEATURES.map((f) => (
                <li key={f.text} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2/60 px-3 py-1 text-xs text-muted">
                  <f.icon size={13} className="text-accent" /> {f.text}
                </li>
              ))}
            </ul>
            <Link href="/compiler/python" className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-medium text-white shadow-[0_10px_30px_-12px_var(--accent)] transition hover:opacity-90">
              Start with Python <ArrowUpRight size={16} />
            </Link>
          </div>
          {/* every logo, as a quick picker */}
          <nav aria-label="Pick a language" className="grid grid-cols-6 gap-2.5 justify-self-center sm:gap-3">
            {LANGUAGES.map((l, i) => (
              <Link key={l.id} href={`/compiler/${l.id}`} title={l.name} aria-label={`${l.name} compiler`} className="lang-float transition hover:-translate-y-1 hover:scale-110" style={{ animationDelay: `${(i % 6) * 120 + Math.floor(i / 6) * 200}ms` }}>
                <LangIcon lang={l} size={48} className="shadow-sm" />
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <Group title="Runs in your browser" note="Instant after the first load, and your code never leaves your device." icon={<Zap size={16} className="text-good" />} langs={browser} />
      <Group title="Compiled on the server" note="Sent to a sandboxed runner, then compiled and run with time limits." icon={<Server size={16} className="text-violet" />} langs={server} />
    </div>
  )
}

function Group({ title, note, icon, langs }: { title: string; note: string; icon: ReactNode; langs: Language[] }) {
  return (
    <section>
      <h2 className="flex items-center gap-2 text-lg font-semibold">{icon}{title}</h2>
      <p className="mb-4 text-sm text-muted">{note}</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {langs.map((l) => (
          <li key={l.id}>
            <Link href={`/compiler/${l.id}`} className="lang-card group flex h-full items-center gap-3.5 rounded-2xl border border-line bg-surface p-4 transition duration-200 hover:-translate-y-0.5" style={{ '--lang': l.color } as CSSProperties}>
              <LangIcon lang={l} size={52} className="transition group-hover:scale-105" />
              <span className="relative min-w-0 flex-1">
                <span className="block truncate font-semibold">{l.name}</span>
                <span className="block truncate font-mono text-xs text-muted">{l.file}</span>
              </span>
              <ArrowUpRight size={16} className="relative shrink-0 text-muted opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" style={{ color: l.color }} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
