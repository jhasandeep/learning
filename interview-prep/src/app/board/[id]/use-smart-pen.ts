'use client'

import { CaptureUpdateAction, convertToExcalidrawElements } from '@excalidraw/excalidraw'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types'
import { useCallback, useEffect, useRef, useState } from 'react'
import { recognizeHandwriting } from '@/lib/board/handwriting'
import { bbox, clusterStrokes, planCluster, type Box, type Pt, type Shape } from '@/lib/board/ink'
import type { Skeleton } from '@/lib/board/concepts'

const IDLE_MS = 1100 // pause after the last stroke before it is cleaned up
const MIN_SHAPE_PX = 60 // on screen; smaller closed strokes are letters like "o"

type Stroke = Extract<ExcalidrawElement, { type: 'freedraw' }>

export interface Suggestion { id: string; box: Box; fontSize: number; color: string; candidates: string[] }

const isInk = (e: { type: string; isDeleted: boolean }): boolean => e.type === 'freedraw' && !e.isDeleted
const inkOf = (els: readonly ExcalidrawElement[], keep: (e: Stroke) => boolean = () => true) => els.filter((e) => isInk(e) && keep(e as Stroke)) as Stroke[]
const points = (e: Stroke): Pt[] => e.points.map(([x, y]) => ({ x: e.x + x, y: e.y + y }))
const fontFor = (h: number) => Math.max(18, Math.min(64, Math.round(h * 1.05)))

/** Where a line of text goes so it sits where the handwriting was. */
function textSkeleton(text: string, box: Box, fontSize: number, color: string): Skeleton {
  return { type: 'text', x: box.x, y: box.y + box.h / 2 - (fontSize * 1.25) / 2, text, fontSize, fontFamily: 5, strokeColor: color } as Skeleton
}

function shapeSkeleton(shape: Shape, color: string, strokeWidth: number, label?: { text: string; fontSize: number }): Skeleton {
  const { box } = shape
  if (shape.kind === 'line' || shape.kind === 'arrow') {
    const { from, to } = shape as Required<Shape>
    return { type: shape.kind, x: from.x, y: from.y, points: [[0, 0], [to.x - from.x, to.y - from.y]], strokeColor: color, strokeWidth, ...(shape.kind === 'arrow' ? { endArrowhead: 'arrow' } : {}) } as Skeleton
  }
  return {
    type: shape.kind, x: box.x, y: box.y, width: box.w, height: box.h, strokeColor: color, strokeWidth,
    ...(label ? { label: { text: label.text, fontSize: label.fontSize, fontFamily: 5, strokeColor: color } } : {}),
  } as Skeleton
}

/**
 * "Smart pen": scribble with the pen tool and, a moment after you stop, the ink is
 * replaced by clean text (handwriting recognition) or an exact shape.
 * Ctrl+Z brings the original strokes back.
 */
export function useSmartPen(api: ExcalidrawImperativeAPI | null, enabled: boolean, onError: (msg: string) => void) {
  const [busy, setBusy] = useState(false)
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const handled = useRef(new Set<string>())
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const running = useRef(false)
  const onErrorRef = useRef(onError)
  useEffect(() => { onErrorRef.current = onError })

  /** Replaces the given strokes (and an optional old text) with new elements, as one undo step. */
  const swap = useCallback((remove: Set<string>, skeleton: Skeleton[]) => {
    if (!api) return
    const added = convertToExcalidrawElements(skeleton)
    const next = api.getSceneElementsIncludingDeleted().map((e) =>
      remove.has(e.id) ? ({ ...e, isDeleted: true, version: e.version + 1, versionNonce: Math.floor(Math.random() * 2 ** 31), updated: Date.now() } as ExcalidrawElement) : e,
    )
    api.updateScene({ elements: [...next, ...added], captureUpdate: CaptureUpdateAction.IMMEDIATELY })
    return added
  }, [api])

  const convert = useCallback(async (strokes: Stroke[]) => {
    if (!api || strokes.length === 0 || running.current) return
    running.current = true
    setBusy(true)
    strokes.forEach((s) => handled.current.add(s.id))
    try {
      const zoom = api.getAppState().zoom.value
      const pts = strokes.map(points)
      const minSize = MIN_SHAPE_PX / zoom
      for (const idx of clusterStrokes(pts, zoom)) {
        const plan = planCluster(pts, idx, minSize)
        const color = strokes[idx[0]].strokeColor
        const width = strokes[idx[0]].strokeWidth
        const remove = new Set(idx.map((i) => strokes[i].id))
        const textPts = plan.textStrokes.map((i) => pts[i])
        let words: string[] = []
        if (textPts.length) {
          try {
            words = await recognizeHandwriting(textPts)
          } catch {
            onErrorRef.current('Could not read the handwriting (it needs an internet connection). Your strokes were kept.')
            continue
          }
        }
        const text = words[0]?.trim()
        const textBox = textPts.length ? bbox(textPts.flat()) : undefined
        const fontSize = textBox ? fontFor(textBox.h) : 20

        if (plan.shape) {
          swap(remove, [shapeSkeleton(plan.shape, color, width, text && textBox ? { text, fontSize } : undefined)])
        } else if (text && textBox) {
          const added = swap(remove, [textSkeleton(text, textBox, fontSize, color)])
          const el = added?.[0]
          if (el && words.length > 1) setSuggestion({ id: el.id, box: textBox, fontSize, color, candidates: words.slice(0, 5) })
        } else {
          onErrorRef.current('Could not read that — your strokes were kept. Try writing a bit bigger or clearer.')
        }
      }
    } finally {
      running.current = false
      setBusy(false)
    }
  }, [api, swap])

  // Watch for finished strokes while enabled.
  useEffect(() => {
    if (!api || !enabled) return
    // Anything already drawn stays as drawn.
    api.getSceneElements().forEach((e) => { if (e.type === 'freedraw') handled.current.add(e.id) })
    const off = api.onChange((elements, appState) => {
      clearTimeout(timer.current)
      if (appState.newElement?.type === 'freedraw' || appState.cursorButton === 'down') return // still drawing
      const pending = inkOf(elements, (e) => !handled.current.has(e.id))
      if (pending.length === 0) return
      timer.current = setTimeout(() => void convert(pending), IDLE_MS)
    })
    return () => { off(); clearTimeout(timer.current) }
  }, [api, enabled, convert])

  /** Clean up what is selected right now (works even when auto mode is off). */
  const convertSelection = useCallback(() => {
    if (!api) return false
    const selected = api.getAppState().selectedElementIds
    const strokes = inkOf(api.getSceneElements(), (e) => Boolean(selected[e.id]))
    if (strokes.length === 0) return false
    void convert(strokes)
    return true
  }, [api, convert])

  const pick = useCallback((text: string) => {
    if (!suggestion) return
    swap(new Set([suggestion.id]), [textSkeleton(text, suggestion.box, suggestion.fontSize, suggestion.color)])
    setSuggestion(null)
  }, [suggestion, swap])

  // The suggestion chip is only for the text just written.
  useEffect(() => {
    if (!api || !suggestion) return
    const off = api.onPointerDown(() => setSuggestion(null))
    return off
  }, [api, suggestion])

  return { busy, suggestion, pick, dismiss: () => setSuggestion(null), convertSelection }
}
