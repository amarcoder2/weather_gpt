import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { UserRole } from '../../types/auth';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'weathergpt-sih-2026-secret-key-moes-imd-secure';
const JWT_ALGORITHM = (process.env.JWT_ALGORITHM as jwt.Algorithm) || 'HS256';
const EXPIRES_IN_MINUTES = parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || '1440', 10); // default 24h

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn: `${EXPIRES_IN_MINUTES}m`,
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
    }) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function getBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // Also check cookie
  const cookie = req.cookies.get('weathergpt_token');
  if (cookie && cookie.value) {
    return cookie.value;
  }

  return null;
}

export function authenticateRequest(req: NextRequest): TokenPayload | null {
  const token = getBearerToken(req);
  if (!token) return null;
  return verifyToken(token);
}

export function signVault(data: unknown): string {
  return jwt.sign({ vault: data }, JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn: '30d',
  });
}

export function verifyVault<T>(token: string): T | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
    }) as { vault: T };
    return decoded?.vault || null;
  } catch {
    return null;
  }
}
