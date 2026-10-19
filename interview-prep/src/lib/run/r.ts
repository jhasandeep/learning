import type { WebR } from 'webr'
import type { RunHandlers, RunSummary } from './protocol'

// R via webR (R compiled to WebAssembly), self-hosted from /vendor/webr.
// webR runs R in its own worker; plots come back as ImageBitmaps.

const TIMEOUT_MS = 20_000
let instance: Promise<WebR> | null = null
let active: { stop: () => void } | null = null

async function boot(): Promise<WebR> {
  const url = '/vendor/webr/webr.js' // the package's browser build
  const mod = (await import(/* turbopackIgnore: true */ /* webpackIgnore: true */ url)) as typeof import('webr')
  const webR = new mod.WebR({ baseUrl: '/vendor/webr/', repoUrl: '/vendor/webr/repo/' })
  await webR.init()
  return webR
}

function toDataUrl(img: ImageBitmap): string {
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  canvas.getContext('2d')!.drawImage(img, 0, 0)
  return canvas.toDataURL('image/png')
}

export function stopR() {
  active?.stop()
}

export async function runR(code: string, handlers: RunHandlers): Promise<RunSummary> {
  if (!instance) handlers.onLoading?.('Loading R (first run downloads ~45 MB, then it is cached)…')
  instance ??= boot()
  let webR: WebR
  try {
    webR = await instance
  } catch (err) {
    instance = null
    handlers.onOutput('stderr', `Could not load R: ${err instanceof Error ? err.message : String(err)}\n`)
    return { exitCode: 1, ms: 0, signal: null }
  }

  const start = performance.now()
  return new Promise<RunSummary>((resolve) => {
    let settled = false
    const settle = (s: RunSummary) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      active = null
      resolve(s)
    }
    // R code cannot be interrupted without cross-origin isolation, so a stop
    // or timeout shuts webR down; the next run boots a fresh session.
    const kill = (signal: 'TIMEOUT' | 'STOPPED') => {
      webR.close()
      instance = null
      settle({ exitCode: null, ms: Math.round(performance.now() - start), signal })
    }
    const timer = setTimeout(() => kill('TIMEOUT'), TIMEOUT_MS)
    active = { stop: () => kill('STOPPED') }

    ;(async () => {
      const shelter = await new webR.Shelter()
      try {
        const result = await shelter.captureR(code, {
          withAutoprint: true,
          captureStreams: true,
          captureConditions: false,
          captureGraphics: { width: 640, height: 420 },
        })
        for (const item of result.output) {
          if (item.type === 'stdout' || item.type === 'stderr') handlers.onOutput(item.type, `${String(item.data)}\n`)
        }
        for (const img of result.images) handlers.onImage?.(toDataUrl(img))
        settle({ exitCode: 0, ms: Math.round(performance.now() - start), signal: null })
      } catch (err) {
        handlers.onOutput('stderr', `${err instanceof Error ? err.message : String(err)}\n`)
        settle({ exitCode: 1, ms: Math.round(performance.now() - start), signal: null })
      } finally {
        shelter.purge().catch(() => {})
      }
    })()
  })
}
