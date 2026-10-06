import { cn } from '@/utils/cn'
import type { Difficulty } from '@/types'

const styles: Record<Difficulty, string> = {
  Beginner: 'border border-bright/25 bg-bright/10 text-accent',
  Intermediate: 'border border-baazex/40 bg-baazex/10 text-accent',
  Advanced: 'border border-baazex/30 bg-baazex/10 text-accent',
}

export function DifficultyBadge({ level }: { level: Difficulty }) {
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide', styles[level])}>
      {level}
    </span>
  )
}
