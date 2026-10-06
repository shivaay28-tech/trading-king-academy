import { cn } from '@/utils/cn'
import { Eye, EyeOff } from 'lucide-react'
import { useState, type InputHTMLAttributes, type ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  trailing?: ReactNode
}

export function Input({ label, error, hint, trailing, className, id, type, ...props }: InputProps) {
  const [visible, setVisible] = useState(false)
  const inputId = id ?? props.name ?? label.replace(/\s+/g, '-').toLowerCase()
  const isPassword = type === 'password'
  const resolvedType = isPassword ? (visible ? 'text' : 'password') : type

  return (
    <label className="block" htmlFor={inputId}>
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      <span className="relative block">
        <input
          id={inputId}
          type={resolvedType}
          className={cn(
            'h-11 w-full rounded-xl border bg-white/5 px-3.5 text-sm text-ink outline-none transition placeholder:text-muted/70',
            error ? 'border-danger' : 'border-line focus:border-bright focus:shadow-[0_0_0_3px_rgb(92_225_255_/_0.15)]',
            (isPassword || Boolean(trailing)) && 'pr-11',
            className,
          )}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-muted hover:text-ink"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : trailing ? (
          <span className="absolute top-1/2 right-3 -translate-y-1/2 text-muted">{trailing}</span>
        ) : null}
      </span>
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}
      {hint && !error ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  )
}
