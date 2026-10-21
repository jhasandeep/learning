// "Interview syntax": the code interviewers ask you to write from memory,
// practised in the typing trainer (type it, then type it from memory).

export type SyntaxLang = 'javascript' | 'typescript' | 'jsx' | 'tsx' | 'python' | 'sql'

export interface SyntaxSnippet {
  /** kebab-case, unique within its set. */
  id: string
  title: string
  lang: SyntaxLang
  /** Plain ASCII, 2-space indents, at most 18 lines of at most 70 characters. */
  code: string
  /** One or two sentences: what it is and when interviewers ask for it (notes mini-markup allowed). */
  note: string
}

export interface SyntaxSet {
  id: string
  title: string
  snippets: SyntaxSnippet[]
}
