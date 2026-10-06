import { CategoryCard } from '@/components/course/CategoryCard'
import { Seo } from '@/components/Seo'
import { useAcademy } from '@/context/AcademyContext'
import { categories } from '@/data/categories'
import { APP_NAME } from '@/utils/constants'
import { getLessonCount } from '@/utils/course'

export function CategoriesPage() {
  const { courses } = useAcademy()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <Seo title="Course categories" description={`Explore ${APP_NAME} categories covering forex, markets, analysis, risk, psychology, MT5, and introducing brokers.`} />
      <p className="text-xs font-bold tracking-[0.18em] text-accent uppercase">Curriculum map</p>
      <h1 className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">Course categories</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Each category lists estimated duration, difficulty, and the number of lessons currently published.
      </p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {categories.map((category) => {
          const lessonCount = courses
            .filter((course) => course.categoryId === category.id)
            .reduce((sum, course) => sum + getLessonCount(course), 0)
          return <CategoryCard key={category.id} category={category} lessonCount={lessonCount} />
        })}
      </div>
    </div>
  )
}
