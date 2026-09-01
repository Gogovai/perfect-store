import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

/**
 * Next.js proxy (middleware) for session refresh and basic route protection.
 * Runs on every matched request to keep Supabase sessions fresh.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
