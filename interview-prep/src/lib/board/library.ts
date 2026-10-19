// Ready-made shapes for teaching (system design blocks and notes callouts),
// shown in Excalidraw's library sidebar. Skeletons are converted in the browser.
import type { Skeleton } from './concepts'
import { FONT } from './concepts'

const box = (label: string, stroke: string, bg: string, type: 'rectangle' | 'ellipse' | 'diamond' = 'rectangle', w = 180, h = 80): Skeleton[] => [
  { type, x: 0, y: 0, width: w, height: h, strokeColor: stroke, backgroundColor: bg, fillStyle: 'solid', strokeWidth: 2, roughness: 1, roundness: type === 'rectangle' ? { type: 3 } : null, label: { text: label, fontSize: 20, fontFamily: FONT.hand } } as Skeleton,
]

const queue = (): Skeleton[] => [
  ...[0, 1, 2, 3].map((i) => ({ type: 'rectangle', x: i * 44, y: 0, width: 40, height: 60, strokeColor: '#e67700', backgroundColor: '#fff3bf', fillStyle: 'solid', strokeWidth: 2, roughness: 1 }) as Skeleton),
  { type: 'text', x: 30, y: 70, text: 'Queue', fontSize: 20, fontFamily: FONT.hand },
]

const callout = (title: string, stroke: string, bg: string): Skeleton[] => [
  { type: 'rectangle', x: 0, y: 0, width: 360, height: 110, strokeColor: stroke, backgroundColor: bg, fillStyle: 'solid', strokeWidth: 2, roughness: 1, roundness: { type: 3 } },
  { type: 'text', x: 18, y: 14, text: title, fontSize: 22, fontFamily: FONT.hand, strokeColor: stroke },
  { type: 'text', x: 18, y: 50, text: 'Write here…', fontSize: 20, fontFamily: FONT.hand },
]

export const LIBRARY: { name: string; skeleton: Skeleton[] }[] = [
  { name: 'Client', skeleton: box('Client', '#1971c2', '#d0ebff') },
  { name: 'Server', skeleton: box('Server', '#2b8a3e', '#d3f9d8') },
  { name: 'Database', skeleton: box('Database', '#6741d9', '#e5dbff', 'ellipse', 180, 100) },
  { name: 'Cache', skeleton: box('Cache', '#c92a2a', '#ffe3e3') },
  { name: 'Load balancer', skeleton: box('LB', '#e67700', '#fff3bf', 'diamond', 140, 110) },
  { name: 'CDN', skeleton: box('CDN', '#0c8599', '#c5f6fa', 'ellipse', 160, 90) },
  { name: 'API gateway', skeleton: box('API Gateway', '#495057', '#f1f3f5', 'rectangle', 200, 70) },
  { name: 'Queue', skeleton: queue() },
  { name: 'Definition', skeleton: callout('Definition', '#6741d9', '#e5dbff') },
  { name: 'Common mistake', skeleton: callout('Common mistake', '#c92a2a', '#ffe3e3') },
  { name: 'Tip', skeleton: callout('Tip', '#2b8a3e', '#d3f9d8') },
  { name: 'Sticky note', skeleton: [{ type: 'rectangle', x: 0, y: 0, width: 200, height: 160, strokeColor: '#e67700', backgroundColor: '#ffec99', fillStyle: 'solid', strokeWidth: 1, roughness: 1 }] },
]
