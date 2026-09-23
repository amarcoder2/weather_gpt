import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose/jwt/verify';

const PROTECTED_ROUTES = [
  '/dashboard',
  '/forecast',
  '/chat',
  '/alerts',
  '/risk',
  '/climate',
  '/explorer',
  '/history',
  '/locations',
  '/settings',
];

interface VerifiedJwt {
  userId: string;
  email?: string;
  role?: string;
  name?: string;
}

function isAdminRole(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.toLowerCase().trim();
  return normalized === 'admin' || normalized === 'super_admin';
}

async function verifyEdgeToken(token: string): Promise<VerifiedJwt | null> {
  try {
    const rawSecret = process.env.JWT_SECRET_KEY;
    if (!rawSecret || rawSecret.trim().length === 0) {
      if (process.env.NODE_ENV === 'production') {
        // Fail safely in production if secret is not set
        return null;
      }
      const devSecret = new TextEncoder().encode('weathergpt-dev-only-secret-do-not-use-in-production-moes-imd');
      const { payload } = await jwtVerify(token, devSecret, { algorithms: ['HS256'] });
      if (!payload.userId) return null;
      return payload as unknown as VerifiedJwt;
    }

    const secretKey = new TextEncoder().encode(rawSecret.trim());
    const { payload } = await jwtVerify(token, secretKey, { algorithms: ['HS256'] });
    if (!payload.userId) return null;
    return payload as unknown as VerifiedJwt;
  } catch {
    // Cryptographic signature invalid, expired, or malformed
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Extract auth token from HttpOnly cookie or Authorization header
  const tokenCookie = req.cookies.get('weathergpt_token')?.value;
  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
  const token = tokenCookie || bearerToken;

  // LAYER 1: Edge Cryptographic Verification
  const verified = token ? await verifyEdgeToken(token) : null;
  const isAuthenticated = Boolean(verified && verified.userId);
  const isAdmin = Boolean(isAuthenticated && isAdminRole(verified?.role));

  // 1. Admin API route protection (Strict Layer 1 Edge Gating)
  if (pathname === '/api/admin' || pathname.startsWith('/api/admin/')) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required. Missing or invalid session token.' } },
        { status: 401 }
      );
    }

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Forbidden: Administrative authorization required.' } },
        { status: 403 }
      );
    }

    return NextResponse.next();
  }

  // 2. Admin page route protection (Strict Layer 1 Edge Gating)
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  if (isAdminRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!isAdmin) {
      const dashboardUrl = new URL('/dashboard', req.url);
      dashboardUrl.searchParams.set('forbidden', 'admin_only');
      return NextResponse.redirect(dashboardUrl);
    }

    return NextResponse.next();
  }

  // 3. Standard protected citizen routes
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  if (isProtectedRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 4. Prevent authenticated users from visiting login/register unnecessarily
  if ((pathname === '/login' || pathname === '/register') && isAuthenticated) {
    const redirectParam = req.nextUrl.searchParams.get('redirect');
    const destination = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/dashboard';
    return NextResponse.redirect(new URL(destination, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/api/admin',
    '/api/admin/:path*',
    '/dashboard',
    '/dashboard/:path*',
    '/forecast',
    '/forecast/:path*',
    '/chat',
    '/chat/:path*',
    '/alerts',
    '/alerts/:path*',
    '/risk',
    '/risk/:path*',
    '/climate',
    '/climate/:path*',
    '/explorer',
    '/explorer/:path*',
    '/history',
    '/history/:path*',
    '/locations',
    '/locations/:path*',
    '/settings',
    '/settings/:path*',
    '/login',
    '/register',
  ],
};
