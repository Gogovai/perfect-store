import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server-side Supabase client.
 *
 * The repository keeps a checked-in database contract for application-level
 * domain types, but the generated Supabase client schema is intentionally not
 * wired into this helper until it is regenerated directly from the live
 * project. This avoids inaccurate hand-maintained query overloads causing
 * valid query builders to collapse to `never` during builds.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component where cookies may be read-only.
          }
        },
      },
    }
  );
}
