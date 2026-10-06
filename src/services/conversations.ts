import { readJson, writeJson } from '@/services/storage'
import type { AiConversation, AiMessage, EnginePlan } from '@/types'
import { BASIC_QUESTIONS, FREE_QUESTIONS, STORAGE_KEYS } from '@/utils/constants'
import { uid } from '@/utils/format'

interface CreditState {
  guestUsed: number
  byUser: Record<string, number>
}

function loadConversations(): AiConversation[] {
  return readJson<AiConversation[]>(STORAGE_KEYS.conversations, [])
}

function saveConversations(items: AiConversation[]) {
  writeJson(STORAGE_KEYS.conversations, items)
}

function loadCredits(): CreditState {
  return readJson<CreditState>(STORAGE_KEYS.questionCredits, { guestUsed: 0, byUser: {} })
}

export const conversationService = {
  list() {
    return loadConversations().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  },

  get(id: string) {
    return loadConversations().find((item) => item.id === id)
  },

  create(title = 'New analysis') {
    const conversation: AiConversation = {
      id: uid('an'),
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    }
    saveConversations([conversation, ...loadConversations()])
    return conversation
  },

  save(conversation: AiConversation) {
    const items = loadConversations()
    const index = items.findIndex((item) => item.id === conversation.id)
    const next = [...items]
    if (index >= 0) next[index] = conversation
    else next.unshift(conversation)
    saveConversations(next)
    return conversation
  },

  remove(id: string) {
    saveConversations(loadConversations().filter((item) => item.id !== id))
  },

  appendMessage(id: string, message: AiMessage, title?: string) {
    const current = this.get(id) ?? this.create()
    const conversation: AiConversation = {
      ...current,
      id,
      title: title || current.title,
      updatedAt: new Date().toISOString(),
      messages: [...current.messages, message],
    }
    return this.save(conversation)
  },

  popLast(id: string, role?: AiMessage['role']) {
    const current = this.get(id)
    if (!current?.messages.length) return current
    const last = current.messages[current.messages.length - 1]
    if (role && last?.role !== role) return current
    return this.save({
      ...current,
      updatedAt: new Date().toISOString(),
      messages: current.messages.slice(0, -1),
    })
  },

  creditLimit(plan: EnginePlan = 'free') {
    return plan === 'basic' ? BASIC_QUESTIONS : FREE_QUESTIONS
  },

  used(userId?: string) {
    const credits = loadCredits()
    if (userId) return credits.byUser[userId] ?? 0
    return credits.guestUsed
  },

  remaining(plan: EnginePlan = 'free', userId?: string) {
    return Math.max(0, this.creditLimit(plan) - this.used(userId))
  },

  consume(userId?: string) {
    const credits = loadCredits()
    if (userId) {
      credits.byUser[userId] = (credits.byUser[userId] ?? 0) + 1
    } else {
      credits.guestUsed += 1
    }
    writeJson(STORAGE_KEYS.questionCredits, credits)
  },
}

export function newMessage(role: AiMessage['role'], content: string, attachments: AiMessage['attachments'] = []): AiMessage {
  return {
    id: uid('msg'),
    role,
    content,
    createdAt: new Date().toISOString(),
    attachments,
  }
}
