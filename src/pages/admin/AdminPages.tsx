import { Seo } from '@/components/Seo'
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { useAcademy } from '@/context/AcademyContext'
import { useToast } from '@/context/ToastContext'
import { categories } from '@/data/categories'
import { countries } from '@/data/countries'
import { authService } from '@/services/auth'
import { catalogService } from '@/services/catalog'
import { APP_NAME } from '@/utils/constants'
import { progressService } from '@/services/progress'
import type { Course, Difficulty, Lesson, Module, SessionUser } from '@/types'
import { getCourseLessons, getLessonCount, progressPercent } from '@/utils/course'
import { formatDate } from '@/utils/format'
import { Award, BookOpen, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

export function AdminDashboardPage() {
  const { courses } = useAcademy()
  const students = authService.listUsers().filter((user) => user.role === 'student')
  const enrollments = progressService.allEnrollments()
  const certificates = progressService.allCertificates()

  return (
    <div className="px-4 py-8 sm:px-6">
      <Seo title="Admin dashboard" description={`${APP_NAME} administration overview.`} />
      <h1 className="text-3xl font-extrabold text-ink">Admin dashboard</h1>
      <p className="mt-2 text-sm text-muted">Live enrolment, student, and certificate counts for this academy.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard label="Published courses" value={courses.filter((item) => item.status === 'published').length} icon={BookOpen} />
        <DashboardStatCard label="Students" value={students.length} icon={Users} accent="navy" />
        <DashboardStatCard label="Enrolments" value={enrollments.length} icon={Award} />
        <DashboardStatCard label="Certificates issued" value={certificates.length} icon={Award} accent="green" />
      </div>
    </div>
  )
}

export function AdminCoursesPage() {
  const { courses, refresh } = useAcademy()
  const { push } = useToast()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Course | null>(null)

  const filtered = courses.filter((course) => course.title.toLowerCase().includes(query.toLowerCase()))

  async function save(addAnother = false) {
    if (!editing) return
    try {
      await catalogService.saveCourse(editing)
      refresh()
      push('success', 'Course saved')
      setEditing(addAnother ? catalogService.createEmptyCourse() : null)
    } catch (error) {
      push('error', 'Could not save course', error instanceof Error ? error.message : 'Try again.')
    }
  }

  return (
    <AdminTable
      title="Manage courses"
      query={query}
      onQuery={setQuery}
      onCreate={() => setEditing(catalogService.createEmptyCourse())}
    >
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="text-xs tracking-wide text-muted uppercase">
          <tr>
            <th className="px-3 py-2">Title</th>
            <th className="px-3 py-2">Level</th>
            <th className="px-3 py-2">Lessons</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {filtered.map((course) => (
            <tr key={course.id} className="border-t border-line">
              <td className="px-3 py-3 font-semibold text-ink">{course.title}</td>
              <td className="px-3 py-3">{course.difficulty}</td>
              <td className="px-3 py-3">{getLessonCount(course)}</td>
              <td className="px-3 py-3">{course.status}</td>
              <td className="px-3 py-3 text-right">
                <button type="button" className="mr-2 text-accent" onClick={() => setEditing(course)} aria-label={`Edit ${course.title}`}>
                  <Pencil className="inline h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="text-danger"
                  onClick={() => {
                    void catalogService.deleteCourse(course.id).then(
                      () => {
                        refresh()
                        push('info', 'Course removed')
                      },
                      (error: unknown) => {
                        push('error', 'Could not delete course', error instanceof Error ? error.message : 'Try again.')
                      },
                    )
                  }}
                  aria-label={`Delete ${course.title}`}
                >
                  <Trash2 className="inline h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Modal open={Boolean(editing)} title="Course editor" onClose={() => setEditing(null)} wide>
        {editing ? (
          <div className="grid gap-4">
            <Input label="Title" value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} />
            <Input label="Subtitle" value={editing.subtitle} onChange={(event) => setEditing({ ...editing, subtitle: event.target.value })} />
            <label className="block text-sm font-semibold text-ink">
              Description
              <textarea
                className="mt-1.5 min-h-24 w-full rounded-xl border border-line bg-white/5 p-3 text-sm font-normal text-ink"
                value={editing.description}
                onChange={(event) => setEditing({ ...editing, description: event.target.value })}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Category"
                value={editing.categoryId}
                onChange={(event) => setEditing({ ...editing, categoryId: event.target.value })}
                options={categories.map((item) => ({ value: item.id, label: item.name }))}
              />
              <Select
                label="Difficulty"
                value={editing.difficulty}
                onChange={(event) => setEditing({ ...editing, difficulty: event.target.value as Difficulty })}
                options={['Beginner', 'Intermediate', 'Advanced'].map((item) => ({ value: item, label: item }))}
              />
              <Select
                label="Status"
                value={editing.status}
                onChange={(event) => setEditing({ ...editing, status: event.target.value as Course['status'] })}
                options={[
                  { value: 'published', label: 'Published' },
                  { value: 'draft', label: 'Draft' },
                ]}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void save(false)}>Save course</Button>
              <Button variant="secondary" onClick={() => void save(true)}>
                Save and add another
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </AdminTable>
  )
}

export function AdminModulesPage() {
  const { courses, refresh } = useAcademy()
  const { push } = useToast()
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '')
  const course = courses.find((item) => item.id === courseId)
  const [moduleTitle, setModuleTitle] = useState('')

  function addModule() {
    if (!course || !moduleTitle.trim()) return
    const next: Module = {
      id: `mod-${Date.now()}`,
      title: moduleTitle.trim(),
      order: course.modules.length + 1,
      lessons: [],
    }
    void catalogService.saveCourse({ ...course, modules: [...course.modules, next] }).then(
      () => {
        setModuleTitle('')
        refresh()
        push('success', 'Module added')
      },
      (error: unknown) => {
        push('error', 'Could not save module', error instanceof Error ? error.message : 'Try again.')
      },
    )
  }

  return (
    <div className="px-4 py-8 sm:px-6">
      <Seo title="Manage modules" description="Create and review course modules." />
      <h1 className="text-3xl font-extrabold text-ink">Manage modules</h1>
      <div className="mt-6 max-w-sm">
        <Select
          label="Course"
          value={courseId}
          onChange={(event) => setCourseId(event.target.value)}
          options={courses.map((item) => ({ value: item.id, label: item.title }))}
        />
      </div>
      <div className="mt-4 flex max-w-xl gap-2">
        <div className="flex-1">
          <Input label="New module title" value={moduleTitle} onChange={(event) => setModuleTitle(event.target.value)} />
        </div>
        <Button className="mt-7" onClick={addModule} icon={<Plus className="h-4 w-4" />}>
          Add
        </Button>
      </div>
      <div className="mt-6 grid gap-3">
        {course?.modules.map((module) => (
          <article key={module.id} className="rounded-2xl panel p-4">
            <p className="font-bold text-ink">{module.title}</p>
            <p className="text-sm text-muted">{module.lessons.length} lessons</p>
          </article>
        ))}
      </div>
    </div>
  )
}

export function AdminLessonsPage() {
  const { courses, refresh } = useAcademy()
  const { push } = useToast()
  const [query, setQuery] = useState('')
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '')
  const course = courses.find((item) => item.id === courseId)
  const rows = useMemo(() => {
    return courses.flatMap((item) =>
      getCourseLessons(item).map((lesson) => ({ course: item, lesson })),
    ).filter((row) => row.lesson.title.toLowerCase().includes(query.toLowerCase()))
  }, [courses, query])

  function addLesson() {
    if (!course) return
    const firstModule = course.modules[0]
    if (!firstModule) {
      push('error', 'Add a module first')
      return
    }
    const lesson: Lesson = {
      id: `lesson-${Date.now()}`,
      slug: `lesson-${Date.now()}`,
      title: 'New lesson',
      durationMinutes: 10,
      order: firstModule.lessons.length + 1,
      summary: 'Draft lesson',
      content: ['Draft content for this educational lesson.'],
      resourceName: 'Lesson notes (PDF)',
    }
    const modules = course.modules.map((module, index) =>
      index === 0 ? { ...module, lessons: [...module.lessons, lesson] } : module,
    )
    void catalogService.saveCourse({ ...course, modules }).then(
      () => {
        refresh()
        push('success', 'Lesson added to the first module')
      },
      (error: unknown) => {
        push('error', 'Could not save lesson', error instanceof Error ? error.message : 'Try again.')
      },
    )
  }

  return (
    <AdminTable title="Manage lessons" query={query} onQuery={setQuery} onCreate={addLesson}>
      <div className="mb-4 max-w-sm">
        <Select
          label="Add lesson to course"
          value={courseId}
          onChange={(event) => setCourseId(event.target.value)}
          options={courses.map((item) => ({ value: item.id, label: item.title }))}
        />
      </div>
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="text-xs text-muted uppercase">
          <tr>
            <th className="px-3 py-2">Lesson</th>
            <th className="px-3 py-2">Course</th>
            <th className="px-3 py-2">Duration</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.lesson.id} className="border-t border-line">
              <td className="px-3 py-3 font-semibold text-ink">{row.lesson.title}</td>
              <td className="px-3 py-3">{row.course.title}</td>
              <td className="px-3 py-3">{row.lesson.durationMinutes} min</td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminTable>
  )
}

export function AdminStudentsPage() {
  const { push } = useToast()
  const { revision } = useAcademy()
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [countryCode, setCountryCode] = useState('AE')
  const [mobile, setMobile] = useState('')
  const [students, setStudents] = useState<SessionUser[]>(() => authService.listUsers())

  useEffect(() => {
    void authService.refreshUsers().then(setStudents)
  }, [revision])

  const filtered = students.filter(
    (user) =>
      user.fullName.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase()),
  )

  async function createStudent() {
    const country = countries.find((item) => item.code === countryCode)
    if (!fullName.trim() || !email.trim() || password.length < 8) {
      push('error', 'Name, email, and an 8-character password are required')
      return
    }
    setSaving(true)
    const result = await authService.createStudent({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      country: country?.name ?? '',
      countryCode,
      mobile: mobile.trim(),
    })
    setSaving(false)
    if (!result.ok) {
      push('error', 'Could not create student', result.message)
      return
    }
    const next = await authService.refreshUsers()
    setStudents(next)
    setCreating(false)
    setFullName('')
    setEmail('')
    setPassword('')
    setMobile('')
    push('success', 'Student created', result.user?.email ?? result.message)
  }

  return (
    <>
      <AdminTable title="Manage students" query={query} onQuery={setQuery} onCreate={() => setCreating(true)} createLabel="Create student">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs text-muted uppercase">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Country</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-t border-line">
                <td className="px-3 py-3 font-semibold text-ink">{user.fullName}</td>
                <td className="px-3 py-3">{user.email}</td>
                <td className="px-3 py-3">{user.country}</td>
                <td className="px-3 py-3">{user.role}</td>
                <td className="px-3 py-3">{formatDate(user.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTable>
      <Modal open={creating} title="Create student" onClose={() => setCreating(false)}>
        <div className="grid gap-4">
          <Input label="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
          <Input label="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Select
            label="Country"
            value={countryCode}
            onChange={(event) => setCountryCode(event.target.value)}
            options={countries.map((item) => ({ value: item.code, label: `${item.name} (${item.dial})` }))}
          />
          <Input
            label="Mobile number"
            inputMode="numeric"
            value={mobile}
            onChange={(event) => setMobile(event.target.value.replace(/[^\d]/g, ''))}
          />
          <Input label="Temporary password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={() => void createStudent()}>
              Create account
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export function AdminQuizzesPage() {
  const quizzes = catalogService.listQuizzes()
  const { courses } = useAcademy()
  return (
    <div className="px-4 py-8 sm:px-6">
      <Seo title="Quiz management" description="Review Academy knowledge checks." />
      <h1 className="text-3xl font-extrabold text-ink">Quiz management</h1>
      <div className="mt-6 overflow-x-auto rounded-2xl panel">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs text-muted uppercase">
            <tr>
              <th className="px-3 py-2">Quiz</th>
              <th className="px-3 py-2">Course</th>
              <th className="px-3 py-2">Questions</th>
              <th className="px-3 py-2">Pass mark</th>
            </tr>
          </thead>
          <tbody>
            {quizzes.map((quiz) => (
              <tr key={quiz.id} className="border-t border-line">
                <td className="px-3 py-3 font-semibold text-ink">{quiz.title}</td>
                <td className="px-3 py-3">{courses.find((course) => course.id === quiz.courseId)?.title}</td>
                <td className="px-3 py-3">{quiz.questions.length}</td>
                <td className="px-3 py-3">{quiz.passingScore}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function AdminCertificatesPage() {
  const records = progressService.allCertificates()
  return (
    <div className="px-4 py-8 sm:px-6">
      <Seo title="Certificate management" description="Issued educational certificates." />
      <h1 className="text-3xl font-extrabold text-ink">Certificate management</h1>
      <div className="mt-6 overflow-x-auto rounded-2xl panel">
        {records.length ? (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs text-muted uppercase">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Student</th>
                <th className="px-3 py-2">Course</th>
                <th className="px-3 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {records.map((item) => (
                <tr key={item.id} className="border-t border-line">
                  <td className="px-3 py-3 font-semibold text-ink">{item.id}</td>
                  <td className="px-3 py-3">{item.studentName}</td>
                  <td className="px-3 py-3">{item.courseName}</td>
                  <td className="px-3 py-3">{formatDate(item.completedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6">
            <EmptyState icon={Award} title="No certificates issued" description="Certificates appear after a student completes lessons and passes the quiz." />
          </div>
        )}
      </div>
    </div>
  )
}

export function AdminReportsPage() {
  const { courses } = useAcademy()
  const enrollments = progressService.allEnrollments()

  return (
    <div className="px-4 py-8 sm:px-6">
      <Seo title="Reports" description={`Enrolment and completion reports for ${APP_NAME}.`} />
      <h1 className="text-3xl font-extrabold text-ink">Enrolment and completion reports</h1>
      <div className="mt-6 overflow-x-auto rounded-2xl panel">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs text-muted uppercase">
            <tr>
              <th className="px-3 py-2">Course</th>
              <th className="px-3 py-2">Enrolments</th>
              <th className="px-3 py-2">Avg. completion</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => {
              const courseEnrolments = enrollments.filter((item) => item.courseId === course.id)
              const lessons = getCourseLessons(course).length
              const avg =
                courseEnrolments.length === 0
                  ? 0
                  : Math.round(
                      courseEnrolments.reduce((sum, item) => {
                        const completed = progressService.completedLessonIds(item.userId, course.id).length
                        return sum + progressPercent(completed, lessons)
                      }, 0) / courseEnrolments.length,
                    )
              return (
                <tr key={course.id} className="border-t border-line">
                  <td className="px-3 py-3 font-semibold text-ink">{course.title}</td>
                  <td className="px-3 py-3">{courseEnrolments.length}</td>
                  <td className="px-3 py-3">{avg}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AdminTable({
  title,
  query,
  onQuery,
  onCreate,
  createLabel = 'New',
  children,
}: {
  title: string
  query: string
  onQuery: (value: string) => void
  onCreate?: () => void
  createLabel?: string
  children: ReactNode
}) {
  return (
    <div className="px-4 py-8 sm:px-6">
      <Seo title={title} description={`${title} in the ${APP_NAME} admin area.`} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-extrabold text-ink">{title}</h1>
        {onCreate ? (
          <Button onClick={onCreate} icon={<Plus className="h-4 w-4" />}>
            {createLabel}
          </Button>
        ) : null}
      </div>
      <div className="mt-5 max-w-sm">
        <Input label="Filter" value={query} onChange={(event) => onQuery(event.target.value)} />
      </div>
      <div className="mt-6 overflow-x-auto rounded-2xl panel">{children}</div>
    </div>
  )
}
