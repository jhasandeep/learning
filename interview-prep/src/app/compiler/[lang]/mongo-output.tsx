'use client'

import { Database } from 'lucide-react'
import { cx } from '@/components/ui'
import type { MongoCollectionInfo, MongoStep, Stream } from '@/lib/run/protocol'

export interface MongoView { steps: MongoStep[]; collections: MongoCollectionInfo[] }

/** Results of a MongoDB run: one card per statement (like mongosh), then the collections in the database. */
export function MongoOutput({ mongo, errors }: { mongo: MongoView | null; errors: { stream: Stream; text: string }[] }) {
  return (
    <div className="space-y-3">
      {errors.length > 0 && (
        <pre className="whitespace-pre-wrap break-words font-mono text-[13px] text-bad">{errors.map((c) => c.text).join('')}</pre>
      )}
      {!mongo || mongo.steps.length === 0 ? (
        errors.length === 0 && <p className="font-mono text-sm text-muted">Press Run to execute your queries.</p>
      ) : (
        mongo.steps.map((s, i) => (
          <div key={i} className={cx('overflow-hidden rounded-xl border', s.kind === 'error' ? 'border-bad/40 bg-bad/5' : 'border-line')}>
            {s.code && (
              <p className="border-b border-line bg-surface-2/60 px-3 py-1.5 font-mono text-[11px] leading-snug text-muted">
                <span className="mr-1.5 text-accent">›</span>
                <span className="whitespace-pre-wrap break-words">{s.code}</span>
              </p>
            )}
            <pre className={cx('overflow-x-auto whitespace-pre px-3 py-2 font-mono text-[12.5px] leading-relaxed', s.kind === 'error' && 'text-bad', s.kind === 'info' && 'text-good')}>{s.text}</pre>
          </div>
        ))
      )}
      {mongo && mongo.collections.length > 0 && (
        <details className="rounded-xl border border-line" open>
          <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-medium text-muted"><Database size={13} /> Collections in the database</summary>
          <ul className="grid gap-2 p-3 pt-0 sm:grid-cols-2">
            {mongo.collections.map((c) => (
              <li key={c.name} className="rounded-lg bg-surface-2/60 px-3 py-2 font-mono text-xs">
                <b>{c.name}</b> <span className="text-muted">({c.count} document{c.count === 1 ? '' : 's'}, {c.indexes} index{c.indexes === 1 ? '' : 'es'})</span>
                <div className="mt-1 text-muted">{c.fields.join(', ') || 'empty'}</div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
