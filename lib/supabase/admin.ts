import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

/**
 * Supabase admin client for use in server-side code only.
 * Uses the service role key which bypasses Row Level Security.
 * NEVER expose this client to the browser.
 * Only use in API routes, server actions, or server components.
 */
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Helper to ensure the admin client is available.
 * Throws if SUPABASE_SERVICE_ROLE_KEY is not set.
 */
export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error(
      'Supabase admin client is not initialized. Ensure SUPABASE_SERVICE_ROLE_KEY is set in environment variables.'
    );
  }
  return supabaseAdmin;
}
