import type { BuildStep, Practice } from '../dsa/types'

// The system design course: every lesson explains one building block with a picture you can step through,
// a real-world example, working code in Python and JavaScript, a simulator, and exercises.
// Text fields support the notes mini-markup (`code`, **bold**, ==highlight==).

export type NodeKind = 'client' | 'lb' | 'server' | 'cache' | 'db' | 'queue' | 'cdn' | 'service' | 'worker' | 'gateway' | 'dns' | 'user'

export interface ArchNode {
  id: string
  label: string
  kind: NodeKind
  /** Position in a 100 x 56 drawing area (centre of the box). */
  x: number
  y: number
  /** Small text under the label, e.g. "3 replicas". */
  sub?: string
}

export interface ArchEdge {
  from: string
  to: string
  label?: string
}

/** One step of the animation: which parts light up and what is happening. */
export interface ArchFrame {
  caption: string
  /** Boxes that are doing something now. */
  active?: string[]
  /** Arrows the request travels along now. */
  flow?: [string, string][]
  /** Small tags next to boxes (for example "HIT" or "MISS"). */
  badges?: Record<string, string>
  /** Boxes shown as failed or overloaded. */
  bad?: string[]
}

export interface Arch {
  title: string
  nodes: ArchNode[]
  edges: ArchEdge[]
  frames: ArchFrame[]
}

export type SimId = 'load-balancer' | 'cache' | 'hash-ring' | 'rate-limiter' | 'queue' | 'breaker' | 'shortener' | 'autoscale' | 'cdn' | 'shard' | 'replication' | 'quorum' | 'jwt' | 'booking'

export interface QuizQuestion {
  q: string
  options: string[]
  /** Index of the right option. */
  answer: number
  why: string
}

export interface SdLesson {
  id: string
  title: string
  topic: string
  blurb: string
  /** The problem this building block solves. */
  why: { story: string; pains: string[] }
  /** The picture without the building block (optional) and with it. */
  before?: Arch
  how: Arch
  /** Labels of the two diagram tabs. Defaults to "Without it" / "With it". */
  tabs?: [string, string]
  realWorld: { name: string; text: string }[]
  tradeoffs: { gain: string[]; cost: string[]; useWhen: string[]; avoidWhen: string[] }
  /** How to build it, step by step, with code in both languages. */
  steps: BuildStep[]
  /** The simulator to play with (some lessons have only the diagram). */
  sim?: { id: SimId; intro: string; tryThis: string[] }
  practice: Practice
  quiz: QuizQuestion[]
  /** Questions an interviewer may ask, with a model answer. */
  interview: { q: string; a: string }[]
  mistakes: string[]
  recap: string
}

export interface SdModule {
  id: string
  title: string
  blurb: string
  color: string
  lessons: SdLesson[]
}
