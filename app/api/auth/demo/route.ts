import { NextResponse, type NextRequest } from 'next/server';
import { DEMO_USER, DEMO_PASSWORD, DEMO_COOKIE_NAME, isDemoCredentials } from '@/lib/demo';

export async function GET(request: NextRequest) {
  const redirectUrl = request.nextUrl.searchParams.get('redirect') || '/dashboard';
  const response = NextResponse.redirect(new URL(redirectUrl, request.url));
  response.cookies.set(DEMO_COOKIE_NAME, JSON.stringify(DEMO_USER), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, action } = await request.json();

    if (action === 'logout') {
      const response = NextResponse.json({ success: true });
      response.cookies.delete(DEMO_COOKIE_NAME);
      return response;
    }

    if (isDemoCredentials(email, password)) {
      const response = NextResponse.json({
        success: true,
        user: DEMO_USER,
      });

      // Set cookie for 7 days
      response.cookies.set(DEMO_COOKIE_NAME, JSON.stringify(DEMO_USER), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Email ou mot de passe incorrect' },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
