import { QuizQuestion } from '@/components/quiz/QuizQuestion'
import { Seo } from '@/components/Seo'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAcademy } from '@/context/AcademyContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { catalogService } from '@/services/catalog'
import { progressService } from '@/services/progress'
import { PASSING_SCORE } from '@/utils/constants'
import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'

export function QuizPage() {
  const { courseSlug, quizId } = useParams()
  const course = catalogService.getCourse(courseSlug ?? '')
  const quiz = catalogService.getQuiz(quizId ?? '')
  const { user } = useAuth()
  const { isEnrolled, refresh } = useAcademy()
  const { push } = useToast()
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(false)

  if (!course || !quiz || quiz.courseId !== course.id) return <Navigate to="/courses" replace />
  if (user && !isEnrolled(course.id)) return <Navigate to={`/courses/${course.slug}`} replace />

  const activeCourse = course
  const activeQuiz = quiz
  const question = activeQuiz.questions[index]
  const answeredCount = activeQuiz.questions.filter((item) => answers[item.id]).length

  async function submit() {
    if (!user || answeredCount !== activeQuiz.questions.length) {
      push('error', 'Answer every question before submitting')
      return
    }
    const correct = activeQuiz.questions.filter((item) => answers[item.id] === item.correctOptionId).length
    const nextScore = Math.round((correct / activeQuiz.questions.length) * 100)
    setLoading(true)
    await progressService.submitQuiz({
      userId: user.id,
      quizId: activeQuiz.id,
      courseId: activeCourse.id,
      answers,
      score: nextScore,
      passed: nextScore >= PASSING_SCORE,
      courseTitle: activeCourse.title,
    })
    setScore(nextScore)
    setSubmitted(true)
    setLoading(false)
    refresh()
    push(nextScore >= PASSING_SCORE ? 'success' : 'info', `You scored ${nextScore}%`)
  }

  function retake() {
    setAnswers({})
    setIndex(0)
    setSubmitted(false)
    setScore(0)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Seo title={quiz.title} description={`Knowledge check for ${course.title}. Passing score ${PASSING_SCORE}%.`} />
      <Link to={`/courses/${course.slug}`} className="text-sm font-semibold text-accent">
        Back to course
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold text-ink">{quiz.title}</h1>
      <p className="mt-2 text-sm text-muted">Select one answer per question. Passing score: {PASSING_SCORE}%.</p>
      <div className="mt-6">
        <ProgressBar value={Math.round((answeredCount / quiz.questions.length) * 100)} label="Answered" />
      </div>

      <div className="mt-8 rounded-3xl panel p-6">
        {submitted ? (
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-accent uppercase">Result</p>
            <h2 className="mt-2 text-4xl font-extrabold text-ink">{score}%</h2>
            <p className="mt-2 text-sm text-muted">
              {score >= PASSING_SCORE
                ? 'You passed this knowledge check. If every lesson is complete, a sample certificate is issued.'
                : 'A pass requires 70%. Review the explanations and retake when you are ready.'}
            </p>
            <div className="mt-6 space-y-8">
              {quiz.questions.map((item, questionIndex) => (
                <QuizQuestion
                  key={item.id}
                  question={item}
                  index={questionIndex}
                  total={quiz.questions.length}
                  selected={answers[item.id]}
                  onSelect={() => undefined}
                  revealed
                />
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="secondary" onClick={retake}>
                Retake quiz
              </Button>
              <Button onClick={() => navigate('/certificates')}>View certificates</Button>
            </div>
          </div>
        ) : question ? (
          <>
            <QuizQuestion
              question={question}
              index={index}
              total={quiz.questions.length}
              selected={answers[question.id]}
              onSelect={(optionId) => setAnswers((current) => ({ ...current, [question.id]: optionId }))}
            />
            <div className="mt-8 flex items-center justify-between">
              <Button variant="secondary" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}>
                Previous
              </Button>
              {index < quiz.questions.length - 1 ? (
                <Button disabled={!answers[question.id]} onClick={() => setIndex((value) => value + 1)}>
                  Next
                </Button>
              ) : (
                <Button loading={loading} onClick={submit}>
                  Submit quiz
                </Button>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
