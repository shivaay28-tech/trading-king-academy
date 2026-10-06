import { seedUsers } from '@/data/users'
import { isSupabaseEnabled } from '@/services/backend'
import { emptyPreferences, mapProfile } from '@/services/mappers'
import { getSupabase } from '@/services/supabase'
import { delay, readJson, writeJson } from '@/services/storage'
import type { AuthResult, RegisterPayload, SessionUser, User } from '@/types'
import { STORAGE_KEYS } from '@/utils/constants'
import { uid } from '@/utils/format'

export interface CreateStudentPayload {
  fullName: string
  email: string
  password: string
  country: string
  countryCode: string
  mobile?: string
}

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
    questionsUsed: user.questionsUsed ?? 0,
  }
}

function saveUsers(users: User[]) {
  writeJson(STORAGE_KEYS.users, users)
}

let sessionUser: SessionUser | null = null
let userCache: SessionUser[] = []

function asRow(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

async function loadProfile(userId: string, tries = 6): Promise<SessionUser | null> {
  const sb = getSupabase()
  for (let attempt = 0; attempt < tries; attempt += 1) {
    const { data, error } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (!error && data) {
      const mapped = mapProfile(asRow(data) ?? {})
      sessionUser = mapped
      return mapped
    }
    await delay(250)
  }
  return null
}

const localAuth = {
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
    const user = loadUsers().find((item) => item.email.toLowerCase() === email.trim().toLowerCase())
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
      emailPreferences: emptyPreferences(),
      plan: 'free',
      questionsUsed: 0,
    }

    saveUsers([user, ...users])
    const session = publicUser(user)
    writeJson(STORAGE_KEYS.session, session)
    return { ok: true, message: 'Your Academy account is ready.', user: session }
  },

  async forgotPassword(email: string): Promise<AuthResult> {
    await delay(500)
    const user = loadUsers().find((item) => item.email.toLowerCase() === email.trim().toLowerCase())
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

  async updateProfile(userId: string, patch: Partial<SessionUser>) {
    const users = loadUsers()
    const index = users.findIndex((item) => item.id === userId)
    const current = index >= 0 ? users[index] : undefined
    if (index < 0 || !current) return null

    const nextUser: User = { ...current, ...patch, id: current.id, password: current.password }
    const next = [...users]
    next[index] = nextUser
    saveUsers(next)

    const session = localAuth.current()
    const published = publicUser(nextUser)
    if (session?.id === userId) writeJson(STORAGE_KEYS.session, published)
    return published
  },

  async changePassword(userId: string, currentPassword: string, nextPassword: string): Promise<AuthResult> {
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

  async createStudent(payload: CreateStudentPayload): Promise<AuthResult> {
    await delay(400)
    const users = loadUsers()
    if (users.some((item) => item.email.toLowerCase() === payload.email.toLowerCase())) {
      return { ok: false, message: 'An account with this email already exists.' }
    }
    const user: User = {
      id: uid('user'),
      fullName: payload.fullName.trim(),
      email: payload.email.trim().toLowerCase(),
      mobile: payload.mobile?.trim() ?? '',
      country: payload.country,
      countryCode: payload.countryCode,
      role: 'student',
      password: payload.password,
      createdAt: new Date().toISOString(),
      emailPreferences: emptyPreferences(),
      plan: 'free',
      questionsUsed: 0,
    }
    saveUsers([user, ...users])
    return { ok: true, message: 'Student account created.', user: publicUser(user) }
  },
}

const cloudAuth = {
  current(): SessionUser | null {
    return sessionUser
  },

  listUsers() {
    return userCache
  },

  getUser(id: string) {
    if (sessionUser?.id === id) return sessionUser
    return userCache.find((item) => item.id === id)
  },

  async login(email: string, password: string): Promise<AuthResult> {
    const sb = getSupabase()
    const { data, error } = await sb.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error || !data.user) {
      return { ok: false, message: error?.message ?? 'Email or password is incorrect.' }
    }
    const profile = await loadProfile(data.user.id)
    if (!profile) {
      return { ok: false, message: 'Signed in, but the profile could not be loaded. Try again in a moment.' }
    }
    return { ok: true, message: 'Welcome back.', user: profile }
  },

  async register(payload: RegisterPayload): Promise<AuthResult> {
    const sb = getSupabase()
    const { data, error } = await sb.auth.signUp({
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          full_name: payload.fullName.trim(),
          mobile: payload.mobile.trim(),
          country: payload.country,
          country_code: payload.countryCode,
        },
      },
    })
    if (error) {
      return { ok: false, message: error.message }
    }
    if (!data.session || !data.user) {
      return {
        ok: true,
        message: 'Check your email to confirm the account, then sign in.',
      }
    }
    const profile = await loadProfile(data.user.id)
    if (!profile) {
      return { ok: true, message: 'Account created. Sign in to continue.' }
    }
    return { ok: true, message: 'Your Academy account is ready.', user: profile }
  },

  async forgotPassword(email: string): Promise<AuthResult> {
    const sb = getSupabase()
    const { error } = await sb.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) return { ok: false, message: error.message }
    return {
      ok: true,
      message: 'If an account exists for this email, a reset link has been sent.',
    }
  },

  async resetPassword(_token: string, password: string): Promise<AuthResult> {
    const sb = getSupabase()
    const { data } = await sb.auth.getSession()
    if (!data.session) {
      return {
        ok: false,
        message: 'Open the reset link from your email. This session is missing or has expired.',
      }
    }
    const { error } = await sb.auth.updateUser({ password })
    if (error) return { ok: false, message: error.message }
    return { ok: true, message: 'Password updated. You can sign in now.' }
  },

  async updateProfile(userId: string, patch: Partial<SessionUser>) {
    const sb = getSupabase()
    const updates: Record<string, unknown> = {}
    if (patch.fullName !== undefined) updates.full_name = patch.fullName
    if (patch.mobile !== undefined) updates.mobile = patch.mobile
    if (patch.country !== undefined) updates.country = patch.country
    if (patch.countryCode !== undefined) updates.country_code = patch.countryCode
    if (patch.emailPreferences !== undefined) updates.email_preferences = patch.emailPreferences
    if (patch.plan !== undefined) updates.plan = patch.plan
    if (patch.avatar !== undefined) updates.avatar = patch.avatar
    if (patch.questionsUsed !== undefined) updates.questions_used = patch.questionsUsed
    const { data, error } = await sb.from('profiles').update(updates).eq('id', userId).select('*').maybeSingle()
    if (error || !data) return sessionUser?.id === userId ? sessionUser : null
    const mapped = mapProfile(asRow(data) ?? {})
    if (sessionUser?.id === userId) sessionUser = mapped
    userCache = userCache.map((item) => (item.id === userId ? mapped : item))
    return mapped
  },

  async changePassword(userId: string, currentPassword: string, nextPassword: string): Promise<AuthResult> {
    const sb = getSupabase()
    const current = sessionUser
    if (!current || current.id !== userId) return { ok: false, message: 'Account not found.' }
    const { error: signInError } = await sb.auth.signInWithPassword({
      email: current.email,
      password: currentPassword,
    })
    if (signInError) return { ok: false, message: 'Current password is incorrect.' }
    const { error } = await sb.auth.updateUser({ password: nextPassword })
    if (error) return { ok: false, message: error.message }
    return { ok: true, message: 'Password updated.' }
  },

  async logout() {
    const sb = getSupabase()
    sessionUser = null
    userCache = []
    await sb.auth.signOut()
  },

  async createStudent(payload: CreateStudentPayload): Promise<AuthResult> {
    const sb = getSupabase()
    const { data } = await sb.auth.getSession()
    const token = data.session?.access_token
    if (!token) return { ok: false, message: 'Sign in as an admin to create students.' }
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fullName: payload.fullName.trim(),
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
        country: payload.country,
        countryCode: payload.countryCode,
        mobile: payload.mobile?.trim() ?? '',
      }),
    })
    const body = (await response.json().catch(() => ({}))) as { message?: string; user?: SessionUser }
    if (!response.ok) {
      return { ok: false, message: body.message ?? 'Could not create the student.' }
    }
    if (body.user) userCache = [body.user, ...userCache.filter((item) => item.id !== body.user?.id)]
    return { ok: true, message: body.message ?? 'Student account created.', user: body.user }
  },
}

function api() {
  return isSupabaseEnabled() ? cloudAuth : localAuth
}

export const authService = {
  isLive: isSupabaseEnabled,

  current() {
    return api().current()
  },

  listUsers() {
    return api().listUsers()
  },

  getUser(id: string) {
    return api().getUser(id)
  },

  async hydrate() {
    if (!isSupabaseEnabled()) {
      sessionUser = localAuth.current()
      userCache = localAuth.listUsers()
      return sessionUser
    }
    const sb = getSupabase()
    const { data } = await sb.auth.getSession()
    if (!data.session) {
      sessionUser = null
      return null
    }
    return loadProfile(data.session.user.id)
  },

  onAuthChange(callback: (user: SessionUser | null) => void) {
    if (!isSupabaseEnabled()) return () => undefined
    const sb = getSupabase()
    const { data } = sb.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        sessionUser = null
        callback(null)
        return
      }
      void loadProfile(session.user.id).then(callback)
    })
    return () => data.subscription.unsubscribe()
  },

  async refreshUsers() {
    if (!isSupabaseEnabled()) {
      userCache = localAuth.listUsers()
      return userCache
    }
    const sb = getSupabase()
    const { data, error } = await sb.from('profiles').select('*').order('created_at', { ascending: false })
    if (error) return userCache
    userCache = (data ?? []).map((row) => mapProfile(asRow(row) ?? {}))
    return userCache
  },

  login(email: string, password: string) {
    return api().login(email, password)
  },

  register(payload: RegisterPayload) {
    return api().register(payload)
  },

  forgotPassword(email: string) {
    return api().forgotPassword(email)
  },

  resetPassword(token: string, password: string) {
    return api().resetPassword(token, password)
  },

  updateProfile(userId: string, patch: Partial<SessionUser>) {
    return api().updateProfile(userId, patch)
  },

  changePassword(userId: string, currentPassword: string, nextPassword: string) {
    return api().changePassword(userId, currentPassword, nextPassword)
  },

  async logout() {
    await api().logout()
    sessionUser = null
  },

  createStudent(payload: CreateStudentPayload) {
    return api().createStudent(payload)
  },

  setQuestionsUsed(count: number) {
    if (!sessionUser) return
    sessionUser = { ...sessionUser, questionsUsed: count }
  },
}
