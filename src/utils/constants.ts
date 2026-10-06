import { BRAND } from '@/assets/brand'

export const APP_NAME = BRAND.name
export const APP_SHORT_NAME = BRAND.shortName
export const ENGINE_NAME = BRAND.engineName
export const COMPANY_NAME = BRAND.company
export const COMPANY_URL = BRAND.url
export const COMPANY_HOST = BRAND.host
export const PASSING_SCORE = 70

export const DISCLAIMER = `Trading forex and CFDs involves significant risk and may not be suitable for all investors. ${APP_NAME} content is provided for educational purposes only and does not constitute investment advice, a recommendation, or a guarantee of trading results.`

export const STORAGE_KEYS = {
  users: `${BRAND.storagePrefix}.users`,
  session: `${BRAND.storagePrefix}.session`,
  catalog: `${BRAND.storagePrefix}.catalog`,
  quizzes: `${BRAND.storagePrefix}.quizzes`,
  enrollments: `${BRAND.storagePrefix}.enrollments`,
  progress: `${BRAND.storagePrefix}.progress`,
  notes: `${BRAND.storagePrefix}.notes`,
  attempts: `${BRAND.storagePrefix}.attempts`,
  certificates: `${BRAND.storagePrefix}.certificates`,
  activity: `${BRAND.storagePrefix}.activity`,
  resetTokens: `${BRAND.storagePrefix}.resetTokens`,
  conversations: `${BRAND.storagePrefix}.conversations`,
  aiCredits: `${BRAND.storagePrefix}.aiCredits`,
  questionCredits: `${BRAND.storagePrefix}.questionCredits`,
} as const

export const FREE_QUESTIONS = 5
export const BASIC_QUESTIONS = 200
export const BASIC_PRICE = 30

export const DEMO_STUDENT = {
  email: BRAND.demoStudentEmail,
  password: 'Learn2026!',
}

export const DEMO_ADMIN = {
  email: BRAND.demoAdminEmail,
  password: 'Admin2026!',
}
