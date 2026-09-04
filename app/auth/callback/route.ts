import { type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';

type PendingCookie = { name: string; value: string; options?: CookieOptions };

/**
 * Handles Supabase auth callbacks:
 * - Email verification (token_hash + type=signup)
 * - Password reset (type=recovery) — must verify the token so the
 *   /reset-password page has a session before calling updateUser()
 * - PKCE code exchange (recovery links can carry ?code= instead)
 * - OAuth callbacks
 *
 * IMPORTANT: session cookies set during verification/exchange are collected
 * and re-applied to the final redirect response — returning a fresh
 * NextResponse.redirect() would silently drop the session.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  let redirectPath = next;
  const pendingCookies: PendingCookie[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            pendingCookies.push({ name, value, options })
          );
        },
      },
    }
  );

  if (code) {
    // PKCE flow: exchange the one-time code for a session.
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && type === 'recovery') {
      redirectPath = '/reset-password';
    }
  } else if (tokenHash && type) {
    if (type === 'recovery') {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'recovery',
      });
      redirectPath = error ? '/login' : '/reset-password';
    } else if (type === 'signup') {
      // Verification links are not part of the product (accounts are
      // auto-confirmed), but honouring an old link remains harmless.
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'signup',
      });
      redirectPath = error ? '/login' : '/login';
    } else {
      redirectPath = '/login';
    }
  }

  const response = NextResponse.redirect(`${origin}${redirectPath}`);
  for (const cookie of pendingCookies) {
    response.cookies.set(cookie.name, cookie.value, cookie.options ?? {});
  }
  return response;
}