import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '../../../../lib/auth/jwt';
import { userRepository } from '../../../../lib/db/postgres';

export async function GET(req: NextRequest) {
  try {
    const payload = authenticateRequest(req);
    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized or token expired. Please log in.' },
        { status: 401 }
      );
    }

    let user = null;
    try {
      user = await userRepository.findById(payload.userId);
    } catch {
      // In case database connection fails or root admin user is active
      user = null;
    }

    const safeUser = {
      id: user ? user.id : payload.userId,
      uid: user ? user.id : payload.userId,
      name: user ? user.name : payload.name,
      displayName: user ? user.name : payload.name,
      email: user ? user.email : payload.email,
      role: (user?.role as any) || (payload.role as any) || 'user',
      latitude: user?.latitude || null,
      longitude: user?.longitude || null,
      location_name: user?.location_name || null,
      location_updated_at: user?.location_updated_at || null,
      created_at: user?.created_at || new Date().toISOString(),
      last_login: user?.last_login || new Date().toISOString(),
    };

    return NextResponse.json({
      user: safeUser,
    });
  } catch (err: unknown) {
    console.error('Auth /me API error:', err instanceof Error ? err.message : 'Unknown');
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your request. Please try again.' },
      { status: 500 }
    );
  }
}
