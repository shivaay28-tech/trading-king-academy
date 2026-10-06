import { cn } from '@/utils/cn'
import { Mic, MonitorUp, Paperclip, Phone, SendHorizonal, Square } from 'lucide-react'
import { useRef, type ClipboardEvent, type FormEvent, type ReactNode } from 'react'

export function EngineComposer({
  value,
  onChange,
  onSubmit,
  onAttach,
  onPasteFiles,
  onScreen,
  onVoice,
  onStop,
  disabled,
  sending,
  hasAttachments,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: (event?: FormEvent, value?: string) => void
  onAttach: () => void
  onPasteFiles: (files: File[]) => void
  onScreen: () => void
  onVoice: () => void
  onStop?: () => void
  disabled?: boolean
  sending?: boolean
  hasAttachments?: boolean
}) {
  const canSend = Boolean(value.trim() || hasAttachments)
  const fieldRef = useRef<HTMLTextAreaElement>(null)

  function handlePaste(event: ClipboardEvent<HTMLFormElement>) {
    const clipboard = event.clipboardData
    const files = Array.from(clipboard.items)
      .filter((item) => item.kind === 'file')
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file))
      .filter((file) => file.type.startsWith('image/') || file.type.startsWith('video/'))
      .map((file, index) => {
        if (file.name) return file
        const extension = file.type.split('/')[1] || 'png'
        return new File([file], `pasted-chart-${index + 1}.${extension}`, { type: file.type })
      })

    if (files.length) onPasteFiles(files)

    const text = clipboard.getData('text/plain')
    if (files.length && !text) event.preventDefault()
    if (!text) return

    event.preventDefault()
    const field = fieldRef.current
    const start = field?.selectionStart ?? value.length
    const end = field?.selectionEnd ?? value.length
    const next = `${value.slice(0, start)}${text}${value.slice(end)}`
    onChange(next)
    const cursor = start + text.length
    requestAnimationFrame(() => {
      field?.focus()
      field?.setSelectionRange(cursor, cursor)
    })
  }

  return (
    <form
      onSubmit={onSubmit}
      onPaste={handlePaste}
      className={cn(
        'rounded-[28px] border border-baazex/30 bg-white p-3 shadow-[0_0_0_1px_rgb(0_102_255_/_0.12),0_16px_40px_-24px_rgb(0_102_255_/_0.45)]',
        disabled ? 'border-white/10 opacity-70' : 'border-bright/35',
      )}
    >
      <textarea
        ref={fieldRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            if (sending) return
            onSubmit(event, event.currentTarget.value)
          }
        }}
        placeholder="Ask anything about markets, charts, MT5, or risk…"
        rows={2}
        disabled={disabled}
        className="w-full resize-none bg-transparent px-2 pt-1 text-sm text-ink outline-none placeholder:text-muted"
      />
      <div className="mt-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <IconButton label="Attach image or video" onClick={onAttach}>
            <Paperclip className="h-4 w-4" />
          </IconButton>
          <IconButton label="Share screen" onClick={onScreen}>
            <MonitorUp className="h-4 w-4" />
          </IconButton>
          <IconButton label="Record a voice note" onClick={onVoice}>
            <Mic className="h-4 w-4" />
          </IconButton>
          <span className="hidden items-center gap-1 px-2 text-muted sm:inline-flex" title="Live voice is not enabled in this educational demo">
            <Phone className="h-4 w-4" />
          </span>
        </div>
        <div className="flex items-center gap-2">
          <p className="hidden text-[11px] text-muted sm:block">Live tutor · results are not guaranteed</p>
          {sending ? (
            <button
              type="button"
              onClick={onStop}
              className="grid h-9 w-9 place-items-center rounded-full bg-baazex/10 text-accent hover:bg-baazex/20"
              aria-label="Stop generating"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={disabled || !canSend}
              className="grid h-9 w-9 place-items-center rounded-full bg-baazex text-ink disabled:bg-line disabled:text-muted"
              aria-label="Send"
            >
              <SendHorizonal className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </form>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-baazex/8 hover:text-accent">
      {children}
    </button>
  )
}
