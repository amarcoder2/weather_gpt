// ==============================================================================
// AUTHENTICATION MIDDLEWARE (Section 8 & 9)
// ==============================================================================

import { Request, Response, NextFunction } from 'express';
import { auth } from '../config';
import { AuthenticationError } from '../errors';
import { AuthContext } from '../types';
import { Role, ROLES } from '../constants';
import { userRepository } from '../repositories/userRepository';
import { logger } from '../logging/logger';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthContext;
    }
  }
}

/**
 * Validates token or developer test session and populates req.user
 */
export const authenticateUser = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Check for standard Firebase Bearer ID Token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1].trim();
      
      try {
        const decodedToken = await auth.verifyIdToken(idToken);
        let role = decodedToken.role as Role;
        if (!role) {
          try {
            const userProfile = await userRepository.getById(decodedToken.uid);
            role = (userProfile?.role as Role) || ROLES.USER;
          } catch {
            role = ROLES.USER;
          }
        }

        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email || '',
          role: role,
          displayName: decodedToken.name,
        };
        return next();
      } catch (err: unknown) {
        logger.warn(`Token verification failed: ${err instanceof Error ? err.message : 'Invalid token'}`, {
          service: 'AuthMiddleware',
          requestId: req.requestId,
        });
        throw new AuthenticationError('Invalid or expired authentication token');
      }
    }

    // 2. Development / Demo Role Simulation Support (Active in non-production or for SIH demonstration)
    const simulatedRole = req.headers['x-weathergpt-role'] as string | undefined;
    if (simulatedRole && Object.values(ROLES).includes(simulatedRole as Role)) {
      const simulatedUid = (req.headers['x-weathergpt-uid'] as string) || `demo_${simulatedRole.toLowerCase()}_user`;
      const simulatedEmail = (req.headers['x-weathergpt-email'] as string) || `${simulatedRole.toLowerCase()}@weathergpt.gov.in`;

      req.user = {
        uid: simulatedUid,
        email: simulatedEmail,
        role: simulatedRole as Role,
        displayName: `SIH Demo (${simulatedRole})`,
      };

      logger.debug('Authenticated via demo role header', {
        service: 'AuthMiddleware',
        requestId: req.requestId,
        userId: req.user.uid,
        metadata: { role: req.user.role },
      });
      return next();
    }

    // If no credentials provided, leave req.user empty for optional auth endpoints
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Strict gate: throws AuthenticationError if req.user is missing
 */
export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required to access this resource');
  }
  next();
};
