import {
  seedActivity,
  seedAttempts,
  seedCertificates,
  seedEnrollments,
  seedProgress,
} from '@/data/progress'
import { authService } from '@/services/auth'
import { catalogService } from '@/services/catalog'
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

function pushActivity(item: ActivityItem) {
  writeJson(STORAGE_KEYS.activity, [item, ...loadActivity()].slice(0, 40))
}

export const progressService = {
  enrollments(userId: string) {
    return loadEnrollments().filter((item) => item.userId === userId)
  },

  allEnrollments() {
    return loadEnrollments()
  },

  progressFor(userId: string) {
    return loadProgress().filter((item) => item.userId === userId)
  },

  notesFor(userId: string) {
    return loadNotes().filter((item) => item.userId === userId)
  },

  attemptsFor(userId: string) {
    return loadAttempts().filter((item) => item.userId === userId)
  },

  allAttempts() {
    return loadAttempts()
  },

  certificatesFor(userId: string) {
    return loadCertificates().filter((item) => item.userId === userId)
  },

  allCertificates() {
    return loadCertificates()
  },

  activityFor(userId: string) {
    return loadActivity().filter((item) => item.userId === userId)
  },

  isEnrolled(userId: string, courseId: string) {
    return loadEnrollments().some((item) => item.userId === userId && item.courseId === courseId)
  },

  isSaved(userId: string, courseId: string) {
    return loadEnrollments().some(
      (item) => item.userId === userId && item.courseId === courseId && item.saved,
    )
  },

  async enroll(userId: string, courseId: string) {
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
    pushActivity({
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
    await delay(350)
    const enrollments = loadEnrollments()
    const fresh = courseIds.filter(
      (courseId) => !enrollments.some((item) => item.userId === userId && item.courseId === courseId),
    )
    if (!fresh.length) return 0
    const at = new Date().toISOString()
    const records: Enrollment[] = fresh.map((courseId) => ({
      userId,
      courseId,
      enrolledAt: at,
      saved: false,
    }))
    writeJson(STORAGE_KEYS.enrollments, [...records, ...enrollments])
    pushActivity({
      id: uid('act'),
      userId,
      type: 'enroll',
      label: fresh.length === 1 ? 'Enrolled in a course' : `Enrolled in ${fresh.length} courses`,
      detail: fresh.map((courseId) => catalogService.getCourse(courseId)?.title ?? 'Course').join(', '),
      at,
    })
    return fresh.length
  },

  toggleSaved(userId: string, courseId: string) {
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
    return loadProgress()
      .filter((item) => item.userId === userId && item.courseId === courseId && item.completed)
      .map((item) => item.lessonId)
  },

  async completeLesson(userId: string, courseId: string, lessonId: string, lessonTitle: string) {
    await delay(250)
    const progress = loadProgress()
    const existing = progress.find(
      (item) => item.userId === userId && item.courseId === courseId && item.lessonId === lessonId,
    )
    const record: LessonProgress = {
      userId,
      courseId,
      lessonId,
      completed: true,
      completedAt: new Date().toISOString(),
    }
    const next = existing
      ? progress.map((item) => (item === existing ? record : item))
      : [record, ...progress]
    writeJson(STORAGE_KEYS.progress, next)
    pushActivity({
      id: uid('act'),
      userId,
      type: 'lesson',
      label: 'Lesson completed',
      detail: lessonTitle,
      at: record.completedAt ?? new Date().toISOString(),
    })
    this.maybeIssueCertificate(userId, courseId)
    return record
  },

  saveNote(userId: string, lessonId: string, content: string) {
    const notes = loadNotes()
    const existing = notes.find((item) => item.userId === userId && item.lessonId === lessonId)
    const record: LessonNote = {
      userId,
      lessonId,
      content,
      updatedAt: new Date().toISOString(),
    }
    writeJson(
      STORAGE_KEYS.notes,
      existing ? notes.map((item) => (item === existing ? record : item)) : [record, ...notes],
    )
    return record
  },

  getNote(userId: string, lessonId: string) {
    return loadNotes().find((item) => item.userId === userId && item.lessonId === lessonId)
  },

  async submitQuiz(input: Omit<QuizAttempt, 'id' | 'submittedAt'> & { courseTitle: string }) {
    await delay(450)
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
    writeJson(STORAGE_KEYS.attempts, [attempt, ...loadAttempts()])
    pushActivity({
      id: uid('act'),
      userId: input.userId,
      type: 'quiz',
      label: input.passed ? 'Quiz passed' : 'Quiz submitted',
      detail: `${input.courseTitle} · ${input.score}%`,
      at: attempt.submittedAt,
    })
    if (input.passed) this.maybeIssueCertificate(input.userId, input.courseId)
    return attempt
  },

  latestAttempt(userId: string, quizId: string) {
    return loadAttempts().find((item) => item.userId === userId && item.quizId === quizId)
  },

  maybeIssueCertificate(userId: string, courseId: string) {
    const course = catalogService.getCourse(courseId)
    if (!course) return null
    const lessons = getCourseLessons(course)
    const completed = this.completedLessonIds(userId, courseId)
    const allDone = lessons.every((lesson) => completed.includes(lesson.id))
    const quiz = catalogService.getQuizForCourse(courseId)
    const passed = quiz
      ? loadAttempts().some((item) => item.userId === userId && item.quizId === quiz.id && item.passed)
      : false
    if (!allDone || !passed) return null

    const existing = loadCertificates().find(
      (item) => item.userId === userId && item.courseId === courseId,
    )
    if (existing) return existing

    const user = authService.getUser(userId)
    const record: CertificateRecord = {
      id: `BAZ-ACAD-${new Date().getFullYear()}-${uid('c').slice(-5).toUpperCase()}`,
      userId,
      courseId,
      studentName: user?.fullName ?? 'Student',
      courseName: course.title,
      completedAt: new Date().toISOString(),
    }
    writeJson(STORAGE_KEYS.certificates, [record, ...loadCertificates()])
    pushActivity({
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
