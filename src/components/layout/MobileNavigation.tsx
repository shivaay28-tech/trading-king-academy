import { cn } from '@/utils/cn'
import { Award, BookOpen, Home, LayoutDashboard, Sparkles, UserRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const items = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/engine', label: 'Engine', icon: Sparkles },
  { to: '/my-courses', label: 'Courses', icon: BookOpen },
  { to: '/certificates', label: 'Awards', icon: Award },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

const adminItems = [
  { to: '/admin', label: 'Home', icon: Home },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen },
  { to: '/admin/students', label: 'People', icon: UserRound },
  { to: '/admin/reports', label: 'Reports', icon: Award },
  { to: '/profile', label: 'Profile', icon: LayoutDashboard },
]

export function MobileNavigation({ admin = false }: { admin?: boolean }) {
  const nav = admin ? adminItems : items
  return (
    <nav className="fixed right-0 bottom-0 left-0 z-30 border-t border-baazex/15 bg-white/95 shadow-[0_-12px_40px_-20px_rgb(0_102_255_/_0.35)] backdrop-blur-xl md:hidden">
      <ul className="grid grid-cols-5">
        {nav.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === '/admin' || item.to === '/dashboard'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold',
                  isActive ? 'text-accent' : 'text-muted',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
