import { MobileNavigation } from '@/components/layout/MobileNavigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAcademy } from '@/context/AcademyContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

export function StudentLayout() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [collapsed, setCollapsed] = useState(false)
  const [query, setQuery] = useState('')
  const { courses } = useAcademy()
  const navigate = useNavigate()

  const filtered = query
    ? courses.filter((course) => course.title.toLowerCase().includes(query.toLowerCase()))
    : []

  return (
    <div className="atmosphere flex h-screen overflow-hidden">
      <div className="hidden md:block">
        <Sidebar collapsed={!isDesktop || collapsed} onToggle={() => setCollapsed((value) => !value)} query={query} onQuery={setQuery} />
      </div>
      <div className="relative min-w-0 flex-1 overflow-y-auto pb-20 md:pb-0">
        {query ? (
          <div className="glass absolute top-3 right-3 left-3 z-20 rounded-2xl p-3 md:left-auto md:w-80">
            {filtered.length ? (
              filtered.slice(0, 6).map((course) => (
                <button
                  type="button"
                  key={course.id}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-white/8"
                  onClick={() => {
                    setQuery('')
                    navigate(`/courses/${course.slug}`)
                  }}
                >
                  {course.title}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-muted">No matching courses.</p>
            )}
          </div>
        ) : null}
        <Outlet />
      </div>
      <MobileNavigation />
    </div>
  )
}
