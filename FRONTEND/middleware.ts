import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie = request.cookies.get('swapneri_session')?.value;
  // Also check if any supabase auth token cookie exists (pattern sb-*-auth-token)
  const hasSupabaseAuth = request.cookies.getAll().some(
    (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token') && Boolean(c.value)
  );

  const isAuthenticated = Boolean(sessionCookie === 'true' || hasSupabaseAuth);

  const isAuthRoute =
    pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';

  // Unauthenticated user trying to access protected routes -> redirect to login
  if (!isAuthenticated && !isAuthRoute) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Already authenticated user trying to access login/register -> redirect to dashboard
  if (isAuthenticated && isAuthRoute) {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/assets with extensions (svg, png, jpg, jpeg, gif, webp, ico)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

