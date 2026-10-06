import { ProgressBar } from '@/components/ui/ProgressBar'
import type { Course, Lesson } from '@/types'
import { cn } from '@/utils/cn'
import { Check, ChevronDown, Lock } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

export function LessonList({
  course,
  completedIds,
  currentSlug,
  enrolled,
}: {
  course: Course
  completedIds: string[]
  currentSlug?: string
  enrolled: boolean
}) {
  const [open, setOpen] = useState<Record<string, boolean>>(
    Object.fromEntries(course.modules.map((module) => [module.id, true])),
  )

  return (
    <div className="space-y-3">
      {course.modules.map((module) => (
        <div key={module.id} className="panel overflow-hidden rounded-2xl">
          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-3 text-left"
            onClick={() => setOpen((current) => ({ ...current, [module.id]: !current[module.id] }))}
          >
            <span className="text-sm font-bold text-ink">{module.title}</span>
            <ChevronDown className={cn('h-4 w-4 text-muted transition', open[module.id] ? 'rotate-180' : '')} />
          </button>
          {open[module.id] ? (
            <ul className="border-t border-line">
              {module.lessons.map((lesson) => (
                <LessonRow
                  key={lesson.id}
                  courseSlug={course.slug}
                  lesson={lesson}
                  completed={completedIds.includes(lesson.id)}
                  current={currentSlug === lesson.slug}
                  enrolled={enrolled}
                />
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function LessonRow({
  courseSlug,
  lesson,
  completed,
  current,
  enrolled,
}: {
  courseSlug: string
  lesson: Lesson
  completed: boolean
  current: boolean
  enrolled: boolean
}) {
  const inner = (
    <span className="flex items-center gap-3 px-4 py-3">
      <span
        className={cn(
          'grid h-7 w-7 place-items-center rounded-full text-[11px]',
          completed ? 'bg-success/10 text-success' : current ? 'bg-baazex text-ink' : 'border border-white/10 bg-white/5 text-muted',
        )}
      >
        {completed ? <Check className="h-3.5 w-3.5" /> : enrolled ? lesson.order : <Lock className="h-3.5 w-3.5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">{lesson.title}</span>
        <span className="text-xs text-muted">{lesson.durationMinutes} min</span>
      </span>
    </span>
  )

  if (!enrolled) {
    return <li className="opacity-80">{inner}</li>
  }

  return (
    <li className={cn(current && 'bg-white/5')}>
      <Link to={`/learn/${courseSlug}/${lesson.slug}`}>{inner}</Link>
    </li>
  )
}

export function CourseCurriculumSidebar({
  course,
  completedIds,
  currentSlug,
}: {
  course: Course
  completedIds: string[]
  currentSlug: string
}) {
  const total = course.modules.reduce((sum, module) => sum + module.lessons.length, 0)
  return (
    <div>
      <ProgressBar value={total ? Math.round((completedIds.length / total) * 100) : 0} label="Course progress" />
      <div className="mt-4">
        <LessonList course={course} completedIds={completedIds} currentSlug={currentSlug} enrolled />
      </div>
    </div>
  )
}
