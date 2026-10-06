import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export interface BillingTarget {
  id: string
  name: string
  url: string
  serviceRole: string
}

const academies = [
  {
    id: 'trading-king-academy',
    name: 'Trading King Academy',
    url: 'https://lhvfsmmncbtpcjulcrwb.supabase.co',
    env: 'BILLING_SERVICE_ROLE_TRADING_KING',
  },
  {
    id: 'nextgen-fx-academy',
    name: 'NextGen FX Academy',
    url: 'https://vdbxmllzdttxxmujbard.supabase.co',
    env: 'BILLING_SERVICE_ROLE_NEXTGEN',
  },
  {
    id: 'trade-rise-academy',
    name: 'Trade Rise Academy',
    url: 'https://kvezpfrktxfmkgtnhzqs.supabase.co',
    env: 'BILLING_SERVICE_ROLE_TRADE_RISE',
  },
  {
    id: 'tradesx-academy',
    name: 'TradesX Academy',
    url: 'https://msrzmadvqmzopiscdsyb.supabase.co',
    env: 'BILLING_SERVICE_ROLE_TRADESX',
  },
  {
    id: 'fx-nova-academy',
    name: 'FX Nova Academy',
    url: 'https://jzrawirvwdkaaxwjqthn.supabase.co',
    env: 'BILLING_SERVICE_ROLE_FX_NOVA',
  },
] as const

export function billingTargets(): BillingTarget[] {
  const listed: BillingTarget[] = academies.flatMap((academy) => {
    const serviceRole = process.env[academy.env]
    if (!serviceRole) return []
    return [{ id: academy.id, name: academy.name, url: academy.url, serviceRole }]
  })
  const localUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const localKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (localUrl && localKey && !listed.some((target) => target.url === localUrl)) {
    listed.unshift({ id: 'this-academy', name: 'This academy', url: localUrl, serviceRole: localKey })
  }
  return listed
}

export function clientFor(target: BillingTarget) {
  return createClient(target.url, target.serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function currentProject() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anon || !service) {
    throw new Error('This academy is missing its server Supabase keys.')
  }
  return { url, anon, service }
}

export async function requireSuperadmin(request: Request) {
  const header = request.headers.get('authorization') ?? ''
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : ''
  if (!token) throw new Error('Sign in again as the superadmin.')
  const project = currentProject()
  const userClient = createClient(project.url, project.anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await userClient.auth.getUser(token)
  if (error || !data.user) throw new Error('Sign in again as the superadmin.')
  const admin = createClient(project.url, project.service, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle()
  if (profileError) throw new Error(profileError.message)
  if (profile?.role !== 'superadmin') throw new Error('Only the superadmin can change payment details.')
  return data.user
}

export interface PaymentSettingsRow {
  id: number
  price: number
  note: string
  upi_enabled: boolean
  upi_id: string
  upi_name: string
  bank_enabled: boolean
  bank_name: string
  account_name: string
  account_number: string
  ifsc: string
  crypto_enabled: boolean
  crypto_asset: string
  crypto_network: string
  crypto_address: string
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function parseSettings(body: unknown): PaymentSettingsRow {
  const row = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  const price = Number(row.price)
  return {
    id: 1,
    price: Number.isFinite(price) && price > 0 ? Math.round(price) : 30,
    note: text(row.note),
    upi_enabled: row.upiEnabled === true,
    upi_id: text(row.upiId),
    upi_name: text(row.upiName),
    bank_enabled: row.bankEnabled === true,
    bank_name: text(row.bankName),
    account_name: text(row.accountName),
    account_number: text(row.accountNumber),
    ifsc: text(row.ifsc),
    crypto_enabled: row.cryptoEnabled === true,
    crypto_asset: text(row.cryptoAsset),
    crypto_network: text(row.cryptoNetwork),
    crypto_address: text(row.cryptoAddress),
  }
}

export async function saveSettingsEverywhere(settings: PaymentSettingsRow) {
  const targets = billingTargets()
  if (targets.length === 0) throw new Error('No academy billing keys are configured on the server.')
  const failures: string[] = []
  for (const target of targets) {
    const { error } = await clientFor(target).from('payment_settings').upsert(settings, { onConflict: 'id' })
    if (error) failures.push(`${target.name}: ${error.message}`)
  }
  if (failures.length > 0) throw new Error(failures.join(' '))
  return targets.length
}

export async function listPending() {
  const targets = billingTargets()
  const requests = []
  for (const target of targets) {
    const admin = clientFor(target)
    const { data, error } = await admin
      .from('payment_requests')
      .select('id, user_id, method, reference, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
    if (error) throw new Error(`${target.name}: ${error.message}`)
    const rows = data ?? []
    const userIds = [...new Set(rows.map((row) => row.user_id))]
    const profiles = new Map<string, { email: string; full_name: string }>()
    if (userIds.length > 0) {
      const { data: people, error: peopleError } = await admin
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds)
      if (peopleError) throw new Error(`${target.name}: ${peopleError.message}`)
      for (const person of people ?? []) profiles.set(person.id, person)
    }
    for (const row of rows) {
      const profile = profiles.get(row.user_id)
      const method = row.method === 'bank' || row.method === 'crypto' ? row.method : 'upi'
      requests.push({
        academyId: target.id,
        academyName: target.name,
        requestId: row.id,
        userId: row.user_id,
        email: profile?.email ?? '',
        fullName: profile?.full_name ?? '',
        method,
        reference: row.reference,
        createdAt: row.created_at,
      })
    }
  }
  return requests
}

export async function approveRequest(academyId: string, requestId: string) {
  const target = billingTargets().find((item) => item.id === academyId)
  if (!target) throw new Error('That academy is not configured on this server.')
  const admin: SupabaseClient = clientFor(target)
  const { data, error } = await admin
    .from('payment_requests')
    .select('user_id, status')
    .eq('id', requestId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Payment request was not found.')
  const { error: profileError } = await admin.from('profiles').update({ plan: 'basic' }).eq('id', data.user_id)
  if (profileError) throw new Error(profileError.message)
  const { error: requestError } = await admin.from('payment_requests').update({ status: 'paid' }).eq('id', requestId)
  if (requestError) throw new Error(requestError.message)
}
