import { diffLines } from '@/lib/diff'
import { cx } from './ui'

export function DiffView({ before, after }: { before: string; after: string }) {
  const lines = diffLines(before, after)
  return (
    <pre className="overflow-x-auto rounded-xl border border-line bg-code py-3 font-mono text-[13px] leading-6" aria-label="Diff between the buggy code and the fix">
      {lines.map((l, i) => (
        <div
          key={i}
          className={cx(
            'px-4',
            l.type === 'add' && 'bg-good/10 text-good',
            l.type === 'del' && 'bg-bad/10 text-bad line-through decoration-bad/40',
          )}
        >
          <span className="mr-3 inline-block w-3 select-none opacity-60">{l.type === 'add' ? '+' : l.type === 'del' ? '−' : ' '}</span>
          {l.text || ' '}
        </div>
      ))}
    </pre>
  )
}
