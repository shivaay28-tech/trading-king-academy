import type { ReactNode } from 'react'

export function EngineMarkdown({ text, caret = false }: { text: string; caret?: boolean }) {
  const blocks = text.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean)

  return (
    <div className={`space-y-3 text-sm leading-7 text-ink ${caret ? 'engine-caret' : ''}`}>
      {blocks.length === 0 && caret ? <p className="text-muted">Thinking…</p> : null}
      {blocks.map((block, index) => {
        const lines = block.split('\n')
        if (/^#{1,3}\s+/.test(block)) {
          const title = block.replace(/^#{1,3}\s+/, '')
          return (
            <p key={index} className="font-bold text-ink">
              {inline(title)}
            </p>
          )
        }
        const bullet = lines.length > 0 && lines.every((line) => /^[-•]\s+/.test(line.trim()) || line.trim() === '')
        if (bullet) {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {lines.filter(Boolean).map((line) => (
                <li key={line}>{inline(line.replace(/^[-•]\s+/, ''))}</li>
              ))}
            </ul>
          )
        }
        const numbered = lines.length > 0 && lines.every((line) => /^\d+\.\s+/.test(line.trim()) || line.trim() === '')
        if (numbered) {
          return (
            <ol key={index} className="list-decimal space-y-1 pl-5">
              {lines.filter(Boolean).map((line) => (
                <li key={line}>{inline(line.replace(/^\d+\.\s+/, ''))}</li>
              ))}
            </ol>
          )
        }
        if (block.startsWith('```')) {
          const code = block.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '')
          return (
            <pre key={index} className="overflow-x-auto rounded-xl bg-baazex/5 p-3 text-xs text-accent/90">
              {code}
            </pre>
          )
        }
        return (
          <p key={index} className="whitespace-pre-wrap">
            {inline(block)}
          </p>
        )
      })}
    </div>
  )
}

function inline(text: string) {
  const parts: ReactNode[] = []
  const pattern = /(\*\*(.+?)\*\*|`([^`]+)`)/g
  let last = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = pattern.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    if (match[2]) {
      parts.push(
        <strong key={key} className="font-bold text-ink">
          {match[2]}
        </strong>,
      )
    } else {
      parts.push(
        <code key={key} className="rounded bg-baazex/10 px-1 text-[12px] text-accent">
          {match[3]}
        </code>,
      )
    }
    key += 1
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}
