import { type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

/**
 * Handles Supabase auth callbacks:
 * - Email verification (token_hash + type=signup)
 * - Password reset (type=recovery)
 * - OAuth callbacks
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/';

  let supabaseResponse = NextResponse.redirect(`${origin}${next}`);

  if (tokenHash && type) {
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
            supabaseResponse = NextResponse.redirect(`${origin}${next}`);
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    if (type === 'signup') {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'signup',
      });
      if (!error) {
        return NextResponse.redirect(`${origin}/login?verified=true`);
      }
    }

    if (type === 'recovery') {
      return NextResponse.redirect(`${origin}/reset-password`);
    }
  }

  return supabaseResponse;
}
