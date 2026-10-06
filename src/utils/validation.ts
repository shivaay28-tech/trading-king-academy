const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[0-9]{7,15}$/
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

export function isEmail(value: string) {
  return EMAIL_RE.test(value.trim())
}

export function isPhone(value: string) {
  return PHONE_RE.test(value.replace(/\s+/g, ''))
}

export function isStrongPassword(value: string) {
  return PASSWORD_RE.test(value)
}

export function required(value: string, label: string) {
  return value.trim() ? '' : `${label} is required.`
}

export type FieldErrors<T extends string> = Partial<Record<T, string>>
