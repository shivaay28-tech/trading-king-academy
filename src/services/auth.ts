import { seedUsers } from '@/data/users'
import type { AuthResult, RegisterPayload, SessionUser, User } from '@/types'
import { STORAGE_KEYS } from '@/utils/constants'
import { uid } from '@/utils/format'
import { delay, readJson, writeJson } from '@/services/storage'

function loadUsers(): User[] {
  const stored = readJson<User[] | null>(STORAGE_KEYS.users, null)
  if (stored && stored.length) return stored
  writeJson(STORAGE_KEYS.users, seedUsers)
  return seedUsers
}

function publicUser(user: User): SessionUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    mobile: user.mobile,
    country: user.country,
    countryCode: user.countryCode,
    role: user.role,
    avatar: user.avatar,
    createdAt: user.createdAt,
    emailPreferences: user.emailPreferences,
    plan: user.plan ?? 'free',
  }
}

function saveUsers(users: User[]) {
  writeJson(STORAGE_KEYS.users, users)
}

export const authService = {
  current(): SessionUser | null {
    return readJson<SessionUser | null>(STORAGE_KEYS.session, null)
  },

  listUsers() {
    return loadUsers().map(publicUser)
  },

  getUser(id: string) {
    const user = loadUsers().find((item) => item.id === id)
    return user ? publicUser(user) : undefined
  },

  async login(email: string, password: string): Promise<AuthResult> {
    await delay(550)
    const user = loadUsers().find(
      (item) => item.email.toLowerCase() === email.trim().toLowerCase(),
    )
    if (!user || user.password !== password) {
      return { ok: false, message: 'Email or password is incorrect.' }
    }
    const session = publicUser(user)
    writeJson(STORAGE_KEYS.session, session)
    return { ok: true, message: 'Welcome back.', user: session }
  },

  async register(payload: RegisterPayload): Promise<AuthResult> {
    await delay(700)
    const users = loadUsers()
    if (users.some((item) => item.email.toLowerCase() === payload.email.toLowerCase())) {
      return { ok: false, message: 'An account with this email already exists.' }
    }

    const user: User = {
      id: uid('user'),
      fullName: payload.fullName.trim(),
      email: payload.email.trim().toLowerCase(),
      mobile: payload.mobile.trim(),
      country: payload.country,
      countryCode: payload.countryCode,
      role: 'student',
      password: payload.password,
      createdAt: new Date().toISOString(),
      emailPreferences: {
        productUpdates: true,
        courseNotifications: true,
        weeklyDigest: false,
      },
    }

    saveUsers([user, ...users])
    const session = publicUser(user)
    writeJson(STORAGE_KEYS.session, session)
    return { ok: true, message: 'Your Academy account is ready.', user: session }
  },

  async forgotPassword(email: string): Promise<AuthResult> {
    await delay(500)
    const user = loadUsers().find(
      (item) => item.email.toLowerCase() === email.trim().toLowerCase(),
    )
    if (!user) {
      return {
        ok: true,
        message: 'If an account exists for this email, a reset link has been created.',
      }
    }

    const token = uid('reset')
    writeJson(STORAGE_KEYS.resetTokens, { token, email: user.email, createdAt: Date.now() })
    return {
      ok: true,
      message: `Reset token created for this demo: ${token}. Use it on the reset page.`,
      user: publicUser(user),
    }
  },

  async resetPassword(token: string, password: string): Promise<AuthResult> {
    await delay(500)
    const record = readJson<{ token: string; email: string } | null>(STORAGE_KEYS.resetTokens, null)
    if (!record || record.token !== token.trim()) {
      return { ok: false, message: 'This reset token is invalid or has expired.' }
    }

    const users = loadUsers()
    const index = users.findIndex((item) => item.email === record.email)
    const current = index >= 0 ? users[index] : undefined
    if (index < 0 || !current) {
      return { ok: false, message: 'We could not find that account.' }
    }

    const next = [...users]
    next[index] = { ...current, password }
    saveUsers(next)
    writeJson(STORAGE_KEYS.resetTokens, null)
    return { ok: true, message: 'Password updated. You can sign in now.' }
  },

  updateProfile(userId: string, patch: Partial<SessionUser>) {
    const users = loadUsers()
    const index = users.findIndex((item) => item.id === userId)
    const current = index >= 0 ? users[index] : undefined
    if (index < 0 || !current) return null

    const nextUser: User = { ...current, ...patch, id: current.id, password: current.password }
    const next = [...users]
    next[index] = nextUser
    saveUsers(next)

    const session = this.current()
    const published = publicUser(nextUser)
    if (session?.id === userId) writeJson(STORAGE_KEYS.session, published)
    return published
  },

  changePassword(userId: string, currentPassword: string, nextPassword: string): AuthResult {
    const users = loadUsers()
    const index = users.findIndex((item) => item.id === userId)
    const current = index >= 0 ? users[index] : undefined
    if (index < 0 || !current) return { ok: false, message: 'Account not found.' }
    if (current.password !== currentPassword) {
      return { ok: false, message: 'Current password is incorrect.' }
    }
    const next = [...users]
    next[index] = { ...current, password: nextPassword }
    saveUsers(next)
    return { ok: true, message: 'Password updated.' }
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.session)
  },
}
