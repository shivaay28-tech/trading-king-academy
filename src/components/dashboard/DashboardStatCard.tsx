import { cn } from '@/utils/cn'
import type { LucideIcon } from 'lucide-react'

export function DashboardStatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = 'blue',
}: {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
  accent?: 'blue' | 'navy' | 'green'
}) {
  return (
    <article className="panel rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-semibold text-muted">{label}</p>
        <span
          className={cn(
            'grid h-9 w-9 place-items-center rounded-xl',
            accent === 'blue' && 'bg-baazex/10 text-accent',
            accent === 'navy' && 'bg-bright/10 text-accent',
            accent === 'green' && 'bg-success/10 text-success',
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </article>
  )
}
