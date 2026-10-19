import { LANGUAGES, type ServerLang } from '@/data/languages'
import { allowRun, getBackend } from '@/lib/exec'
import { LIMITS } from '@/lib/exec/types'

const SERVER_LANGS = new Set<string>(LANGUAGES.filter((l) => l.engine === 'server').map((l) => l.runtime))

export async function GET() {
  const status = getBackend()
  return Response.json(status.ok ? { configured: true, backend: status.backend.name } : { configured: false, reason: status.reason })
}

export async function POST(request: Request) {
  let body: { language?: unknown; code?: unknown; stdin?: unknown }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Body must be JSON.' }, { status: 400 })
  }
  const { language, code, stdin = '' } = body
  if (typeof language !== 'string' || !SERVER_LANGS.has(language)) {
    return Response.json({ error: 'Unsupported language.' }, { status: 400 })
  }
  if (typeof code !== 'string' || typeof stdin !== 'string') {
    return Response.json({ error: 'code and stdin must be strings.' }, { status: 400 })
  }
  if (code.length > LIMITS.maxCodeBytes || stdin.length > LIMITS.maxStdinBytes) {
    return Response.json({ error: 'Code or input is too large (64 KB max).' }, { status: 413 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local'
  if (!allowRun(ip)) {
    return Response.json({ error: 'Too many runs — wait a minute and try again.' }, { status: 429, headers: { 'Retry-After': '60' } })
  }

  const status = getBackend()
  if (!status.ok) return Response.json({ error: status.reason }, { status: 503 })

  try {
    const result = await status.backend.run({ language: language as ServerLang, code, stdin })
    return Response.json(result)
  } catch (e) {
    return Response.json({ error: `The code runner failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 502 })
  }
}
