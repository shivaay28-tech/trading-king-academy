import { seedCourses } from '@/data/courses'
import { seedQuizzes } from '@/data/quizzes'
import type { Course, Quiz } from '@/types'
import { APP_NAME, STORAGE_KEYS } from '@/utils/constants'
import { uid } from '@/utils/format'
import { readJson, writeJson } from '@/services/storage'

function loadCourses() {
  const stored = readJson<Course[] | null>(STORAGE_KEYS.catalog, null)
  if (!stored || !stored.length) {
    writeJson(STORAGE_KEYS.catalog, seedCourses)
    return seedCourses
  }
  const missing = seedCourses.filter((seed) => !stored.some((course) => course.id === seed.id))
  if (!missing.length) return stored
  const next = [...stored, ...missing]
  writeJson(STORAGE_KEYS.catalog, next)
  return next
}

function loadQuizzes() {
  const stored = readJson<Quiz[] | null>(STORAGE_KEYS.quizzes, null)
  if (!stored || !stored.length) {
    writeJson(STORAGE_KEYS.quizzes, seedQuizzes)
    return seedQuizzes
  }
  const missing = seedQuizzes.filter((seed) => !stored.some((quiz) => quiz.id === seed.id))
  if (!missing.length) return stored
  const next = [...stored, ...missing]
  writeJson(STORAGE_KEYS.quizzes, next)
  return next
}

export const catalogService = {
  listCourses() {
    return loadCourses()
  },

  getCourse(idOrSlug: string) {
    return loadCourses().find((course) => course.id === idOrSlug || course.slug === idOrSlug)
  },

  listQuizzes() {
    return loadQuizzes()
  },

  getQuiz(id: string) {
    return loadQuizzes().find((quiz) => quiz.id === id)
  },

  getQuizForCourse(courseId: string) {
    return loadQuizzes().find((quiz) => quiz.courseId === courseId)
  },

  saveCourse(input: Course) {
    const courses = loadCourses()
    const index = courses.findIndex((course) => course.id === input.id)
    const next = [...courses]
    if (index >= 0) next[index] = input
    else next.unshift(input)
    writeJson(STORAGE_KEYS.catalog, next)
    return input
  },

  deleteCourse(id: string) {
    writeJson(
      STORAGE_KEYS.catalog,
      loadCourses().filter((course) => course.id !== id),
    )
  },

  saveQuiz(input: Quiz) {
    const quizzes = loadQuizzes()
    const index = quizzes.findIndex((quiz) => quiz.id === input.id)
    const next = [...quizzes]
    if (index >= 0) next[index] = input
    else next.unshift(input)
    writeJson(STORAGE_KEYS.quizzes, next)
    return input
  },

  createEmptyCourse(): Course {
    const id = uid('course')
    return {
      id,
      slug: `new-course-${id.slice(-6)}`,
      title: 'Untitled course',
      subtitle: 'Add a short summary for learners.',
      description: 'Describe what this educational course covers.',
      categoryId: 'cat-forex-basics',
      difficulty: 'Beginner',
      durationHours: 1,
      objectives: ['Describe a core market concept'],
      instructor: APP_NAME,
      status: 'draft',
      popular: false,
      featured: false,
      quizId: uid('quiz'),
      modules: [
        {
          id: uid('mod'),
          title: 'Module 1',
          order: 1,
          lessons: [
            {
              id: uid('lesson'),
              slug: 'new-lesson',
              title: 'New lesson',
              durationMinutes: 10,
              order: 1,
              summary: 'Write a one-sentence summary.',
              content: ['Add lesson content here.'],
              resourceName: 'Lesson notes (PDF)',
            },
          ],
        },
      ],
    }
  },
}
