import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { UserRole } from '../../types/auth';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET_KEY;
  if (!secret || secret.trim().length === 0) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SECURITY CONFIGURATION ERROR: JWT_SECRET_KEY must be set in production environment.');
    }
    return 'weathergpt-dev-only-secret-do-not-use-in-production-moes-imd';
  }
  return secret.trim();
}

const JWT_ALGORITHM = (process.env.JWT_ALGORITHM as jwt.Algorithm) || 'HS256';
const EXPIRES_IN_MINUTES = parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || '1440', 10); // default 24h

/**
 * Uniform server-side check for administrative authorization.
 * Supports both 'admin' and 'super_admin' roles consistently.
 */
export function isAdminRole(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.toLowerCase().trim();
  return normalized === 'admin' || normalized === 'super_admin';
}

/**
  * Server-side check for super-administrator authorization.
  * Super admins have full privileges including privilege escalation and root administration.
  */
export function isSuperAdminRole(role?: string | null): boolean {
  if (!role) return false;
  return role.toLowerCase().trim() === 'super_admin';
}

export function signToken(payload: TokenPayload): string {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, {
    algorithm: JWT_ALGORITHM,
    expiresIn: `${EXPIRES_IN_MINUTES}m`,
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret, {
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

  // Also check HttpOnly cookie
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
