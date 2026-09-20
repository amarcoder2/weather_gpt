// ==============================================================================
// REQUEST LOGGER MIDDLEWARE (Section 7 & 42)
// ==============================================================================

import { Request, Response, NextFunction } from 'express';
import { logger } from '../logging/logger';

export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const durationMs = Date.now() - (req.startTime || Date.now());
    const statusCode = res.statusCode;

    const logMethod = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    logger[logMethod](`${method} ${originalUrl} ${statusCode} - ${durationMs}ms`, {
      service: 'ApiGateway',
      requestId: req.requestId,
      operation: `${method} ${req.path}`,
      durationMs,
      metadata: {
        statusCode,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      },
    });
  });

  next();
};
