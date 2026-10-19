'use client'

import { javascript } from '@codemirror/lang-javascript'
import { Prec } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import CodeMirror from '@uiw/react-codemirror'
import { useMemo } from 'react'
import { RUN_EVENT } from './editor-events'
import { useTheme } from './theme-toggle'

export default function CodeEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const theme = useTheme()
  const extensions = useMemo(
    () => [
      javascript(),
      // Ctrl/Cmd+Enter runs the tests instead of inserting a blank line.
      Prec.highest(keymap.of([{ key: 'Mod-Enter', run: (view) => { view.dom.dispatchEvent(new Event(RUN_EVENT, { bubbles: true })); return true } }])),
    ],
    [],
  )
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      theme={theme}
      height="100%"
      extensions={extensions}
      basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true, autocompletion: true, tabSize: 2 }}
      aria-label="Code editor"
      className="h-full"
    />
  )
}
