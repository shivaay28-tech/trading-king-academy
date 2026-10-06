import { cn } from '@/utils/cn'

export function LoadingSkeleton({ className, lines = 3 }: { className?: string; lines?: number }) {
  return (
    <div className={cn('animate-pulse space-y-3', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="h-3 rounded-full bg-line/80" style={{ width: `${88 - index * 12}%` }} />
      ))}
    </div>
  )
}

export function CourseCardSkeleton() {
  return (
    <div className="panel animate-pulse rounded-2xl p-5">
      <div className="h-24 rounded-xl bg-white/6" />
      <div className="mt-4 h-4 w-2/3 rounded bg-line" />
      <div className="mt-2 h-3 w-full rounded bg-line/80" />
      <div className="mt-2 h-3 w-5/6 rounded bg-line/70" />
    </div>
  )
}
