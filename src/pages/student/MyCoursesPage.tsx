import { CourseCard } from '@/components/course/CourseCard'
import { Seo } from '@/components/Seo'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAcademy } from '@/context/AcademyContext'
import { BookOpen } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { APP_NAME } from '@/utils/constants'

const tabs = ['All Courses', 'In Progress', 'Completed', 'Saved Courses'] as const

export function MyCoursesPage() {
  const { courses, isEnrolled, isSaved, courseProgress } = useAcademy()
  const [tab, setTab] = useState<(typeof tabs)[number]>('All Courses')

  const list = useMemo(() => {
    const enrolled = courses.filter((course) => isEnrolled(course.id))
    if (tab === 'Saved Courses') return courses.filter((course) => isSaved(course.id))
    if (tab === 'Completed') return enrolled.filter((course) => courseProgress(course.id).percent === 100)
    if (tab === 'In Progress') {
      return enrolled.filter((course) => {
        const value = courseProgress(course.id).percent
        return value > 0 && value < 100
      })
    }
    return enrolled
  }, [courses, tab, isEnrolled, isSaved, courseProgress])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Seo title="My courses" description={`Courses you have enrolled in or saved on ${APP_NAME}.`} />
      <h1 className="text-3xl font-extrabold text-ink">My courses</h1>
      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${tab === item ? 'bg-baazex text-on-button shadow-float' : 'border border-white/10 bg-white/5 text-muted'}`}
          >
            {item}
          </button>
        ))}
      </div>
      {list.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            icon={BookOpen}
            title="Nothing in this list yet"
            description="Enrol from the catalogue or save a course to see it here."
            action={
              <Link to="/courses" className="rounded-xl bg-baazex px-4 py-2 text-sm font-semibold text-on-button">
                Browse courses
              </Link>
            }
          />
        </div>
      )}
    </div>
  )
}
