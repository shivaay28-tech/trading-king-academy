import { cn } from '@/utils/cn'
import { Search } from 'lucide-react'
import type { Difficulty } from '@/types'
import { categories } from '@/data/categories'

export function SearchAndFilters({
  query,
  onQuery,
  categoryId,
  onCategory,
  difficulty,
  onDifficulty,
}: {
  query: string
  onQuery: (value: string) => void
  categoryId: string
  onCategory: (value: string) => void
  difficulty: Difficulty | 'All'
  onDifficulty: (value: Difficulty | 'All') => void
}) {
  const difficulties: Array<Difficulty | 'All'> = ['All', 'Beginner', 'Intermediate', 'Advanced']

  return (
    <div className="panel rounded-2xl p-4">
      <label className="flex h-11 items-center gap-2 rounded-xl border border-line bg-white/5 px-3">
        <Search className="h-4 w-4 text-muted" />
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Search courses, topics, or platforms"
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          aria-label="Search courses"
        />
      </label>
      <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto">
          <FilterChip active={categoryId === 'all'} onClick={() => onCategory('all')}>
            All categories
          </FilterChip>
          {categories.map((category) => (
            <FilterChip key={category.id} active={categoryId === category.id} onClick={() => onCategory(category.id)}>
              {category.name}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {difficulties.map((level) => (
            <FilterChip key={level} active={difficulty === level} onClick={() => onDifficulty(level)}>
              {level}
            </FilterChip>
          ))}
        </div>
      </div>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition',
        active ? 'bg-baazex text-ink shadow-float' : 'bg-white/5 text-muted hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}
