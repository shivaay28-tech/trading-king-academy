import type { FaqItem } from '@/types'
import { APP_NAME, APP_SHORT_NAME, COMPANY_NAME } from '@/utils/constants'

export const faqs: FaqItem[] = [
  {
    id: 'faq-1',
    question: `Is ${APP_NAME} a trading signal service?`,
    answer: `No. ${APP_NAME} is an educational platform. Courses explain market concepts, platform tools, and risk. They do not provide personalised investment advice, live trade recommendations, or guaranteed outcomes.`,
  },
  {
    id: 'faq-2',
    question: `Do I need a ${APP_SHORT_NAME} trading account to study?`,
    answer:
      'You can create a free Academy account and study the courses without opening a live trading account. A trading account is optional and is a separate decision with its own suitability and risk considerations.',
  },
  {
    id: 'faq-3',
    question: 'Are the courses suitable for beginners?',
    answer:
      'Yes. Several courses start from first principles, including currency pairs, order types, and MetaTrader 5 navigation. Intermediate and advanced modules are clearly labelled so you can choose an appropriate path.',
  },
  {
    id: 'faq-4',
    question: 'Will completing a course make me a profitable trader?',
    answer:
      'No programme can promise trading results. Education can improve your understanding of markets and risk, but forex and CFD trading can result in the loss of capital. Past study is not a predictor of future performance.',
  },
  {
    id: 'faq-5',
    question: 'How are quizzes and certificates used?',
    answer:
      'Quizzes check that you have understood the lesson material. A score of 70% or higher is required to pass. Certificates record that you completed the educational course. They are not a professional licence or a trading qualification.',
  },
  {
    id: 'faq-6',
    question: 'Can I study on a mobile device?',
    answer:
      'Yes. The Academy is designed to work on phones, tablets, and desktops. Lesson progress, notes, and enrolments are stored with your account so you can continue on another device.',
  },
  {
    id: 'faq-7',
    question: 'Is leverage explained in the curriculum?',
    answer:
      'Yes. Leverage, margin, and position size are covered as risk topics. The material explains how these tools can magnify both gains and losses. It does not encourage the use of high leverage.',
  },
  {
    id: 'faq-8',
    question: 'Who provides the education?',
    answer: `Content is published by ${APP_NAME}, a learning resource of ${COMPANY_NAME}. Lessons are reviewed for clarity and for a strictly educational tone.`,
  },
]
