import { CourseCard } from '@/components/course/CourseCard'
import { SearchAndFilters } from '@/components/course/SearchAndFilters'
import { Seo } from '@/components/Seo'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAcademy } from '@/context/AcademyContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import type { Difficulty } from '@/types'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { APP_NAME } from '@/utils/constants'

export function CoursesPage() {
  const { courses, enrollMany, isEnrolled } = useAcademy()
  const { user } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState('all')
  const [difficulty, setDifficulty] = useState<Difficulty | 'All'>('All')
  const [selected, setSelected] = useState<string[]>([])
  const [enrolling, setEnrolling] = useState(false)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return courses.filter((course) => {
      const matchesQuery =
        !needle ||
        course.title.toLowerCase().includes(needle) ||
        course.subtitle.toLowerCase().includes(needle) ||
        course.description.toLowerCase().includes(needle)
      const matchesCategory = categoryId === 'all' || course.categoryId === categoryId
      const matchesDifficulty = difficulty === 'All' || course.difficulty === difficulty
      return matchesQuery && matchesCategory && matchesDifficulty && course.status === 'published'
    })
  }, [courses, query, categoryId, difficulty])

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Seo title="Courses" description={`Browse ${APP_NAME} courses on forex, CFDs, analysis, risk, MetaTrader 5, and introducing broker education.`} />
      <p className="text-xs font-bold tracking-[0.18em] text-accent uppercase">Catalogue</p>
      <h1 className="mt-2 text-4xl font-extrabold text-ink">Course listing</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Select more than one course and enrol together. After that, continue any of them from this catalogue, your dashboard, or a lesson link.
      </p>
      {selected.length ? (
        <div className="mt-5">
          <Button
            loading={enrolling}
            onClick={() => {
              if (!user) {
                navigate('/login', { state: { from: '/courses' } })
                return
              }
              const ids = selected.filter((id) => !isEnrolled(id))
              if (!ids.length) {
                push('info', 'Those courses are already on your list')
                return
              }
              setEnrolling(true)
              void enrollMany(ids)
                .then((added) => {
                  push('success', added === 1 ? '1 course added' : `${added} courses added`, 'Open any of them from your dashboard or My courses.')
                  setSelected([])
                })
                .finally(() => setEnrolling(false))
            }}
          >
            Enrol in {selected.length} {selected.length === 1 ? 'course' : 'courses'}
          </Button>
        </div>
      ) : null}
      <div className="mt-8">
        <SearchAndFilters
          query={query}
          onQuery={setQuery}
          categoryId={categoryId}
          onCategory={setCategoryId}
          difficulty={difficulty}
          onDifficulty={setDifficulty}
        />
      </div>
      {filtered.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              selected={selected.includes(course.id)}
              onToggle={
                isEnrolled(course.id)
                  ? undefined
                  : () =>
                      setSelected((current) =>
                        current.includes(course.id) ? current.filter((id) => id !== course.id) : [...current, course.id],
                      )
              }
            />
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            icon={Search}
            title="No courses match those filters"
            description="Try a different search term or reset the category and difficulty filters."
          />
        </div>
      )}
    </div>
  )
}
