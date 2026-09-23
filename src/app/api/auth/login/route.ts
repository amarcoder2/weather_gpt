import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { userRepository } from '../../../../lib/db/postgres';
import { signToken } from '../../../../lib/auth/jwt';

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

    // Server-side admin authentication check via ADMIN_PASSWORD environment variable
    const adminEmail = (process.env.ADMIN_EMAIL || process.env.DEMO_ADMIN_EMAIL || 'admin@weathergpt.gov.in').toLowerCase().trim();
    const envAdminPassword = process.env.ADMIN_PASSWORD || process.env.DEMO_ADMIN_PASSWORD;

    let isMatch = false;

    // Direct administrative check using server-side ADMIN_PASSWORD if configured
    if (envAdminPassword && (normalizedEmail === adminEmail || (user && user.role === 'admin'))) {
      if (password === envAdminPassword) {
        isMatch = true;
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

    // Standard user password verification via bcrypt hash
    if (!isMatch && user && user.password_hash) {
      isMatch = await bcrypt.compare(password, user.password_hash);
    }

    // Generic error to prevent user enumeration
    if (!isMatch || !user) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Check account status: enforce suspension
    if (user.status && user.status.toUpperCase() === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'This account has been suspended by an administrator. Please contact operations support.' },
        { status: 403 }
      );
    }

    // Update last login timestamp in background
    userRepository.updateLastLogin(user.id).catch(() => {});

    // Sign cryptographic JWT token
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

    // Set secure HttpOnly session cookie
    response.cookies.set('weathergpt_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: unknown) {
    console.error('Login API error:', err instanceof Error ? err.message : 'Unknown');
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your request. Please try again.' },
      { status: 500 }
    );
  }
}
