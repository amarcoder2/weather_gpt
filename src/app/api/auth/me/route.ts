import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, verifyVault } from '../../../../lib/auth/jwt';
import { userRepository } from '../../../../lib/db/postgres';
import { DbUser } from '../../../../types/auth';

export async function GET(req: NextRequest) {
  try {
    const payload = authenticateRequest(req);
    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized or token expired. Please log in.' },
        { status: 401 }
      );
    }

    let user = await userRepository.findById(payload.userId);
    if (!user) {
      const vaultCookie = req.cookies.get('weathergpt_user_vault')?.value;
      const vaultUser = vaultCookie ? verifyVault<DbUser>(vaultCookie) : null;
      if (vaultUser && (vaultUser.id === payload.userId || vaultUser.email === payload.email)) {
        user = vaultUser;
      }
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
    console.error('Auth /me API error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error while fetching session profile.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
