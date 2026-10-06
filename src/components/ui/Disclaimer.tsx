import { DISCLAIMER } from '@/utils/constants'
import { cn } from '@/utils/cn'

export function Disclaimer({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <p className={cn(compact ? 'text-[11px] leading-relaxed text-muted' : 'text-sm leading-relaxed text-muted', className)}>
      {DISCLAIMER}
    </p>
  )
}
