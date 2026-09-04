import 'server-only';
import { createClient } from '@/lib/supabase/server';

// The server client mirrors the untyped createServerClient() helper (see
// lib/supabase/server.ts), so privileged RPC calls accept any function name.
type ServerClient = Awaited<ReturnType<typeof createClient>>;

export type AdminSession =
  | { error: string; status: 401 | 403; userId: null; supabase: null }
  | { error: null; status: 200; userId: string; supabase: ServerClient };

/**
 * Verify the request session belongs to an admin.
 * Returns JSON-friendly error info for API route handlers, plus the
 * authenticated client for privileged RPC calls (e.g. admin_set_seller_status).
 */
export async function requireAdminApi(): Promise<AdminSession> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated', status: 401, userId: null, supabase: null };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { error: 'Admin access required', status: 403, userId: null, supabase: null };
  }

  return { error: null, status: 200, userId: user.id, supabase };
}