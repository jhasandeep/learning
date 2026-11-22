import { highlight } from '@/components/notes/highlight'
import { Answer } from '@/components/questions/answer'

/** Lesson text: mini-markup paragraphs and bullets, plus ``` fenced code highlighted at build time. */
export async function LearnText({ text, lang }: { text: string; lang: string }) {
  const parts = text.split(/```\n?([\s\S]*?)```/)
  return (
    <div className="space-y-3 leading-relaxed">
      {await Promise.all(parts.map(async (part, i) => {
        if (i % 2 === 0) return part.trim() ? <Answer key={i} text={part.trim()} /> : null
        const html = await highlight(part.replace(/\n$/, ''), lang === 'text' ? 'bash' : lang)
        return <div key={i} className="note-box note-codecard note-pre !my-2 text-[13px]" dangerouslySetInnerHTML={{ __html: html }} />
      }))}
    </div>
  )
}
