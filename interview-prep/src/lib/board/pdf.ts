// PDF in and out of a board.
//  - import: each PDF page is rendered with pdf.js to an image and placed in its
//    own frame, so a lecture PDF becomes slides you can draw on;
//  - export: each frame (slide) becomes one PDF page; a board without frames
//    becomes a single page.
import type { ExcalidrawImperativeAPI, BinaryFileData, DataURL } from '@excalidraw/excalidraw/types'
import type { ExcalidrawElement, ExcalidrawFrameLikeElement, FileId } from '@excalidraw/excalidraw/element/types'
import type { Skeleton } from './concepts'

const PAGE_W = 1100 // scene width of an imported page
const RENDER_SCALE = 1.6 // pdf.js render scale, for sharp text when zoomed in
const EXPORT_PX = 1600 // pixel width of an exported slide

export interface PdfScene {
  files: BinaryFileData[]
  skeleton: Skeleton[]
}

/** Renders a PDF to images, laid out top to bottom from (x, y), one frame per page. */
export async function pdfToScene(data: ArrayBuffer, x: number, y: number, name: string, onPage?: (done: number, total: number) => void): Promise<PdfScene> {
  // The legacy build polyfills recent JS (e.g. Map.getOrInsertComputed) that many browsers still lack.
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  pdfjs.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.mjs'
  const task = pdfjs.getDocument({ data })
  const doc = await task.promise
  const files: BinaryFileData[] = []
  const skeleton: Skeleton[] = []
  const stamp = Date.now()
  try {
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n)
      const viewport = page.getViewport({ scale: RENDER_SCALE })
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      await page.render({ canvas, viewport, background: '#ffffff' }).promise
      const id = `pdf-${stamp}-${n}` as FileId
      files.push({ id, mimeType: 'image/jpeg', dataURL: canvas.toDataURL('image/jpeg', 0.85) as DataURL, created: stamp })
      const h = Math.round((PAGE_W * canvas.height) / canvas.width)
      const imageId = `${id}-img`
      skeleton.push(
        { type: 'image', id: imageId, x, y, width: PAGE_W, height: h, fileId: id, status: 'saved' },
        { type: 'frame', id: `${id}-frame`, name: `${name} · page ${n}`, children: [imageId], x: x - 20, y: y - 20, width: PAGE_W + 40, height: h + 40 },
      )
      y += h + 160
      page.cleanup()
      onPage?.(n, doc.numPages)
    }
  } finally {
    await task.destroy()
  }
  return { files, skeleton }
}

/** Frames in reading order: top to bottom, then left to right. */
export function framesInOrder(elements: readonly ExcalidrawElement[]): ExcalidrawFrameLikeElement[] {
  return elements
    .filter((e): e is ExcalidrawFrameLikeElement => !e.isDeleted && (e.type === 'frame' || e.type === 'magicframe'))
    .sort((a, b) => (Math.abs(a.y - b.y) > 40 ? a.y - b.y : a.x - b.x))
}

/** Exports the board as a PDF: one page per frame (or the whole board when there are none). */
export async function boardToPdf(api: ExcalidrawImperativeAPI, title: string, onPage?: (done: number, total: number) => void): Promise<Blob> {
  const [{ exportToBlob }, { PDFDocument }] = await Promise.all([import('@excalidraw/excalidraw'), import('pdf-lib')])
  const elements = api.getSceneElements()
  const files = api.getFiles()
  const appState = { exportBackground: true, exportWithDarkMode: false, viewBackgroundColor: api.getAppState().viewBackgroundColor || '#ffffff' }
  const frames = framesInOrder(elements)
  const slides: (ExcalidrawFrameLikeElement | null)[] = frames.length ? frames : [null]

  const pdf = await PDFDocument.create()
  pdf.setTitle(title)
  pdf.setCreator('PrepArena whiteboard')
  for (const [i, frame] of slides.entries()) {
    const blob = await exportToBlob({
      elements,
      files,
      appState,
      exportingFrame: frame,
      exportPadding: frame ? 0 : 40,
      mimeType: 'image/jpeg',
      quality: 0.82,
      getDimensions: (w: number, h: number) => {
        const scale = Math.min(EXPORT_PX / w, 3)
        return { width: Math.round(w * scale), height: Math.round(h * scale), scale }
      },
    })
    const img = await pdf.embedJpg(await blob.arrayBuffer())
    const width = 842 // A4 landscape width in points; height follows the slide
    const height = (width * img.height) / img.width
    pdf.addPage([width, height]).drawImage(img, { x: 0, y: 0, width, height })
    onPage?.(i + 1, slides.length)
  }
  const bytes = await pdf.save()
  return new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' })
}
