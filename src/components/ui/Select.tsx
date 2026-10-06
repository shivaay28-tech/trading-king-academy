import { cn } from '@/utils/cn'
import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  options: Array<{ value: string; label: string }>
}

export function Select({ label, error, options, className, id, ...props }: SelectProps) {
  const selectId = id ?? props.name ?? label.replace(/\s+/g, '-').toLowerCase()
  return (
    <label className="block" htmlFor={selectId}>
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      <select
        id={selectId}
        className={cn(
          'h-11 w-full rounded-xl border bg-white/5 px-3.5 text-sm text-ink outline-none transition',
          error ? 'border-danger' : 'border-line focus:border-bright focus:shadow-[0_0_0_3px_rgb(92_225_255_/_0.15)]',
          className,
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}
    </label>
  )
}
