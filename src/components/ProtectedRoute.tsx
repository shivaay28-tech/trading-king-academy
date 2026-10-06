import { useAuth } from '@/context/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

export function GuestRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (user) {
    return (
      <Navigate
        to={user.role === 'superadmin' ? '/superadmin' : user.role === 'admin' ? '/admin' : '/engine'}
        replace
      />
    )
  }
  return children
}
