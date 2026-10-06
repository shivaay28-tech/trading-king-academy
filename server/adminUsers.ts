import { createClient } from '@supabase/supabase-js'

interface CreateStudentBody {
  fullName?: string
  email?: string
  password?: string
  country?: string
  countryCode?: string
  mobile?: string
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })
}

function env(name: string) {
  return process.env[name]?.trim() || ''
}

function supabaseConfig() {
  const url = env('SUPABASE_URL') || env('VITE_SUPABASE_URL')
  const anon = env('SUPABASE_ANON_KEY') || env('VITE_SUPABASE_ANON_KEY')
  const service = env('SUPABASE_SERVICE_ROLE_KEY')
  return { url, anon, service }
}

export async function handleAdminUsers(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 })
  }
  if (request.method !== 'POST') {
    return json(405, { message: 'Method not allowed.' })
  }

  const { url, anon, service } = supabaseConfig()
  if (!url || !anon || !service) {
    return json(503, { message: 'Supabase admin keys are not configured on the server.' })
  }

  const header = request.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return json(401, { message: 'Sign in as an admin to create students.' })

  const userClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: authData, error: authError } = await userClient.auth.getUser(token)
  if (authError || !authData.user) return json(401, { message: 'Your session expired. Sign in again.' })

  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: profile } = await admin.from('profiles').select('role').eq('id', authData.user.id).maybeSingle()
  if (profile?.role !== 'admin') return json(403, { message: 'Only admins can create student accounts.' })

  let payload: CreateStudentBody
  try {
    payload = (await request.json()) as CreateStudentBody
  } catch {
    return json(400, { message: 'Invalid JSON body.' })
  }

  const fullName = payload.fullName?.trim() ?? ''
  const email = payload.email?.trim().toLowerCase() ?? ''
  const password = payload.password ?? ''
  const country = payload.country?.trim() ?? ''
  const countryCode = payload.countryCode?.trim() ?? ''
  const mobile = payload.mobile?.trim() ?? ''

  if (!fullName || !email || password.length < 8) {
    return json(400, { message: 'Name, email, and a password of at least 8 characters are required.' })
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      mobile,
      country,
      country_code: countryCode,
    },
  })
  if (error || !data.user) {
    return json(400, { message: error?.message ?? 'Could not create the student.' })
  }

  const { data: created } = await admin
    .from('profiles')
    .upsert({
      id: data.user.id,
      full_name: fullName,
      email,
      mobile,
      country,
      country_code: countryCode,
      role: 'student',
      plan: 'free',
      questions_used: 0,
    })
    .select('*')
    .maybeSingle()

  const row = created ?? {
    id: data.user.id,
    full_name: fullName,
    email,
    mobile,
    country,
    country_code: countryCode,
    role: 'student',
    plan: 'free',
    questions_used: 0,
    created_at: new Date().toISOString(),
    email_preferences: { productUpdates: true, courseNotifications: true, weeklyDigest: false },
  }

  return json(201, {
    message: 'Student account created.',
    user: {
      id: row.id,
      fullName: row.full_name ?? fullName,
      email: row.email ?? email,
      mobile: row.mobile ?? mobile,
      country: row.country ?? country,
      countryCode: row.country_code ?? countryCode,
      role: 'student' as const,
      createdAt: row.created_at ?? new Date().toISOString(),
      emailPreferences: row.email_preferences ?? { productUpdates: true, courseNotifications: true, weeklyDigest: false },
      plan: 'free' as const,
      questionsUsed: row.questions_used ?? 0,
    },
  })
}
