import type { LearnTrack } from './types'

export const genai: LearnTrack = {
  id: 'genai',
  intro: 'Build the plumbing around an LLM in plain JavaScript: token and cost estimates, few-shot prompts, embeddings, chunking, retrieval for RAG, JSON validation, an agent loop and retries.',
  kind: 'js',
  lang: 'javascript',
  steps: [
    {
      id: 'tokens-cost',
      title: 'Tokens and cost',
      learn: `Models read and write **tokens**, sub-word pieces of text. A rule of thumb for English is about ==4 characters per token==.

Providers price input and output tokens separately, **per million tokens**, and output usually costs several times more:

\`\`\`
const dollars = (tokens / 1_000_000) * pricePerMillion
\`\`\`

Estimating before you ship tells you whether a feature costs cents or thousands a month.`,
      task: 'Write `estimateTokens(text)` (characters divided by 4, rounded up) and `estimateCost(inputTokens, outputTokens, price)`, where `price` is `{ inPerM, outPerM }` in dollars per million tokens.',
      starter: `function estimateTokens(text) {
  return 0
}

function estimateCost(inputTokens, outputTokens, price) {
  return 0
}
`,
      solution: `function estimateTokens(text) {
  return Math.ceil(text.length / 4)
}

function estimateCost(inputTokens, outputTokens, price) {
  return (inputTokens / 1e6) * price.inPerM + (outputTokens / 1e6) * price.outPerM
}
`,
      tests: [
        ['4 characters is 1 token, 5 rounds up to 2', 'expect(estimateTokens("abcd")).toBe(1); expect(estimateTokens("abcde")).toBe(2)'],
        ['an empty string is 0 tokens', 'expect(estimateTokens("")).toBe(0)'],
        ['prices are per million tokens', 'expect(estimateCost(1000000, 0, { inPerM: 3, outPerM: 15 })).toBeCloseTo(3, 6)'],
        ['input and output are priced separately', 'expect(estimateCost(2000, 1000, { inPerM: 5, outPerM: 25 })).toBeCloseTo(0.035, 6)'],
      ],
      hints: ['`Math.ceil(text.length / 4)` rounds up, so a short string still counts as a token.', 'Divide each token count by `1e6` before multiplying by its price, then add the two parts.'],
    },
    {
      id: 'few-shot',
      title: 'A few-shot prompt',
      learn: `**Few-shot prompting** shows the model a handful of solved examples before the real input. The model copies the pattern: the format, the labels, the tone.

\`\`\`
Classify the ticket.

Input: App crashes on save
Output: bug

Input: Add a dark theme
Output:
\`\`\`

Ending with \`Output:\` leaves the model exactly one thing to do: fill in the answer.`,
      task: 'Write `buildFewShot(instruction, examples, input)`. Blocks are separated by a blank line: the instruction, then one `Input: ...` / `Output: ...` pair per example, then `Input: <input>` and a final `Output:` with nothing after it.',
      starter: `function buildFewShot(instruction, examples, input) {
  return instruction
}
`,
      solution: `function buildFewShot(instruction, examples, input) {
  const shots = examples.map((ex) => \`Input: \${ex.input}\\nOutput: \${ex.output}\`)
  return [instruction, ...shots, \`Input: \${input}\\nOutput:\`].join('\\n\\n')
}
`,
      tests: [
        ['builds the full prompt', 'expect(buildFewShot("Classify the ticket.", [{ input: "App crashes", output: "bug" }], "Add dark mode")).toBe("Classify the ticket.\\n\\nInput: App crashes\\nOutput: bug\\n\\nInput: Add dark mode\\nOutput:")'],
        ['keeps the examples in order', 'const p = buildFewShot("X", [{ input: "a", output: "1" }, { input: "b", output: "2" }], "c"); expect(p.indexOf("Output: 1")).toBeLessThan(p.indexOf("Output: 2"))'],
        ['works with zero examples', 'expect(buildFewShot("Sum it.", [], "2+2")).toBe("Sum it.\\n\\nInput: 2+2\\nOutput:")'],
        ['ends with "Output:" for the model to complete', 'expect(buildFewShot("X", [{ input: "a", output: "1" }], "b").endsWith("Output:")).toBe(true)'],
      ],
      hints: ['Map each example to the string `Input: ...` + a newline + `Output: ...`.', 'Put the instruction, the example strings and the final block in one array and `join("\\n\\n")` it.'],
    },
    {
      id: 'cosine-similarity',
      title: 'Cosine similarity',
      learn: `An **embedding** turns text into a vector of numbers; texts with similar meaning get vectors that point the same way.

**Cosine similarity** measures that angle: the dot product divided by both lengths.

\`\`\`
cos(a, b) = (a . b) / (|a| * |b|)
\`\`\`

\`1\` means same direction, \`0\` unrelated, \`-1\` opposite. Because it divides by the lengths, scaling a vector does not change the score.`,
      task: 'Write `cosine(a, b)` for two arrays of the same length. Return `0` if either vector is all zeros (instead of dividing by zero).',
      starter: `function cosine(a, b) {
  let dot = 0
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i]
  return dot
}
`,
      solution: `function cosine(a, b) {
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}
`,
      tests: [
        ['the same direction is 1', 'expect(cosine([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 6)'],
        ['scaling does not change the score', 'expect(cosine([1, 2, 3], [2, 4, 6])).toBeCloseTo(1, 6)'],
        ['orthogonal is 0, opposite is -1', 'expect(cosine([1, 0], [0, 1])).toBeCloseTo(0, 6); expect(cosine([1, 1], [-1, -1])).toBeCloseTo(-1, 6)'],
        ['a zero vector gives 0, not NaN', 'expect(cosine([0, 0], [1, 2])).toBe(0)'],
      ],
      hints: ['Track three sums in the loop: the dot product and the squared length of each vector.', 'Divide by `Math.sqrt(na) * Math.sqrt(nb)`, but return `0` first when either sum is `0`.'],
    },
    {
      id: 'chunking',
      title: 'Chunking with overlap',
      learn: `Documents are too long to embed whole, so RAG splits them into **chunks**. A little **overlap** between neighbours keeps a sentence that straddles a boundary findable from both sides.

With \`size = 3\` and \`overlap = 1\`, each chunk starts \`size - overlap = 2\` words after the last:

\`\`\`
"a b c d e f g" -> ["a b c", "c d e", "e f g"]
\`\`\`

If \`overlap >= size\` the window never moves forward, so reject it.`,
      task: 'Write `chunkWords(text, size, overlap)`: split on whitespace, return chunks of up to `size` words (joined by single spaces) that overlap by `overlap` words. Stop once a chunk reaches the last word. Throw if `overlap >= size`. Empty text gives `[]`.',
      starter: `function chunkWords(text, size, overlap) {
  return [text]
}
`,
      solution: `function chunkWords(text, size, overlap) {
  if (overlap >= size) throw new Error('overlap must be smaller than size')
  const words = text.split(/\\s+/).filter(Boolean)
  const chunks = []
  for (let i = 0; i < words.length; i += size - overlap) {
    chunks.push(words.slice(i, i + size).join(' '))
    if (i + size >= words.length) break
  }
  return chunks
}
`,
      tests: [
        ['overlaps neighbouring chunks', 'expect(chunkWords("a b c d e f g", 3, 1)).toEqual(["a b c", "c d e", "e f g"])'],
        ['no tiny trailing chunk after the last word', 'expect(chunkWords("a b c d e", 3, 1)).toEqual(["a b c", "c d e"])'],
        ['overlap 0 just splits, the last chunk may be short', 'expect(chunkWords("a  b c\\nd e", 4, 0)).toEqual(["a b c d", "e"])'],
        ['empty text gives no chunks', 'expect(chunkWords("", 3, 1)).toEqual([])'],
        ['rejects an overlap that never moves forward', 'expect(() => chunkWords("a b c", 2, 2)).toThrow()'],
      ],
      hints: ['`text.split(/\\s+/).filter(Boolean)` gives the words without empty strings.', 'Step the loop by `size - overlap`, push `words.slice(i, i + size).join(" ")`, and `break` once `i + size >= words.length`.'],
    },
    {
      id: 'rag-retrieval',
      title: 'Top-k retrieval and a RAG prompt',
      learn: `**RAG** (retrieval-augmented generation) answers from your data:

- embed the question and score every chunk against it
- keep the **top k** chunks, best first
- put them in the prompt, numbered, and tell the model to answer ==only from the sources== and cite them

Allowing "I don't know" is what stops the model from inventing an answer when retrieval missed.`,
      task: '`cosine` is given. Write `topK(queryVec, chunks, k)`: chunks are `{ id, text, vector }`; return the `k` best as copies with a `score` field, highest first, without reordering the input. Then write `ragPrompt(question, chunks)` that lists each chunk as `[1] text`, `[2] text`, ... and ends with `Question: <question>`. Include the words `only` and `I don\'t know` in the instructions.',
      starter: `function cosine(a, b) {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] ** 2; nb += b[i] ** 2 }
  return na && nb ? dot / Math.sqrt(na * nb) : 0
}

function topK(queryVec, chunks, k) {
  return chunks.slice(0, k)
}

function ragPrompt(question, chunks) {
  return question
}
`,
      solution: `function cosine(a, b) {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] ** 2; nb += b[i] ** 2 }
  return na && nb ? dot / Math.sqrt(na * nb) : 0
}

function topK(queryVec, chunks, k) {
  return chunks
    .map((c) => ({ ...c, score: cosine(queryVec, c.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
}

function ragPrompt(question, chunks) {
  const sources = chunks.map((c, i) => \`[\${i + 1}] \${c.text}\`).join('\\n')
  return [
    "Answer using only the sources below and cite them like [1]. If the answer is not in the sources, say \\"I don't know\\".",
    sources,
    \`Question: \${question}\`,
  ].join('\\n\\n')
}
`,
      tests: [
        ['returns the k most similar, best first', 'const docs = [{ id: "a", text: "A", vector: [0, 1] }, { id: "b", text: "B", vector: [1, 0] }, { id: "c", text: "C", vector: [1, 1] }]; expect(topK([1, 0], docs, 2).map((d) => d.id)).toEqual(["b", "c"])'],
        ['adds a score and does not reorder the input', 'const docs = [{ id: "a", text: "A", vector: [0, 1] }, { id: "b", text: "B", vector: [1, 0] }]; const top = topK([1, 0], docs, 1); expect(top[0].score).toBeCloseTo(1, 6); expect(docs[0].id).toBe("a"); expect(docs[0].score).toBeUndefined()'],
        ['numbers the sources', 'const p = ragPrompt("When?", [{ text: "Opens at 9" }, { text: "Closes at 5" }]); expect(p).toContain("[1] Opens at 9"); expect(p).toContain("[2] Closes at 5")'],
        ['ends with the question', 'expect(ragPrompt("When does it open?", [{ text: "x" }]).trim().endsWith("Question: When does it open?")).toBe(true)'],
        ['answers only from the sources, or says it does not know', 'const p = ragPrompt("Q", [{ text: "x" }]); expect(p).toMatch(/only/i); expect(p).toContain("I don\'t know")'],
      ],
      hints: ['Map each chunk to `{ ...c, score: cosine(queryVec, c.vector) }` first: the spread makes a copy, and `map` makes a new array to sort.', 'Build the sources with `chunks.map((c, i) => "[" + (i + 1) + "] " + c.text).join("\\n")`, then join the instructions, sources and question with blank lines.'],
    },
    {
      id: 'parse-json',
      title: 'Parsing and validating model JSON',
      learn: `Ask a model for JSON and you may get a code fence, a friendly sentence around it, or a field with the wrong type. Prefer the API's **structured outputs** (a JSON schema) when you can, but ==always validate before you trust it==.

A forgiving parser:

- takes the text from the first \`{\` to the last \`}\`
- \`JSON.parse\`s it inside \`try / catch\`
- checks each required field's \`typeof\`

Return a result object instead of throwing, so the caller can retry or fall back.`,
      task: 'Write `parseModelJson(text, required)`, where `required` maps field names to `typeof` names, e.g. `{ label: "string", confidence: "number" }`. Return `{ ok: true, value }`, or `{ ok: false, error }` when there is no valid JSON object or a field is missing or has the wrong type (the error names the field).',
      starter: `function parseModelJson(text, required) {
  return { ok: true, value: JSON.parse(text) }
}
`,
      solution: `function parseModelJson(text, required) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end < start) return { ok: false, error: 'no JSON object found' }
  let value
  try {
    value = JSON.parse(text.slice(start, end + 1))
  } catch {
    return { ok: false, error: 'invalid JSON' }
  }
  for (const [key, type] of Object.entries(required)) {
    if (typeof value[key] !== type) return { ok: false, error: \`missing or wrong type: \${key}\` }
  }
  return { ok: true, value }
}
`,
      tests: [
        ['reads JSON inside a code fence', 'const r = parseModelJson("\\u0060\\u0060\\u0060json\\n{\\"label\\": \\"bug\\", \\"confidence\\": 0.9}\\n\\u0060\\u0060\\u0060", { label: "string", confidence: "number" }); expect(r).toEqual({ ok: true, value: { label: "bug", confidence: 0.9 } })'],
        ['reads JSON wrapped in a sentence', 'const r = parseModelJson("Sure! {\\"label\\": \\"feature\\"} Hope that helps.", { label: "string" }); expect(r.ok).toBe(true); expect(r.value.label).toBe("feature")'],
        ['invalid JSON is not ok (and does not throw)', 'expect(parseModelJson("{label: bug}", { label: "string" }).ok).toBe(false); expect(parseModelJson("no json here", {}).ok).toBe(false)'],
        ['a wrong type names the field', 'const r = parseModelJson("{\\"label\\": \\"bug\\", \\"confidence\\": \\"high\\"}", { label: "string", confidence: "number" }); expect(r.ok).toBe(false); expect(r.error).toMatch(/confidence/)'],
        ['a missing field is not ok', 'expect(parseModelJson("{\\"label\\": \\"bug\\"}", { label: "string", confidence: "number" }).ok).toBe(false)'],
      ],
      hints: ['`text.indexOf("{")` and `text.lastIndexOf("}")` find the object; `slice(start, end + 1)` keeps the closing brace.', 'Loop over `Object.entries(required)` and compare `typeof value[key]` with the expected type name.'],
    },
    {
      id: 'agent-loop',
      title: 'An agent loop with tools',
      learn: `With **tool use**, the model replies with \`stop_reason: "tool_use"\` and one or more \`tool_use\` blocks: \`{ type: "tool_use", id, name, input }\`. Your code runs each tool and sends back, in the next user message, a \`tool_result\` block per call ==with the matching \`tool_use_id\`==.

\`\`\`
{ type: 'tool_result', tool_use_id: block.id, content: '...' }
\`\`\`

Repeat until \`stop_reason\` is \`"end_turn"\`. Guardrails: answer **every** tool call in the turn, report unknown tools or errors as \`is_error: true\` results instead of crashing, and cap the number of steps.`,
      task: 'Finish `runAgent(model, tools, prompt, maxSteps)`. `model(messages)` returns `{ stop_reason, content }`. Append the assistant `content`, run every `tool_use` block, and send one user message with all the `tool_result` blocks. Return `{ text, messages }` at `end_turn` (text = the text blocks joined). Throw `"too many steps"` after `maxSteps` model calls.',
      starter: `async function runAgent(model, tools, prompt, maxSteps = 5) {
  const messages = [{ role: 'user', content: prompt }]
  const res = await model(messages)
  // TODO: loop: run the tool_use blocks, send tool_result blocks back, until end_turn
  const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('')
  return { text, messages }
}
`,
      solution: `async function runAgent(model, tools, prompt, maxSteps = 5) {
  const messages = [{ role: 'user', content: prompt }]
  for (let step = 0; step < maxSteps; step++) {
    const res = await model(messages)
    messages.push({ role: 'assistant', content: res.content })
    if (res.stop_reason !== 'tool_use') {
      const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('')
      return { text, messages }
    }
    const results = []
    for (const block of res.content) {
      if (block.type !== 'tool_use') continue
      const tool = tools[block.name]
      if (!tool) {
        results.push({ type: 'tool_result', tool_use_id: block.id, content: \`Unknown tool: \${block.name}\`, is_error: true })
        continue
      }
      try {
        results.push({ type: 'tool_result', tool_use_id: block.id, content: String(await tool(block.input)) })
      } catch (e) {
        results.push({ type: 'tool_result', tool_use_id: block.id, content: e.message, is_error: true })
      }
    }
    messages.push({ role: 'user', content: results })
  }
  throw new Error('Agent stopped: too many steps')
}
`,
      tests: [
        ['answers directly when no tool is needed', 'const model = async () => ({ stop_reason: "end_turn", content: [{ type: "text", text: "Hi!" }] }); expect((await runAgent(model, {}, "hello")).text).toBe("Hi!")'],
        ['runs the tool and replies with the same tool_use_id', 'let calls = 0; const model = async (messages) => { calls++; if (calls === 1) return { stop_reason: "tool_use", content: [{ type: "tool_use", id: "toolu_1", name: "getOrder", input: { id: "A17" } }] }; const r = messages.at(-1).content[0]; return { stop_reason: "end_turn", content: [{ type: "text", text: r.tool_use_id + ": " + r.content }] } }; const out = await runAgent(model, { getOrder: ({ id }) => id + " shipped" }, "Where is A17?"); expect(out.text).toBe("toolu_1: A17 shipped")'],
        ['answers every tool call of a turn in one user message', 'let seen; let calls = 0; const model = async (messages) => { calls++; if (calls === 1) return { stop_reason: "tool_use", content: [{ type: "text", text: "Checking." }, { type: "tool_use", id: "t1", name: "add", input: { a: 1, b: 2 } }, { type: "tool_use", id: "t2", name: "add", input: { a: 3, b: 4 } }] }; seen = messages.at(-1); return { stop_reason: "end_turn", content: [{ type: "text", text: "done" }] } }; await runAgent(model, { add: ({ a, b }) => a + b }, "sums"); expect(seen.role).toBe("user"); expect(seen.content.map((r) => [r.tool_use_id, r.content])).toEqual([["t1", "3"], ["t2", "7"]])'],
        ['reports an unknown tool as an error result', 'let seen; let calls = 0; const model = async (messages) => { calls++; if (calls === 1) return { stop_reason: "tool_use", content: [{ type: "tool_use", id: "t9", name: "deleteAll", input: {} }] }; seen = messages.at(-1).content[0]; return { stop_reason: "end_turn", content: [{ type: "text", text: "ok" }] } }; await runAgent(model, {}, "x"); expect(seen.tool_use_id).toBe("t9"); expect(seen.is_error).toBe(true)'],
        ['stops after maxSteps', 'let calls = 0; const model = async () => { calls++; return { stop_reason: "tool_use", content: [{ type: "tool_use", id: "t" + calls, name: "ping", input: {} }] } }; await expect(runAgent(model, { ping: () => "pong" }, "loop", 3)).rejects.toMatch(/too many steps/); expect(calls).toBe(3)'],
      ],
      hints: ['Wrap the model call in `for (let step = 0; step < maxSteps; step++)` and push `{ role: "assistant", content: res.content }` every time.', 'Collect one `{ type: "tool_result", tool_use_id: block.id, content }` per `tool_use` block, then push them all as a single `{ role: "user", content: results }` message.'],
    },
    {
      id: 'retry-backoff',
      title: 'Retries with exponential backoff',
      learn: `LLM APIs return **429** (rate limited) and **5xx** (overloaded, server error) under load. Those are worth retrying; a **400** (bad request) will fail the same way every time, so throw it at once.

**Exponential backoff** waits longer after each failure so a busy service can recover:

\`\`\`
wait = baseMs * 2 ** attempt   // 500, 1000, 2000, ...
\`\`\`

In production add random jitter and honour a \`retry-after\` header. Here \`sleep\` is passed in, so the check runs instantly.`,
      task: 'Write `withRetry(call, { retries, baseMs, sleep })`: return `await call()`; on an error whose `status` is 429 or 500 and above, `await sleep(baseMs * 2 ** attempt)` and try again, up to `retries` retries. Rethrow other errors immediately, and the last error when retries run out.',
      starter: `async function withRetry(call, { retries = 3, baseMs = 500, sleep }) {
  return call()
}
`,
      solution: `async function withRetry(call, { retries = 3, baseMs = 500, sleep }) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await call()
    } catch (e) {
      const retryable = e.status === 429 || e.status >= 500
      if (!retryable || attempt >= retries) throw e
      await sleep(baseMs * 2 ** attempt)
    }
  }
}
`,
      tests: [
        ['returns the result when the call works', 'const sleep = fn(async () => {}); expect(await withRetry(async () => "ok", { retries: 3, baseMs: 100, sleep })).toBe("ok"); expect(sleep).toHaveBeenCalledTimes(0)'],
        ['retries a 429 until it works', 'let n = 0; const call = async () => { n++; if (n < 3) throw Object.assign(new Error("rate limited"), { status: 429 }); return "ok" }; expect(await withRetry(call, { retries: 3, baseMs: 100, sleep: async () => {} })).toBe("ok"); expect(n).toBe(3)'],
        ['waits baseMs * 2 ** attempt', 'let n = 0; const sleep = fn(async () => {}); const call = async () => { n++; if (n < 4) throw Object.assign(new Error("overloaded"), { status: 529 }); return "ok" }; await withRetry(call, { retries: 3, baseMs: 100, sleep }); expect(sleep.mock.calls).toEqual([[100], [200], [400]])'],
        ['does not retry a 400', 'let n = 0; const call = async () => { n++; throw Object.assign(new Error("bad request"), { status: 400 }) }; await expect(withRetry(call, { retries: 3, baseMs: 1, sleep: async () => {} })).rejects.toMatch("bad request"); expect(n).toBe(1)'],
        ['gives up after the retries with the last error', 'let n = 0; const call = async () => { n++; throw Object.assign(new Error("busy " + n), { status: 429 }) }; await expect(withRetry(call, { retries: 2, baseMs: 1, sleep: async () => {} })).rejects.toMatch("busy 3"); expect(n).toBe(3)'],
      ],
      hints: ['Loop forever with an `attempt` counter and `return await call()` inside `try`: the `await` is what lets `catch` see the rejection.', 'In `catch`, throw if the error is not retryable or `attempt >= retries`; otherwise `await sleep(baseMs * 2 ** attempt)` and loop.'],
    },
  ],
}
