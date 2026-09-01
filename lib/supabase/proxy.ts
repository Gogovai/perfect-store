import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Refresh the Supabase session and handle cookie updates.
 * This function is called from the Next.js proxy (middleware).
 *
 * IMPORTANT: Do not run code between createServerClient and
 * supabase.auth.getClaims(). This can cause users to be randomly logged out.
 *
 * IMPORTANT: Always use getClaims() to verify identity.
 * Never trust getSession() for authorization decisions.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not remove getClaims(). It validates the JWT signature
  // against the project's published public keys every time.
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;

  // Define protected route patterns
  const pathname = request.nextUrl.pathname;

  const isProtectedCustomerRoute =
    pathname.startsWith('/account') ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/wishlist') ||
    pathname.startsWith('/addresses');

  const isProtectedSellerRoute =
    pathname.startsWith('/seller') && !pathname.startsWith('/seller/apply');

  const isProtectedAdminRoute = pathname.startsWith('/admin');

  const isProtectedRoute =
    isProtectedCustomerRoute || isProtectedSellerRoute || isProtectedAdminRoute;

  // Redirect unauthenticated users away from protected routes
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next(),
  // make sure to copy over the cookies.
  return supabaseResponse;
}
