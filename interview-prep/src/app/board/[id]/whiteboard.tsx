'use client'

import { CaptureUpdateAction, convertToExcalidrawElements, Excalidraw, MainMenu, WelcomeScreen } from '@excalidraw/excalidraw'
import type { BinaryFiles, ExcalidrawImperativeAPI, LibraryItems } from '@excalidraw/excalidraw/types'
import type { ExcalidrawElement, ExcalidrawFrameLikeElement } from '@excalidraw/excalidraw/element/types'
import { BookOpen, ChevronLeft, ChevronRight, FileDown, FileUp, Loader2, MonitorPlay, MousePointer2, RotateCcw, Wand2, X } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import '@excalidraw/excalidraw/index.css'
import { useTheme } from '@/components/theme-toggle'
import { useToast } from '@/components/toast'
import { cx } from '@/components/ui'
import type { BoardDef } from '@/data/boards'
import { NOTE_TOPICS_BY_ID } from '@/data/notes'
import { SLIDE, topicBoard, type Skeleton } from '@/lib/board/concepts'
import { LIBRARY } from '@/lib/board/library'
import { boardToPdf, framesInOrder, pdfToScene } from '@/lib/board/pdf'
import { deleteBoard, loadBoard, saveBoard } from '@/lib/board/store'

// Excalidraw's hand-drawn fonts are self-hosted (copied by scripts/vendor-runtimes.mjs).
if (typeof window !== 'undefined') (window as unknown as { EXCALIDRAW_ASSET_PATH: string }).EXCALIDRAW_ASSET_PATH = '/vendor/excalidraw/'

interface Scene {
  elements: readonly ExcalidrawElement[]
  files: BinaryFiles
  viewBackgroundColor: string
  /** A generated board, built once Excalidraw's fonts are loaded (see buildWithFonts). */
  build?: Skeleton[]
}

async function fetchPdf(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`)
  return res.arrayBuffer()
}

/** The board's starting scene: the saved copy, or a freshly generated one. */
async function initialScene(def: BoardDef, onProgress: (msg: string) => void): Promise<Scene> {
  const saved = await loadBoard(def.id).catch(() => undefined)
  if (saved) return { elements: saved.elements as ExcalidrawElement[], files: saved.files as BinaryFiles, viewBackgroundColor: saved.viewBackgroundColor ?? '#ffffff' }
  if (def.kind === 'topic') {
    return { elements: [], files: {}, viewBackgroundColor: '#ffffff', build: topicBoard(NOTE_TOPICS_BY_ID[def.topicId]) }
  }
  if (def.kind === 'pdf') {
    onProgress('Downloading PDF…')
    const pdf = await pdfToScene(await fetchPdf(def.pdf), SLIDE.x, SLIDE.y, def.title, (n, total) => onProgress(`Rendering page ${n} of ${total}…`))
    return { elements: convertToExcalidrawElements(pdf.skeleton), files: Object.fromEntries(pdf.files.map((f) => [f.id, f])), viewBackgroundColor: '#ffffff' }
  }
  return { elements: [], files: {}, viewBackgroundColor: '#ffffff' }
}

/**
 * Text is measured when the skeleton is converted, so the hand-drawn fonts must
 * be loaded first or every line is sized for a fallback font and gets clipped.
 * Excalidraw registers its font faces when it mounts; wait for them, then load
 * the glyph ranges this board uses.
 */
async function buildWithFonts(skeleton: Skeleton[]) {
  for (let i = 0; i < 50 && ![...document.fonts].some((f) => f.family.includes('Excalifont')); i++) {
    await new Promise((r) => setTimeout(r, 100))
  }
  const text = skeleton.flatMap((e) => (e.type === 'text' ? [e.text] : 'label' in e && e.label ? [e.label.text] : [])).join(' ')
  await Promise.all([document.fonts.load('20px Excalifont', text), document.fonts.load('15px Cascadia', text)]).catch(() => {})
  return convertToExcalidrawElements(skeleton)
}

function libraryItems(): LibraryItems {
  return LIBRARY.map((item, i) => ({
    id: `prep-${i}`,
    name: item.name,
    status: 'published' as const,
    created: 1,
    elements: convertToExcalidrawElements(item.skeleton, { regenerateIds: true }),
  }))
}

export default function Whiteboard({ def }: { def: BoardDef }) {
  const [nonce, setNonce] = useState(0) // bumped by "Reset" to rebuild the board
  return <Board key={nonce} def={def} onReset={() => setNonce((n) => n + 1)} />
}

function Board({ def, onReset }: { def: BoardDef; onReset: () => void }) {
  const theme = useTheme()
  const toast = useToast()
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null)
  const [scene, setScene] = useState<Scene | null>(null)
  const [loading, setLoading] = useState('Loading board…')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [saved, setSaved] = useState<'saved' | 'saving' | 'error'>('saved')
  const [slides, setSlides] = useState<ExcalidrawFrameLikeElement[] | null>(null)
  const [slide, setSlide] = useState(0)
  const [built, setBuilt] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const lastVersion = useRef(-1)

  useEffect(() => {
    let live = true
    initialScene(def, (m) => live && setLoading(m))
      .then((s) => {
        if (!live) return
        setScene(s)
        // Persist rendered PDF boards right away so a big PDF is rendered only once.
        if (def.kind === 'pdf') void saveBoard(def.id, { elements: s.elements, files: s.files, viewBackgroundColor: s.viewBackgroundColor, updatedAt: Date.now() })
      })
      .catch((e: unknown) => live && setError(e instanceof Error ? e.message : String(e)))
    return () => { live = false }
  }, [def])

  useEffect(() => {
    if (!api || !scene?.build) return
    let live = true
    void buildWithFonts(scene.build).then((elements) => {
      if (!live) return
      api.updateScene({ elements, captureUpdate: CaptureUpdateAction.NEVER })
      setBuilt(true)
      const cover = framesInOrder(elements)[0]
      api.scrollToContent(cover ?? elements, { fitToViewport: true, viewportZoomFactor: 0.9 })
      void saveBoard(def.id, { elements, files: {}, viewBackgroundColor: scene.viewBackgroundColor, updatedAt: Date.now() })
    })
    return () => { live = false }
  }, [api, scene, def.id])

  // The scene is fully on the canvas (the PDF export script waits for this).
  const ready = Boolean(api && scene && (!scene.build || built))

  const initialData = useMemo(
    () => scene && { elements: scene.elements, files: scene.files, appState: { viewBackgroundColor: scene.viewBackgroundColor, currentItemFontFamily: 5 }, libraryItems: libraryItems(), scrollToContent: true },
    [scene],
  )

  const onChange = useCallback((elements: readonly ExcalidrawElement[], appState: { viewBackgroundColor: string }, files: BinaryFiles) => {
    const version = elements.reduce((n, e) => n + e.version, 0)
    if (version === lastVersion.current) return
    const first = lastVersion.current === -1
    lastVersion.current = version
    if (first) return
    setSaved('saving')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const live = elements.filter((e) => !e.isDeleted)
      const used = new Set<string>(live.flatMap((e) => (e.type === 'image' && e.fileId ? [e.fileId] : [])))
      const keep = Object.fromEntries(Object.entries(files).filter(([id]) => used.has(id)))
      saveBoard(def.id, { elements: live, files: keep, viewBackgroundColor: appState.viewBackgroundColor, updatedAt: Date.now() })
        .then(() => setSaved('saved'))
        .catch(() => setSaved('error'))
    }, 700)
  }, [def.id])

  /** Appends a PDF below everything on the board, one frame per page. */
  const addPdf = async (data: ArrayBuffer, name: string) => {
    if (!api) return
    const existing = api.getSceneElements()
    const bottom = existing.reduce((m, e) => Math.max(m, e.y + e.height), SLIDE.y - 300)
    const pdf = await pdfToScene(data, SLIDE.x + 20, bottom + 300, name, (n, total) => setBusy(`Importing page ${n} of ${total}…`))
    api.addFiles(pdf.files)
    const added = convertToExcalidrawElements(pdf.skeleton)
    api.updateScene({ elements: [...existing, ...added], captureUpdate: CaptureUpdateAction.IMMEDIATELY })
    const firstFrame = added.find((e) => e.type === 'frame')
    if (firstFrame) api.scrollToContent(firstFrame, { fitToViewport: true, viewportZoomFactor: 0.9, animate: true })
    toast(`Added ${pdf.files.length} page${pdf.files.length === 1 ? '' : 's'} from ${name}`, 'good')
  }

  const run = async (label: string, task: () => Promise<void>) => {
    setBusy(label)
    try {
      await task()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Something went wrong', 'bad')
    } finally {
      setBusy('')
    }
  }

  const importFile = (file: File) => run('Reading PDF…', async () => addPdf(await file.arrayBuffer(), file.name.replace(/\.pdf$/i, '')))
  const importNotesPdf = () => def.kind === 'topic' && run('Downloading notes PDF…', async () => addPdf(await fetchPdf(`/notes/${def.topicId}.pdf`), `${def.title} notes`))

  const exportPdf = () => api && run('Exporting PDF…', async () => {
    const blob = await boardToPdf(api, `${def.title} — PrepArena board`, (n, total) => setBusy(`Exporting slide ${n} of ${total}…`))
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${def.id}-board.pdf`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  })

  const reset = async () => {
    const what = def.kind === 'sketch' ? 'clear your sketchbook' : 'discard your drawings and rebuild this board'
    if (!window.confirm(`This will ${what}. Continue?`)) return
    clearTimeout(saveTimer.current)
    await deleteBoard(def.id).catch(() => {})
    onReset()
  }

  // ---- presenting: frames are slides ----
  const show = useCallback((frames: ExcalidrawFrameLikeElement[], i: number) => {
    const at = Math.max(0, Math.min(frames.length - 1, i))
    setSlide(at)
    api?.scrollToContent(frames[at], { fitToViewport: true, viewportZoomFactor: 0.96, animate: true, duration: 250 })
  }, [api])

  const present = async () => {
    if (!api) return
    const frames = framesInOrder(api.getSceneElements())
    if (frames.length === 0) {
      toast('Add a frame (F key) around something to make a slide', 'info')
      return
    }
    setSlides(frames)
    api.updateScene({ appState: { zenModeEnabled: true } })
    await wrapRef.current?.requestFullscreen?.().catch(() => {})
    setTimeout(() => show(frames, 0), 120)
  }

  const stopPresenting = useCallback(() => {
    setSlides(null)
    api?.updateScene({ appState: { zenModeEnabled: false } })
    api?.setActiveTool({ type: 'selection' })
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
  }, [api])

  useEffect(() => {
    if (!slides || !api) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('textarea, input')) return
      if (Object.keys(api.getAppState().selectedElementIds).length) return // arrows move the selection
      const next = e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown'
      const prev = e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp'
      if (!next && !prev) return
      e.preventDefault()
      e.stopPropagation()
      show(slides, slide + (next ? 1 : -1))
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [slides, slide, api, show])

  const btn = 'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-xs font-medium text-text transition hover:border-line-strong disabled:opacity-50'

  return (
    <div ref={wrapRef} data-board-ready={ready || undefined} className="board-wrap flex h-[calc(100dvh-3.5rem-4.25rem)] flex-col bg-bg md:h-[calc(100dvh-3.5rem)]">
      <div className={cx('flex items-center gap-2 overflow-x-auto border-b border-line px-3 py-2', slides && 'hidden')}>
        <Link href="/board" className="inline-flex shrink-0 items-center gap-1 text-sm text-muted hover:text-text"><ChevronLeft size={16} /> Boards</Link>
        <span className="text-muted">/</span>
        <h1 className="shrink-0 truncate text-sm font-semibold">{def.title}</h1>
        <span className={cx('shrink-0 text-xs', saved === 'error' ? 'text-bad' : 'text-muted')} aria-live="polite">
          {saved === 'saving' ? 'Saving…' : saved === 'error' ? 'Not saved' : 'Saved in this browser'}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          {busy && <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted"><Loader2 size={14} className="animate-spin" /> {busy}</span>}
          {def.kind === 'topic' && <Link href={`/notes/${def.topicId}`} className={btn} title="Open the written notes"><BookOpen size={14} /> <span className="hidden sm:inline">Notes</span></Link>}
          {def.kind === 'topic' && <button type="button" className={btn} onClick={importNotesPdf} disabled={!api || Boolean(busy)} title="Add the handwritten notes PDF as slides below"><Wand2 size={14} /> <span className="hidden sm:inline">Add notes PDF</span></button>}
          <button type="button" className={btn} onClick={() => fileRef.current?.click()} disabled={!api || Boolean(busy)} title="Import a PDF: every page becomes a slide you can draw on"><FileUp size={14} /> <span className="hidden sm:inline">Import PDF</span></button>
          <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void importFile(f) }} />
          <button type="button" className={btn} onClick={present} disabled={!api} title="Present the frames as slides (arrow keys)"><MonitorPlay size={14} /> <span className="hidden sm:inline">Present</span></button>
          <button type="button" className={cx(btn, 'border-accent/40 text-accent')} onClick={exportPdf} disabled={!api || Boolean(busy)} title="Download the board as a PDF, one page per frame"><FileDown size={14} /> <span className="hidden sm:inline">Export PDF</span></button>
          <button type="button" className={btn} onClick={reset} title={def.kind === 'sketch' ? 'Clear the board' : 'Rebuild this board from the notes'}><RotateCcw size={14} /> <span className="hidden lg:inline">Reset</span></button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {initialData ? (
          <Excalidraw
            excalidrawAPI={setApi}
            initialData={initialData}
            onChange={onChange}
            theme={theme}
            name={def.title}
            UIOptions={{ canvasActions: { toggleTheme: false, saveToActiveFile: false } }}
          >
            <MainMenu>
              <MainMenu.DefaultItems.LoadScene />
              <MainMenu.DefaultItems.Export />
              <MainMenu.DefaultItems.SaveAsImage />
              <MainMenu.DefaultItems.SearchMenu />
              <MainMenu.DefaultItems.Help />
              <MainMenu.DefaultItems.ClearCanvas />
              <MainMenu.Separator />
              <MainMenu.DefaultItems.ChangeCanvasBackground />
            </MainMenu>
            {def.kind === 'sketch' && (
              <WelcomeScreen>
                <WelcomeScreen.Hints.MenuHint />
                <WelcomeScreen.Hints.ToolbarHint />
                <WelcomeScreen.Hints.HelpHint />
                <WelcomeScreen.Center>
                  <WelcomeScreen.Center.Heading>Explain it to learn it. Draw anything, or import a PDF to teach from.</WelcomeScreen.Center.Heading>
                  <WelcomeScreen.Center.Menu>
                    <WelcomeScreen.Center.MenuItem onSelect={() => fileRef.current?.click()} icon={<FileUp size={16} />}>Import a PDF</WelcomeScreen.Center.MenuItem>
                    <WelcomeScreen.Center.MenuItemHelp />
                  </WelcomeScreen.Center.Menu>
                </WelcomeScreen.Center>
              </WelcomeScreen>
            )}
          </Excalidraw>
        ) : (
          <div className="grid h-full place-items-center text-sm text-muted">
            {error ? <p className="text-bad">{error}</p> : <p className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> {loading}</p>}
          </div>
        )}

        {slides && (
          <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center">
            <div className="flex items-center gap-1 rounded-xl border border-line bg-surface/95 p-1.5 shadow-lg backdrop-blur">
              <button type="button" className={btn} onClick={() => show(slides, slide - 1)} disabled={slide === 0} aria-label="Previous slide"><ChevronLeft size={16} /></button>
              <span className="min-w-28 px-2 text-center text-xs text-muted">
                <span className="font-medium text-text">{slide + 1}</span> / {slides.length} · {slides[slide]?.name}
              </span>
              <button type="button" className={btn} onClick={() => show(slides, slide + 1)} disabled={slide === slides.length - 1} aria-label="Next slide"><ChevronRight size={16} /></button>
              <button type="button" className={btn} onClick={() => api?.setActiveTool({ type: 'laser' })} title="Laser pointer (K)"><MousePointer2 size={14} /> Laser</button>
              <button type="button" className={btn} onClick={() => api?.setActiveTool({ type: 'freedraw' })} title="Pen (P)">Pen</button>
              <button type="button" className={btn} onClick={stopPresenting} aria-label="Stop presenting"><X size={14} /> Exit</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
