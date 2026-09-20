// ==============================================================================
// ROLE-BASED ACCESS CONTROL (RBAC) MIDDLEWARE (Section 9 & 33)
// ==============================================================================

import { Request, Response, NextFunction } from 'express';
import { Role, ROLE_HIERARCHY } from '../constants';
import { AuthorizationError, AuthenticationError } from '../errors';
import { logger } from '../logging/logger';

/**
 * Ensures user has at least one of the explicitly allowed roles
 */
export const requireRoles = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Forbidden: Insufficient role permissions', {
        service: 'RbacMiddleware',
        requestId: req.requestId,
        userId: req.user.uid,
        metadata: {
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          path: req.originalUrl,
        },
      });

      throw new AuthorizationError(
        `Forbidden: Role '${req.user.role}' is not authorized to perform this operation. Required: [${allowedRoles.join(', ')}]`
      );
    }

    next();
  };
};

/**
 * Ensures user meets or exceeds a minimum hierarchical role level
 */
export const requireMinRole = (minRole: Role) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;

    if (userLevel < requiredLevel) {
      logger.warn('Forbidden: Insufficient role hierarchy level', {
        service: 'RbacMiddleware',
        requestId: req.requestId,
        userId: req.user.uid,
        metadata: {
          userRole: req.user.role,
          userLevel,
          requiredRole: minRole,
          requiredLevel,
          path: req.originalUrl,
        },
      });

      throw new AuthorizationError(
        `Forbidden: Role '${req.user.role}' does not meet minimum level '${minRole}'`
      );
    }

    next();
  };
};
