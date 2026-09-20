// ==============================================================================
// CENTRALIZED ERROR HANDLER (Section 6 & 43)
// ==============================================================================

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';
import { ApiErrorResponse } from '../types';
import { logger } from '../logging/logger';
import { config } from '../config';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandlerMiddleware = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  const requestId = req.requestId || 'req_unknown';

  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected internal error occurred';
  let details: unknown = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    details = err.details;
  } else if (err.name === 'SyntaxError') {
    statusCode = 400;
    errorCode = 'INVALID_JSON_SYNTAX';
    message = 'Malformed JSON in request payload';
  } else {
    // Unhandled exception: log full stack internally
    logger.error(`Unhandled Exception: ${err.message}`, {
      service: 'ApiGateway',
      requestId,
      errorCode,
      metadata: {
        stack: err.stack,
        url: req.originalUrl,
      },
    });

    if (config.isDev) {
      details = { stack: err.stack };
    }
  }

  // Structured response adhering strictly to Section 6 standard
  const responsePayload: ApiErrorResponse = {
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details ? { details } : {}),
    },
    requestId,
  };

  res.status(statusCode).json(responsePayload);
};
