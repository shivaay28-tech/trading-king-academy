import { DifficultyBadge } from '@/components/ui/DifficultyBadge'
import type { Category } from '@/types'
import {
  Brain,
  CandlestickChart,
  Globe2,
  Handshake,
  LineChart,
  MonitorSmartphone,
  Newspaper,
  Shield,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const icons = {
  candlestick: CandlestickChart,
  globe: Globe2,
  chart: LineChart,
  news: Newspaper,
  shield: Shield,
  brain: Brain,
  monitor: MonitorSmartphone,
  handshake: Handshake,
}

export function CategoryCard({
  category,
  lessonCount,
}: {
  category: Category
  lessonCount: number
}) {
  const Icon = icons[category.icon as keyof typeof icons] ?? LineChart

  return (
    <Link
      to={`/categories/${category.slug}`}
      className="group panel flex h-full flex-col rounded-2xl p-5 transition hover:-translate-y-1 hover:border-bright/40 hover:shadow-float"
    >
      <span className="grid h-11 w-11 place-items-center rounded-2xl border border-bright/20 bg-white/6 text-accent group-hover:bg-baazex group-hover:text-ink">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-base font-bold text-ink">{category.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{category.description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium">
        <DifficultyBadge level={category.difficulty} />
        <span className="text-muted">{lessonCount} lessons</span>
        <span className="text-muted">·</span>
        <span className="text-muted">{category.estimatedHours}h estimated</span>
      </div>
    </Link>
  )
}
