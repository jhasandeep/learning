import type { NoteTopic } from './types'

export const genai: NoteTopic = {
  id: 'genai',
  title: 'Gen AI & LLMs',
  tagline: 'How LLMs work, prompting, embeddings, RAG, agents, evals and running them in production',
  category: 'AI & LLMs',
  badge: 'AI',
  color: '#8b5cf6',
  sections: [
    {
      id: 'how-llms-work',
      title: 'How LLMs work',
      blocks: [
        { type: 'def', text: 'A **large language model (LLM)** is a neural network trained to ==predict the next token== given the tokens before it. Repeating that prediction, one token at a time, produces whole answers, code and plans.' },
        {
          type: 'flow',
          steps: ['Text', 'Tokenizer → token ids', 'Embeddings', 'Transformer layers (self-attention)', 'Probabilities for the next token', 'Sample one token', 'Append and repeat'],
          caption: 'Generation is a loop: every new token is fed back in as input.',
        },
        {
          type: 'list',
          items: [
            '**Tokens**: sub-word pieces (roughly 3–4 characters of English each). Pricing, limits and speed are all counted in tokens.',
            '**Context window**: the maximum tokens the model can read in one request (input + output). Current frontier models handle around 1M tokens.',
            '**Self-attention**: every token looks at every earlier token and decides which ones matter, which is how the model tracks meaning across long text.',
            '**Parameters**: the learned weights (billions of them). More parameters usually means more capability, plus more cost and latency.',
          ],
        },
        {
          type: 'table', head: ['Training stage', 'What it teaches'],
          rows: [
            ['Pre-training', 'Next-token prediction on huge amounts of text and code: language, facts, reasoning patterns'],
            ['Instruction tuning (SFT)', 'Following instructions and answering in a helpful format'],
            ['Preference tuning (RLHF / RLAIF / DPO)', 'Preferring helpful, honest, harmless answers'],
          ],
        },
        { type: 'mistake', text: 'An LLM does not look facts up: it generates likely text. Without grounding (RAG, tools) it can produce confident, wrong answers, called **hallucinations**.' },
      ],
    },
    {
      id: 'prompting',
      title: 'Prompting and controlling output',
      blocks: [
        { type: 'def', text: 'A **prompt** is everything the model reads: the **system prompt** (role, rules, format), the conversation messages, any documents and tool results. ==Clear context beats clever wording.==' },
        {
          type: 'table', head: ['Technique', 'When to use it'],
          rows: [
            ['Zero-shot', 'Simple tasks: just describe what you want'],
            ['Few-shot (examples)', 'A specific format or style: show 2–5 input → output pairs'],
            ['Step-by-step / thinking', 'Maths, logic, multi-step reasoning; current models do this with built-in (adaptive) thinking'],
            ['Role + constraints', '"You are a senior reviewer. Answer in 3 bullets. Say I don\'t know if unsure."'],
            ['Structured output', 'Machine-readable JSON validated against a schema'],
          ],
        },
        {
          type: 'list',
          items: [
            'Put long documents **first** and the question **last**; label them with tags such as `<document>`.',
            'Say **why** a rule exists, not only the rule: models generalise better from the reason.',
            'Ask for the format you need (JSON, a table, a word limit) and give an example.',
            'Allow an exit: "If the answer is not in the documents, say so." This cuts hallucinations.',
          ],
        },
        { type: 'tip', text: 'Sampling knobs like `temperature` and `top_p` were the classic way to trade creativity for consistency. On the newest Claude models they are removed: you control depth and cost with **effort** (`low` to `max`) instead.' },
        {
          type: 'code', lang: 'typescript', title: 'A basic Claude API call (TypeScript SDK)',
          code: `import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic() // reads ANTHROPIC_API_KEY

const res = await client.messages.create({
  model: 'claude-opus-5-5',
  max_tokens: 16000,
  system: 'You are a concise senior engineer. Answer in 3 bullets.',
  messages: [{ role: 'user', content: 'When should I use RAG?' }],
})

for (const block of res.content) {
  if (block.type === 'text') console.log(block.text)
}
console.log(res.usage.input_tokens, res.usage.output_tokens)`,
        },
        {
          type: 'code', lang: 'javascript', title: 'Building a few-shot prompt', run: true,
          code: `const examples = [
  ['The app crashes on login', 'bug'],
  ['Please add dark mode', 'feature'],
  ['How do I reset my password?', 'question'],
]

function fewShotPrompt(input) {
  const shots = examples.map(([text, label]) => \`Ticket: \${text}\\nLabel: \${label}\`)
  return [
    'Classify each support ticket as bug, feature or question.',
    ...shots,
    \`Ticket: \${input}\\nLabel:\`,
  ].join('\\n\\n')
}

console.log(fewShotPrompt('Export to CSV fails with a 500 error'))`,
        },
      ],
    },
    {
      id: 'embeddings',
      title: 'Embeddings and vector search',
      blocks: [
        { type: 'def', text: 'An **embedding** is a list of numbers (a vector, often 256–3072 dimensions) that represents the ==meaning of a text==. Similar meanings land close together, so "reset password" and "forgot login" end up near each other.' },
        {
          type: 'list',
          items: [
            '**Cosine similarity** measures how close two vectors point: 1 = same direction, 0 = unrelated.',
            '**Vector database / index**: stores embeddings and finds the nearest ones fast (pgvector in Postgres, Pinecone, Weaviate, Qdrant, Elasticsearch, OpenSearch).',
            '**ANN (approximate nearest neighbour)** indexes such as **HNSW** trade a little accuracy for huge speed on millions of vectors.',
            'Embeddings come from a dedicated embedding model (for example Voyage AI, OpenAI or open-source BGE/E5). Anthropic does not offer an embeddings endpoint.',
          ],
        },
        {
          type: 'code', lang: 'javascript', title: 'Cosine similarity and nearest neighbours', run: true,
          code: `function cosine(a, b) {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

// Toy 3-d "embeddings" (real ones have hundreds of dimensions)
const docs = {
  'reset your password': [0.9, 0.1, 0.0],
  'forgot login details': [0.8, 0.2, 0.1],
  'pizza recipe': [0.0, 0.1, 0.9],
}
const query = [0.85, 0.15, 0.05] // "can't sign in"

const ranked = Object.entries(docs)
  .map(([text, vec]) => [text, cosine(query, vec).toFixed(3)])
  .sort((x, y) => y[1] - x[1])
console.log(ranked)`,
        },
        { type: 'mistake', text: 'Mixing embeddings from two different models, or changing the model without re-embedding everything: vectors from different models live in different spaces and cannot be compared.' },
      ],
    },
    {
      id: 'rag',
      title: 'RAG: retrieval-augmented generation',
      blocks: [
        { type: 'def', text: '**RAG** grounds an LLM in your own data: retrieve the most relevant chunks for a question and put them in the prompt, so the model ==answers from your documents== instead of from memory, and can cite them.' },
        {
          type: 'flow',
          steps: ['Load documents', 'Split into chunks', 'Embed chunks → vector DB', 'Embed the question', 'Retrieve top-k (+ rerank)', 'Prompt = question + chunks', 'LLM answers with citations'],
          caption: 'Indexing (first three steps) runs ahead of time; the rest runs per question.',
        },
        {
          type: 'table', head: ['Lever', 'Why it matters'],
          rows: [
            ['Chunk size + overlap', 'Too big wastes context and blurs meaning; too small loses context. 200–800 tokens with ~10–20% overlap is a common start'],
            ['Hybrid search', 'Combine vectors (meaning) with keyword/BM25 (exact names, error codes, ids)'],
            ['Reranking', 'A reranker re-scores the top 20–50 hits so the best 3–5 go in the prompt'],
            ['Metadata filters', 'Filter by tenant, date, product or permissions before ranking'],
            ['Contextual chunks', 'Prefix each chunk with a short description of its document to improve retrieval'],
          ],
        },
        {
          type: 'code', lang: 'javascript', title: 'Chunking with overlap + a tiny retriever', run: true,
          code: `function chunk(text, size, overlap) {
  const words = text.split(/\\s+/)
  const out = []
  for (let i = 0; i < words.length; i += size - overlap) {
    out.push(words.slice(i, i + size).join(' '))
    if (i + size >= words.length) break
  }
  return out
}

// Keyword-overlap score stands in for vector similarity here
const score = (q, c) => q.toLowerCase().split(' ')
  .filter((w) => c.toLowerCase().includes(w)).length

const doc = 'Refunds are issued within 5 days. Refunds need the order id. ' +
  'Shipping takes 3 days. Express shipping costs 10 dollars extra.'
const chunks = chunk(doc, 8, 2)
const question = 'how long do refunds take'
const top = chunks.map((c) => [score(question, c), c])
  .sort((a, b) => b[0] - a[0]).slice(0, 2).map(([, c]) => c)

console.log(chunks.length, 'chunks')
console.log('Answer using ONLY this context:\\n- ' + top.join('\\n- ') +
  '\\n\\nQuestion: ' + question)`,
        },
        { type: 'mistake', title: 'Common RAG failure', text: 'The answer is wrong, so people tune the prompt, but the real problem is **retrieval**: the right chunk never reached the model. Measure retrieval (did the top-k contain the answer?) separately from generation.' },
        { type: 'tip', text: 'With 1M-token context windows, a small knowledge base (tens of documents) can simply go in the prompt with **prompt caching**. Reach for RAG when the data is large, changes often, or needs per-user permissions.' },
      ],
    },
    {
      id: 'adapting',
      title: 'Prompting vs RAG vs fine-tuning',
      blocks: [
        {
          type: 'table', head: ['Approach', 'Best for', 'Cost / effort'],
          rows: [
            ['Prompting (+ examples)', 'Behaviour, format, tone; always try first', 'Lowest: minutes'],
            ['RAG', 'Knowledge that is private, large or changes often; citations', 'Medium: an indexing pipeline'],
            ['Fine-tuning', 'A consistent style, a narrow task at scale, smaller/cheaper models', 'Highest: data, training, evals, re-training'],
          ],
        },
        {
          type: 'list',
          items: [
            '**Fine-tuning teaches behaviour, not facts**: use RAG for knowledge you must keep current.',
            '**LoRA / PEFT** fine-tunes a small set of extra weights instead of the whole model: much cheaper, and adapters can be swapped.',
            '**Distillation**: train a small model on a large model\'s outputs for a cheaper, faster specialist.',
          ],
        },
        { type: 'revision', text: 'Order to try: prompt → prompt + examples → RAG / tools → fine-tune. Measure with evals at every step.' },
      ],
    },
    {
      id: 'agents',
      title: 'Tool use, agents and MCP',
      blocks: [
        { type: 'def', text: '**Tool use (function calling)**: you describe functions with a JSON schema; the model replies with a tool call (name + arguments), ==your code runs it== and sends the result back. An **agent** is this loop running until the task is done, with the model choosing each step.' },
        {
          type: 'flow',
          steps: ['User goal', 'Model plans', 'Calls a tool', 'Your code runs it', 'Result back to the model', 'Repeat until done', 'Final answer'],
        },
        {
          type: 'code', lang: 'typescript', title: 'The agent loop with the Claude API',
          code: `const tools: Anthropic.Tool[] = [{
  name: 'get_order',
  description: 'Look up an order by id',
  input_schema: {
    type: 'object',
    properties: { id: { type: 'string' } },
    required: ['id'],
  },
}]
const messages: Anthropic.MessageParam[] = [
  { role: 'user', content: 'Where is order A17?' },
]

while (true) {
  const res = await client.messages.create({
    model: 'claude-opus-5-5', max_tokens: 16000, tools, messages,
  })
  if (res.stop_reason !== 'tool_use') break // finished
  messages.push({ role: 'assistant', content: res.content })
  const results: Anthropic.ToolResultBlockParam[] = []
  for (const block of res.content) {
    if (block.type !== 'tool_use') continue
    const output = await runTool(block.name, block.input)
    results.push({ type: 'tool_result', tool_use_id: block.id, content: output })
  }
  messages.push({ role: 'user', content: results })
}`,
        },
        {
          type: 'code', lang: 'javascript', title: 'The same loop with a fake model (runnable)', run: true,
          code: `const tools = { getWeather: ({ city }) => \`\${city}: 21C, sunny\` }

// A scripted "model": first asks for a tool, then answers
let turn = 0
function fakeModel(messages) {
  turn++
  if (turn === 1) return { stop: 'tool_use', call: { name: 'getWeather', input: { city: 'Pune' } } }
  const last = messages[messages.length - 1].content
  return { stop: 'end_turn', text: 'It is ' + last.split(': ')[1] + ' in Pune.' }
}

const messages = [{ role: 'user', content: 'Weather in Pune?' }]
while (true) {
  const res = fakeModel(messages)
  if (res.stop === 'end_turn') { console.log(res.text); break }
  const output = tools[res.call.name](res.call.input)
  console.log('tool', res.call.name, '->', output)
  messages.push({ role: 'tool', content: output })
}`,
        },
        {
          type: 'list',
          items: [
            '**MCP (Model Context Protocol)**: an open standard for connecting AI apps to tools and data. Build an MCP server once (GitHub, a database, your API) and any MCP client (Claude, IDEs, agents) can use it.',
            '**Workflow vs agent**: if you can write the steps down, use a coded workflow (cheaper, predictable); use an agent when the path depends on what it finds.',
            '**Guardrails**: least-privilege tools, human approval for risky actions, sandboxes, step and budget limits.',
          ],
        },
        { type: 'mistake', text: 'Trusting tool inputs or tool **results** blindly. Text inside a web page, email or file can carry instructions (**prompt injection**); treat it as data and gate destructive actions.' },
      ],
    },
    {
      id: 'evals-safety',
      title: 'Evals, hallucinations and safety',
      blocks: [
        { type: 'def', text: 'An **eval** is a test suite for an LLM feature: a set of inputs with expected outcomes and a way to grade them. ==You cannot improve what you do not measure==, and prompts, models and RAG settings all change behaviour.' },
        {
          type: 'table', head: ['Grading method', 'Use it for'],
          rows: [
            ['Exact / code checks', 'Classification labels, JSON validity, numbers, "contains the order id"'],
            ['LLM-as-judge', 'Open answers graded against a rubric (check the judge against human labels)'],
            ['Human review', 'Ground truth for a sample; calibrating the automated graders'],
          ],
        },
        {
          type: 'code', lang: 'javascript', title: 'A tiny eval harness', run: true,
          code: `const cases = [
  { input: 'App crashes on save', expected: 'bug' },
  { input: 'Add a dark theme', expected: 'feature' },
  { input: 'How to export data?', expected: 'question' },
]

// Stand-in for the model under test
const classify = (t) => /crash|error|fail/i.test(t) ? 'bug'
  : /add|support|please/i.test(t) ? 'feature' : 'question'

let passed = 0
for (const c of cases) {
  const got = classify(c.input)
  const ok = got === c.expected
  if (ok) passed++
  console.log(ok ? 'PASS' : 'FAIL', c.input, '->', got)
}
console.log(\`accuracy: \${Math.round((passed / cases.length) * 100)}%\`)`,
        },
        {
          type: 'list',
          items: [
            'Reduce hallucinations: ground with RAG or tools, ask for citations, allow "I don\'t know", verify facts with code where possible.',
            '**Prompt injection**: untrusted content tries to override instructions. Separate instructions from data, limit tool permissions, require approval for risky actions.',
            '**Privacy**: avoid sending secrets or unneeded PII; redact logs; check data-retention terms.',
          ],
        },
        { type: 'tip', text: 'Run the eval in CI on every prompt or model change, like unit tests, and compare cost and latency as well as quality.' },
      ],
    },
    {
      id: 'production',
      title: 'Running LLMs in production',
      blocks: [
        {
          type: 'table', head: ['Concern', 'What to do'],
          rows: [
            ['Latency', 'Stream tokens to the UI; keep prompts lean; pick the effort level per route'],
            ['Cost', 'Prompt caching for repeated context, batch APIs for offline jobs, smaller models for simple routes'],
            ['Reliability', 'Retry 429/5xx with exponential backoff, timeouts, fallbacks'],
            ['Output shape', 'Structured outputs (JSON schema) instead of parsing free text'],
            ['Observability', 'Log prompts, token usage, latency, cost and eval scores per request (tracing)'],
          ],
        },
        {
          type: 'code', lang: 'typescript', title: 'Streaming + prompt caching',
          code: `const stream = client.messages.stream({
  model: 'claude-opus-5-5',
  max_tokens: 64000,
  system: [{
    type: 'text',
    text: handbook, // large and identical on every request
    cache_control: { type: 'ephemeral' },
  }],
  messages: [{ role: 'user', content: question }],
})

for await (const event of stream) {
  if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
    process.stdout.write(event.delta.text)
  }
}
const final = await stream.finalMessage()
console.log(final.usage.cache_read_input_tokens) // > 0 when the cache hit`,
        },
        {
          type: 'code', lang: 'javascript', title: 'Estimating tokens and cost', run: true,
          code: `// Rule of thumb: ~4 characters per token for English text
const tokens = (text) => Math.ceil(text.length / 4)

function cost({ inputTokens, outputTokens, inPerM, outPerM }) {
  return (inputTokens / 1e6) * inPerM + (outputTokens / 1e6) * outPerM
}

const prompt = 'Summarise this support thread. '.repeat(400)
const inputTokens = tokens(prompt)
const perCall = cost({ inputTokens, outputTokens: 500, inPerM: 4, outPerM: 20 })

console.log('input tokens ~', inputTokens)
console.log('cost per call $', perCall.toFixed(4))
console.log('per 100k calls $', (perCall * 100000).toFixed(0))`,
        },
        { type: 'revision', text: 'LLM = next-token predictor over tokens in a context window. Prompt first, then RAG for knowledge, tools/agents for actions, fine-tune for behaviour at scale. Always: evals, streaming, caching, retries, guardrails.' },
      ],
    },
  ],
  qa: [
    ['What is a token?', 'A sub-word piece of text (about 4 characters of English). Context limits, speed and pricing are all measured in tokens.'],
    ['What is a context window?', 'The most tokens a model can take in one request, input plus output. Everything the model knows about your task must fit in it.'],
    ['Why do LLMs hallucinate?', 'They generate the most likely text, not verified facts. Grounding (RAG, tools), citations and allowing "I don\'t know" reduce it.'],
    ['What is an embedding?', 'A vector of numbers representing the meaning of text; similar meanings have high cosine similarity.'],
    ['Explain RAG in one line.', 'Retrieve relevant chunks of your data and put them in the prompt so the model answers from them, with citations.'],
    ['RAG or fine-tuning for company documents?', 'RAG: knowledge changes and needs citations and permissions. Fine-tuning changes behaviour or style, not facts.'],
    ['Why hybrid search?', 'Vectors capture meaning but miss exact terms like error codes and ids; keyword (BM25) search catches those. Combine them and rerank.'],
    ['What is tool use / function calling?', 'The model returns a structured call (name + JSON arguments); your code runs it and sends the result back.'],
    ['What is an agent?', 'An LLM in a loop that chooses tools step by step until the goal is met, with limits and guardrails.'],
    ['What is MCP?', 'Model Context Protocol: an open standard for exposing tools and data to AI apps, so one server works with many clients.'],
    ['How do you evaluate an LLM feature?', 'A golden set of inputs with expected outcomes, graded by code checks, an LLM judge with a rubric, and human review; run it in CI.'],
    ['How do you cut LLM cost and latency?', 'Prompt caching, streaming, right-sized models and effort per route, batching offline work, shorter prompts.'],
  ],
}
