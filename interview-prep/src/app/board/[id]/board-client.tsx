'use client'

import dynamic from 'next/dynamic'
import type { BoardDef } from '@/data/boards'

// Excalidraw needs the DOM (canvas, fonts, IndexedDB), so it loads only in the browser.
const Whiteboard = dynamic(() => import('./whiteboard'), {
  ssr: false,
  loading: () => <div className="grid h-[calc(100dvh-3.5rem-4.25rem)] place-items-center text-sm text-muted md:h-[calc(100dvh-3.5rem)]">Loading whiteboard…</div>,
})

export function BoardClient({ def }: { def: BoardDef }) {
  return <Whiteboard def={def} />
}
