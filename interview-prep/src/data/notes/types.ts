// Content model for the in-app revision notes. Text fields support a tiny
// markup: `code`, **bold** and ==highlight==.

export type NoteCategory = 'Frontend' | 'Backend' | 'Databases' | 'DevOps & Tools'

export type Block =
  | { type: 'p'; text: string }
  | { type: 'def'; title?: string; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'steps'; items: string[] }
  /** `run`: open the snippet in the online compiler (lang = compiler language id). */
  | { type: 'code'; lang: string; title?: string; code: string; run?: boolean }
  | { type: 'table'; head: string[]; rows: string[][] }
  | { type: 'flow'; steps: string[]; caption?: string }
  /** "Think of X like a Y": a numbered story where each step maps a real-world role to the tech term. */
  | { type: 'analogy'; title: string; steps: AnalogyStep[]; caption?: string }
  | { type: 'mistake'; title?: string; text: string }
  | { type: 'tip'; text: string }
  | { type: 'revision'; text: string }

export interface AnalogyStep {
  icon: string
  /** The real-world role, e.g. "Customer (You)". */
  who: string
  /** The tech term it stands for, e.g. "Browser". */
  tech: string
  text: string
}

export interface NoteSection {
  id: string
  title: string
  blocks: Block[]
}

export interface NoteTopic {
  id: string
  title: string
  tagline: string
  category: NoteCategory
  badge: string
  color: string
  sections: NoteSection[]
  /** Rapid-fire interview Q&A; also becomes this topic's flashcard deck. */
  qa: [string, string][]
}
