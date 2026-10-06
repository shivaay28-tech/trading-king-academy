import { getSupabase } from '@/services/supabase'
import { isSupabaseEnabled } from '@/services/backend'
import type { PaymentMethod } from '@/types'

export interface PaymentSettings {
  price: number
  note: string
  upiEnabled: boolean
  upiId: string
  upiName: string
  bankEnabled: boolean
  bankName: string
  accountName: string
  accountNumber: string
  ifsc: string
  cryptoEnabled: boolean
  cryptoAsset: string
  cryptoNetwork: string
  cryptoAddress: string
}

export interface PaymentRequest {
  id: string
  method: PaymentMethod
  reference: string
  status: 'pending' | 'paid'
}

export const emptyPaymentSettings: PaymentSettings = {
  price: 30,
  note: '',
  upiEnabled: false,
  upiId: '',
  upiName: '',
  bankEnabled: false,
  bankName: '',
  accountName: '',
  accountNumber: '',
  ifsc: '',
  cryptoEnabled: false,
  cryptoAsset: '',
  cryptoNetwork: '',
  cryptoAddress: '',
}

function text(value: unknown) {
  return typeof value === 'string' ? value : ''
}

export function mapPaymentSettings(row: Record<string, unknown> | null): PaymentSettings {
  if (!row) return emptyPaymentSettings
  return {
    price: typeof row.price === 'number' ? row.price : Number(row.price) || 30,
    note: text(row.note),
    upiEnabled: row.upi_enabled === true,
    upiId: text(row.upi_id),
    upiName: text(row.upi_name),
    bankEnabled: row.bank_enabled === true,
    bankName: text(row.bank_name),
    accountName: text(row.account_name),
    accountNumber: text(row.account_number),
    ifsc: text(row.ifsc),
    cryptoEnabled: row.crypto_enabled === true,
    cryptoAsset: text(row.crypto_asset),
    cryptoNetwork: text(row.crypto_network),
    cryptoAddress: text(row.crypto_address),
  }
}

export function settingsToRow(settings: PaymentSettings) {
  return {
    id: 1,
    price: settings.price,
    note: settings.note,
    upi_enabled: settings.upiEnabled,
    upi_id: settings.upiId,
    upi_name: settings.upiName,
    bank_enabled: settings.bankEnabled,
    bank_name: settings.bankName,
    account_name: settings.accountName,
    account_number: settings.accountNumber,
    ifsc: settings.ifsc,
    crypto_enabled: settings.cryptoEnabled,
    crypto_asset: settings.cryptoAsset,
    crypto_network: settings.cryptoNetwork,
    crypto_address: settings.cryptoAddress,
  }
}

export async function loadPaymentSettings() {
  if (!isSupabaseEnabled()) return emptyPaymentSettings
  const { data, error } = await getSupabase().from('payment_settings').select('*').eq('id', 1).maybeSingle()
  if (error) throw new Error(error.message)
  return mapPaymentSettings(data as Record<string, unknown> | null)
}

export async function loadMyPaymentRequest(userId: string): Promise<PaymentRequest | null> {
  if (!isSupabaseEnabled()) return null
  const { data, error } = await getSupabase()
    .from('payment_requests')
    .select('id, method, reference, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  const method = data.method === 'bank' || data.method === 'crypto' ? data.method : 'upi'
  return {
    id: String(data.id),
    method,
    reference: text(data.reference),
    status: data.status === 'paid' ? 'paid' : 'pending',
  }
}

export async function submitPaymentRequest(userId: string, method: PaymentMethod, reference: string) {
  const trimmed = reference.trim()
  if (!trimmed) throw new Error('Enter the payment reference.')
  if (!isSupabaseEnabled()) throw new Error('Payments are available on the live academy.')
  const { error } = await getSupabase().from('payment_requests').insert({
    user_id: userId,
    method,
    reference: trimmed,
    status: 'pending',
  })
  if (error) throw new Error(error.message)
}

async function authHeader() {
  const { data } = await getSupabase().auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Sign in again as the superadmin.')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export async function savePaymentSettings(settings: PaymentSettings) {
  const response = await fetch('/api/superadmin/settings', {
    method: 'POST',
    headers: await authHeader(),
    body: JSON.stringify(settings),
  })
  const body = (await response.json().catch(() => ({}))) as { error?: string }
  if (!response.ok) throw new Error(body.error || 'Could not save payment details.')
}

export interface PendingPayment {
  academyId: string
  academyName: string
  requestId: string
  userId: string
  email: string
  fullName: string
  method: PaymentMethod
  reference: string
  createdAt: string
}

export async function loadPendingPayments() {
  const response = await fetch('/api/superadmin/requests', { headers: await authHeader() })
  const body = (await response.json().catch(() => ({}))) as { error?: string; requests?: PendingPayment[] }
  if (!response.ok) throw new Error(body.error || 'Could not load payment requests.')
  return body.requests ?? []
}

export async function approvePayment(academyId: string, requestId: string) {
  const response = await fetch('/api/superadmin/approve', {
    method: 'POST',
    headers: await authHeader(),
    body: JSON.stringify({ academyId, requestId }),
  })
  const body = (await response.json().catch(() => ({}))) as { error?: string }
  if (!response.ok) throw new Error(body.error || 'Could not approve this payment.')
}
