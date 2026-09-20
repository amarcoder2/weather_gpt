import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { userRepository } from '../../../../lib/db/postgres';
import { signToken, verifyVault, signVault } from '../../../../lib/auth/jwt';
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

    // Server-side admin authentication via Vercel environment variable ADMIN_PASSWORD
    const adminEmail = (process.env.ADMIN_EMAIL || process.env.DEMO_ADMIN_EMAIL || 'admin@weathergpt.gov.in').toLowerCase().trim();
    const envAdminPassword = process.env.ADMIN_PASSWORD || process.env.DEMO_ADMIN_PASSWORD;

    let isMatch = false;
    let isAdminAuth = false;

    // Direct administrative check using server-side ADMIN_PASSWORD
    if (envAdminPassword && (normalizedEmail === adminEmail || (user && user.role === 'admin'))) {
      if (password === envAdminPassword) {
        isMatch = true;
        isAdminAuth = true;
        if (!user) {
          user = {
            id: 'usr_admin_root',
            name: process.env.ADMIN_NAME || 'IMD Chief Administrator',
            email: normalizedEmail,
            password_hash: '',
            role: 'admin',
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString(),
          };
        } else {
          user.role = 'admin';
        }
      }
    }

    // If not authenticated via ADMIN_PASSWORD, check bcrypt hash for standard registered users
    if (!isMatch && user && user.password_hash) {
      isMatch = await bcrypt.compare(password, user.password_hash);
    }

    // Generic error to avoid user enumeration if both checks fail
    if (!isMatch || !user) {
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

    // If authenticated as admin or user has admin role, refresh vault cookie with admin role
    if (isAdminAuth || user.role === 'admin') {
      const vaultToken = signVault({
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'admin',
        password_hash: user.password_hash || '',
      });
      response.cookies.set('weathergpt_user_vault', vaultToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

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
