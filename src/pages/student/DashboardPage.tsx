import { CourseCard } from '@/components/course/CourseCard'
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard'
import { Seo } from '@/components/Seo'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAcademy } from '@/context/AcademyContext'
import { useAuth } from '@/context/AuthContext'
import { progressService } from '@/services/progress'
import { APP_NAME } from '@/utils/constants'
import { getCourseLessons } from '@/utils/course'
import { formatDate } from '@/utils/format'
import { Award, BookOpen, CheckCircle2, Clock3 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

export function DashboardPage() {
  const { user } = useAuth()
  const { courses, courseProgress, isEnrolled } = useAcademy()
  const navigate = useNavigate()
  const enrolled = courses.filter((course) => isEnrolled(course.id))
  const completed = enrolled.filter((course) => courseProgress(course.id).percent === 100)
  const inProgress = enrolled.filter((course) => {
    const value = courseProgress(course.id).percent
    return value > 0 && value < 100
  })
  const continueCourse = inProgress[0] ?? enrolled.find((course) => courseProgress(course.id).percent < 100)
  const continueLesson = continueCourse
    ? getCourseLessons(continueCourse).find(
        (lesson) => !progressService.completedLessonIds(user?.id ?? '', continueCourse.id).includes(lesson.id),
      )
    : undefined
  const activity = user ? progressService.activityFor(user.id).slice(0, 5) : []
  const certificates = user ? progressService.certificatesFor(user.id) : []
  const recommended = courses.filter((course) => !isEnrolled(course.id) && course.popular).slice(0, 3)
  const overall =
    enrolled.length === 0
      ? 0
      : Math.round(enrolled.reduce((sum, course) => sum + courseProgress(course.id).percent, 0) / enrolled.length)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Seo title="Dashboard" description={`Your ${APP_NAME} learning dashboard.`} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Welcome back</p>
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{user?.fullName}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => navigate('/engine')}>
            Open AI Engine
          </Button>
          <Button variant="ghost" onClick={() => navigate('/courses')}>
            Browse catalogue
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard label="Enrolled courses" value={enrolled.length} icon={BookOpen} />
        <DashboardStatCard label="In progress" value={inProgress.length} icon={Clock3} accent="navy" />
        <DashboardStatCard label="Completed" value={completed.length} icon={CheckCircle2} accent="green" />
        <DashboardStatCard label="Overall progress" value={`${overall}%`} icon={Award} hint="Average across enrolled courses" />
      </div>

      {enrolled.length ? (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-ink">Your courses</h2>
            <Link to="/my-courses" className="text-sm font-semibold text-accent">
              Open all
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {enrolled.map((course) => {
              const lessons = getCourseLessons(course)
              const done = progressService.completedLessonIds(user?.id ?? '', course.id)
              const next = lessons.find((lesson) => !done.includes(lesson.id)) ?? lessons[0]
              return (
                <Link
                  key={course.id}
                  to={next ? `/learn/${course.slug}/${next.slug}` : `/courses/${course.slug}`}
                  className="panel rounded-2xl p-4 hover:border-bright/40"
                >
                  <p className="font-bold text-ink">{course.title}</p>
                  <p className="mt-1 text-sm text-muted">{next?.title ?? 'Open the course'}</p>
                  <div className="mt-3">
                    <ProgressBar value={courseProgress(course.id).percent} size="sm" />
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      ) : null}

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <article className="rounded-3xl border border-bright/25 bg-navy p-6 text-ink shadow-[inset_0_0_80px_rgb(0_163_255_/_0.12)] lg:col-span-2">
          <p className="text-xs font-bold tracking-[0.16em] text-ink uppercase">Continue learning</p>
          {continueCourse ? (
            <>
              <h2 className="mt-2 text-2xl font-bold">{continueCourse.title}</h2>
              <p className="mt-2 text-sm text-ink/65">{continueLesson?.title ?? 'Review the course modules'}</p>
              <div className="mt-5 max-w-md">
                <ProgressBar value={courseProgress(continueCourse.id).percent} />
              </div>
              <Button
                className="mt-6"
                onClick={() =>
                  navigate(
                    continueLesson
                      ? `/learn/${continueCourse.slug}/${continueLesson.slug}`
                      : `/courses/${continueCourse.slug}`,
                  )
                }
              >
                Resume lesson
              </Button>
            </>
          ) : (
            <>
              <h2 className="mt-2 text-2xl font-bold">Choose a course to begin</h2>
              <p className="mt-2 text-sm text-ink/65">Enrol from the catalogue to start tracking lessons and quizzes.</p>
              <Button className="mt-6" onClick={() => navigate('/courses')}>
                Explore courses
              </Button>
            </>
          )}
        </article>
        <article className="panel rounded-3xl p-6">
          <h2 className="font-bold text-ink">Certificates</h2>
          {certificates.length ? (
            <ul className="mt-4 space-y-3">
              {certificates.map((item) => (
                <li key={item.id}>
                  <Link to={`/certificates/${item.id}`} className="block rounded-xl border border-white/8 bg-white/5 px-3 py-3">
                    <p className="text-sm font-semibold text-ink">{item.courseName}</p>
                    <p className="text-xs text-muted">{formatDate(item.completedAt)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">Complete all lessons and pass the quiz to receive a sample certificate.</p>
          )}
        </article>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <article className="panel rounded-3xl p-6">
          <h2 className="font-bold text-ink">Recent activity</h2>
          <ul className="mt-4 space-y-3">
            {activity.length ? (
              activity.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 border-b border-line pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-ink">{item.label}</p>
                    <p className="text-xs text-muted">{item.detail}</p>
                  </div>
                  <span className="text-[11px] text-muted">{formatDate(item.at)}</span>
                </li>
              ))
            ) : (
              <p className="text-sm text-muted">Your lesson completions and quiz results will appear here.</p>
            )}
          </ul>
        </article>
        <article className="panel rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-ink">Recommended courses</h2>
            <Link to="/courses" className="text-sm font-semibold text-accent">
              View all
            </Link>
          </div>
          <div className="mt-4 grid gap-4">
            {recommended.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </article>
      </div>
    </div>
  )
}
