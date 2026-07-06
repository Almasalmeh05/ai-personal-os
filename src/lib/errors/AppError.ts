/**
 * Custom error class for application-specific errors.
 * Provides standardized error handling and recovery strategies.
 */

import type { UUID } from '@/types';

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly retryable: boolean;
  public readonly timestamp: number;
  private _retryCount: number = 0;
  private _maxRetries: number = 3;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    options?: {
      details?: Record<string, unknown>;
      retryable?: boolean;
      maxRetries?: number;
    }
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = options?.details;
    this.retryable = options?.retryable ?? statusCode < 500;
    this._maxRetries = options?.maxRetries ?? 3;
    this.timestamp = Date.now();

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Check if error is retryable.
   */
  public canRetry(): boolean {
    return this.retryable && this._retryCount < this._maxRetries;
  }

  /**
   * Increment retry count.
   */
  public incrementRetryCount(): number {
    return ++this._retryCount;
  }

  /**
   * Get retry count.
   */
  public getRetryCount(): number {
    return this._retryCount;
  }

  /**
   * Reset retry count.
   */
  public resetRetryCount(): void {
    this._retryCount = 0;
  }

  /**
   * Serialize error for logging.
   */
  public toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      retryable: this.retryable,
      retryCount: this._retryCount,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

/**
 * Authentication-specific error.
 */
export class AuthError extends AppError {
  constructor(message: string, code: string = 'AUTH_ERROR', details?: Record<string, unknown>) {
    super(code, message, 401, {
      details,
      retryable: false,
    });
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

/**
 * Validation-specific error.
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, 400, {
      details,
      retryable: false,
    });
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Not found error.
 */
export class NotFoundError extends AppError {
  constructor(resourceType: string, resourceId: UUID | string) {
    super('NOT_FOUND', `${resourceType} with id ${resourceId} not found`, 404, {
      retryable: false,
      details: { resourceType, resourceId },
    });
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Unauthorized error.
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access', details?: Record<string, unknown>) {
    super('UNAUTHORIZED', message, 403, {
      details,
      retryable: false,
    });
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * Rate limit error.
 */
export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(retryAfter: number = 60, details?: Record<string, unknown>) {
    super('RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later.', 429, {
      retryable: true,
      maxRetries: 1,
      details,
    });
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Network error.
 */
export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed', details?: Record<string, unknown>) {
    super('NETWORK_ERROR', message, 0, {
      retryable: true,
      details,
    });
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Timeout error.
 */
export class TimeoutError extends AppError {
  constructor(operation: string = 'Operation', timeoutMs: number = 0) {
    super('TIMEOUT', `${operation} timed out after ${timeoutMs}ms`, 0, {
      retryable: true,
      details: { operation, timeoutMs },
    });
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Conflict error (e.g., duplicate resource).
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('CONFLICT', message, 409, {
      retryable: false,
      details,
    });
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}
