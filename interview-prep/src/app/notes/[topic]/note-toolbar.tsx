'use client'

import { CircleCheck, Download, Lightbulb, Layers, MessageCircleQuestion, Network, PenLine, PenTool, Printer, SquareTerminal } from 'lucide-react'
import Link from 'next/link'
import { useSyncExternalStore } from 'react'
import { useToast } from '@/components/toast'
import { Button, buttonClass, cx } from '@/components/ui'
import { markNoteRead, useProgress } from '@/lib/progress'

const HAND_KEY = 'prep-arena:notes:hand'
const SIMPLE_KEY = 'prep-arena:notes:simple'

/** Applies the saved "handwritten" preference before paint (see the topic page). */
export const HAND_SCRIPT = `(function(){try{var d=document.documentElement;if(localStorage.getItem("${HAND_KEY}")==="1")d.setAttribute("data-notes-hand","1");if(localStorage.getItem("${SIMPLE_KEY}")==="1")d.setAttribute("data-notes-simple","1")}catch(e){}})()`

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb)
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-notes-hand', 'data-notes-simple'] })
  return () => obs.disconnect()
}

function useHand() {
  return useSyncExternalStore(subscribe, () => document.documentElement.dataset.notesHand === '1', () => false)
}

function useSimple() {
  return useSyncExternalStore(subscribe, () => document.documentElement.dataset.notesSimple === '1', () => false)
}

function toggleSimple() {
  const on = document.documentElement.dataset.notesSimple !== '1'
  if (on) document.documentElement.dataset.notesSimple = '1'
  else delete document.documentElement.dataset.notesSimple
  try {
    localStorage.setItem(SIMPLE_KEY, on ? '1' : '0')
  } catch {}
}

function toggleHand() {
  const on = document.documentElement.dataset.notesHand !== '1'
  if (on) document.documentElement.dataset.notesHand = '1'
  else delete document.documentElement.dataset.notesHand
  try {
    localStorage.setItem(HAND_KEY, on ? '1' : '0')
  } catch {}
}

export function NoteToolbar({ topicId, deckId, compilerLang, hasQuestions = true }: { topicId: string; deckId: string; compilerLang?: string; hasQuestions?: boolean }) {
  const hand = useHand()
  const simple = useSimple()
  const p = useProgress()
  const toast = useToast()
  const read = Boolean(p.notesRead[topicId])

  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <Button size="sm" onClick={toggleSimple} aria-pressed={simple} title="Hide code and tables: just the ideas, analogies and key points">
        <Lightbulb size={14} /> {simple ? 'Simple view: on' : 'Simple view'}
      </Button>
      <Button size="sm" onClick={toggleHand} aria-pressed={hand} title="Switch between the app style and the handwritten notes style">
        <PenLine size={14} /> {hand ? 'Handwritten: on' : 'Handwritten'}
      </Button>
      <Button size="sm" onClick={() => window.print()} title="Print or save as PDF (A4)">
        <Printer size={14} /> Print / PDF
      </Button>
      <a href={`/notes/${topicId}.pdf`} download className={buttonClass('secondary', 'sm')} title="Handwritten A4 PDF of this topic">
        <Download size={14} /> PDF
      </a>
      {hasQuestions && <Link href={`/questions/${topicId}`} className={buttonClass('secondary', 'sm')} title="The most asked interview questions for this topic"><MessageCircleQuestion size={14} /> Interview questions</Link>}
      <Link href={`/map/${topicId}`} className={buttonClass('secondary', 'sm')} title="Every idea in this topic on one zoomable map"><Network size={14} /> Mind map</Link>
      <Link href={`/board/${topicId}`} className={buttonClass('secondary', 'sm')} title="This topic as a hand-drawn whiteboard you can draw on and present"><PenTool size={14} /> Whiteboard</Link>
      <Link href={`/flashcards/${deckId}`} className={buttonClass('secondary', 'sm')}><Layers size={14} /> Flashcards</Link>
      {compilerLang && <Link href={`/compiler/${compilerLang}`} className={buttonClass('secondary', 'sm')}><SquareTerminal size={14} /> Compiler</Link>}
      <Button
        size="sm"
        variant={read ? 'secondary' : 'primary'}
        disabled={read}
        onClick={() => { const xp = markNoteRead(topicId); if (xp) toast(`Marked as read · +${xp} XP`, 'good') }}
        className={cx(read && 'text-good')}
      >
        <CircleCheck size={14} /> {read ? 'Read' : 'Mark as read'}
      </Button>
    </div>
  )
}
