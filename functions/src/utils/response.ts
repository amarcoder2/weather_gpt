// ==============================================================================
// RESPONSE HELPER UTILITY (Section 6 & 7)
// ==============================================================================

import { Request, Response } from 'express';
import { ApiResponse, PaginationMeta } from '../types';

export const sendSuccess = <T>(
  req: Request,
  res: Response,
  data: T,
  statusCode = 200,
  pagination?: PaginationMeta,
  extraMeta?: Record<string, unknown>
): void => {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      requestId: req.requestId || 'req_unknown',
      timestamp: new Date().toISOString(),
      ...(pagination ? { pagination } : {}),
      ...(extraMeta || {}),
    },
  };

  res.status(statusCode).json(payload);
};
