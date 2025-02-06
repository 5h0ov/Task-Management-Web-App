import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/utils/auth';

export async function middleware(request: NextRequest) {

  const token = request.cookies.get('token')?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      const payload = await verifyToken(token);
      isAuthenticated = !!payload; // convert to boolean
    } catch {
      isAuthenticated = false;
    }
  }

  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard');

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isDashboardPage && !isAuthenticated) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

// protected routes
export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
};