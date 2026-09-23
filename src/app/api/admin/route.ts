import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAdminRole } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  // LAYER 3: Endpoint-level Server Authorization
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required. Missing or invalid session token.' } },
      { status: 401 }
    );
  }

  if (!isAdminRole(user.role)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Forbidden: Administrative authorization required.',
        },
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Welcome to WeatherGPT Administrative Operations API',
    admin: user.email,
    role: user.role,
  });
}
