import { cn } from '@/utils/cn'

export function ProgressBar({
  value,
  size = 'md',
  label,
}: {
  value: number
  size?: 'sm' | 'md'
  label?: string
}) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className="w-full">
      {label ? (
        <div className="mb-1 flex items-center justify-between text-xs font-medium text-muted">
          <span>{label}</span>
          <span>{clamped}%</span>
        </div>
      ) : null}
      <div
        className={cn('overflow-hidden rounded-full bg-baazex/15', size === 'sm' ? 'h-1.5' : 'h-2.5')}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-baazex to-bright transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
