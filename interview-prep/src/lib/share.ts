// Share links keep the code in the URL fragment (#s=…), compressed with
// deflate and base64url-encoded. Nothing is uploaded or stored on a server.

export interface Shared { code: string; stdin: string }

function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function fromBase64Url(s: string): Uint8Array {
  const bin = atob(s.replaceAll('-', '+').replaceAll('_', '/'))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream)
  return new Uint8Array(await new Response(out).arrayBuffer())
}

export async function encodeShare(data: Shared): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(data))
  return toBase64Url(await pipe(json, new CompressionStream('deflate-raw')))
}

export async function decodeShare(token: string): Promise<Shared | null> {
  try {
    const json = await pipe(fromBase64Url(token), new DecompressionStream('deflate-raw'))
    const data = JSON.parse(new TextDecoder().decode(json)) as Partial<Shared>
    return typeof data.code === 'string' ? { code: data.code, stdin: typeof data.stdin === 'string' ? data.stdin : '' } : null
  } catch {
    return null
  }
}
