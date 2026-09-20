import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { userRepository } from '../../../../lib/db/postgres';
import { signVault, verifyVault } from '../../../../lib/auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, confirmPassword } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Full Name is required.' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return NextResponse.json({ error: 'Confirm Password does not match Password.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate from DB / in-memory or incoming vault cookie
    const existing = await userRepository.findByEmail(normalizedEmail);
    const vaultCookie = req.cookies.get('weathergpt_user_vault')?.value;
    const vaultUser = vaultCookie ? verifyVault<{ id: string; email: string }>(vaultCookie) : null;

    if (existing || (vaultUser && vaultUser.email.toLowerCase() === normalizedEmail)) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please log in.' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const newUser = await userRepository.create({
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      password_hash: passwordHash,
      role: 'user', // Default role is strictly user; no self-promotion to admin
    });

    const response = NextResponse.json(
      { message: 'Account created successfully. You can now log in.' },
      { status: 201 }
    );

    // Set signed vault cookie for multi-container serverless persistence
    const vaultToken = signVault({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      password_hash: passwordHash,
    });

    response.cookies.set('weathergpt_user_vault', vaultToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err: unknown) {
    console.error('Registration API error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error while processing registration.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

