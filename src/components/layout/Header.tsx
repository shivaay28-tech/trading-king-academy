import { Logo } from '@/components/ui/Logo'
import { useAuth } from '@/context/AuthContext'
import { APP_NAME } from '@/utils/constants'
import { cn } from '@/utils/cn'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home' },
  { to: '/engine', label: 'AI Engine' },
  { to: '/courses', label: 'Courses' },
  { to: '/learning-path', label: 'Learning Path' },
  { to: '/about', label: 'About Academy' },
  { to: '/faq', label: 'FAQ' },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-baazex/15 bg-white/90 shadow-[0_12px_40px_-24px_rgb(0_102_255_/_0.45)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <Link to="/" aria-label={`${APP_NAME} home`}>
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2 text-sm font-semibold tracking-wide transition',
                  isActive ? 'bg-baazex text-ink shadow-float' : 'text-ink/70 hover:text-accent',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="inline-flex h-9 items-center rounded-lg border border-baazex/25 px-3 text-sm font-semibold text-accent hover:bg-baazex/5"
              >
                Dashboard
              </Link>
              <Link
                to="/engine"
                className="inline-flex h-9 items-center rounded-lg bg-baazex px-4 text-sm font-semibold text-ink shadow-float hover:bg-baazex-600"
              >
                Open AI Engine
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 text-sm font-semibold text-ink/80 hover:text-accent">
                Login
              </Link>
              <Link
                to="/register"
                className="inline-flex h-9 items-center rounded-lg bg-baazex px-4 text-sm font-semibold text-ink shadow-float hover:bg-baazex-600"
              >
                Start Learning
              </Link>
            </>
          )}
        </div>
        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-lg text-accent lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open ? (
        <div className="max-h-[min(80dvh,calc(100dvh-3.5rem))] overflow-y-auto border-t border-line bg-white px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-semibold text-ink"
              >
                {link.label}
              </NavLink>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              {user ? (
                <Link
                  to="/engine"
                  onClick={() => setOpen(false)}
                  className="rounded-xl bg-baazex px-4 py-3 text-center text-sm font-semibold text-ink"
                >
                  Open AI Engine
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="px-3 py-2 text-sm font-semibold text-ink">
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setOpen(false)}
                    className="rounded-xl bg-baazex px-4 py-3 text-center text-sm font-semibold text-ink"
                  >
                    Start Learning
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
