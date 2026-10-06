import { authService } from '@/services/auth'
import type { AuthResult, RegisterPayload, SessionUser } from '@/types'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

interface AuthContextValue {
  user: SessionUser | null
  login: (email: string, password: string) => Promise<AuthResult>
  register: (payload: RegisterPayload) => Promise<AuthResult>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => authService.current())

  useEffect(() => {
    let active = true
    void authService.hydrate().then((next) => {
      if (active) setUser(next)
    })
    const unsubscribe = authService.onAuthChange((next) => {
      if (active) setUser(next)
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await authService.login(email, password)
    if (result.user) setUser(result.user)
    return result
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    const result = await authService.register(payload)
    if (result.user) setUser(result.user)
    return result
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
  }, [])

  const refresh = useCallback(async () => {
    const next = await authService.hydrate()
    setUser(next)
  }, [])

  const value = useMemo(
    () => ({ user, login, register, logout, refresh }),
    [user, login, register, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
