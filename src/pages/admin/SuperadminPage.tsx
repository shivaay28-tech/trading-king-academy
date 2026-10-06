import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import {
  approvePayment,
  emptyPaymentSettings,
  loadPaymentSettings,
  loadPendingPayments,
  savePaymentSettings,
  type PaymentSettings,
  type PendingPayment,
} from '@/services/billing'
import { useEffect, useState } from 'react'

export function SuperadminPage() {
  const { user } = useAuth()
  const { push } = useToast()
  const [settings, setSettings] = useState<PaymentSettings>(emptyPaymentSettings)
  const [requests, setRequests] = useState<PendingPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function reload() {
    const [nextSettings, nextRequests] = await Promise.all([loadPaymentSettings(), loadPendingPayments()])
    setSettings(nextSettings)
    setRequests(nextRequests)
  }

  useEffect(() => {
    if (user?.role !== 'superadmin') return
    void reload()
      .catch((error: Error) => push('error', error.message))
      .finally(() => setLoading(false))
  }, [user?.role, push])

  if (user?.role !== 'superadmin') {
    return <p className="p-6 text-sm text-muted">Only the superadmin can edit payment details.</p>
  }

  async function save() {
    setSaving(true)
    try {
      await savePaymentSettings(settings)
      push('success', 'Payment details saved on every academy')
    } catch (error) {
      push('error', error instanceof Error ? error.message : 'Could not save payment details.')
    } finally {
      setSaving(false)
    }
  }

  async function approve(item: PendingPayment) {
    try {
      await approvePayment(item.academyId, item.requestId)
      setRequests((current) => current.filter((row) => row.requestId !== item.requestId))
      push('success', 'Marked as paid', `${item.email} is now on Basic.`)
    } catch (error) {
      push('error', error instanceof Error ? error.message : 'Could not approve this payment.')
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-bold text-ink">Payment details</h1>
      <p className="mt-1 text-sm text-muted">One setup is copied to all five academies. Students stay on the free plan until you mark them paid.</p>
      {loading ? <p className="mt-6 text-sm text-muted">Loading…</p> : null}

      <section className="mt-6 space-y-4 rounded-2xl border border-line bg-white p-4">
        <label className="block text-sm font-semibold text-ink">
          Price (USD)
          <input
            className="mt-1 h-11 w-full rounded-xl border border-line px-3"
            inputMode="numeric"
            value={settings.price}
            onChange={(event) => setSettings({ ...settings, price: Number(event.target.value) || 0 })}
          />
        </label>
        <label className="block text-sm font-semibold text-ink">
          Note shown to students
          <textarea
            className="mt-1 min-h-20 w-full rounded-xl border border-line px-3 py-2"
            value={settings.note}
            onChange={(event) => setSettings({ ...settings, note: event.target.value })}
          />
        </label>

        <fieldset className="space-y-2 rounded-xl border border-line p-3">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={settings.upiEnabled}
              onChange={(event) => setSettings({ ...settings, upiEnabled: event.target.checked })}
            />
            UPI
          </label>
          <input className="h-11 w-full rounded-xl border border-line px-3" placeholder="UPI ID" value={settings.upiId} onChange={(event) => setSettings({ ...settings, upiId: event.target.value })} />
          <input className="h-11 w-full rounded-xl border border-line px-3" placeholder="Name on UPI" value={settings.upiName} onChange={(event) => setSettings({ ...settings, upiName: event.target.value })} />
        </fieldset>

        <fieldset className="space-y-2 rounded-xl border border-line p-3">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={settings.bankEnabled}
              onChange={(event) => setSettings({ ...settings, bankEnabled: event.target.checked })}
            />
            Bank account
          </label>
          <input className="h-11 w-full rounded-xl border border-line px-3" placeholder="Bank name" value={settings.bankName} onChange={(event) => setSettings({ ...settings, bankName: event.target.value })} />
          <input className="h-11 w-full rounded-xl border border-line px-3" placeholder="Account name" value={settings.accountName} onChange={(event) => setSettings({ ...settings, accountName: event.target.value })} />
          <input className="h-11 w-full rounded-xl border border-line px-3" placeholder="Account number" value={settings.accountNumber} onChange={(event) => setSettings({ ...settings, accountNumber: event.target.value })} />
          <input className="h-11 w-full rounded-xl border border-line px-3" placeholder="IFSC" value={settings.ifsc} onChange={(event) => setSettings({ ...settings, ifsc: event.target.value })} />
        </fieldset>

        <fieldset className="space-y-2 rounded-xl border border-line p-3">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={settings.cryptoEnabled}
              onChange={(event) => setSettings({ ...settings, cryptoEnabled: event.target.checked })}
            />
            Crypto
          </label>
          <input className="h-11 w-full rounded-xl border border-line px-3" placeholder="Asset, for example USDT" value={settings.cryptoAsset} onChange={(event) => setSettings({ ...settings, cryptoAsset: event.target.value })} />
          <input className="h-11 w-full rounded-xl border border-line px-3" placeholder="Network" value={settings.cryptoNetwork} onChange={(event) => setSettings({ ...settings, cryptoNetwork: event.target.value })} />
          <input className="h-11 w-full rounded-xl border border-line px-3" placeholder="Wallet address" value={settings.cryptoAddress} onChange={(event) => setSettings({ ...settings, cryptoAddress: event.target.value })} />
        </fieldset>

        <button type="button" className="h-11 rounded-xl bg-baazex px-4 font-semibold text-on-button disabled:opacity-60" disabled={saving} onClick={() => void save()}>
          {saving ? 'Saving…' : 'Save for all academies'}
        </button>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-ink">Waiting for approval</h2>
        {requests.length === 0 ? <p className="mt-2 text-sm text-muted">No pending payments.</p> : null}
        <ul className="mt-3 space-y-3">
          {requests.map((item) => (
            <li key={`${item.academyId}-${item.requestId}`} className="rounded-2xl border border-line bg-white p-4">
              <p className="font-semibold text-ink">{item.fullName || item.email}</p>
              <p className="text-sm text-muted">{item.academyName} · {item.email}</p>
              <p className="mt-2 text-sm text-ink">{item.method.toUpperCase()} · {item.reference}</p>
              <button type="button" className="mt-3 h-10 rounded-xl bg-baazex px-4 text-sm font-semibold text-on-button" onClick={() => void approve(item)}>
                Mark as paid
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
