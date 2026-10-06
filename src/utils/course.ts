import type { Course, Lesson } from '@/types'

export function getCourseLessons(course: Course): Lesson[] {
  return course.modules
    .slice()
    .sort((a, b) => a.order - b.order)
    .flatMap((module) => module.lessons.slice().sort((a, b) => a.order - b.order))
}

export function getLessonCount(course: Course) {
  return getCourseLessons(course).length
}

export function getCourseDuration(course: Course) {
  return getCourseLessons(course).reduce((sum, lesson) => sum + lesson.durationMinutes, 0)
}

export function findLesson(course: Course, lessonSlug: string) {
  return getCourseLessons(course).find((lesson) => lesson.slug === lessonSlug)
}

export function getAdjacentLessons(course: Course, lessonSlug: string) {
  const lessons = getCourseLessons(course)
  const index = lessons.findIndex((lesson) => lesson.slug === lessonSlug)
  return {
    previous: index > 0 ? lessons[index - 1] : undefined,
    next: index >= 0 ? lessons[index + 1] : undefined,
    index,
    total: lessons.length,
  }
}

export function progressPercent(completed: number, total: number) {
  if (total <= 0) return 0
  return Math.round((completed / total) * 100)
}
