import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * Supabase client for use in Client Components (browser).
 * Uses @supabase/ssr with cookie-based session management.
 * This client uses the anonymous/publishable key which is safe to expose.
 * Row Level Security (RLS) controls data access.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
