import type { QuizQuestionData } from '@/types'
import { cn } from '@/utils/cn'

export function QuizQuestion({
  question,
  index,
  total,
  selected,
  onSelect,
  revealed,
}: {
  question: QuizQuestionData
  index: number
  total: number
  selected?: string
  onSelect: (optionId: string) => void
  revealed?: boolean
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-muted">
        Question {index + 1} of {total}
      </legend>
      <h2 className="mt-2 text-xl font-bold text-ink">{question.prompt}</h2>
      <div className="mt-5 space-y-2">
        {question.options.map((option) => {
          const isSelected = selected === option.id
          const isCorrect = option.id === question.correctOptionId
          return (
            <label
              key={option.id}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-sm transition',
                revealed && isCorrect && 'border-success bg-success/5',
                revealed && isSelected && !isCorrect && 'border-danger bg-danger/5',
                !revealed && isSelected && 'border-baazex bg-baazex/5',
                !revealed && !isSelected && 'border-line hover:border-baazex/40',
              )}
            >
              <input
                type="radio"
                name={question.id}
                value={option.id}
                checked={isSelected}
                disabled={revealed}
                onChange={() => onSelect(option.id)}
                className="mt-0.5"
              />
              <span className="font-medium text-ink">{option.text}</span>
            </label>
          )
        })}
      </div>
      {revealed ? <p className="mt-4 rounded-xl border border-white/8 bg-white/5 p-3 text-sm text-muted">{question.explanation}</p> : null}
    </fieldset>
  )
}
