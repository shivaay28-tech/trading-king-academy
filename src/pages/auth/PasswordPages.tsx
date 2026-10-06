import { Seo } from '@/components/Seo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/context/ToastContext'
import { authService } from '@/services/auth'
import { APP_NAME } from '@/utils/constants'
import { isSupabaseEnabled } from '@/services/backend'
import { isEmail, required } from '@/utils/validation'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export function ForgotPasswordPage() {
  const { push } = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const next = required(email, 'Email') || (isEmail(email) ? '' : 'Enter a valid email address.')
    setError(next)
    if (next) return
    setLoading(true)
    const result = await authService.forgotPassword(email)
    setLoading(false)
    setMessage(result.message)
    push(result.ok ? 'success' : 'error', result.ok ? 'Check the reset details' : 'Request failed', result.message)
    if (result.ok && result.message.includes('Reset token')) {
      const token = result.message.split('demo: ')[1]?.split('.')[0]
      if (token) navigate(`/reset-password?token=${token}`)
    }
  }

  return (
    <div>
      <Seo title="Forgot password" description={`Request a ${APP_NAME} password reset.`} />
      <h1 className="text-3xl font-extrabold text-ink">Forgot password</h1>
      <p className="mt-2 text-sm text-muted">
        {isSupabaseEnabled()
          ? 'Enter your email and we will send a password reset link if an account exists.'
          : 'Enter your email. In local demo mode, a reset token is generated in this browser instead of sending mail.'}
      </p>
      <form className="mt-8 space-y-4" onSubmit={onSubmit} noValidate>
        <Input label="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} error={error} />
        <Button type="submit" className="w-full" loading={loading}>
          Send reset link
        </Button>
      </form>
      {message ? <p className="mt-4 text-sm text-muted">{message}</p> : null}
      <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-accent">
        Back to sign in
      </Link>
    </div>
  )
}

export function ResetPasswordPage() {
  const { push } = useToast()
  const navigate = useNavigate()
  const params = new URLSearchParams(window.location.search)
  const [token, setToken] = useState(params.get('token') ?? '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!isSupabaseEnabled() && !token.trim()) {
      setError('A reset token is required.')
      return
    }
    if (password.length < 8 || password !== confirm) {
      setError('Passwords must match and contain at least 8 characters.')
      return
    }
    setLoading(true)
    const result = await authService.resetPassword(token, password)
    setLoading(false)
    if (!result.ok) {
      setError(result.message)
      push('error', 'Reset failed', result.message)
      return
    }
    push('success', 'Password updated', 'You can sign in with the new password.')
    navigate('/login')
  }

  return (
    <div>
      <Seo title="Reset password" description={`Choose a new ${APP_NAME} password.`} />
      <h1 className="text-3xl font-extrabold text-ink">Reset password</h1>
      <form className="mt-8 space-y-4" onSubmit={onSubmit} noValidate>
        {isSupabaseEnabled() ? null : (
          <Input label="Reset token" value={token} onChange={(event) => setToken(event.target.value)} />
        )}
        <Input label="New password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <Input label="Confirm password" type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" className="w-full" loading={loading}>
          Update password
        </Button>
      </form>
    </div>
  )
}
