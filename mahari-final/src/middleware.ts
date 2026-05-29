import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware runs on every request to:
 * 1. Refresh the Supabase session (rotate tokens before expiry)
 * 2. Protect routes that require authentication
 * 3. Redirect authenticated users away from auth pages
 *
 * Route map:
 *   /login             → public
 *   /invite/[token]    → public
 *   /dashboard/*       → requires auth (supervisor, teacher, admin)
 *   /school/*          → requires auth (principal, admin)
 *   /parent/*          → requires auth (parent role)
 *   /api/ai/*          → requires auth (handled in route handler)
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — IMPORTANT: do not add any logic between
  // createServerClient and getUser() or sessions may not refresh correctly.
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ─── Route protection ─────────────────────────────────────────
  const protectedPrefixes  = ['/dashboard', '/school', '/parent'];
  const authOnlyPaths      = ['/login', '/invite'];
  const isProtected        = protectedPrefixes.some(p => pathname.startsWith(p));
  const isAuthPage         = authOnlyPaths.some(p => pathname.startsWith(p));

  if (!user && isProtected) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthPage) {
    // Redirect to the appropriate dashboard based on role
    const role = user.app_metadata?.role as string | undefined;
    const redirectPath =
      role === 'parent'    ? '/parent'    :
      role === 'principal' ? '/school'    :
      '/dashboard';
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Match all request paths except static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
