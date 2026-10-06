export type Role = 'student' | 'admin'
export type EnginePlan = 'free' | 'basic'
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'
export type CourseStatus = 'draft' | 'published'
export type ToastTone = 'success' | 'error' | 'info'

export interface EmailPreferences {
  productUpdates: boolean
  courseNotifications: boolean
  weeklyDigest: boolean
}

export interface User {
  id: string
  fullName: string
  email: string
  mobile: string
  country: string
  countryCode: string
  role: Role
  password: string
  avatar?: string
  createdAt: string
  emailPreferences: EmailPreferences
  plan?: EnginePlan
}

export type SessionUser = Omit<User, 'password'>

export interface Category {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  difficulty: Difficulty
  estimatedHours: number
}

export interface Lesson {
  id: string
  slug: string
  title: string
  durationMinutes: number
  order: number
  summary: string
  content: string[]
  resourceName: string
}

export interface Module {
  id: string
  title: string
  order: number
  lessons: Lesson[]
}

export interface QuizOption {
  id: string
  text: string
}

export interface QuizQuestionData {
  id: string
  prompt: string
  options: QuizOption[]
  correctOptionId: string
  explanation: string
}

export interface Quiz {
  id: string
  courseId: string
  title: string
  passingScore: number
  questions: QuizQuestionData[]
}

export interface Course {
  id: string
  slug: string
  title: string
  subtitle: string
  description: string
  categoryId: string
  difficulty: Difficulty
  durationHours: number
  objectives: string[]
  instructor: string
  status: CourseStatus
  popular: boolean
  featured: boolean
  modules: Module[]
  quizId: string
}

export interface Enrollment {
  userId: string
  courseId: string
  enrolledAt: string
  saved: boolean
}

export interface LessonProgress {
  userId: string
  courseId: string
  lessonId: string
  completed: boolean
  completedAt?: string
}

export interface LessonNote {
  userId: string
  lessonId: string
  content: string
  updatedAt: string
}

export interface QuizAttempt {
  id: string
  userId: string
  quizId: string
  courseId: string
  answers: Record<string, string>
  score: number
  passed: boolean
  submittedAt: string
}

export interface CertificateRecord {
  id: string
  userId: string
  courseId: string
  studentName: string
  courseName: string
  completedAt: string
}

export interface ActivityItem {
  id: string
  userId: string
  label: string
  detail: string
  at: string
  type: 'lesson' | 'quiz' | 'enroll' | 'certificate' | 'account'
}

export interface CountryOption {
  name: string
  code: string
  dial: string
}

export interface FaqItem {
  id: string
  question: string
  answer: string
}

export interface ToastMessage {
  id: string
  tone: ToastTone
  title: string
  description?: string
}

export interface RegisterPayload {
  fullName: string
  email: string
  mobile: string
  country: string
  countryCode: string
  password: string
}

export interface AuthResult {
  ok: boolean
  message: string
  user?: SessionUser
}

export type AiRole = 'user' | 'assistant'
export type AiAnswerLength = 'brief' | 'standard'

export interface AiAttachment {
  id: string
  name: string
  mime: string
  dataUrl: string
  kind: 'image' | 'video'
}

export interface AiMessage {
  id: string
  role: AiRole
  content: string
  createdAt: string
  attachments: AiAttachment[]
}

export interface AiConversation {
  id: string
  title: string
  instrument?: string
  createdAt: string
  updatedAt: string
  messages: AiMessage[]
}

export interface Instrument {
  symbol: string
  name: string
  sessionNote: string
}


