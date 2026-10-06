import { CourseCard } from '@/components/course/CourseCard'
import { Seo } from '@/components/Seo'
import { useAcademy } from '@/context/AcademyContext'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { APP_NAME } from '@/utils/constants'

const stages = [
  {
    title: 'Stage 1 · Foundations',
    text: 'Learn how the market is organised, how pairs are quoted, and how orders are described.',
    slugs: ['introduction-to-forex-trading', 'understanding-currency-pairs', 'how-buy-and-sell-orders-work'],
  },
  {
    title: 'Stage 2 · Platform and product math',
    text: 'Connect pip value, lots, leverage, and the MetaTrader 5 workspace.',
    slugs: ['pips-lots-leverage-and-margin', 'introduction-to-metatrader-5'],
  },
  {
    title: 'Stage 3 · Analysis',
    text: 'Describe charts and economic information without treating either as a forecast.',
    slugs: ['technical-analysis-essentials', 'fundamental-market-analysis'],
  },
  {
    title: 'Stage 4 · Conduct',
    text: 'Risk, psychology, and introducing-broker standards for professional communication.',
    slugs: ['risk-management-fundamentals', 'trading-psychology', 'introducing-broker-fundamentals'],
  },
]

export function LearningPathPage() {
  const { courses } = useAcademy()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <Seo title="Learning path" description={`A suggested ${APP_NAME} sequence from forex foundations to analysis, risk, and partner education.`} />
      <p className="text-xs font-bold tracking-[0.18em] text-accent uppercase">Suggested sequence</p>
      <h1 className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">Learning path</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        This path is a study recommendation, not a requirement. You can enrol in any published course at any time.
      </p>
      <div className="mt-10 space-y-12">
        {stages.map((stage) => (
          <section key={stage.title}>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-ink">{stage.title}</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted">{stage.text}</p>
              </div>
              <ArrowRight className="hidden h-5 w-5 text-accent sm:block" />
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {stage.slugs.map((slug) => {
                const course = courses.find((item) => item.slug === slug)
                return course ? <CourseCard key={course.id} course={course} /> : null
              })}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-10 text-sm">
        Prefer a full catalogue view? <Link to="/courses" className="font-semibold text-accent">Browse all courses</Link>
      </p>
    </div>
  )
}
