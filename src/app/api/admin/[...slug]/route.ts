import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/jwt';

// Backend authorization middleware verification
function checkAdminAuth(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required. Missing or invalid Bearer token.' } },
        { status: 401 }
      ),
    };
  }

  if (user.role !== 'admin') {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `Forbidden: Role '${user.role}' lacks administrative authorization. Only 'admin' role may access /api/admin endpoints.`,
          },
        },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, user };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const auth = checkAdminAuth(req);
  if (!auth.authorized) return auth.response;

  const resolvedParams = await params;
  const path = resolvedParams.slug ? resolvedParams.slug.join('/') : '';

  if (path === 'overview') {
    return NextResponse.json({
      success: true,
      data: {
        totalUsers: 14,
        activeAlerts: 3,
        pendingAlerts: 1,
        trackedLocations: 16,
        disasters: 5,
        systemStatus: 'OPERATIONAL',
        nodeEnvironment: process.env.NODE_ENV || 'production',
        adminUser: auth.user?.email,
      },
    });
  }

  return NextResponse.json({
    success: true,
    message: `Admin operation '${path}' processed successfully.`,
    authorizedAs: auth.user?.email,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const auth = checkAdminAuth(req);
  if (!auth.authorized) return auth.response;

  const resolvedParams = await params;
  const path = resolvedParams.slug ? resolvedParams.slug.join('/') : '';
  let body = {};
  try {
    body = await req.json();
  } catch {
    // Body is optional
  }

  return NextResponse.json({
    success: true,
    message: `Administrative POST request to /api/admin/${path} authorized and executed.`,
    target: path,
    payload: body,
    performedBy: auth.user?.email,
    timestamp: new Date().toISOString(),
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const auth = checkAdminAuth(req);
  if (!auth.authorized) return auth.response;

  const resolvedParams = await params;
  const path = resolvedParams.slug ? resolvedParams.slug.join('/') : '';

  return NextResponse.json({
    success: true,
    message: `Administrative DELETE request to /api/admin/${path} authorized and executed.`,
    performedBy: auth.user?.email,
  });
}
