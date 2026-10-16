import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { DEMO_USER, DEMO_COOKIE_NAME } from '@/lib/demo';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Check demo session cookie
  const demoCookie = request.cookies.get(DEMO_COOKIE_NAME);
  let hasUser = !!demoCookie?.value;

  // In demo mode or local environment without active Supabase, don't block on network timeouts
  if (!hasUser && supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project') && !supabaseUrl.includes('placeholder') && !supabaseUrl.includes('ucywkgrrqhaqplpobouk')) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) hasUser = true;
    } catch {
      // Supabase connection or fetch error, fallback to demo check
    }
  }

  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/searches') ||
    pathname.startsWith('/leads') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/messages') ||
    pathname.startsWith('/settings');

  const attachDemoCookie = (res: NextResponse) => {
    res.cookies.set(DEMO_COOKIE_NAME, JSON.stringify(DEMO_USER), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return res;
  };

  // If user visits /login or /signup, direct entry into dashboard
  if (isAuthRoute) {
    const url = request.nextUrl.clone();
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    url.pathname = redirectParam || '/dashboard';
    url.search = '';
    return attachDemoCookie(NextResponse.redirect(url));
  }

  // If user visits root /, go directly to /dashboard (unless explicit ?landing is provided)
  if (pathname === '/' && !request.nextUrl.searchParams.has('landing')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return attachDemoCookie(NextResponse.redirect(url));
  }

  // If accessing a protected route without session, auto-authenticate and enter directly
  if (!hasUser && isProtectedRoute) {
    const demoUserStr = JSON.stringify(DEMO_USER);
    request.cookies.set(DEMO_COOKIE_NAME, demoUserStr);
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
    return attachDemoCookie(response);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

