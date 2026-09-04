import 'server-only';
import { createClient } from '@/lib/supabase/server';

export type AdminSession =
  | { error: string; status: 401 | 403; userId: null }
  | { error: null; status: 200; userId: string };

/**
 * Verify the request session belongs to an admin.
 * Returns JSON-friendly error info for API route handlers.
 */
export async function requireAdminApi(): Promise<AdminSession> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated', status: 401, userId: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { error: 'Admin access required', status: 403, userId: null };
  }

  return { error: null, status: 200, userId: user.id };
}