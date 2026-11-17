import { bbox, type Pt } from './ink'

// Handwriting → text. Browsers have no built-in recogniser, so the strokes are
// sent to Google's public Input Tools handwriting service (the one behind Google
// Keyboard / Search handwriting). It is tried straight from the browser first and,
// if that is blocked (CORS, offline proxy…), through our own /api/handwriting route.

const ENDPOINT = 'https://inputtools.google.com/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8'

export function buildRequest(strokes: Pt[][]) {
  const box = bbox(strokes.flat())
  const ink = strokes.map((s) => {
    const xs: number[] = [], ys: number[] = [], ts: number[] = []
    s.forEach((p, i) => { xs.push(Math.round(p.x - box.x)); ys.push(Math.round(p.y - box.y)); ts.push(i * 12) })
    return [xs, ys, ts]
  })
  return {
    options: 'enable_pre_space',
    requests: [{
      writing_guide: { writing_area_width: Math.max(1, Math.round(box.w)), writing_area_height: Math.max(1, Math.round(box.h)) },
      ink,
      language: 'en',
      max_num_results: 5,
    }],
  }
}

/** Candidates, best first. Empty when nothing was recognised. */
export function parseResponse(json: unknown): string[] {
  if (!Array.isArray(json) || json[0] !== 'SUCCESS') return []
  const list = (json[1] as unknown[][] | undefined)?.[0]?.[1]
  return Array.isArray(list) ? list.filter((s): s is string => typeof s === 'string' && s.trim().length > 0) : []
}

async function post(url: string, body: unknown, signal: AbortSignal) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal })
  if (!res.ok) throw new Error(`Handwriting service replied ${res.status}`)
  return res.json() as Promise<unknown>
}

export async function recognizeHandwriting(strokes: Pt[][]): Promise<string[]> {
  const body = buildRequest(strokes)
  const signal = AbortSignal.timeout(8000)
  try {
    return parseResponse(await post(ENDPOINT, body, signal))
  } catch {
    return parseResponse(await post('/api/handwriting', body, AbortSignal.timeout(10000)))
  }
}
