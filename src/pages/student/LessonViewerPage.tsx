import { CourseCurriculumSidebar } from '@/components/course/LessonList'
import { Seo } from '@/components/Seo'
import { Button } from '@/components/ui/Button'
import { Disclaimer } from '@/components/ui/Disclaimer'
import { useAcademy } from '@/context/AcademyContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { catalogService } from '@/services/catalog'
import { progressService } from '@/services/progress'
import { APP_NAME } from '@/utils/constants'
import { findLesson, getAdjacentLessons, getCourseLessons } from '@/utils/course'
import { ChevronLeft, ChevronRight, Download, Menu, PanelLeftClose } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'

export function LessonViewerPage() {
  const { courseSlug, lessonSlug } = useParams()
  const course = catalogService.getCourse(courseSlug ?? '')
  const { user } = useAuth()
  const { completeLesson, enroll, isEnrolled, refresh } = useAcademy()
  const { push } = useToast()
  const navigate = useNavigate()
  const [sidebar, setSidebar] = useState(true)
  const [mobileCurriculum, setMobileCurriculum] = useState(false)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState('')

  const lesson = course && lessonSlug ? findLesson(course, lessonSlug) : undefined
  const adjacent = course && lessonSlug ? getAdjacentLessons(course, lessonSlug) : undefined
  const completedIds = user && course ? progressService.completedLessonIds(user.id, course.id) : []
  const completed = lesson ? completedIds.includes(lesson.id) : false

  useEffect(() => {
    if (user && lesson) {
      setNote(progressService.getNote(user.id, lesson.id)?.content ?? '')
    }
  }, [user, lesson])

  useEffect(() => {
    if (user && course && !isEnrolled(course.id)) {
      void enroll(course.id)
    }
  }, [user, course, enroll, isEnrolled])

  if (!course || !lesson) {
    return <Navigate to="/404" replace />
  }

  const activeCourse = course
  const activeLesson = lesson

  async function markComplete() {
    if (!user) return
    setSaving(true)
    await completeLesson(activeCourse.id, activeLesson.id, activeLesson.title)
    progressService.saveNote(user.id, activeLesson.id, note)
    setSaving(false)
    push('success', 'Lesson marked complete')
    refresh()
    const next = adjacent?.next
    if (next) navigate(`/learn/${activeCourse.slug}/${next.slug}`)
  }

  function downloadResource() {
    const blob = new Blob(
      [`${APP_NAME} resource\n\n${activeLesson.title}\n\n${activeLesson.content.join('\n\n')}\n\nEducational use only.`],
      { type: 'text/plain' },
    )
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${activeLesson.slug}-notes.txt`
    anchor.click()
    URL.revokeObjectURL(url)
    push('success', 'Resource downloaded')
  }

  const lessons = getCourseLessons(course)
  const quizReady = completedIds.length >= Math.max(1, lessons.length - 1)

  return (
    <div className="atmosphere flex min-h-dvh overflow-x-clip">
      <Seo title={lesson.title} description={lesson.summary} />
      {sidebar ? (
        <aside className="glass hidden w-[320px] shrink-0 overflow-y-auto border-r border-bright/15 p-4 lg:block">
          <Link to={`/courses/${course.slug}`} className="text-xs font-semibold text-accent">
            Back to course
          </Link>
          <h2 className="mt-3 text-sm font-bold text-ink">{course.title}</h2>
          <div className="mt-4">
            <CourseCurriculumSidebar course={course} completedIds={completedIds} currentSlug={lesson.slug} />
          </div>
        </aside>
      ) : null}

      {mobileCurriculum ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/55" aria-label="Close lessons" onClick={() => setMobileCurriculum(false)} />
          <aside className="relative h-full w-[min(100%,20rem)] overflow-y-auto bg-white p-4 shadow-float">
            <Link to={`/courses/${course.slug}`} className="text-xs font-semibold text-accent">
              Back to course
            </Link>
            <h2 className="mt-3 text-sm font-bold text-ink">{course.title}</h2>
            <div className="mt-4" onClick={() => setMobileCurriculum(false)}>
              <CourseCurriculumSidebar course={course} completedIds={completedIds} currentSlug={lesson.slug} />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-bright/15 bg-navy/78 px-4 py-3 backdrop-blur">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-lg hover:bg-white/8 lg:hidden"
            onClick={() => setMobileCurriculum(true)}
            aria-label="Open lessons"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button type="button" className="hidden rounded-lg p-2 hover:bg-white/8 lg:inline-flex" onClick={() => setSidebar((value) => !value)}>
            {sidebar ? <PanelLeftClose className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <p className="min-w-0 truncate text-sm font-semibold text-ink">{course.title}</p>
          <span className="shrink-0 text-xs text-muted">
            {(adjacent?.index ?? 0) + 1}/{adjacent?.total}
          </span>
        </div>

        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="overflow-hidden rounded-3xl border border-bright/20 bg-navy shadow-[inset_0_0_80px_rgb(0_163_255_/_0.12)]">
            <div className="flex aspect-video items-center justify-center bg-linear-to-br from-navy via-navy-700 to-baazex">
              <div className="text-center text-ink">
                <p className="text-xs tracking-[0.18em] text-ink uppercase">Lesson media</p>
                <p className="mt-2 text-lg font-bold">{lesson.title}</p>
                <p className="mt-1 text-xs text-ink/60">{lesson.durationMinutes} minute educational module</p>
              </div>
            </div>
          </div>

          <h1 className="mt-6 text-2xl font-extrabold text-ink sm:text-3xl">{lesson.title}</h1>
          <p className="mt-2 text-sm text-muted">{lesson.summary}</p>
          <div className="mt-6 space-y-4 text-sm leading-7 text-ink">
            {lesson.content.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button className="w-full sm:w-auto" variant="secondary" icon={<Download className="h-4 w-4" />} onClick={downloadResource}>
              Download resources
            </Button>
            <Button className="w-full sm:w-auto" loading={saving} onClick={markComplete}>
              {completed ? 'Completed · continue' : 'Mark as complete'}
            </Button>
          </div>

          <section className="panel mt-10 rounded-2xl p-5">
            <h2 className="font-bold text-ink">Notes</h2>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              onBlur={() => user && progressService.saveNote(user.id, lesson.id, note)}
              className="mt-3 min-h-28 w-full rounded-xl border border-line bg-white/5 p-3 text-sm text-ink outline-none focus:border-bright"
              placeholder="Capture definitions, questions, or items to review. Notes stay in this browser."
            />
          </section>

          <section className="panel mt-6 rounded-2xl p-5">
            <h2 className="font-bold text-ink">Short quiz</h2>
            <p className="mt-2 text-sm text-muted">
              When you have worked through the lessons, take the course quiz. The passing score is 70%.
            </p>
            <Button
              className="mt-4"
              variant="navy"
              disabled={!quizReady}
              onClick={() => navigate(`/quiz/${course.slug}/${course.quizId}`)}
            >
              {quizReady ? 'Open course quiz' : 'Complete more lessons to unlock'}
            </Button>
          </section>

          <div className="mt-8 flex items-center justify-between gap-3">
            {adjacent?.previous ? (
              <Button variant="secondary" icon={<ChevronLeft className="h-4 w-4" />} onClick={() => navigate(`/learn/${course.slug}/${adjacent.previous?.slug}`)}>
                Previous
              </Button>
            ) : (
              <span />
            )}
            {adjacent?.next ? (
              <Button icon={<ChevronRight className="h-4 w-4" />} onClick={() => navigate(`/learn/${course.slug}/${adjacent.next?.slug}`)}>
                Next lesson
              </Button>
            ) : (
              <Button onClick={() => navigate(`/quiz/${course.slug}/${course.quizId}`)}>Take quiz</Button>
            )}
          </div>

          <div className="mt-8">
            <Disclaimer compact />
          </div>
        </div>
      </div>
    </div>
  )
}
