import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { userRepository } from '../../../../lib/db/postgres';
import { signToken, verifyVault } from '../../../../lib/auth/jwt';
import { DbUser } from '../../../../types/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await userRepository.findByEmail(normalizedEmail);

    // Fallback: recover user from signed vault cookie across serverless cold starts
    if (!user) {
      const vaultCookie = req.cookies.get('weathergpt_user_vault')?.value;
      const vaultUser = vaultCookie ? verifyVault<DbUser>(vaultCookie) : null;
      if (vaultUser && vaultUser.email.toLowerCase() === normalizedEmail) {
        user = vaultUser;
      }
    }

    // Generic error to avoid user enumeration
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Update last login
    await userRepository.updateLastLogin(user.id);

    // Sign JWT
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: (user.role as any) || 'user',
      name: user.name,
    });

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
      last_login: new Date().toISOString(),
    };

    const response = NextResponse.json({
      access_token: token,
      token_type: 'bearer',
      user: safeUser,
    });

    // Set HttpOnly cookie for server/browser compatibility
    response.cookies.set('weathergpt_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: unknown) {
    console.error('Login API error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error while processing login.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
