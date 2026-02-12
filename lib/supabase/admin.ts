import { createClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase client with service role key.
 * Bypasses RLS - use only in trusted server code (e.g. admin API routes).
 * Set SUPABASE_SERVICE_ROLE_KEY in env (from Supabase Dashboard > Settings > API).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY (and NEXT_PUBLIC_SUPABASE_URL) required for admin operations')
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  })
}
