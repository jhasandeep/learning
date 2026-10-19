'use client'

import { ArrowRight, BookOpen, Bug, Flame, Infinity as InfinityIcon, Layers, Minus, Plus, SquareTerminal, Target } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { buttonClass, Card, cx, ProgressBar, Ring } from '@/components/ui'
import { ALGORITHMS } from '@/data/algorithms'
import { CAMPAIGN } from '@/data/campaign'
import { ALL_CARDS } from '@/data/decks'
import { LANGUAGES } from '@/data/languages'
import { ENDLESS_COUNT, nextUnsolved } from '@/lib/endless'
import { dayStreak, levelFromXp, setDailyGoal, useProgress } from '@/lib/progress'
import { isDue } from '@/lib/srs'
import { useToday } from '@/lib/today'

export function Dashboard() {
  const p = useProgress()
  const today = useToday()
  const lv = levelFromXp(p.xp)
  const streak = dayStreak(p.activity, today)
  const doneToday = p.activity[today] ?? 0
  const campaignSolved = CAMPAIGN.filter((l) => p.campaign[l.id]).length
  const nextLevel = CAMPAIGN.find((l) => !p.campaign[l.id])
  const nextLevelIndex = nextLevel ? CAMPAIGN.indexOf(nextLevel) + 1 : 0
  const endlessSolved = Object.keys(p.endless.solved).length
  const resume = nextUnsolved(p.endless.solved, p.endless.last + 1)
  const due = ALL_CARDS.filter((c) => isDue(p.cards[c.id], today)).length
  const isNew = p.xp === 0 && p.reviews === 0

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-10">
        <div className="absolute -right-24 -top-24 size-80 rounded-full bg-accent/15 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 left-1/3 size-72 rounded-full bg-violet/10 blur-3xl" aria-hidden />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-medium text-accent">{isNew ? 'Welcome to PrepArena' : `Level ${lv.level} · ${p.xp} XP`}</p>
            <h1 className="mt-2 max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Learn DSA the way interviews test it — <span className="text-accent">by fixing broken code.</span>
            </h1>
            <p className="mt-4 max-w-xl text-muted">
              Real code runs in your browser against real tests. Hints when you are stuck, a clear explanation and diff when you are done, and spaced-repetition flashcards so the answers stick.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {nextLevel ? (
                <Link href={`/campaign/${nextLevel.id}`} className={buttonClass('primary')}>
                  {campaignSolved === 0 ? 'Start the campaign' : `Continue · level ${nextLevelIndex}`} <ArrowRight size={16} />
                </Link>
              ) : (
                <Link href={`/endless/${resume}`} className={buttonClass('primary')}>Endless #{resume} <ArrowRight size={16} /></Link>
              )}
              <Link href="/flashcards" className={buttonClass('secondary')}>
                <Layers size={16} /> {due > 0 ? `${due} cards due` : 'Flashcards'}
              </Link>
            </div>
          </div>

          <Card className="w-full bg-surface-2/50 p-5 lg:w-72">
            <div className="flex items-center gap-4">
              <Ring value={doneToday / p.dailyGoal} size={76} color={doneToday >= p.dailyGoal ? 'var(--good)' : 'var(--accent)'}>
                {Math.min(doneToday, p.dailyGoal)}/{p.dailyGoal}
              </Ring>
              <div>
                <p className="font-semibold">Daily goal</p>
                <p className="text-sm text-muted">{doneToday >= p.dailyGoal ? 'Done for today 🎉' : `${p.dailyGoal - doneToday} more to go`}</p>
                <div className="mt-2 flex items-center gap-1">
                  <button type="button" className="grid size-6 place-items-center rounded-md border border-line text-muted hover:text-text" onClick={() => setDailyGoal(p.dailyGoal - 1)} aria-label="Lower daily goal"><Minus size={12} /></button>
                  <button type="button" className="grid size-6 place-items-center rounded-md border border-line text-muted hover:text-text" onClick={() => setDailyGoal(p.dailyGoal + 1)} aria-label="Raise daily goal"><Plus size={12} /></button>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-sm">
              <span className="flex items-center gap-1.5 text-warn"><Flame size={16} /> {streak}-day streak</span>
              <Link href="/progress" className="text-muted hover:text-text">Stats →</Link>
            </div>
          </Card>
        </div>
      </section>

      <section aria-label="Modes" className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <ModeCard
          href={nextLevel ? `/campaign/${nextLevel.id}` : '/campaign'}
          icon={<Bug size={20} />} color="var(--accent)" title="Bug Hunt"
          text="Hand-made levels that teach one pattern each, ending in a two-bug boss."
          footer={<><ProgressBar value={campaignSolved / CAMPAIGN.length} className="w-24" /><span>{campaignSolved}/{CAMPAIGN.length}</span></>}
          tag={campaignSolved === 0 ? 'Start here' : undefined}
        />
        <ModeCard
          href={`/endless/${resume}`} icon={<InfinityIcon size={20} />} color="var(--warn)" title="Endless"
          text={`${ENDLESS_COUNT} verified bugs injected into ${ALGORITHMS.length} classic algorithms. Build a streak.`}
          footer={<span><Flame size={12} className="mr-1 inline" />streak {p.endless.streak} · best {p.endless.best} · {endlessSolved} fixed</span>}
        />
        <ModeCard
          href="/flashcards" icon={<Layers size={20} />} color="var(--violet)" title="Flashcards"
          text={`${ALL_CARDS.length} interview questions on system design, DSA, React and JS with spaced repetition.`}
          footer={<span>{due > 0 ? `${due} due today` : 'Nothing due — learn new cards'}</span>}
        />
        <ModeCard
          href="/compiler" icon={<SquareTerminal size={20} />} color="var(--accent)" title="Online compiler"
          text={`Write and run code in ${LANGUAGES.length} languages — Python, Java, C++, SQL, JS and more. Share with a link.`}
          footer={<span>{LANGUAGES.filter((l) => l.engine === 'browser').length} run right in your browser</span>}
          tag="New"
        />
        <ModeCard
          href="/notes" icon={<BookOpen size={20} />} color="var(--good)" title="Revision notes"
          text="Handwritten-style PDFs for system design and DSA (Python + JS) to read before a round."
          footer={<span>3 PDFs</span>}
        />
      </section>

      <section aria-label="How it works" className="grid gap-4 md:grid-cols-3">
        {[
          ['1', 'Read the ticket', 'Each level describes the symptom and shows the test cases, like a real bug report.'],
          ['2', 'Debug & run', 'Edit the code, add console.log, run the tests with Ctrl + Enter. Infinite loops are cut off safely.'],
          ['3', 'Learn the why', 'See the explanation and a diff of the fix, earn XP, and move on to the next pattern.'],
        ].map(([n, title, text]) => (
          <Card key={n} className="flex gap-4 p-5">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent/10 text-sm font-semibold text-accent">{n}</span>
            <div>
              <h2 className="font-medium">{title}</h2>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </div>
          </Card>
        ))}
      </section>

      <section aria-label="What's inside" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [CAMPAIGN.length, 'campaign levels'],
          [ENDLESS_COUNT, 'verified endless bugs'],
          [ALGORITHMS.length, 'algorithms'],
          [ALL_CARDS.length, 'flashcards'],
        ].map(([v, l]) => (
          <div key={l} className="rounded-2xl border border-line bg-surface/60 px-4 py-4 text-center">
            <div className="text-2xl font-semibold"><Target size={14} className="mr-1 inline text-accent" />{v}</div>
            <div className="text-xs text-muted">{l}</div>
          </div>
        ))}
      </section>
    </div>
  )
}

function ModeCard({ href, icon, color, title, text, footer, tag }: { href: string; icon: ReactNode; color: string; title: string; text: string; footer: ReactNode; tag?: string }) {
  return (
    <Link href={href} className="group relative flex flex-col rounded-2xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-line-strong">
      {tag && <span className="absolute right-4 top-4 rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ color, background: `color-mix(in srgb, ${color} 15%, transparent)` }}>{tag}</span>}
      <span className="grid size-10 place-items-center rounded-xl" style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}>{icon}</span>
      <h2 className="mt-4 font-semibold group-hover:underline">{title}</h2>
      <p className="mt-1 flex-1 text-sm text-muted">{text}</p>
      <div className={cx('mt-4 flex items-center gap-2 text-xs text-muted')}>{footer}</div>
    </Link>
  )
}
