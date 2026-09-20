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

    const user = await userRepository.findById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User record not found.' },
        { status: 401 }
      );
    }

    const safeUser = {
      id: user.id,
      uid: user.id,
      name: user.name,
      displayName: user.name,
      email: user.email,
      role: (user.role as any) || 'user',
      latitude: user.latitude || null,
      longitude: user.longitude || null,
      location_name: user.location_name || null,
      location_updated_at: user.location_updated_at || null,
      created_at: user.created_at,
      last_login: user.last_login,
    };

    return NextResponse.json({
      user: safeUser,
    });
  } catch (err) {
    console.error('Auth /me API error:', err);
    return NextResponse.json(
      { error: 'Internal server error while fetching session profile.' },
      { status: 500 }
    );
  }
}
