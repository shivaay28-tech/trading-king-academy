import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { ReactNode } from 'react'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="panel rounded-2xl border-dashed px-6 py-12 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-bright/20 bg-white/6 text-accent">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  )
}

export function EmptyAction({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <Button onClick={onClick} size="sm">
      {children}
    </Button>
  )
}
