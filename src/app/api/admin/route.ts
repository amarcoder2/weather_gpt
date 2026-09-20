import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required. Missing Bearer token.' } },
      { status: 401 }
    );
  }

  if (user.role !== 'admin') {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Forbidden: User role '${user.role}' is not authorized to access administrative operations.`,
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
