// Server-side relay to Google's Input Tools handwriting recogniser, used when the
// browser cannot call it directly. Only stroke coordinates are forwarded.
const ENDPOINT = 'https://inputtools.google.com/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8'

export async function POST(request: Request) {
  const text = await request.text()
  if (text.length > 200_000) return Response.json({ error: 'Too much ink.' }, { status: 413 })
  try {
    const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: text, signal: AbortSignal.timeout(8000) })
    return new Response(await res.text(), { status: res.status, headers: { 'Content-Type': 'application/json' } })
  } catch {
    return Response.json({ error: 'Handwriting service unreachable.' }, { status: 502 })
  }
}
