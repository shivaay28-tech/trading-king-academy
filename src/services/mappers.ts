import type {
  ActivityItem,
  CertificateRecord,
  Course,
  EmailPreferences,
  Enrollment,
  LessonNote,
  LessonProgress,
  Module,
  Quiz,
  QuizAttempt,
  SessionUser,
} from '@/types'

const defaultPrefs: EmailPreferences = {
  productUpdates: true,
  courseNotifications: true,
  weeklyDigest: false,
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

export function mapProfile(row: Record<string, unknown>): SessionUser {
  const prefs = asRecord(row.email_preferences)
  return {
    id: text(row.id),
    fullName: text(row.full_name, 'Student'),
    email: text(row.email),
    mobile: text(row.mobile),
    country: text(row.country),
    countryCode: text(row.country_code),
    role: row.role === 'admin' || row.role === 'superadmin' ? row.role : 'student',
    avatar: text(row.avatar) || undefined,
    createdAt: text(row.created_at, new Date().toISOString()),
    emailPreferences: {
      productUpdates: prefs.productUpdates !== false,
      courseNotifications: prefs.courseNotifications !== false,
      weeklyDigest: prefs.weeklyDigest === true,
    },
    plan: row.plan === 'basic' ? 'basic' : 'free',
    questionsUsed: typeof row.questions_used === 'number' ? row.questions_used : 0,
  }
}

export function emptyPreferences() {
  return { ...defaultPrefs }
}

export function mapCourse(row: Record<string, unknown>): Course {
  return {
    id: text(row.id),
    slug: text(row.slug),
    title: text(row.title),
    subtitle: text(row.subtitle),
    description: text(row.description),
    categoryId: text(row.category_id),
    difficulty: (text(row.difficulty, 'Beginner') as Course['difficulty']),
    durationHours: Number(row.duration_hours ?? 1),
    objectives: Array.isArray(row.objectives) ? row.objectives.filter((item): item is string => typeof item === 'string') : [],
    instructor: text(row.instructor),
    status: row.status === 'draft' ? 'draft' : 'published',
    popular: row.popular === true,
    featured: row.featured === true,
    quizId: text(row.quiz_id),
    modules: Array.isArray(row.modules) ? (row.modules as Module[]) : [],
  }
}

export function courseToRow(course: Course) {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    subtitle: course.subtitle,
    description: course.description,
    category_id: course.categoryId,
    difficulty: course.difficulty,
    duration_hours: course.durationHours,
    objectives: course.objectives,
    instructor: course.instructor,
    status: course.status,
    popular: course.popular,
    featured: course.featured,
    quiz_id: course.quizId,
    modules: course.modules,
  }
}

export function mapQuiz(row: Record<string, unknown>): Quiz {
  return {
    id: text(row.id),
    courseId: text(row.course_id),
    title: text(row.title),
    passingScore: Number(row.passing_score ?? 70),
    questions: Array.isArray(row.questions) ? (row.questions as Quiz['questions']) : [],
  }
}

export function quizToRow(quiz: Quiz) {
  return {
    id: quiz.id,
    course_id: quiz.courseId,
    title: quiz.title,
    passing_score: quiz.passingScore,
    questions: quiz.questions,
  }
}

export function mapEnrollment(row: Record<string, unknown>): Enrollment {
  return {
    userId: text(row.user_id),
    courseId: text(row.course_id),
    enrolledAt: text(row.enrolled_at, new Date().toISOString()),
    saved: row.saved === true,
  }
}

export function mapProgress(row: Record<string, unknown>): LessonProgress {
  return {
    userId: text(row.user_id),
    courseId: text(row.course_id),
    lessonId: text(row.lesson_id),
    completed: row.completed !== false,
    completedAt: text(row.completed_at) || undefined,
  }
}

export function mapNote(row: Record<string, unknown>): LessonNote {
  return {
    userId: text(row.user_id),
    lessonId: text(row.lesson_id),
    content: text(row.content),
    updatedAt: text(row.updated_at, new Date().toISOString()),
  }
}

export function mapAttempt(row: Record<string, unknown>): QuizAttempt {
  return {
    id: text(row.id),
    userId: text(row.user_id),
    quizId: text(row.quiz_id),
    courseId: text(row.course_id),
    answers: asRecord(row.answers) as Record<string, string>,
    score: Number(row.score ?? 0),
    passed: row.passed === true,
    submittedAt: text(row.submitted_at, new Date().toISOString()),
  }
}

export function mapCertificate(row: Record<string, unknown>): CertificateRecord {
  return {
    id: text(row.id),
    userId: text(row.user_id),
    courseId: text(row.course_id),
    studentName: text(row.student_name, 'Student'),
    courseName: text(row.course_name, 'Course'),
    completedAt: text(row.completed_at, new Date().toISOString()),
  }
}

export function mapActivity(row: Record<string, unknown>): ActivityItem {
  const type = text(row.type, 'account')
  return {
    id: text(row.id),
    userId: text(row.user_id),
    label: text(row.label),
    detail: text(row.detail),
    at: text(row.at, new Date().toISOString()),
    type:
      type === 'lesson' || type === 'quiz' || type === 'enroll' || type === 'certificate' || type === 'account'
        ? type
        : 'account',
  }
}
