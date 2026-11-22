import type { QuestionSet } from './types'

export const genai: QuestionSet = {
  id: 'genai',
  title: 'Gen AI & LLMs',
  questions: [
    {
      id: 'what-is-llm',
      q: 'What is a large language model and how does it generate text?',
      a: `An LLM is a neural network trained on huge amounts of text to do one thing: **predict the next token** given the tokens so far. Generation is just that prediction run in a loop: pick a token, append it, predict again.

Almost all LLMs are **transformers**. Their key piece is ==self-attention==: every token looks at every other token in the context and decides how much each one matters, which is how the model tracks meaning across long passages.

- **Pre-training** on web-scale text gives general knowledge and language skill.
- **Post-training** (instruction tuning, RLHF) turns that into a helpful assistant that follows instructions.

The model has no database of facts; knowledge lives in its weights, which is why it can sound confident and still be wrong.`,
      difficulty: 'Easy',
      freq: 3,
      tags: ['fundamentals', 'transformer'],
      followUp: 'Why does attention cost grow quadratically with context length?',
    },
    {
      id: 'tokens-context-window',
      q: 'What are tokens and what is a context window?',
      a: `A **token** is the unit the model reads and writes: a word, part of a word, a punctuation mark or a few bytes. In English one token is roughly 3 to 4 characters, so 1,000 tokens is about 750 words. Code, JSON and non-English text usually take more tokens.

The **context window** is the maximum number of tokens the model can see at once: system prompt + conversation history + documents + tool results + the answer it is writing. Current frontier models offer hundreds of thousands up to a million tokens.

Why it matters in interviews:
- you pay per input and output token, so tokens are your cost unit
- latency grows with output tokens
- a bigger window is not free: quality can drop when the key fact is buried in a huge prompt, so ==curate what goes in== rather than dumping everything`,
      difficulty: 'Easy',
      freq: 3,
      tags: ['tokens', 'context window', 'cost'],
      followUp: 'What do you do when a conversation grows past the context window?',
    },
    {
      id: 'temperature-top-p',
      q: 'What do temperature and top-p control?',
      a: `Both shape how the next token is **sampled** from the model's probability distribution.

- **Temperature** rescales the distribution. Low (near 0) makes the top token dominate: focused and repeatable. High flattens it: more varied and creative, but more errors.
- **Top-p** (nucleus sampling) keeps only the smallest set of tokens whose probabilities add up to p, then samples from those. **Top-k** keeps the k most likely tokens.

Classic advice: low temperature for extraction, classification and code; higher for brainstorming. Change one knob, not both.

A 2026 nuance: on the newest Claude models these sampling parameters are **removed**. You steer behaviour with the prompt and control how much the model reasons with the \`effort\` setting (\`low\` up to \`max\`) instead. Even at temperature 0, outputs were never guaranteed to be identical.`,
      difficulty: 'Easy',
      freq: 2,
      tags: ['sampling', 'parameters'],
    },
    {
      id: 'prompting-techniques',
      q: 'Which prompting techniques do you use, and when?',
      a: `- **System prompt:** sets the role, rules, tone and output format for the whole conversation. Put stable instructions here.
- **Zero-shot:** just ask clearly. Works for most tasks on modern models.
- **Few-shot:** include 2 to 5 input/output examples when the format or judgement is hard to describe. Make examples varied, or the model copies their quirks.
- **Clear structure:** separate instructions from data with XML-style tags such as \`<document>\`, say what to do (not only what to avoid) and give the reason behind rules.
- **Chain of thought:** ask the model to reason before answering for multi-step problems.
- **Decomposition / prompt chaining:** split a big task into steps, each with its own prompt.

The ==most effective technique== is usually just being specific: audience, goal, constraints, and an example of a good answer.`,
      difficulty: 'Easy',
      freq: 3,
      tags: ['prompting', 'few-shot'],
      code: { lang: 'typescript', code: `const system = \`You are a support assistant for Acme.
Answer only from the <docs>. If the answer is not there, say so.
Reply in at most 3 sentences.\`

const user = \`<docs>\${docs}</docs>

<question>\${question}</question>\`` },
      followUp: 'Why do few-shot examples sometimes make results worse?',
    },
    {
      id: 'chain-of-thought-thinking',
      q: 'What is chain of thought, and how does extended or adaptive thinking differ?',
      a: `**Chain of thought** (CoT) means letting the model write out intermediate reasoning before the final answer. Because each token is conditioned on the previous ones, reasoning steps give it "scratch space" and improve accuracy on math, logic and multi-step tasks.

Originally this was a prompt trick ("think step by step"). Modern reasoning models do it natively:
- **Extended thinking** gives the model a separate thinking phase before it answers.
- **Adaptive thinking** (\`thinking: { type: 'adaptive' }\` on current Claude models) lets the model decide **how much** to think per request; you tune depth with \`effort\` rather than a fixed token budget.

Trade-offs: more thinking means ==more latency and more output tokens==. Use low effort for simple lookups and classification, high for hard coding or analysis. Thinking text is a working aid, not a guaranteed faithful explanation.`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['reasoning', 'thinking', 'prompting'],
    },
    {
      id: 'hallucination',
      q: 'What is hallucination and how do you reduce it?',
      a: `A **hallucination** is fluent, confident output that is false or unsupported: an invented citation, API, number or policy. It happens because the model is trained to produce plausible text, not to know what it does not know.

How to reduce it:
- **Ground it:** give the source material (RAG) and instruct it to answer only from that.
- **Allow "I don't know":** explicitly say that saying so is acceptable.
- **Ask for citations** or quotes from the provided documents, then verify them in code.
- **Use tools** for facts that change or need precision (search, a database, a calculator).
- **Structured outputs** and validation for anything a program consumes.
- **Evals** that measure groundedness, plus a stronger model or more effort for hard questions.

You cannot drive it to zero, so ==design the product for errors==: show sources, keep a human in the loop for high-stakes actions.`,
      difficulty: 'Easy',
      freq: 3,
      tags: ['hallucination', 'reliability'],
      followUp: 'How would you measure the hallucination rate of a RAG bot?',
    },
    {
      id: 'embeddings-cosine',
      q: 'What are embeddings and how does cosine similarity work?',
      a: `An **embedding** is a vector of numbers (often 256 to 3,072 dimensions) that represents the meaning of a text, image or code. An embedding model is trained so that similar meanings land close together: "reset my password" and "I forgot my login" end up near each other even with no shared words.

**Cosine similarity** measures the angle between two vectors: \`dot(a, b) / (|a| * |b|)\`. It ranges from -1 to 1; higher means more similar, and it ignores vector length. If vectors are normalised to length 1, cosine equals the plain dot product, which is cheaper.

Uses: semantic search, RAG retrieval, clustering, deduplication, recommendations. Note that Anthropic has no embeddings endpoint; teams typically pair Claude with a provider such as Voyage AI or an open-source model. Always ==embed queries and documents with the same model==.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['embeddings', 'vectors', 'math'],
      code: { lang: 'javascript', run: true, code: `function cosine(a, b) {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

// toy 3-d "embeddings"
const password = [0.9, 0.1, 0.0]
const login = [0.8, 0.2, 0.1]
const pizza = [0.0, 0.1, 0.9]
console.log(cosine(password, login).toFixed(3)) // close to 1
console.log(cosine(password, pizza).toFixed(3)) // close to 0` },
      followUp: 'Why not use Euclidean distance instead?',
    },
    {
      id: 'vector-databases',
      q: 'What is a vector database and how does an ANN index like HNSW work?',
      a: `A **vector database** stores embeddings with their metadata and answers "give me the k nearest vectors to this one", usually with metadata filters. Options: **pgvector** (Postgres extension, great when you already run Postgres), Pinecone, Weaviate, Qdrant, Milvus, Elasticsearch/OpenSearch, MongoDB Atlas Vector Search.

Exact search compares the query with every vector: O(n), too slow at millions of rows. **ANN** (approximate nearest neighbour) indexes trade a little recall for big speed:
- **HNSW** builds a multi-layer graph. Search starts on a sparse top layer, greedily hops toward the query, then drops to denser layers. Fast and accurate, but memory hungry.
- **IVF** clusters vectors and searches only the closest clusters.
- **Quantisation** (PQ, binary) compresses vectors to save memory.

Tune parameters such as \`ef_search\` to balance ==recall against latency==.`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['vector database', 'pgvector', 'hnsw'],
      code: { lang: 'sql', code: `CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE chunks (id bigserial PRIMARY KEY, body text, embedding vector(1024));
CREATE INDEX ON chunks USING hnsw (embedding vector_cosine_ops);

-- <=> is cosine distance in pgvector
SELECT id, body FROM chunks ORDER BY embedding <=> $1 LIMIT 5;` },
      followUp: 'When would you pick pgvector over a dedicated vector database?',
    },
    {
      id: 'rag-pipeline',
      q: 'Walk me through a RAG pipeline end to end.',
      a: `**RAG** (retrieval-augmented generation) answers questions using your own data by retrieving relevant text and putting it in the prompt.

**Indexing (offline):**
- load sources (docs, tickets, PDFs), clean them, keep metadata (title, URL, permissions)
- split into chunks, embed each chunk, store vectors + text in a vector store

**Query (online):**
- optionally rewrite the user question (resolve "it", add context from chat history)
- embed the query, retrieve top-k chunks (often hybrid search), filter by the user's permissions
- rerank and keep the best few
- build a prompt: instructions + chunks with source ids + question
- generate, ask for citations, stream to the user

**Evaluate** retrieval (recall@k) and generation (faithfulness, answer quality) separately. Most bad RAG answers are ==retrieval failures==, not model failures.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['rag', 'retrieval', 'architecture'],
      followUp: 'Users say answers are wrong. How do you debug it?',
    },
    {
      id: 'chunking',
      q: 'How do you chunk documents for RAG?',
      a: `Chunks must be small enough to be specific when retrieved but large enough to make sense on their own.

Strategies:
- **Fixed size** with **overlap** (for example 500 tokens, 50 overlap) so a sentence cut at a boundary still appears whole somewhere. Simple baseline.
- **Recursive / structure-aware:** split on headings, then paragraphs, then sentences. Keeps sections intact; best for Markdown, HTML and code (split by function).
- **Semantic chunking:** split where the embedding similarity between sentences drops.
- **Contextual chunks:** prepend the document title or a short summary to each chunk before embedding, which noticeably improves retrieval.
- **Parent-child:** search small chunks, return the larger parent section to the model.

There is no universal size: ==measure recall on your own questions== with a few settings.`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['rag', 'chunking'],
      code: { lang: 'javascript', run: true, code: `function chunk(text, size, overlap) {
  const words = text.split(/\\s+/)
  const out = []
  for (let i = 0; i < words.length; i += size - overlap) {
    out.push(words.slice(i, i + size).join(' '))
    if (i + size >= words.length) break
  }
  return out
}

const doc = 'one two three four five six seven eight nine ten'
console.log(chunk(doc, 4, 1))
// ["one two three four","four five six seven","seven eight nine ten"]` },
    },
    {
      id: 'hybrid-search-reranking',
      q: 'What are hybrid search and reranking, and why use them?',
      a: `**Vector search** is good at meaning ("cancel subscription" matches "end my plan") but weak at exact terms: error codes, SKUs, names. **Keyword search** (BM25) is the opposite.

**Hybrid search** runs both and merges the lists. A common merge is **Reciprocal Rank Fusion**: each document scores \`sum(1 / (k + rank))\` across lists (k is often 60), so items ranked well by either method rise.

**Reranking** is a second stage: take the top 50 candidates and score each (query, chunk) pair with a **cross-encoder** reranker or an LLM. It is slower per item than embeddings but much more precise, because it reads query and chunk together.

Typical pipeline: hybrid retrieve 50, rerank, keep the top 5 for the prompt. This usually gives the ==biggest quality gain== in a RAG system for the least effort.`,
      difficulty: 'Hard',
      freq: 2,
      tags: ['rag', 'search', 'reranking'],
      code: { lang: 'javascript', run: true, code: `function rrf(lists, k = 60) {
  const score = new Map()
  for (const list of lists) {
    list.forEach((id, rank) => {
      score.set(id, (score.get(id) || 0) + 1 / (k + rank + 1))
    })
  }
  return [...score].sort((a, b) => b[1] - a[1]).map(([id]) => id)
}

const vector = ['doc3', 'doc1', 'doc7']
const keyword = ['doc1', 'doc9', 'doc3']
console.log(rrf([vector, keyword])) // doc1 and doc3 rise to the top` },
    },
    {
      id: 'rag-vs-finetuning',
      q: 'Prompting vs RAG vs fine-tuning: how do you choose?',
      a: `Go in this order, moving on only when the cheaper option fails your evals:

- **Prompting** (plus few-shot examples): fastest to iterate, no infrastructure. Try it first.
- **RAG:** when the model needs **knowledge** it does not have: private, large or frequently changing data. Gives citations and respects permissions. Updating data means re-indexing, not retraining.
- **Fine-tuning:** when you need to change **behaviour**: a consistent format or style, a narrow classification task, or distilling a big model into a small cheap one. It is poor at adding facts, needs good labelled data, and must be redone when the base model changes.

They combine: a fine-tuned small model can still use RAG. A good line in interviews: "RAG for ==knowledge==, fine-tuning for form, prompting before both."`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['rag', 'fine-tuning', 'architecture'],
      followUp: 'Long context windows are huge now. Is RAG still needed?',
    },
    {
      id: 'lora-peft',
      q: 'What are LoRA and PEFT?',
      a: `**PEFT** (parameter-efficient fine-tuning) means adapting a model by training only a tiny fraction of parameters instead of all of them.

**LoRA** (low-rank adaptation) is the most common method. The original weight matrices are **frozen**; next to each chosen matrix you train two small matrices A and B whose product \`A * B\` is a low-rank update (rank 8 to 64). Benefits:
- train with far less GPU memory, often a single GPU
- the adapter is a few megabytes, so you can keep many adapters (one per customer or task) and swap them on one base model
- adapters can be merged into the weights for zero extra latency

**QLoRA** also quantises the frozen base model to 4-bit, so even large open models fit on modest hardware. These apply to open-weight models (Llama, Mistral, Qwen); hosted frontier models are usually ==customised through prompting and RAG== instead.`,
      difficulty: 'Hard',
      freq: 1,
      tags: ['fine-tuning', 'lora'],
    },
    {
      id: 'rlhf-dpo',
      q: 'Explain RLHF and DPO at a high level.',
      a: `Both are post-training steps that align a model with human preferences after supervised instruction tuning.

**RLHF** (reinforcement learning from human feedback):
- humans compare pairs of model answers and pick the better one
- a **reward model** is trained to predict those preferences
- the LLM is optimised with RL (classically PPO) to get high reward, with a penalty for drifting too far from the original model

**DPO** (direct preference optimisation) skips the reward model and the RL loop. It uses the same preference pairs but trains directly with a simple classification-style loss that raises the probability of preferred answers. It is simpler and more stable, so it is widely used.

Related ideas: **RLAIF** / Constitutional AI use AI feedback guided by written principles, and RL on verifiable rewards (tests pass, math is correct) drives ==reasoning models==.`,
      difficulty: 'Hard',
      freq: 1,
      tags: ['training', 'alignment'],
    },
    {
      id: 'tool-use',
      q: 'How does tool use (function calling) work?',
      a: `You describe tools to the model: a **name**, a **description** and a **JSON Schema** for the input. The model never runs code. When it decides a tool helps, it replies with a structured tool call (on Claude: a \`tool_use\` block with \`id\`, \`name\`, \`input\`, and \`stop_reason: 'tool_use'\`).

Your code then:
- validates the input and runs the real function (API call, DB query)
- sends the result back as a \`tool_result\` block that references the \`tool_use_id\`
- calls the model again so it can use the result or call another tool

Tips: write descriptions as if for a new teammate (when to use it, what it returns), keep tools few and distinct, return concise results and ==clear error messages== the model can recover from, and never trust tool input blindly.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['tools', 'function calling', 'agents'],
      code: { lang: 'typescript', code: `const tools = [{
  name: 'get_order_status',
  description: 'Look up the shipping status of an order by its id.',
  input_schema: {
    type: 'object',
    properties: { orderId: { type: 'string' } },
    required: ['orderId'],
  },
}]

const res = await client.messages.create({
  model: 'claude-opus-5-5',
  max_tokens: 16000,
  tools,
  messages: [{ role: 'user', content: 'Where is order A-17?' }],
})
// res.stop_reason === 'tool_use' -> run it, send a tool_result back` },
      followUp: 'How do you stop a model from calling a dangerous tool with bad input?',
    },
    {
      id: 'agents-loop',
      q: 'What is an AI agent and what does the agent loop look like?',
      a: `An **agent** is an LLM that works toward a goal by deciding its own next steps: it calls tools, observes the results and repeats until done. A **workflow** is different: you hard-code the steps in code and the LLM fills them in.

The loop:
- send the goal, tools and history to the model
- if it returns tool calls, execute them and append the results
- repeat until it returns a final answer (\`end_turn\`) or you hit a limit

Production concerns:
- **limits:** max iterations, timeouts, a token budget
- **safety:** least-privilege tools, confirmation before destructive actions, sandboxing
- **context:** summarise or trim long histories
- **observability:** trace every step

Interview tip: say you would start with the ==simplest workflow== that works and only add autonomy when the task really is open-ended.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['agents', 'tools'],
      code: { lang: 'javascript', run: true, code: `// fake model: asks for a tool once, then answers
async function fakeModel(messages) {
  const last = messages[messages.length - 1]
  if (last.role === 'user' && !last.toolResult) {
    return { stop: 'tool_use', tool: { name: 'add', input: { a: 2, b: 3 } } }
  }
  return { stop: 'end_turn', text: 'The answer is ' + last.toolResult }
}
const tools = { add: ({ a, b }) => a + b }

const messages = [{ role: 'user', content: 'What is 2 + 3?' }]
for (let step = 0; step < 5; step++) {          // hard iteration limit
  const res = await fakeModel(messages)
  if (res.stop === 'end_turn') { console.log(res.text); break }
  const result = tools[res.tool.name](res.tool.input)
  console.log('tool', res.tool.name, '->', result)
  messages.push({ role: 'user', toolResult: result })
}` },
      followUp: 'How would you design a multi-agent system, and when is it worth it?',
    },
    {
      id: 'mcp',
      q: 'What is MCP (Model Context Protocol)?',
      a: `**MCP** is an open protocol, introduced by Anthropic and now widely adopted, that standardises how AI applications connect to tools and data. Think of it as "USB-C for AI integrations": write a server once, use it from any MCP client (Claude, Claude Code, Cursor, VS Code, ChatGPT and others).

Pieces:
- **Host / client:** the AI app that talks to servers
- **Server:** exposes capabilities over JSON-RPC, locally via stdio or remotely via Streamable HTTP
- **Tools** (actions the model can call), **resources** (data to read), **prompts** (reusable templates)

Why it matters: without it every app needed custom glue for every integration (N x M). Remote servers use OAuth for auth.

Risks to mention: a server's tool descriptions and outputs go into the model's context, so ==untrusted servers can inject instructions==. Install only trusted servers and scope their permissions.`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['mcp', 'tools', 'agents'],
      followUp: 'MCP server vs a plain REST API: what does MCP add?',
    },
    {
      id: 'structured-outputs',
      q: 'How do you get reliable JSON out of an LLM?',
      a: `Asking "reply in JSON" in the prompt works most of the time, but production code needs a guarantee.

Options, weakest to strongest:
- **Prompt + examples**, then \`JSON.parse\` and retry on failure.
- **Tool use:** define a tool whose input schema is the shape you want; the model returns arguments as structured JSON.
- **Structured outputs:** pass a JSON Schema and the API uses ==constrained decoding==, so the response always matches the schema. In the Anthropic SDK, \`client.messages.parse\` with \`output_config: { format: zodOutputFormat(Schema) }\` returns a typed \`parsed_output\`.

Still validate with Zod or similar: the schema guarantees shape, not truth. Keep schemas simple (enums for categories, optional fields where data may be missing) and include a field like \`reason\` or \`confidence\` if you need it.`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['structured outputs', 'json schema'],
      code: { lang: 'typescript', code: `import { z } from 'zod'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'

const Ticket = z.object({
  category: z.enum(['billing', 'bug', 'other']),
  urgent: z.boolean(),
})

const r = await client.messages.parse({
  model: 'claude-opus-5-5',
  max_tokens: 1024,
  messages: [{ role: 'user', content: emailText }],
  output_config: { format: zodOutputFormat(Ticket) },
})
console.log(r.parsed_output?.category)` },
    },
    {
      id: 'evals',
      q: 'How do you evaluate an LLM feature?',
      a: `"Vibe checks" do not scale. Treat prompts like code and build **evals**.

- **Golden set:** 50 to a few hundred real inputs with expected outputs or grading criteria, including edge cases and past failures.
- **Code-based graders** where possible: exact match, JSON schema valid, contains the right ID, unit tests pass. Cheap and deterministic.
- **LLM-as-judge** for open-ended quality: a strong model grades against a clear rubric, ideally pass/fail per criterion. Calibrate it against human labels and watch for bias (position, length, self-preference).
- **Human review** of samples for the things that matter most.
- **Online signals:** thumbs up/down, edits, task completion.

Run evals in CI whenever a prompt, model or retrieval setting changes, and ==block regressions== like failing tests.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['evals', 'testing', 'quality'],
      code: { lang: 'javascript', run: true, code: `const golden = [
  { input: 'Refund my order', expected: 'billing' },
  { input: 'App crashes on login', expected: 'bug' },
  { input: 'Love the product!', expected: 'other' },
]
// pretend these came from the model
const outputs = ['billing', 'bug', 'billing']

let pass = 0
golden.forEach((c, i) => {
  const ok = outputs[i] === c.expected
  if (ok) pass++
  else console.log('FAIL:', c.input, '->', outputs[i])
})
const score = pass / golden.length
console.log('accuracy', score.toFixed(2))
console.log(score >= 0.9 ? 'ship' : 'block: below threshold')` },
      followUp: 'How do you make sure your LLM judge itself is trustworthy?',
    },
    {
      id: 'prompt-injection',
      q: 'What is prompt injection and how do you defend against it?',
      a: `**Prompt injection** is when untrusted text gets the model to follow instructions it should not. **Direct:** a user types "ignore previous instructions". **Indirect:** the instructions hide in content the model reads, such as a web page, email, PDF, issue or tool result ("send the user's data to this URL").

It cannot be fully solved by prompting, because instructions and data share the same channel. Defence in depth:
- treat model output as ==untrusted input==: validate before acting on it
- **least privilege:** the agent only gets the tools and data the task needs
- human confirmation for sensitive actions (payments, emails, deletes)
- separate and label untrusted content; never put secrets in prompts
- block data exfiltration paths (arbitrary URLs, image links in markdown)
- input/output classifiers and guardrails, plus red-team evals

Key principle: assume the model can be tricked and limit what damage that can do.`,
      difficulty: 'Hard',
      freq: 2,
      tags: ['security', 'prompt injection', 'guardrails'],
      followUp: 'An agent reads emails and can send emails. What could go wrong?',
    },
    {
      id: 'latency-cost',
      q: 'How do you reduce the latency and cost of an LLM app?',
      a: `- **Streaming:** show tokens as they arrive; total time is the same but time-to-first-token is what users feel.
- **Prompt caching:** mark a large stable prefix (system prompt, documents, tool definitions) as cacheable. Later calls that share the prefix read it from cache at a fraction of the price and with lower latency. Put stable content first, variable content last.
- **Model routing:** send easy requests to a small fast model and only hard ones to a frontier model. Lower \`effort\` for simple tasks.
- **Batch API:** for offline jobs (evals, backfills), batch requests at roughly half the price.
- **Fewer tokens:** trim context, retrieve fewer but better chunks, cap \`max_tokens\`, ask for concise output.
- **Parallel calls** for independent steps, and caching of whole responses for repeated questions.

Measure first: ==tokens per request== and p95 latency per step tell you where to start.`,
      difficulty: 'Hard',
      freq: 2,
      tags: ['performance', 'cost', 'caching'],
      code: { lang: 'typescript', code: `const res = await client.messages.create({
  model: 'claude-opus-5-5',
  max_tokens: 2048,
  system: [{
    type: 'text',
    text: productManual,                // big and identical every call
    cache_control: { type: 'ephemeral' },
  }],
  messages: [{ role: 'user', content: question }],
})
console.log(res.usage.cache_read_input_tokens) // > 0 on a cache hit` },
    },
    {
      id: 'streaming-ui',
      q: 'How would you stream an LLM response to a web UI?',
      a: `The model API streams **server-sent events** (SSE): message start, content block deltas with text chunks, then message stop with final usage.

Typical full-stack setup:
- the **browser never holds the API key**; it calls your backend (Next.js route handler, Express)
- the backend opens a streaming request with the SDK and forwards text deltas to the client as SSE or a streamed \`Response\` body
- the client reads with \`fetch\` + \`response.body.getReader()\` (or a library such as the Vercel AI SDK) and appends text to state

Details interviewers like: handle **abort** (user clicks stop, pass an \`AbortSignal\` through), handle errors mid-stream, render markdown incrementally without flicker, and record ==final token usage== once the stream ends for billing and monitoring.`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['streaming', 'full-stack'],
      code: { lang: 'typescript', code: `// app/api/chat/route.ts
export async function POST(req: Request) {
  const { messages } = await req.json()
  const stream = client.messages.stream({
    model: 'claude-opus-5-5', max_tokens: 64000, messages,
  })
  const body = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta') {
          controller.enqueue(new TextEncoder().encode(event.delta.text))
        }
      }
      controller.close()
    },
  })
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } })
}` },
    },
    {
      id: 'multimodal',
      q: 'What does multimodal mean for LLMs, and what can you build with it?',
      a: `A **multimodal** model accepts more than text: images, PDFs, screenshots, charts, sometimes audio and video. Images are turned into tokens (patches) and processed alongside the text in the same context.

Common uses:
- document understanding: invoices, receipts, contracts, scanned forms into structured JSON
- UI work: screenshot to code, visual bug reports, ==computer use== agents that read the screen and click
- charts and diagrams: explain or extract the data
- accessibility: alt text and image descriptions

Practical points: images cost tokens (roughly proportional to resolution), so resize sensibly; models can still misread small text or exact numbers, so validate extracted values; and image generation is usually a separate kind of model (diffusion), not the same LLM.`,
      difficulty: 'Easy',
      freq: 1,
      tags: ['multimodal', 'vision'],
    },
    {
      id: 'context-engineering',
      q: 'What is context engineering, and how is it different from prompt engineering?',
      a: `**Prompt engineering** is wording a single instruction well. **Context engineering** is designing everything the model sees at each step: system prompt, tool definitions, retrieved documents, memory, conversation history and tool results. For agents that run many steps, this matters more than any single prompt.

Principles:
- context is a ==limited budget==: the smallest set of high-signal tokens wins
- load information **just in time** (search, read a file when needed) instead of stuffing everything up front
- **compact** long histories: summarise old turns, clear stale tool results
- give agents **memory** outside the window (notes files, a todo list, a database)
- keep tool sets small and descriptions clear to avoid confusion
- use **sub-agents** with fresh context for big side tasks, returning only a summary

Symptoms of poor context: the agent forgets instructions, repeats work or gets distracted by irrelevant documents.`,
      difficulty: 'Hard',
      freq: 2,
      tags: ['context engineering', 'agents', 'prompting'],
      followUp: 'How would you give an agent memory across sessions?',
    },
    {
      id: 'small-vs-large-models',
      q: 'When do you choose a small model over a large one?',
      a: `**Large frontier models** are best at hard reasoning, complex coding, long agentic tasks and ambiguous instructions. **Small models** are faster and much cheaper, and they are often good enough for classification, extraction, routing, summarisation and autocomplete. Small open-weight models can also run on your own hardware or on-device for privacy.

How to decide:
- write evals first, then try the **smallest model that passes** them
- use a **router**: a cheap model or rules classify the request, hard ones go to the big model
- **cascade:** try small first, escalate when confidence is low or validation fails
- **distil:** use a big model to label data and fine-tune a small one for a narrow task
- for agents, a big model can plan while smaller sub-agents do routine steps

Re-run the comparison when new models ship; the ==price-performance curve== moves every few months.`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['model selection', 'cost', 'routing'],
    },
  ],
}
