'use client'

import { cpp } from '@codemirror/lang-cpp'
import { css } from '@codemirror/lang-css'
import { go } from '@codemirror/lang-go'
import { html } from '@codemirror/lang-html'
import { java } from '@codemirror/lang-java'
import { javascript } from '@codemirror/lang-javascript'
import { php } from '@codemirror/lang-php'
import { python } from '@codemirror/lang-python'
import { rust } from '@codemirror/lang-rust'
import { sql } from '@codemirror/lang-sql'
import { StreamLanguage } from '@codemirror/language'
import { csharp, dart, kotlin, scala } from '@codemirror/legacy-modes/mode/clike'
import { r } from '@codemirror/legacy-modes/mode/r'
import { ruby } from '@codemirror/legacy-modes/mode/ruby'
import { swift } from '@codemirror/legacy-modes/mode/swift'
import { Prec, type Extension } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import CodeMirror from '@uiw/react-codemirror'
import { useMemo } from 'react'
import { RUN_EVENT } from './editor-events'
import { useTheme } from './theme-toggle'

/** Syntax support for every compiler language (legacy modes where no Lezer grammar exists). */
function languageExtension(id: string): Extension {
  switch (id) {
    case 'python': return python()
    case 'r': return StreamLanguage.define(r)
    case 'sql': return sql()
    case 'html': return html({ autoCloseTags: true })
    case 'css': return css()
    case 'java': return java()
    case 'kotlin': return StreamLanguage.define(kotlin)
    case 'c':
    case 'cpp': return cpp()
    case 'csharp': return StreamLanguage.define(csharp)
    case 'typescript': return javascript({ typescript: true })
    case 'go': return go()
    case 'rust': return rust()
    case 'scala': return StreamLanguage.define(scala)
    case 'dart': return StreamLanguage.define(dart)
    case 'ruby': return StreamLanguage.define(ruby)
    case 'php': return php({ plain: false })
    case 'swift': return StreamLanguage.define(swift)
    case 'text': return []
    case 'jsx': return javascript({ jsx: true })
    default: return javascript()
  }
}

export default function CodeEditor({ value, onChange, language = 'javascript', fontSize = 14, height = '100%' }: {
  value: string
  onChange: (v: string) => void
  language?: string
  fontSize?: number
  height?: string
}) {
  const theme = useTheme()
  const extensions = useMemo(
    () => [
      languageExtension(language),
      EditorView.theme({ '&': { fontSize: `${fontSize}px` } }),
      // Ctrl/Cmd+Enter runs the code instead of inserting a blank line.
      Prec.highest(keymap.of([{ key: 'Mod-Enter', run: (view) => { view.dom.dispatchEvent(new Event(RUN_EVENT, { bubbles: true })); return true } }])),
    ],
    [language, fontSize],
  )
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      theme={theme}
      height={height}
      extensions={extensions}
      basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true, autocompletion: true, tabSize: language === 'go' ? 4 : 2 }}
      aria-label="Code editor"
      className="h-full"
    />
  )
}
