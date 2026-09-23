import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    message: 'Logged out successfully',
  });

  const cookieOptions = {
    path: '/',
    expires: new Date(0),
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  };

  // Invalidate all session & legacy vault cookies
  response.cookies.set('weathergpt_token', '', cookieOptions);
  response.cookies.set('weathergpt_user_vault', '', cookieOptions);
  response.cookies.set('weathergpt_session', '', cookieOptions);

  response.cookies.delete('weathergpt_token');
  response.cookies.delete('weathergpt_user_vault');
  response.cookies.delete('weathergpt_session');

  return response;
}
