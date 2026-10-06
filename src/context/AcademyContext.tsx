import { catalogService } from '@/services/catalog'
import { progressService } from '@/services/progress'
import type { Course } from '@/types'
import { getCourseLessons, progressPercent } from '@/utils/course'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'

interface AcademyContextValue {
  courses: Course[]
  revision: number
  refresh: () => void
  enroll: (courseId: string) => Promise<void>
  enrollMany: (courseIds: string[]) => Promise<number>
  toggleSaved: (courseId: string) => void
  completeLesson: (courseId: string, lessonId: string, title: string) => Promise<void>
  courseProgress: (courseId: string) => { completed: number; total: number; percent: number }
  isEnrolled: (courseId: string) => boolean
  isSaved: (courseId: string) => boolean
}

const AcademyContext = createContext<AcademyContextValue | null>(null)

export function AcademyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [revision, setRevision] = useState(0)
  const refresh = useCallback(() => setRevision((value) => value + 1), [])

  const courses = useMemo(() => catalogService.listCourses(), [revision])

  const enroll = useCallback(
    async (courseId: string) => {
      if (!user) return
      await progressService.enroll(user.id, courseId)
      refresh()
    },
    [user, refresh],
  )

  const enrollMany = useCallback(
    async (courseIds: string[]) => {
      if (!user) return 0
      const added = await progressService.enrollMany(user.id, courseIds)
      refresh()
      return added
    },
    [user, refresh],
  )

  const toggleSaved = useCallback(
    (courseId: string) => {
      if (!user) return
      progressService.toggleSaved(user.id, courseId)
      refresh()
    },
    [user, refresh],
  )

  const completeLesson = useCallback(
    async (courseId: string, lessonId: string, title: string) => {
      if (!user) return
      await progressService.completeLesson(user.id, courseId, lessonId, title)
      refresh()
    },
    [user, refresh],
  )

  const courseProgress = useCallback(
    (courseId: string) => {
      const course = catalogService.getCourse(courseId)
      const total = course ? getCourseLessons(course).length : 0
      if (!user) return { completed: 0, total, percent: 0 }
      const completed = progressService.completedLessonIds(user.id, courseId).length
      return { completed, total, percent: progressPercent(completed, total) }
    },
    [user, revision],
  )

  const isEnrolled = useCallback(
    (courseId: string) => (user ? progressService.isEnrolled(user.id, courseId) : false),
    [user, revision],
  )

  const isSaved = useCallback(
    (courseId: string) => (user ? progressService.isSaved(user.id, courseId) : false),
    [user, revision],
  )

  const value = useMemo(
    () => ({
      courses,
      revision,
      refresh,
      enroll,
      enrollMany,
      toggleSaved,
      completeLesson,
      courseProgress,
      isEnrolled,
      isSaved,
    }),
    [courses, revision, refresh, enroll, enrollMany, toggleSaved, completeLesson, courseProgress, isEnrolled, isSaved],
  )

  return <AcademyContext.Provider value={value}>{children}</AcademyContext.Provider>
}

export function useAcademy() {
  const context = useContext(AcademyContext)
  if (!context) throw new Error('useAcademy must be used within AcademyProvider')
  return context
}
