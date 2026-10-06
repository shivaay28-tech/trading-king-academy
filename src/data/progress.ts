import type { ActivityItem, CertificateRecord, Enrollment, LessonProgress, QuizAttempt } from '@/types'

export const seedEnrollments: Enrollment[] = [
  {
    userId: 'user-demo-student',
    courseId: 'course-forex-intro',
    enrolledAt: '2026-08-01T09:00:00.000Z',
    saved: false,
  },
  {
    userId: 'user-demo-student',
    courseId: 'course-pairs',
    enrolledAt: '2026-08-10T09:00:00.000Z',
    saved: true,
  },
  {
    userId: 'user-demo-student',
    courseId: 'course-mt5',
    enrolledAt: '2026-08-20T09:00:00.000Z',
    saved: false,
  },
  {
    userId: 'user-demo-student',
    courseId: 'course-ta',
    enrolledAt: '2026-09-02T09:00:00.000Z',
    saved: true,
  },
  {
    userId: 'user-lina',
    courseId: 'course-forex-intro',
    enrolledAt: '2026-08-04T11:00:00.000Z',
    saved: false,
  },
  {
    userId: 'user-omar',
    courseId: 'course-risk',
    enrolledAt: '2026-08-22T11:00:00.000Z',
    saved: false,
  },
]

export const seedProgress: LessonProgress[] = [
  {
    userId: 'user-demo-student',
    courseId: 'course-forex-intro',
    lessonId: 'l-fx-1',
    completed: true,
    completedAt: '2026-08-01T10:00:00.000Z',
  },
  {
    userId: 'user-demo-student',
    courseId: 'course-forex-intro',
    lessonId: 'l-fx-2',
    completed: true,
    completedAt: '2026-08-01T11:10:00.000Z',
  },
  {
    userId: 'user-demo-student',
    courseId: 'course-forex-intro',
    lessonId: 'l-fx-3',
    completed: true,
    completedAt: '2026-08-02T09:20:00.000Z',
  },
  {
    userId: 'user-demo-student',
    courseId: 'course-forex-intro',
    lessonId: 'l-fx-4',
    completed: true,
    completedAt: '2026-08-02T10:05:00.000Z',
  },
  {
    userId: 'user-demo-student',
    courseId: 'course-pairs',
    lessonId: 'l-pairs-1',
    completed: true,
    completedAt: '2026-08-11T08:40:00.000Z',
  },
  {
    userId: 'user-demo-student',
    courseId: 'course-pairs',
    lessonId: 'l-pairs-2',
    completed: true,
    completedAt: '2026-08-12T08:40:00.000Z',
  },
  {
    userId: 'user-demo-student',
    courseId: 'course-mt5',
    lessonId: 'l-mt5-1',
    completed: true,
    completedAt: '2026-08-21T07:15:00.000Z',
  },
]

export const seedAttempts: QuizAttempt[] = [
  {
    id: 'attempt-demo-fx',
    userId: 'user-demo-student',
    quizId: 'quiz-forex-intro',
    courseId: 'course-forex-intro',
    answers: {
      qi1: 'qi1-a',
      qi2: 'qi2-b',
      qi3: 'qi3-c',
      qi4: 'qi4-b',
      qi5: 'qi5-c',
    },
    score: 100,
    passed: true,
    submittedAt: '2026-08-02T10:30:00.000Z',
  },
]

export const seedCertificates: CertificateRecord[] = [
  {
    id: 'BAZ-ACAD-2026-08421',
    userId: 'user-demo-student',
    courseId: 'course-forex-intro',
    studentName: 'Amina Al Hashimi',
    courseName: 'Introduction to Forex Trading',
    completedAt: '2026-08-02T10:30:00.000Z',
  },
]

export const seedActivity: ActivityItem[] = [
  {
    id: 'act-1',
    userId: 'user-demo-student',
    type: 'certificate',
    label: 'Certificate issued',
    detail: 'Introduction to Forex Trading',
    at: '2026-08-02T10:30:00.000Z',
  },
  {
    id: 'act-2',
    userId: 'user-demo-student',
    type: 'lesson',
    label: 'Lesson completed',
    detail: 'Opening MT5 and reading the layout',
    at: '2026-08-21T07:15:00.000Z',
  },
  {
    id: 'act-3',
    userId: 'user-demo-student',
    type: 'enroll',
    label: 'Enrolled in a course',
    detail: 'Technical Analysis Essentials',
    at: '2026-09-02T09:00:00.000Z',
  },
]
