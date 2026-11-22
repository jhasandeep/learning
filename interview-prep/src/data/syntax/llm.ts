import type { SyntaxSet } from './types'

export const llm: SyntaxSet = {
  id: 'llm',
  title: 'LLM APIs',
  snippets: [
    {
      id: 'basic-message',
      title: 'Send a message (Anthropic SDK)',
      lang: 'typescript',
      code: `import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic() // reads ANTHROPIC_API_KEY

const res = await client.messages.create({
  model: 'claude-opus-5-5',
  max_tokens: 16000,
  system: 'You are a helpful assistant.',
  messages: [{ role: 'user', content: 'Explain RAG in one line.' }],
})

for (const block of res.content) {
  if (block.type === 'text') console.log(block.text)
}`,
      note: 'The response `content` is an **array of blocks**, not a string, so loop and pick `text` blocks. Keep the API key on the server, never in the browser.',
    },
    {
      id: 'stream-text',
      title: 'Stream a response',
      lang: 'typescript',
      code: `const stream = client.messages.stream({
  model: 'claude-opus-5-5',
  max_tokens: 64000,
  messages: [{ role: 'user', content: 'Write a haiku about Node.' }],
})

for await (const event of stream) {
  if (
    event.type === 'content_block_delta' &&
    event.delta.type === 'text_delta'
  ) {
    process.stdout.write(event.delta.text)
  }
}

const final = await stream.finalMessage()
console.log('\\n', final.usage.output_tokens, 'tokens')`,
      note: 'Streaming cuts **time to first token**, which is what users feel. `finalMessage()` gives the full message and usage once the stream ends.',
    },
    {
      id: 'effort-thinking',
      title: 'Adaptive thinking and effort',
      lang: 'typescript',
      code: `const res = await client.messages.create({
  model: 'claude-opus-5-5',
  max_tokens: 16000,
  thinking: { type: 'adaptive' },
  // effort: low | medium | high | xhigh | max
  output_config: { effort: 'high' },
  messages: [{ role: 'user', content: hardQuestion }],
})

const answer = res.content
  .filter((b) => b.type === 'text')
  .map((b) => b.text)
  .join('')`,
      note: 'On current Claude models you control reasoning depth with `effort` instead of temperature or a thinking budget. Use **low** for simple tasks, higher for hard coding and analysis.',
    },
    {
      id: 'define-tool',
      title: 'Define a tool',
      lang: 'typescript',
      code: `const tools: Anthropic.Tool[] = [
  {
    name: 'get_weather',
    description: 'Get the current weather for a city.',
    input_schema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'City name' },
        unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
      },
      required: ['city'],
    },
  },
]`,
      note: 'A tool is a **name**, a **description** the model reads to decide when to call it, and a JSON Schema for its input. Good descriptions matter more than clever names.',
    },
    {
      id: 'agent-loop',
      title: 'Tool-use agent loop',
      lang: 'typescript',
      code: `const messages: Anthropic.MessageParam[] = [
  { role: 'user', content: 'What should I wear in Paris today?' },
]
while (true) {
  const res = await client.messages.create({
    model: 'claude-opus-5-5', max_tokens: 16000, tools, messages,
  })
  messages.push({ role: 'assistant', content: res.content })
  if (res.stop_reason === 'end_turn') break
  const results: Anthropic.ToolResultBlockParam[] = []
  for (const block of res.content) {
    if (block.type !== 'tool_use') continue
    const out = await runTool(block.name, block.input)
    results.push({ type: 'tool_result', tool_use_id: block.id,
      content: JSON.stringify(out) })
  }
  messages.push({ role: 'user', content: results })
}`,
      note: 'The **agent loop**: call the model, run every `tool_use` block, send `tool_result` blocks back, repeat until `end_turn`. In production add a max-iterations limit.',
    },
    {
      id: 'structured-output',
      title: 'Structured output with Zod',
      lang: 'typescript',
      code: `import { z } from 'zod'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'

const Invoice = z.object({
  vendor: z.string(),
  total: z.number(),
  currency: z.enum(['USD', 'EUR', 'GBP']),
})

const r = await client.messages.parse({
  model: 'claude-opus-5-5',
  max_tokens: 4096,
  messages: [{ role: 'user', content: invoiceText }],
  output_config: { format: zodOutputFormat(Invoice) },
})
console.log(r.parsed_output?.total)`,
      note: 'Structured outputs **constrain decoding** to your schema, so you get valid, typed JSON instead of parsing free text and hoping.',
    },
    {
      id: 'prompt-caching',
      title: 'Prompt caching',
      lang: 'typescript',
      code: `const res = await client.messages.create({
  model: 'claude-opus-5-5',
  max_tokens: 2048,
  system: [
    {
      type: 'text',
      text: bigDoc, // stable prefix: same on every call
      cache_control: { type: 'ephemeral' },
    },
  ],
  messages: [{ role: 'user', content: question }],
})

console.log('cached', res.usage.cache_read_input_tokens)`,
      note: 'Cache a large **stable prefix** (docs, tools, long instructions) to cut cost and latency on repeat calls. Stable content goes first, changing content last.',
    },
    {
      id: 'retry-backoff',
      title: 'Retry 429s with exponential backoff',
      lang: 'typescript',
      code: `const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function withRetry<T>(fn: () => Promise<T>, max = 5) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const api = err instanceof Anthropic.APIError
      const retry = err instanceof Anthropic.RateLimitError ||
        (api && (err.status ?? 0) >= 500)
      if (!retry || attempt >= max) throw err
      const ms = 2 ** attempt * 500 + Math.random() * 250
      await sleep(ms)
    }
  }
}`,
      note: 'Retry only **rate limits and server errors**, with exponential backoff plus jitter so clients do not retry in lockstep. Never retry a 400.',
    },
    {
      id: 'cosine-similarity',
      title: 'Cosine similarity',
      lang: 'javascript',
      code: `function cosine(a, b) {
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}`,
      note: 'The standard way to compare **embeddings**: 1 means same direction, 0 unrelated. For unit-length vectors it is just the dot product.',
    },
    {
      id: 'chunk-overlap',
      title: 'Chunk text with overlap',
      lang: 'javascript',
      code: `function chunk(text, size = 800, overlap = 100) {
  const chunks = []
  let start = 0
  while (start < text.length) {
    const end = Math.min(start + size, text.length)
    chunks.push(text.slice(start, end))
    if (end === text.length) break
    start = end - overlap
  }
  return chunks
}`,
      note: 'The RAG baseline: fixed-size chunks with **overlap** so a sentence cut at a boundary still appears whole in one chunk.',
    },
    {
      id: 'top-k-retrieval',
      title: 'Top-k retrieval and RAG prompt',
      lang: 'typescript',
      code: `// embed(texts) wraps your embedding provider (e.g. Voyage AI)
async function retrieve(query: string, docs: Doc[], k = 3) {
  const [q] = await embed([query])
  return docs
    .map((d) => ({ ...d, score: cosine(q, d.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
}

function ragPrompt(question: string, hits: Doc[]) {
  const ctx = hits
    .map((h) => '<doc id="' + h.id + '">' + h.text + '</doc>')
    .join('\\n')
  return 'Answer only from the docs below. Cite doc ids. ' +
    'If the answer is not there, say you do not know.\\n' +
    ctx + '\\n<question>' + question + '</question>'
}`,
      note: 'Brute-force top-k is fine for small corpora; use a vector index (pgvector, HNSW) at scale. Anthropic has no embeddings endpoint, so `embed` calls another provider.',
    },
    {
      id: 'llm-judge',
      title: 'LLM-as-judge grader',
      lang: 'typescript',
      code: `async function judge(question: string, answer: string) {
  const res = await client.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 1024,
    output_config: { effort: 'low' },
    system: 'Grade the answer. Reply PASS or FAIL, then one reason.',
    messages: [{
      role: 'user',
      content: '<rubric>Correct, grounded, concise.</rubric>' +
        '<question>' + question + '</question>' +
        '<answer>' + answer + '</answer>',
    }],
  })
  const first = res.content[0]
  const text = first.type === 'text' ? first.text : ''
  return text.trim().startsWith('PASS')
}`,
      note: 'An **LLM judge** scores open-ended output against a clear rubric. Prefer pass/fail per criterion and calibrate it against human labels.',
    },
  ],
}
