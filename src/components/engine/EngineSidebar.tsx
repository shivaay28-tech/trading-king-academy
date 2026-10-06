import { Logo } from '@/components/ui/Logo'
import { useAuth } from '@/context/AuthContext'
import type { AiConversation, EnginePlan } from '@/types'
import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/format'
import { ChevronLeft, ChevronRight, MoreHorizontal, Plus, Search, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

export function EngineSidebar({
  collapsed,
  onToggle,
  conversations,
  activeId,
  query,
  onQuery,
  onNew,
  onSelect,
  onDelete,
  remaining,
  limit,
  plan,
}: {
  collapsed: boolean
  onToggle: () => void
  conversations: AiConversation[]
  activeId?: string
  query: string
  onQuery: (value: string) => void
  onNew: () => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  remaining: number
  limit: number
  plan: EnginePlan
}) {
  const { user } = useAuth()
  const visible = conversations.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-white/20 bg-navy text-ink shadow-[inset_-1px_0_0_rgb(255_255_255_/_0.18)] backdrop-blur-xl transition-all duration-200',
        collapsed ? 'w-[76px]' : 'w-[272px]',
      )}
    >
      <div className="flex items-center justify-between px-3 py-4">
        <Link to="/" className="min-w-0">
          <Logo light compact={collapsed} />
        </Link>
        <button type="button" onClick={onToggle} className="rounded-lg p-1.5 text-ink/50 hover:bg-white/8" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed ? (
        <div className="px-3">
          <button
            type="button"
            onClick={onNew}
            className="flex h-11 w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-semibold hover:bg-white/10"
          >
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4 text-ink" />
              New analysis
            </span>
            <kbd className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] tracking-wide text-ink/45">⌘K</kbd>
          </button>
          <p className="mt-4 px-1 text-[10px] font-bold tracking-[0.18em] text-ink/35 uppercase">Recent</p>
          <label className="mt-2 flex h-10 items-center gap-2 rounded-xl bg-white/70 px-3 text-ink/40">
            <Search className="h-4 w-4 shrink-0" />
            <input
              value={query}
              onChange={(event) => onQuery(event.target.value)}
              placeholder="Search conversations"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink/35"
            />
          </label>
        </div>
      ) : (
        <button type="button" onClick={onNew} className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-ink" aria-label="New analysis">
          <Plus className="h-4 w-4" />
        </button>
      )}

      <div className="mt-3 flex-1 space-y-1 overflow-y-auto px-2">
        {visible.map((item) => (
          <div key={item.id} className={cn('group flex items-center gap-1 rounded-xl', activeId === item.id && 'bg-white/8')}>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn('min-w-0 flex-1 truncate px-3 py-2.5 text-left text-sm', collapsed && 'px-0 text-center')}
            >
              {collapsed ? <MoreHorizontal className="mx-auto h-4 w-4" /> : (
                <>
                  <span className="block truncate font-medium text-ink/85">{item.title}</span>
                  <span className="block text-[11px] text-ink/35">{formatDate(item.updatedAt)}</span>
                </>
              )}
            </button>
            {!collapsed ? (
              <button type="button" className="hidden rounded-md p-1 text-ink/30 hover:text-danger group-hover:block" onClick={() => onDelete(item.id)} aria-label="Delete conversation">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <div className="border-t border-white/8 p-3">
        {user ? (
          <Link to="/profile" className="flex items-center gap-3 rounded-xl bg-white/5 p-2 hover:bg-white/8">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-baazex text-xs font-bold">{user.fullName.slice(0, 1)}</span>
            {collapsed ? null : (
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{user.fullName}</span>
                <span className="block text-[11px] text-ink/40">
                  {plan === 'basic' ? `${remaining} of ${limit} on Basic` : `${remaining} of ${limit} free`}
                </span>
              </span>
            )}
          </Link>
        ) : (
          <Link to="/login" state={{ from: '/engine' }} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2 hover:bg-white/8">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-warning/20 text-sm">?</span>
            {collapsed ? null : (
              <span>
                <span className="block text-sm font-semibold">Sign in</span>
                <span className="block text-[11px] text-ink/40">{remaining} of {limit} free</span>
              </span>
            )}
          </Link>
        )}
      </div>
    </aside>
  )
}
