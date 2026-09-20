// ==============================================================================
// WEATHERGPT CENTRALIZED ERROR ARCHITECTURE (SIH 2026 #26068)
// ==============================================================================

export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly code = 'VALIDATION_ERROR';
}

export class AuthenticationError extends AppError {
  readonly statusCode = 401;
  readonly code = 'AUTHENTICATION_REQUIRED';
}

export class AuthorizationError extends AppError {
  readonly statusCode = 403;
  readonly code = 'FORBIDDEN_INSUFFICIENT_PERMISSIONS';
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = 'RESOURCE_NOT_FOUND';
}

export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly code = 'CONFLICT_STATE_ERROR';
}

export class ProviderError extends AppError {
  readonly statusCode = 502;
  readonly code = 'UPSTREAM_PROVIDER_ERROR';
}

export class DatabaseError extends AppError {
  readonly statusCode = 500;
  readonly code = 'DATABASE_OPERATION_FAILED';
}

export class InternalServerError extends AppError {
  readonly statusCode = 500;
  readonly code = 'INTERNAL_SERVER_ERROR';
}
