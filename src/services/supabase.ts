import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { isSupabaseEnabled } from '@/services/backend'

let client: SupabaseClient | null = null

export function getSupabase() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!isSupabaseEnabled() || !url || !key) {
    throw new Error('Supabase is not configured.')
  }
  if (!client) {
    client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return client
}
