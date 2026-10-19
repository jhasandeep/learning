'use client'

import { Check, Copy, Play } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { encodeShare } from '@/lib/share'

export function CodeActions({ code, runLang }: { code: string; runLang?: string }) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  const run = async () => {
    router.push(`/compiler/${runLang}#s=${await encodeShare({ code, stdin: '' })}`)
  }

  return (
    <div className="no-print flex items-center gap-1">
      <button type="button" onClick={copy} className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-slate-300 hover:bg-white/10" aria-label="Copy code">
        {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
      </button>
      {runLang && (
        <button type="button" onClick={run} className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[11px] font-medium text-white hover:bg-white/20" aria-label="Run this code in the online compiler">
          <Play size={12} /> Run in compiler
        </button>
      )}
    </div>
  )
}
