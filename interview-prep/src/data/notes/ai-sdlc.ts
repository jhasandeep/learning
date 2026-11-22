import type { NoteTopic } from './types'

export const aiSdlc: NoteTopic = {
  id: 'ai-sdlc',
  title: 'AI in the SDLC',
  tagline: 'AI across plan, code, test, review, deploy and operate; coding agents, LLMOps and the risks',
  category: 'AI & LLMs',
  badge: 'SDLC',
  color: '#0d9488',
  sections: [
    {
      id: 'overview',
      title: 'What AI-assisted SDLC means',
      blocks: [
        { type: 'def', text: 'The **AI-assisted SDLC** uses AI tools in every phase of building software (requirements, design, code, test, review, deploy, operate) while ==humans stay accountable== for what ships.' },
        {
          type: 'table', head: ['Phase', 'How AI helps', 'Human owns'],
          rows: [
            ['Plan / requirements', 'Draft user stories, acceptance criteria, edge cases, specs from notes', 'Priorities, trade-offs, sign-off'],
            ['Design', 'Compare architectures, draft ADRs and API contracts, spot risks', 'The decision and its constraints'],
            ['Code', 'Autocomplete, chat, coding agents that edit files and run commands', 'Reviewing and owning the diff'],
            ['Test', 'Generate unit/e2e tests, test data, find missing cases', 'That tests check the right behaviour'],
            ['Review / CI', 'AI PR review, security scanning, summarising changes', 'Approval and merge'],
            ['Deploy / operate', 'Release notes, incident summaries, log and alert analysis', 'Production decisions, rollbacks'],
          ],
        },
        { type: 'tip', text: 'Think of AI as a very fast junior-to-mid engineer with no memory of your project: great output when given clear context and checks, risky when trusted blindly.' },
      ],
    },
    {
      id: 'coding-agents',
      title: 'Coding with AI: assistants and agents',
      blocks: [
        {
          type: 'table', head: ['Kind', 'Examples', 'Works on'],
          rows: [
            ['Inline completion', 'GitHub Copilot, Cursor Tab', 'The next lines you are typing'],
            ['Chat in the IDE', 'Copilot Chat, Cursor, Claude in the IDE', 'Explaining, small edits, Q&A about code'],
            ['Coding agents', 'Claude Code, Cursor agent, Copilot coding agent', 'Multi-file tasks: read code, edit, run tests, open a PR'],
          ],
        },
        {
          type: 'steps',
          items: [
            '**Give context**: a project instructions file (`CLAUDE.md` / `AGENTS.md`) with build/test commands, conventions and gotchas.',
            '**Describe the outcome**, not keystrokes: the goal, constraints and how to verify (which tests must pass).',
            '**Plan first** for big changes: ask for a plan, review it, then implement in small steps.',
            '**Let it verify**: the agent runs tests, linters and type checks itself and fixes what fails.',
            '**Review the diff** like a teammate\'s PR before merging.',
          ],
        },
        {
          type: 'code', lang: 'text', title: 'A good CLAUDE.md / AGENTS.md (excerpt)',
          code: `# Project notes for coding agents
- Install: npm ci   Test: npm test   Lint: npm run lint
- Next.js 16 App Router; params are Promises (await them)
- Never edit generated files in src/gen/
- DB changes need a migration in prisma/migrations
- Keep components server-side unless they need state`,
        },
        { type: 'mistake', text: 'Accepting a large AI diff because "the tests pass" without reading it. Agents can change tests to make them pass, add needless code, or touch unrelated files. Review the diff, especially tests and security-sensitive code.' },
      ],
    },
    {
      id: 'spec-driven',
      title: 'Spec-driven development and TDD with AI',
      blocks: [
        { type: 'def', text: '**Spec-driven development**: write (or co-write with AI) a short spec of behaviour, inputs, outputs and edge cases first; the spec becomes the agent\'s instructions and the basis for tests. ==The spec is the source of truth, not the prompt history.==' },
        {
          type: 'flow',
          steps: ['Spec / acceptance criteria', 'Failing tests', 'Agent implements', 'Tests + lint + types pass', 'Human review', 'Merge'],
          caption: 'TDD gives the agent a clear, checkable definition of done.',
        },
        {
          type: 'code', lang: 'javascript', title: 'Tests written from a spec (the agent must make them pass)', run: true,
          code: `// Spec: slugify(title) lowercases, trims, joins words with "-",
// drops symbols, and never returns two "-" in a row.
function slugify(title) {
  return title.toLowerCase().trim()
    .replace(/[^a-z0-9\\s-]/g, '')
    .replace(/[\\s-]+/g, '-')
    .replace(/^-|-$/g, '')
}

const cases = [
  ['Hello World', 'hello-world'],
  ['  Next.js 16: What\\'s New?  ', 'nextjs-16-whats-new'],
  ['a -- b', 'a-b'],
]
for (const [input, want] of cases) {
  const got = slugify(input)
  console.log(got === want ? 'PASS' : 'FAIL', JSON.stringify(input), '->', got)
}`,
        },
        {
          type: 'list',
          items: [
            'AI-generated tests often test the implementation, not the behaviour: check that they would fail on a real bug.',
            'Ask for edge cases explicitly: empty input, unicode, huge input, concurrency, permissions.',
            'Use mutation testing or "break the code and see if a test fails" to judge test quality.',
          ],
        },
      ],
    },
    {
      id: 'review-ci',
      title: 'AI in code review and CI/CD',
      blocks: [
        {
          type: 'list',
          items: [
            '**AI PR review**: a bot comments on bugs, security issues and style before a human reviews; humans still approve.',
            '**Security**: run SAST, dependency and secret scanning on AI-written code like any other code.',
            '**Summaries**: AI writes PR descriptions, release notes and changelogs from the diff.',
            '**CI fixing**: agents read failing CI logs and push fixes, within the PR\'s scope.',
          ],
        },
        {
          type: 'code', lang: 'text', title: 'A pipeline with AI checks (GitHub Actions style)',
          code: `on: pull_request
jobs:
  checks:
    steps:
      - run: npm ci && npm run lint && npm test
      - run: npm audit --audit-level=high   # dependency risks
      - uses: secret-scanner@v1             # leaked keys
      - uses: ai-code-review@v1             # comments on the PR
  # merge only with green checks + a human approval`,
        },
        { type: 'mistake', title: 'Hallucinated packages', text: 'AI can suggest packages that do not exist; attackers register those names (**slopsquatting**). Verify every new dependency: real repo, maintainers, downloads, and lock versions.' },
      ],
    },
    {
      id: 'llmops',
      title: 'LLMOps: the lifecycle of an AI feature',
      blocks: [
        { type: 'def', text: '**LLMOps** applies DevOps/MLOps discipline to features built on LLMs: prompts, models and retrieval are ==versioned, evaluated and monitored== like code.' },
        {
          type: 'flow',
          steps: ['Define task + success metric', 'Build eval set', 'Prompt / RAG / tools', 'Eval in CI', 'Canary release', 'Monitor quality, cost, latency', 'Feedback → new eval cases'],
        },
        {
          type: 'table', head: ['Practice', 'Why'],
          rows: [
            ['Version prompts in git', 'Review, roll back and A/B test prompt changes like code'],
            ['Eval gate in CI', 'A prompt or model change cannot merge if quality drops'],
            ['Pin model versions', 'Upgrade deliberately, re-running evals, instead of drifting'],
            ['Tracing', 'Each request: prompt, retrieved chunks, tool calls, tokens, latency, cost'],
            ['Online feedback', 'Thumbs up/down and corrections become new eval cases'],
          ],
        },
        {
          type: 'code', lang: 'javascript', title: 'An eval gate: block the release if quality drops', run: true,
          code: `const baseline = { accuracy: 0.91, p95LatencyMs: 2400, costPer1k: 3.1 }
const candidate = { accuracy: 0.93, p95LatencyMs: 2600, costPer1k: 2.4 }

const rules = [
  ['accuracy', (c, b) => c >= b - 0.01],         // no quality drop
  ['p95LatencyMs', (c, b) => c <= b * 1.2],      // at most 20% slower
  ['costPer1k', (c, b) => c <= b * 1.1],         // at most 10% dearer
]

let ok = true
for (const [metric, pass] of rules) {
  const good = pass(candidate[metric], baseline[metric])
  if (!good) ok = false
  console.log(good ? 'ok  ' : 'FAIL', metric, baseline[metric], '->', candidate[metric])
}
console.log(ok ? 'Ship it (canary first)' : 'Blocked: fix before release')`,
        },
      ],
    },
    {
      id: 'risks',
      title: 'Risks, governance and measuring impact',
      blocks: [
        {
          type: 'table', head: ['Risk', 'Mitigation'],
          rows: [
            ['Secrets / private code leaving', 'Approved tools with data-retention terms; never paste secrets; secret scanning'],
            ['Prompt injection via repo, issues, web pages', 'Treat content as data; sandbox agents; least-privilege tokens; approval for risky commands'],
            ['Insecure or wrong code', 'Code review, tests, SAST, threat modelling for sensitive areas'],
            ['Licensing / IP', 'Company policy on AI use; check provenance of large generated snippets'],
            ['Over-reliance, skills fade', 'Engineers explain and own the code; pair on hard parts'],
          ],
        },
        {
          type: 'list',
          items: [
            '**Agent guardrails**: run in a sandbox or container, limit network and file access, ask before destructive commands, cap steps and budget.',
            '**Measure outcomes, not output**: DORA metrics (deployment frequency, lead time, change failure rate, time to restore), cycle time, defect rates, developer satisfaction. Lines of code written by AI is a vanity metric.',
            '**When not to use AI**: when you cannot verify the result, for secrets-heavy or regulated code without approval, or when explaining the problem takes longer than solving it.',
          ],
        },
        { type: 'revision', text: 'AI in every phase, humans accountable. Give agents context (CLAUDE.md, specs, tests), make them verify, review every diff. Ship AI features with LLMOps: versioned prompts, eval gates, tracing, canaries. Guard against secrets leaks, prompt injection and fake packages; measure with DORA, not lines of code.' },
      ],
    },
  ],
  qa: [
    ['What is the AI-assisted SDLC?', 'Using AI in every phase (requirements, design, code, test, review, deploy, operate) while humans stay accountable for decisions and what ships.'],
    ['Copilot vs coding agent?', 'Copilots suggest code as you type or chat; agents take a goal, edit many files, run commands and tests, and can open a PR.'],
    ['How do you give a coding agent context?', 'A project instructions file (CLAUDE.md / AGENTS.md) with commands and conventions, a clear spec, and tests that define done.'],
    ['What is spec-driven development?', 'Write the behaviour and edge cases first; the spec drives the agent and the tests, and stays the source of truth.'],
    ['Why TDD works well with AI', 'Failing tests are a precise, checkable definition of done; the agent iterates until they pass, and you review the result.'],
    ['Biggest risks of AI-generated code?', 'Subtle bugs, insecure patterns, tests that do not test behaviour, hallucinated packages, leaked secrets, licensing questions.'],
    ['What is slopsquatting?', 'Attackers publish packages under names AI tools hallucinate; verify every new dependency before installing.'],
    ['What is LLMOps?', 'Running LLM features like software: versioned prompts, eval sets gating CI, pinned models, tracing, canaries and feedback loops.'],
    ['How do you safely run an autonomous agent?', 'Sandbox it, least-privilege credentials, approvals for risky actions, step and budget limits, and full logs.'],
    ['How do you measure AI\'s impact on a team?', 'Outcome metrics: DORA, cycle time, change failure rate, defects and developer satisfaction, not lines of code.'],
  ],
}
