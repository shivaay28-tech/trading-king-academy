import { seedCourses } from '@/data/courses'
import { categories } from '@/data/categories'
import { seedQuizzes } from '@/data/quizzes'
import { isSupabaseEnabled } from '@/services/backend'
import { courseToRow, mapCourse, mapQuiz, quizToRow } from '@/services/mappers'
import { getSupabase } from '@/services/supabase'
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

let courseCache: Course[] = []
let quizCache: Quiz[] = []
let hydrated = false

function asRow(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

async function fetchCatalog() {
  const sb = getSupabase()
  await sb.rpc('ensure_catalog_seed', {
    payload: {
      categories,
      courses: seedCourses,
      quizzes: seedQuizzes,
    },
  })
  const [{ data: courseRows }, { data: quizRows }] = await Promise.all([
    sb.from('courses').select('*').order('title'),
    sb.from('quizzes').select('*'),
  ])
  courseCache = (courseRows ?? []).map((row) => mapCourse(asRow(row)))
  quizCache = (quizRows ?? []).map((row) => mapQuiz(asRow(row)))
  hydrated = true
}

export const catalogService = {
  async refresh() {
    if (!isSupabaseEnabled()) {
      courseCache = loadCourses()
      quizCache = loadQuizzes()
      hydrated = true
      return
    }
    await fetchCatalog()
  },

  listCourses() {
    if (!hydrated && !isSupabaseEnabled()) {
      courseCache = loadCourses()
      hydrated = true
    }
    return courseCache
  },

  getCourse(idOrSlug: string) {
    return this.listCourses().find((course) => course.id === idOrSlug || course.slug === idOrSlug)
  },

  listQuizzes() {
    if (!hydrated && !isSupabaseEnabled()) {
      quizCache = loadQuizzes()
      hydrated = true
    }
    return quizCache
  },

  getQuiz(id: string) {
    return this.listQuizzes().find((quiz) => quiz.id === id)
  },

  getQuizForCourse(courseId: string) {
    return this.listQuizzes().find((quiz) => quiz.courseId === courseId)
  },

  async saveCourse(input: Course) {
    if (!isSupabaseEnabled()) {
      const courses = loadCourses()
      const index = courses.findIndex((course) => course.id === input.id)
      const next = [...courses]
      if (index >= 0) next[index] = input
      else next.unshift(input)
      writeJson(STORAGE_KEYS.catalog, next)
      courseCache = next
      return input
    }
    const sb = getSupabase()
    const { error } = await sb.from('courses').upsert(courseToRow(input))
    if (error) throw new Error(error.message)
    const index = courseCache.findIndex((course) => course.id === input.id)
    if (index >= 0) courseCache[index] = input
    else courseCache = [input, ...courseCache]
    return input
  },

  async deleteCourse(id: string) {
    if (!isSupabaseEnabled()) {
      const next = loadCourses().filter((course) => course.id !== id)
      writeJson(STORAGE_KEYS.catalog, next)
      courseCache = next
      return
    }
    const sb = getSupabase()
    const { error: quizError } = await sb.from('quizzes').delete().eq('course_id', id)
    if (quizError) throw new Error(quizError.message)
    const { error } = await sb.from('courses').delete().eq('id', id)
    if (error) throw new Error(error.message)
    courseCache = courseCache.filter((course) => course.id !== id)
    quizCache = quizCache.filter((quiz) => quiz.courseId !== id)
  },

  async saveQuiz(input: Quiz) {
    if (!isSupabaseEnabled()) {
      const quizzes = loadQuizzes()
      const index = quizzes.findIndex((quiz) => quiz.id === input.id)
      const next = [...quizzes]
      if (index >= 0) next[index] = input
      else next.unshift(input)
      writeJson(STORAGE_KEYS.quizzes, next)
      quizCache = next
      return input
    }
    const sb = getSupabase()
    const { error } = await sb.from('quizzes').upsert(quizToRow(input))
    if (error) throw new Error(error.message)
    const index = quizCache.findIndex((quiz) => quiz.id === input.id)
    if (index >= 0) quizCache[index] = input
    else quizCache = [input, ...quizCache]
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
