// Builds src/data/endless-bank.json: every injected bug that compiles and
// makes at least one test fail. Run with: npm run build:bank
import { writeFileSync } from 'node:fs'
import vm from 'node:vm'
import { ALGORITHMS } from '../src/data/algorithms.ts'
import { applyMutation, findMutations, lineOf, OPERATORS_BY_ID } from '../src/lib/mutate.ts'
import { compile, runCases, type CaseResult, type TestCase } from '../src/lib/testing.ts'

const TIMEOUT_MS = 250

type Result = { kind: 'ok'; results: CaseResult[] } | { kind: 'compile-error' } | { kind: 'timeout' }

function run(code: string, fnName: string, tests: TestCase[]): Result {
  let fn
  try {
    fn = compile(code, fnName)
  } catch {
    return { kind: 'compile-error' }
  }
  try {
    const results = vm.runInNewContext('runCases(fn, tests)', { runCases, fn, tests }, { timeout: TIMEOUT_MS }) as CaseResult[]
    return { kind: 'ok', results }
  } catch (e) {
    if ((e as { code?: string })?.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') return { kind: 'timeout' }
    throw e
  }
}

const bank = []
const perAlgo: Record<string, number> = {}

for (const algo of ALGORITHMS) {
  const base = run(algo.code, algo.fnName, algo.tests)
  if (base.kind !== 'ok' || !base.results.every((r) => r.passed)) {
    throw new Error(`Reference solution for ${algo.id} does not pass its own tests`)
  }
  const seen = new Set<string>()
  for (const m of findMutations(algo.code)) {
    const mutated = applyMutation(algo.code, m)
    if (seen.has(mutated)) continue
    seen.add(mutated)
    const r = run(mutated, algo.fnName, algo.tests)
    if (r.kind === 'compile-error') continue
    if (r.kind === 'ok' && r.results.every((x) => x.passed)) continue // equivalent mutant: not a real bug
    bank.push({
      algo: algo.id,
      op: m.op,
      category: OPERATORS_BY_ID[m.op].category,
      start: m.start,
      end: m.end,
      replacement: m.replacement,
      line: lineOf(algo.code, m.start),
      hangs: r.kind === 'timeout',
    })
    perAlgo[algo.id] = (perAlgo[algo.id] ?? 0) + 1
  }
}

writeFileSync(new URL('../src/data/endless-bank.json', import.meta.url), JSON.stringify(bank) + '\n')
console.log(`endless bank: ${bank.length} verified bugs across ${ALGORITHMS.length} algorithms`)
console.log(perAlgo)
