import { Seo } from '@/components/Seo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { APP_NAME, DEMO_ADMIN, DEMO_STUDENT } from '@/utils/constants'
import { isSupabaseEnabled } from '@/services/backend'
import { isEmail, required, type FieldErrors } from '@/utils/validation'
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

export function LoginPage() {
  const { login } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FieldErrors<'email' | 'password' | 'form'>>({})

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const next: FieldErrors<'email' | 'password' | 'form'> = {
      email: required(email, 'Email') || (isEmail(email) ? '' : 'Enter a valid email address.'),
      password: required(password, 'Password'),
    }
    setErrors(next)
    if (next.email || next.password) return

    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (!result.ok || !result.user) {
      setErrors({ form: result.message })
      push('error', 'Sign in failed', result.message)
      return
    }
    push('success', 'Welcome back', result.user.fullName)
    const destination = from ?? (result.user.role === 'admin' ? '/admin' : '/engine')
    navigate(destination, { replace: true })
  }

  return (
    <div>
      <Seo title="Login" description={`Sign in to ${APP_NAME} to continue your educational courses.`} />
      <p className="text-xs font-bold tracking-[0.18em] text-accent uppercase">Welcome back</p>
      <h1 className="mt-2 text-2xl font-extrabold text-ink sm:text-3xl">Sign in to Academy</h1>
      <p className="mt-2 text-sm text-muted">
        {isSupabaseEnabled()
          ? 'Use the email and password for this academy.'
          : 'Use your Academy email and password. Demo accounts are listed below.'}
      </p>
      <form className="mt-8 space-y-4" onSubmit={onSubmit} noValidate>
        <Input label="Email address" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} error={errors.email} />
        <Input label="Password" name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} error={errors.password} />
        {errors.form ? <p className="text-sm text-danger">{errors.form}</p> : null}
        <Button type="submit" className="w-full" loading={loading}>
          Sign in
        </Button>
      </form>
      <div className="mt-4 flex items-center justify-between text-sm">
        <Link to="/register" className="font-semibold text-accent">
          Create your account
        </Link>
        <Link to="/forgot-password" className="text-muted hover:text-ink">
          Forgot password?
        </Link>
      </div>
      {isSupabaseEnabled() ? null : (
        <div className="mt-8 rounded-2xl border border-bright/15 bg-white/5 p-4 text-xs text-muted">
          <p className="font-semibold text-ink">Demo access</p>
          <p className="mt-1">Student: {DEMO_STUDENT.email} / {DEMO_STUDENT.password}</p>
          <p>Admin: {DEMO_ADMIN.email} / {DEMO_ADMIN.password}</p>
        </div>
      )}
    </div>
  )
}
