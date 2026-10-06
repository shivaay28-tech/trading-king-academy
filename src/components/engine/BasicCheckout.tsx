import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import {
  emptyPaymentSettings,
  loadMyPaymentRequest,
  loadPaymentSettings,
  submitPaymentRequest,
  type PaymentRequest,
  type PaymentSettings,
} from '@/services/billing'
import type { PaymentMethod } from '@/types'
import { APP_SHORT_NAME, COMPANY_URL } from '@/utils/constants'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function BasicCheckout({ open }: { open: boolean }) {
  const { user } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const [settings, setSettings] = useState<PaymentSettings>(emptyPaymentSettings)
  const [request, setRequest] = useState<PaymentRequest | null>(null)
  const [method, setMethod] = useState<PaymentMethod>('upi')
  const [reference, setReference] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    void loadPaymentSettings()
      .then((next) => {
        setSettings(next)
        const enabled: PaymentMethod[] = []
        if (next.upiEnabled) enabled.push('upi')
        if (next.bankEnabled) enabled.push('bank')
        if (next.cryptoEnabled) enabled.push('crypto')
        if (enabled[0]) setMethod(enabled[0])
      })
      .catch((error: Error) => push('error', error.message))
    if (!user) {
      setRequest(null)
      return
    }
    void loadMyPaymentRequest(user.id)
      .then(setRequest)
      .catch((error: Error) => push('error', error.message))
  }, [open, user, push])

  const methods: { id: PaymentMethod; label: string }[] = []
  if (settings.upiEnabled) methods.push({ id: 'upi', label: 'UPI' })
  if (settings.bankEnabled) methods.push({ id: 'bank', label: 'Bank' })
  if (settings.cryptoEnabled) methods.push({ id: 'crypto', label: 'Crypto' })

  async function submit() {
    if (!user) {
      navigate('/register', { state: { from: '/engine' } })
      return
    }
    setBusy(true)
    try {
      await submitPaymentRequest(user.id, method, reference)
      setRequest({ id: 'pending', method, reference: reference.trim(), status: 'pending' })
      setReference('')
      push('success', 'Payment submitted', 'It stays pending until the superadmin marks it paid.')
    } catch (error) {
      push('error', error instanceof Error ? error.message : 'Could not submit the payment.')
    } finally {
      setBusy(false)
    }
  }

  if (request?.status === 'pending') {
    return (
      <p className="text-sm text-muted">
        Your {request.method.toUpperCase()} payment reference <span className="font-semibold text-ink">{request.reference}</span> is waiting for approval. Basic questions stay locked until then.
      </p>
    )
  }

  return (
    <>
      <p className="text-sm text-muted">
        Five free questions are included. Basic is ${settings.price} and adds 200 questions, plus a free {APP_SHORT_NAME} trading account. Pay with one of the methods below, then enter the reference from your payment.
      </p>
      {settings.note ? <p className="mt-3 text-sm text-ink">{settings.note}</p> : null}
      {methods.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Payment details have not been published yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {methods.map((item) => (
              <button
                key={item.id}
                type="button"
                className={item.id === method ? 'h-10 rounded-xl bg-baazex px-4 text-sm font-semibold text-on-button' : 'h-10 rounded-xl border border-line px-4 text-sm font-semibold'}
                onClick={() => setMethod(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-line bg-canvas p-3 text-sm text-ink">
            {method === 'upi' ? (
              <>
                <p>UPI ID: {settings.upiId || '—'}</p>
                <p>Name: {settings.upiName || '—'}</p>
              </>
            ) : null}
            {method === 'bank' ? (
              <>
                <p>Bank: {settings.bankName || '—'}</p>
                <p>Account name: {settings.accountName || '—'}</p>
                <p>Account number: {settings.accountNumber || '—'}</p>
                <p>IFSC: {settings.ifsc || '—'}</p>
              </>
            ) : null}
            {method === 'crypto' ? (
              <>
                <p>Asset: {settings.cryptoAsset || '—'}</p>
                <p>Network: {settings.cryptoNetwork || '—'}</p>
                <p className="break-all">Address: {settings.cryptoAddress || '—'}</p>
              </>
            ) : null}
          </div>
          {user ? (
            <label className="block text-sm font-semibold text-ink">
              Payment reference
              <input
                className="mt-1 h-11 w-full rounded-xl border border-line px-3"
                placeholder="UTR, transaction id, or hash"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
              />
            </label>
          ) : null}
          <button type="button" className="h-11 w-full rounded-xl bg-baazex font-semibold text-on-button disabled:opacity-60" disabled={busy || (Boolean(user) && methods.length === 0)} onClick={() => void submit()}>
            {user ? `Submit payment — $${settings.price}` : 'Create an account to get Basic'}
          </button>
        </div>
      )}
      {user ? null : (
        <button
          type="button"
          className="mt-2 h-11 w-full rounded-xl border border-line font-semibold"
          onClick={() => navigate('/login', { state: { from: '/engine' } })}
        >
          Sign in
        </button>
      )}
      <a
        href={COMPANY_URL}
        className="mt-2 flex h-11 items-center justify-center rounded-xl border border-line text-sm font-semibold text-accent"
        target="_blank"
        rel="noreferrer"
      >
        Open a free {APP_SHORT_NAME} trading account
      </a>
    </>
  )
}
