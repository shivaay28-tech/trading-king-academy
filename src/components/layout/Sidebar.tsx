import { Logo } from '@/components/ui/Logo'
import { useAuth } from '@/context/AuthContext'
import { useAcademy } from '@/context/AcademyContext'
import { categories } from '@/data/categories'
import { cn } from '@/utils/cn'
import { initials } from '@/utils/format'
import {
  Award,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Shield,
  Sparkles,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'

const studentNav = [
  { to: '/engine', label: 'AI Engine', icon: Sparkles },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/my-courses', label: 'My Courses', icon: BookOpen },
  { to: '/certificates', label: 'Certificates', icon: Award },
  { to: '/profile', label: 'Settings', icon: Settings },
]

const adminNav = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen },
  { to: '/admin/students', label: 'Students', icon: Shield },
  { to: '/admin/reports', label: 'Reports', icon: Award },
]

export function Sidebar({
  collapsed,
  onToggle,
  admin = false,
  query,
  onQuery,
}: {
  collapsed: boolean
  onToggle: () => void
  admin?: boolean
  query: string
  onQuery: (value: string) => void
}) {
  const { user, logout } = useAuth()
  const { courses, isEnrolled } = useAcademy()
  const navigate = useNavigate()
  const items = admin ? adminNav : studentNav
  const recent = courses.filter((course) => isEnrolled(course.id)).slice(0, 4)

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-bright/15 bg-navy/90 text-ink shadow-[inset_-1px_0_0_rgb(92_225_255_/_0.12)] backdrop-blur-xl transition-all duration-200',
        collapsed ? 'w-[76px]' : 'w-[280px]',
      )}
    >
      <div className="flex items-center justify-between px-3 py-4">
        <NavLink to={admin ? '/admin' : '/dashboard'} className="min-w-0">
          <Logo light compact={collapsed} />
        </NavLink>
        <button
          type="button"
          onClick={onToggle}
          className="rounded-lg p-1.5 text-ink/60 hover:bg-white/10 hover:text-ink"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed ? (
        <div className="px-3">
          <button
            type="button"
            onClick={() => navigate(admin ? '/admin/courses' : '/courses')}
            className="flex h-11 w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-semibold hover:bg-white/10"
          >
            {admin ? 'Manage catalogue' : 'Continue learning'}
            <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] tracking-wide text-ink/50">⌘K</span>
          </button>
          <label className="mt-3 flex h-10 items-center gap-2 rounded-xl bg-white/70 px-3 text-ink/50">
            <Search className="h-4 w-4 shrink-0" />
            <input
              value={query}
              onChange={(event) => onQuery(event.target.value)}
              placeholder={admin ? 'Search admin' : 'Search courses'}
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink/35"
            />
          </label>
        </div>
      ) : null}

      <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-2" aria-label={admin ? 'Admin' : 'Student'}>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin' || item.to === '/dashboard'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold',
                isActive ? 'bg-baazex text-ink' : 'text-ink/70 hover:bg-white/8 hover:text-ink',
                collapsed && 'justify-center px-0',
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
          </NavLink>
        ))}

        {!admin && !collapsed ? (
          <>
            <p className="mt-5 px-3 text-[10px] font-bold tracking-[0.18em] text-ink/35 uppercase">Recent</p>
            <div className="mt-2 space-y-1">
              {recent.length ? (
                recent.map((course) => (
                  <NavLink
                    key={course.id}
                    to={`/courses/${course.slug}`}
                    className="block truncate rounded-lg px-3 py-2 text-xs text-ink/65 hover:bg-white/8 hover:text-ink"
                  >
                    {course.title}
                  </NavLink>
                ))
              ) : (
                <p className="px-3 text-xs text-ink/40">No enrolments yet.</p>
              )}
            </div>
            <p className="mt-5 px-3 text-[10px] font-bold tracking-[0.18em] text-ink/35 uppercase">Categories</p>
            <div className="mt-2 flex flex-wrap gap-1.5 px-2">
              {categories.slice(0, 6).map((category) => (
                <NavLink
                  key={category.id}
                  to={`/categories/${category.slug}`}
                  className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-ink/70 hover:border-bright/40 hover:text-ink"
                >
                  {category.name.split(' ')[0]}
                </NavLink>
              ))}
            </div>
          </>
        ) : null}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className={cn('flex items-center gap-3 rounded-xl bg-white/5 p-2', collapsed && 'justify-center')}>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-baazex text-xs font-bold">
            {initials(user?.fullName ?? 'BA')}
          </span>
          {collapsed ? null : (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user?.fullName}</p>
              <p className="truncate text-[11px] text-ink/45">{user?.email}</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            logout()
            navigate('/')
          }}
          className={cn(
            'mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink/60 hover:bg-white/8 hover:text-ink',
            collapsed && 'justify-center',
          )}
        >
          <LogOut className="h-4 w-4" />
          {collapsed ? <span className="sr-only">Log out</span> : 'Log out'}
        </button>
      </div>
    </aside>
  )
}
