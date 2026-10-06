import { Seo } from '@/components/Seo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { countries } from '@/data/countries'
import { isEmail, isPhone, isStrongPassword, required, type FieldErrors } from '@/utils/validation'
import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { APP_NAME } from '@/utils/constants'
import { isSupabaseEnabled } from '@/services/backend'

type Fields = 'fullName' | 'email' | 'mobile' | 'country' | 'password' | 'confirm' | 'terms' | 'form'

export function RegisterPage() {
  const { register } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [countryCode, setCountryCode] = useState('AE')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [terms, setTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FieldErrors<Fields>>({})

  const country = useMemo(
    () => countries.find((item) => item.code === countryCode) ?? countries[0],
    [countryCode],
  )

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const next: FieldErrors<Fields> = {
      fullName: required(fullName, 'Full name'),
      email: required(email, 'Email') || (isEmail(email) ? '' : 'Enter a valid email address.'),
      mobile: required(mobile, 'Mobile number') || (isPhone(mobile) ? '' : 'Enter 7 to 15 digits without the country code.'),
      country: country ? '' : 'Select a country.',
      password:
        required(password, 'Password') ||
        (isStrongPassword(password) ? '' : 'Use at least 8 characters with a letter and a number.'),
      confirm: password === confirm ? '' : 'Passwords do not match.',
      terms: terms ? '' : 'Please accept the terms and privacy policy.',
    }
    setErrors(next)
    if (Object.values(next).some(Boolean)) return

    setLoading(true)
    const result = await register({
      fullName,
      email,
      mobile,
      country: country?.name ?? '',
      countryCode,
      password,
    })
    setLoading(false)
    if (!result.ok) {
      setErrors({ form: result.message })
      push('error', 'Registration failed', result.message)
      return
    }
    if (!result.user) {
      push('success', 'Check your email', result.message)
      navigate('/login')
      return
    }
    push('success', 'Account created', 'You can start exploring the AI Engine and courses.')
    navigate('/engine')
  }

  return (
    <div>
      <Seo title="Create account" description={`Register for a free ${APP_NAME} learning account.`} />
      <p className="text-xs font-bold tracking-[0.18em] text-accent uppercase">New student</p>
      <h1 className="mt-2 text-2xl font-extrabold text-ink sm:text-3xl">Create your account</h1>
      <p className="mt-2 text-sm text-muted">
        {isSupabaseEnabled()
          ? 'Create a free student account. Enrolments, notes, quizzes, and certificates stay with you on every device.'
          : 'One Academy login stores your enrolments, notes, quizzes, and certificates in this browser until a backend is connected.'}
      </p>
      <form className="mt-8 space-y-4" onSubmit={onSubmit} noValidate>
        <Input label="Full name" name="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} error={errors.fullName} autoComplete="name" />
        <Input label="Email address" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} error={errors.email} autoComplete="email" />
        <Select
          label="Country"
          name="country"
          value={countryCode}
          onChange={(event) => setCountryCode(event.target.value)}
          options={countries.map((item) => ({ value: item.code, label: `${item.name} (${item.dial})` }))}
          error={errors.country}
        />
        <Input
          label="Mobile number"
          name="mobile"
          inputMode="numeric"
          value={mobile}
          onChange={(event) => setMobile(event.target.value.replace(/[^\d]/g, ''))}
          error={errors.mobile}
          hint={`Country code ${country?.dial} will be stored with your number.`}
        />
        <Input label="Password" name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} error={errors.password} autoComplete="new-password" />
        <Input label="Confirm password" name="confirm" type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} error={errors.confirm} autoComplete="new-password" />
        <label className="flex items-start gap-3 text-sm text-muted">
          <input type="checkbox" className="mt-1" checked={terms} onChange={(event) => setTerms(event.target.checked)} />
          <span>
            I accept the{' '}
            <Link to="/terms" className="font-semibold text-accent">
              Terms of use
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="font-semibold text-accent">
              Privacy policy
            </Link>
            , and I understand that Academy content is educational only.
          </span>
        </label>
        {errors.terms ? <p className="text-xs text-danger">{errors.terms}</p> : null}
        {errors.form ? <p className="text-sm text-danger">{errors.form}</p> : null}
        <Button type="submit" className="w-full" loading={loading}>
          Create free account
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-accent">
          Sign in
        </Link>
      </p>
    </div>
  )
}
