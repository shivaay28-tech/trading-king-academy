import { useToast } from '@/context/ToastContext'
import { cn } from '@/utils/cn'
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react'

export function ToastViewport() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-60 flex w-[min(100%-2rem,24rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'glass pointer-events-auto flex gap-3 rounded-2xl p-3',
            toast.tone === 'success' && 'border-success/20',
            toast.tone === 'error' && 'border-danger/20',
            toast.tone === 'info' && 'border-baazex/20',
          )}
        >
          {toast.tone === 'success' ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" /> : null}
          {toast.tone === 'error' ? <CircleAlert className="mt-0.5 h-5 w-5 text-danger" /> : null}
          {toast.tone === 'info' ? <Info className="mt-0.5 h-5 w-5 text-accent" /> : null}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">{toast.title}</p>
            {toast.description ? <p className="mt-0.5 text-xs text-muted">{toast.description}</p> : null}
          </div>
          <button type="button" className="text-muted hover:text-ink" onClick={() => dismiss(toast.id)} aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
