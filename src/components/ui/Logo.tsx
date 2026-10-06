import { APP_SHORT_NAME } from '@/utils/constants'
import { cn } from '@/utils/cn'
import { useId } from 'react'

export function Logo({
  light = false,
  compact = false,
  className,
}: {
  light?: boolean
  compact?: boolean
  className?: string
}) {
  const markId = useId()
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl border border-bright/30 bg-navy shadow-float">
        <svg viewBox="0 0 36 36" className="h-7 w-7" aria-hidden="true">
          <path
            d="M9 26V10h9.2c3.6 0 5.9 2.1 5.9 5.2 0 1.9-1 3.5-2.7 4.3 2.1.8 3.5 2.6 3.5 4.8 0 3.3-2.5 6.1-6.7 6.1H9Zm4.6-8.2h4.2c1.6 0 2.5-.8 2.5-2.1s-.9-2-2.5-2h-4.2v4.1Zm0 3.7v4.9h4.9c1.8 0 2.9-1 2.9-2.5s-1.1-2.4-2.9-2.4h-4.9Z"
            fill={`url(#${markId})`}
          />
          <path
            d="M7 28 13.5 21.5l4.2 3.4L24 16.5l5 4.6"
            stroke="#0A1F44"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <defs>
            <linearGradient id={markId} x1="9" y1="10" x2="28" y2="30">
              <stop stopColor="#0A1F44" />
              <stop offset="1" stopColor="#1468B8" />
            </linearGradient>
          </defs>
        </svg>
      </span>
      {compact ? null : (
        <span className="leading-tight">
          <span className={cn('block text-[13px] font-extrabold tracking-tight', light ? 'text-ink' : 'text-ink')}>
            {APP_SHORT_NAME}
          </span>
          <span className={cn('block text-[11px] font-semibold tracking-[0.18em] uppercase', light ? 'text-ink/80' : 'text-accent')}>
            Academy
          </span>
        </span>
      )}
    </span>
  )
}
