// ==============================================================================
// REQUEST ID / CORRELATION ID MIDDLEWARE (Section 7)
// ==============================================================================

import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Use incoming client header if provided, otherwise generate a secure unique correlation ID
  const incomingId = req.headers['x-request-id'];
  const requestId = typeof incomingId === 'string' && incomingId.trim().length > 0 
    ? incomingId.trim() 
    : `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  req.requestId = requestId;
  req.startTime = Date.now();
  res.setHeader('X-Request-Id', requestId);
  next();
};
