import {
  seedActivity,
  seedAttempts,
  seedCertificates,
  seedEnrollments,
  seedProgress,
} from '@/data/progress'
import { isSupabaseEnabled } from '@/services/backend'
import { authService } from '@/services/auth'
import { catalogService } from '@/services/catalog'
import { mapActivity, mapAttempt, mapCertificate, mapEnrollment, mapNote, mapProgress } from '@/services/mappers'
import { getSupabase } from '@/services/supabase'
import { delay, readJson, writeJson } from '@/services/storage'
import type {
  ActivityItem,
  CertificateRecord,
  Enrollment,
  LessonNote,
  LessonProgress,
  QuizAttempt,
} from '@/types'
import { STORAGE_KEYS } from '@/utils/constants'
import { getCourseLessons } from '@/utils/course'
import { uid } from '@/utils/format'

interface ProgressCache {
  enrollments: Enrollment[]
  progress: LessonProgress[]
  notes: LessonNote[]
  attempts: QuizAttempt[]
  certificates: CertificateRecord[]
  activity: ActivityItem[]
}

const emptyCache = (): ProgressCache => ({
  enrollments: [],
  progress: [],
  notes: [],
  attempts: [],
  certificates: [],
  activity: [],
})

let cache: ProgressCache = emptyCache()

function asRow(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function loadEnrollments() {
  const stored = readJson<Enrollment[] | null>(STORAGE_KEYS.enrollments, null)
  if (stored) return stored
  writeJson(STORAGE_KEYS.enrollments, seedEnrollments)
  return seedEnrollments
}

function loadProgress() {
  const stored = readJson<LessonProgress[] | null>(STORAGE_KEYS.progress, null)
  if (stored) return stored
  writeJson(STORAGE_KEYS.progress, seedProgress)
  return seedProgress
}

function loadNotes() {
  return readJson<LessonNote[]>(STORAGE_KEYS.notes, [])
}

function loadAttempts() {
  const stored = readJson<QuizAttempt[] | null>(STORAGE_KEYS.attempts, null)
  if (stored) return stored
  writeJson(STORAGE_KEYS.attempts, seedAttempts)
  return seedAttempts
}

function loadCertificates() {
  const stored = readJson<CertificateRecord[] | null>(STORAGE_KEYS.certificates, null)
  if (stored) return stored
  writeJson(STORAGE_KEYS.certificates, seedCertificates)
  return seedCertificates
}

function loadActivity() {
  const stored = readJson<ActivityItem[] | null>(STORAGE_KEYS.activity, null)
  if (stored) return stored
  writeJson(STORAGE_KEYS.activity, seedActivity)
  return seedActivity
}

function pushLocalActivity(item: ActivityItem) {
  writeJson(STORAGE_KEYS.activity, [item, ...loadActivity()].slice(0, 40))
}

function rememberActivity(item: ActivityItem) {
  cache.activity = [item, ...cache.activity].slice(0, 40)
}

async function pushCloudActivity(item: ActivityItem) {
  rememberActivity(item)
  const sb = getSupabase()
  await sb.from('activity').insert({
    id: item.id,
    user_id: item.userId,
    label: item.label,
    detail: item.detail,
    type: item.type,
    at: item.at,
  })
}

async function fetchProgress(userId?: string, isAdmin = false) {
  const sb = getSupabase()
  const enrollmentsQuery = sb.from('enrollments').select('*')
  const progressQuery = sb.from('lesson_progress').select('*')
  const notesQuery = sb.from('lesson_notes').select('*')
  const attemptsQuery = sb.from('quiz_attempts').select('*').order('submitted_at', { ascending: false })
  const certificatesQuery = sb.from('certificates').select('*').order('completed_at', { ascending: false })
  const activityQuery = sb.from('activity').select('*').order('at', { ascending: false }).limit(40)
  const scoped = Boolean(userId && !isAdmin)

  const [
    enrollmentsRes,
    progressRes,
    notesRes,
    attemptsRes,
    certificatesRes,
    activityRes,
  ] = await Promise.all([
    scoped && userId ? enrollmentsQuery.eq('user_id', userId) : enrollmentsQuery,
    scoped && userId ? progressQuery.eq('user_id', userId) : progressQuery,
    scoped && userId ? notesQuery.eq('user_id', userId) : notesQuery,
    scoped && userId ? attemptsQuery.eq('user_id', userId) : attemptsQuery,
    scoped && userId ? certificatesQuery.eq('user_id', userId) : certificatesQuery,
    scoped && userId ? activityQuery.eq('user_id', userId) : activityQuery,
  ])

  cache = {
    enrollments: (enrollmentsRes.data ?? []).map((row) => mapEnrollment(asRow(row))),
    progress: (progressRes.data ?? []).map((row) => mapProgress(asRow(row))),
    notes: (notesRes.data ?? []).map((row) => mapNote(asRow(row))),
    attempts: (attemptsRes.data ?? []).map((row) => mapAttempt(asRow(row))),
    certificates: (certificatesRes.data ?? []).map((row) => mapCertificate(asRow(row))),
    activity: (activityRes.data ?? []).map((row) => mapActivity(asRow(row))),
  }
}

function localSnapshot(): ProgressCache {
  return {
    enrollments: loadEnrollments(),
    progress: loadProgress(),
    notes: loadNotes(),
    attempts: loadAttempts(),
    certificates: loadCertificates(),
    activity: loadActivity(),
  }
}

function source(): ProgressCache {
  return isSupabaseEnabled() ? cache : localSnapshot()
}

export const progressService = {
  async refresh(userId?: string, isAdmin = false) {
    if (!isSupabaseEnabled()) {
      cache = localSnapshot()
      return
    }
    if (!userId && !isAdmin) {
      cache = emptyCache()
      return
    }
    await fetchProgress(userId, isAdmin)
  },

  enrollments(userId: string) {
    return source().enrollments.filter((item) => item.userId === userId)
  },

  allEnrollments() {
    return source().enrollments
  },

  progressFor(userId: string) {
    return source().progress.filter((item) => item.userId === userId)
  },

  notesFor(userId: string) {
    return source().notes.filter((item) => item.userId === userId)
  },

  attemptsFor(userId: string) {
    return source().attempts.filter((item) => item.userId === userId)
  },

  allAttempts() {
    return source().attempts
  },

  certificatesFor(userId: string) {
    return source().certificates.filter((item) => item.userId === userId)
  },

  allCertificates() {
    return source().certificates
  },

  activityFor(userId: string) {
    return source().activity.filter((item) => item.userId === userId)
  },

  isEnrolled(userId: string, courseId: string) {
    return source().enrollments.some((item) => item.userId === userId && item.courseId === courseId)
  },

  isSaved(userId: string, courseId: string) {
    return source().enrollments.some(
      (item) => item.userId === userId && item.courseId === courseId && item.saved,
    )
  },

  async enroll(userId: string, courseId: string) {
    if (isSupabaseEnabled()) {
      const existing = cache.enrollments.find((item) => item.userId === userId && item.courseId === courseId)
      if (existing) return existing
      const record: Enrollment = {
        userId,
        courseId,
        enrolledAt: new Date().toISOString(),
        saved: false,
      }
      const sb = getSupabase()
      const { error } = await sb.from('enrollments').upsert({
        user_id: userId,
        course_id: courseId,
        enrolled_at: record.enrolledAt,
        saved: false,
      })
      if (error) throw new Error(error.message)
      cache.enrollments = [record, ...cache.enrollments]
      const course = catalogService.getCourse(courseId)
      await pushCloudActivity({
        id: uid('act'),
        userId,
        type: 'enroll',
        label: 'Enrolled in a course',
        detail: course?.title ?? 'Course',
        at: record.enrolledAt,
      })
      return record
    }

    await delay(350)
    const enrollments = loadEnrollments()
    const existing = enrollments.find((item) => item.userId === userId && item.courseId === courseId)
    if (existing) return existing
    const record: Enrollment = {
      userId,
      courseId,
      enrolledAt: new Date().toISOString(),
      saved: false,
    }
    writeJson(STORAGE_KEYS.enrollments, [record, ...enrollments])
    const course = catalogService.getCourse(courseId)
    pushLocalActivity({
      id: uid('act'),
      userId,
      type: 'enroll',
      label: 'Enrolled in a course',
      detail: course?.title ?? 'Course',
      at: record.enrolledAt,
    })
    return record
  },

  async enrollMany(userId: string, courseIds: string[]) {
    const fresh = courseIds.filter((courseId) => !this.isEnrolled(userId, courseId))
    if (!fresh.length) return 0
    for (const courseId of fresh) {
      await this.enroll(userId, courseId)
    }
    return fresh.length
  },

  async toggleSaved(userId: string, courseId: string) {
    if (isSupabaseEnabled()) {
      const existing = cache.enrollments.find((item) => item.userId === userId && item.courseId === courseId)
      const nextSaved = existing ? !existing.saved : true
      const record: Enrollment = existing
        ? { ...existing, saved: nextSaved }
        : { userId, courseId, enrolledAt: new Date().toISOString(), saved: true }
      const sb = getSupabase()
      const { error } = await sb.from('enrollments').upsert({
        user_id: userId,
        course_id: courseId,
        enrolled_at: record.enrolledAt,
        saved: record.saved,
      })
      if (error) throw new Error(error.message)
      cache.enrollments = existing
        ? cache.enrollments.map((item) => (item === existing ? record : item))
        : [record, ...cache.enrollments]
      return record.saved
    }

    const enrollments = loadEnrollments()
    const existing = enrollments.find((item) => item.userId === userId && item.courseId === courseId)
    if (existing) {
      const next = enrollments.map((item) =>
        item === existing ? { ...item, saved: !item.saved } : item,
      )
      writeJson(STORAGE_KEYS.enrollments, next)
      return !existing.saved
    }
    const record: Enrollment = {
      userId,
      courseId,
      enrolledAt: new Date().toISOString(),
      saved: true,
    }
    writeJson(STORAGE_KEYS.enrollments, [record, ...enrollments])
    return true
  },

  completedLessonIds(userId: string, courseId: string) {
    return source()
      .progress.filter((item) => item.userId === userId && item.courseId === courseId && item.completed)
      .map((item) => item.lessonId)
  },

  async completeLesson(userId: string, courseId: string, lessonId: string, lessonTitle: string) {
    const record: LessonProgress = {
      userId,
      courseId,
      lessonId,
      completed: true,
      completedAt: new Date().toISOString(),
    }

    if (isSupabaseEnabled()) {
      const sb = getSupabase()
      const { error } = await sb.from('lesson_progress').upsert({
        user_id: userId,
        course_id: courseId,
        lesson_id: lessonId,
        completed: true,
        completed_at: record.completedAt,
      })
      if (error) throw new Error(error.message)
      const existing = cache.progress.find(
        (item) => item.userId === userId && item.courseId === courseId && item.lessonId === lessonId,
      )
      cache.progress = existing
        ? cache.progress.map((item) => (item === existing ? record : item))
        : [record, ...cache.progress]
      await pushCloudActivity({
        id: uid('act'),
        userId,
        type: 'lesson',
        label: 'Lesson completed',
        detail: lessonTitle,
        at: record.completedAt ?? new Date().toISOString(),
      })
      await this.maybeIssueCertificate(userId, courseId)
      return record
    }

    await delay(250)
    const progress = loadProgress()
    const existing = progress.find(
      (item) => item.userId === userId && item.courseId === courseId && item.lessonId === lessonId,
    )
    const next = existing
      ? progress.map((item) => (item === existing ? record : item))
      : [record, ...progress]
    writeJson(STORAGE_KEYS.progress, next)
    pushLocalActivity({
      id: uid('act'),
      userId,
      type: 'lesson',
      label: 'Lesson completed',
      detail: lessonTitle,
      at: record.completedAt ?? new Date().toISOString(),
    })
    await this.maybeIssueCertificate(userId, courseId)
    return record
  },

  async saveNote(userId: string, lessonId: string, content: string) {
    const record: LessonNote = {
      userId,
      lessonId,
      content,
      updatedAt: new Date().toISOString(),
    }
    if (isSupabaseEnabled()) {
      const sb = getSupabase()
      const { error } = await sb.from('lesson_notes').upsert({
        user_id: userId,
        lesson_id: lessonId,
        content,
        updated_at: record.updatedAt,
      })
      if (error) throw new Error(error.message)
      const existing = cache.notes.find((item) => item.userId === userId && item.lessonId === lessonId)
      cache.notes = existing
        ? cache.notes.map((item) => (item === existing ? record : item))
        : [record, ...cache.notes]
      return record
    }
    const notes = loadNotes()
    const existing = notes.find((item) => item.userId === userId && item.lessonId === lessonId)
    writeJson(
      STORAGE_KEYS.notes,
      existing ? notes.map((item) => (item === existing ? record : item)) : [record, ...notes],
    )
    return record
  },

  getNote(userId: string, lessonId: string) {
    return source().notes.find((item) => item.userId === userId && item.lessonId === lessonId)
  },

  async submitQuiz(input: Omit<QuizAttempt, 'id' | 'submittedAt'> & { courseTitle: string }) {
    const attempt: QuizAttempt = {
      id: uid('attempt'),
      userId: input.userId,
      quizId: input.quizId,
      courseId: input.courseId,
      answers: input.answers,
      score: input.score,
      passed: input.passed,
      submittedAt: new Date().toISOString(),
    }

    if (isSupabaseEnabled()) {
      const sb = getSupabase()
      const { error } = await sb.from('quiz_attempts').insert({
        id: attempt.id,
        user_id: attempt.userId,
        quiz_id: attempt.quizId,
        course_id: attempt.courseId,
        answers: attempt.answers,
        score: attempt.score,
        passed: attempt.passed,
        submitted_at: attempt.submittedAt,
      })
      if (error) throw new Error(error.message)
      cache.attempts = [attempt, ...cache.attempts]
      await pushCloudActivity({
        id: uid('act'),
        userId: input.userId,
        type: 'quiz',
        label: input.passed ? 'Quiz passed' : 'Quiz submitted',
        detail: `${input.courseTitle} · ${input.score}%`,
        at: attempt.submittedAt,
      })
      if (input.passed) await this.maybeIssueCertificate(input.userId, input.courseId)
      return attempt
    }

    await delay(450)
    writeJson(STORAGE_KEYS.attempts, [attempt, ...loadAttempts()])
    pushLocalActivity({
      id: uid('act'),
      userId: input.userId,
      type: 'quiz',
      label: input.passed ? 'Quiz passed' : 'Quiz submitted',
      detail: `${input.courseTitle} · ${input.score}%`,
      at: attempt.submittedAt,
    })
    if (input.passed) await this.maybeIssueCertificate(input.userId, input.courseId)
    return attempt
  },

  latestAttempt(userId: string, quizId: string) {
    return source().attempts.find((item) => item.userId === userId && item.quizId === quizId)
  },

  async maybeIssueCertificate(userId: string, courseId: string) {
    const course = catalogService.getCourse(courseId)
    if (!course) return null
    const lessons = getCourseLessons(course)
    const completed = this.completedLessonIds(userId, courseId)
    const allDone = lessons.every((lesson) => completed.includes(lesson.id))
    const quiz = catalogService.getQuizForCourse(courseId)
    const passed = quiz
      ? source().attempts.some((item) => item.userId === userId && item.quizId === quiz.id && item.passed)
      : false
    if (!allDone || !passed) return null

    const existing = source().certificates.find((item) => item.userId === userId && item.courseId === courseId)
    if (existing) return existing

    const user = authService.getUser(userId) ?? authService.current()
    const record: CertificateRecord = {
      id: `BAZ-ACAD-${new Date().getFullYear()}-${uid('c').slice(-5).toUpperCase()}`,
      userId,
      courseId,
      studentName: user?.fullName ?? 'Student',
      courseName: course.title,
      completedAt: new Date().toISOString(),
    }

    if (isSupabaseEnabled()) {
      const sb = getSupabase()
      const { error } = await sb.from('certificates').insert({
        id: record.id,
        user_id: record.userId,
        course_id: record.courseId,
        student_name: record.studentName,
        course_name: record.courseName,
        completed_at: record.completedAt,
      })
      if (error) throw new Error(error.message)
      cache.certificates = [record, ...cache.certificates]
      await pushCloudActivity({
        id: uid('act'),
        userId,
        type: 'certificate',
        label: 'Certificate issued',
        detail: course.title,
        at: record.completedAt,
      })
      return record
    }

    writeJson(STORAGE_KEYS.certificates, [record, ...loadCertificates()])
    pushLocalActivity({
      id: uid('act'),
      userId,
      type: 'certificate',
      label: 'Certificate issued',
      detail: course.title,
      at: record.completedAt,
    })
    return record
  },
}
