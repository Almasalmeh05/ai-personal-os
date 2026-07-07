/**
 * Error handling utilities and strategies.
 * Provides centralized error handling across the application.
 */

import { AppError, ValidationError, NetworkError, TimeoutError } from './AppError';
import type { AppError as AppErrorType } from '@/types';

/**
 * Error handler function type.
 */
export type ErrorHandler = (error: AppError) => void | Promise<void>;

/**
 * Error handlers registry for different error types.
 */
const errorHandlers: Map<string, ErrorHandler[]> = new Map();

/**
 * Register an error handler for a specific error code.
 * @param errorCode - The error code to handle
 * @param handler - The handler function
 */
export function onError(errorCode: string, handler: ErrorHandler): () => void {
  if (!errorHandlers.has(errorCode)) {
    errorHandlers.set(errorCode, []);
  }

  const handlers = errorHandlers.get(errorCode)!;
  handlers.push(handler);

  // Return unsubscribe function
  return () => {
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  };
}

/**
 * Handle an error with registered handlers.
 * @param error - The error to handle
 */
export async function handleError(error: AppError): Promise<void> {
  const handlers = errorHandlers.get(error.code) ?? [];

  // Execute all handlers for this error code
  await Promise.all(handlers.map((handler) => handler(error)));

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error(`[${error.code}]`, error.message, error.details);
  }
}

/**
 * Convert various error types to AppError.
 * @param error - The error to convert
 * @returns AppError instance
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof TypeError) {
    return new ValidationError(error.message, { originalError: error.name });
  }

  if (error instanceof ReferenceError) {
    return new AppError('REFERENCE_ERROR', error.message, 500, {
      details: { originalError: error.name },
    });
  }

  if (error instanceof SyntaxError) {
    return new ValidationError(error.message, { originalError: error.name });
  }

  if (error instanceof Error) {
    // Check for network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return new NetworkError(error.message);
    }

    return new AppError('UNKNOWN_ERROR', error.message, 500, {
      details: { originalError: error.name },
    });
  }

  return new AppError('UNKNOWN_ERROR', 'An unknown error occurred', 500);
}

/**
 * Create a formatted error response for API.
 * @param error - The error to format
 * @returns Formatted error response
 */
export function formatErrorResponse(error: AppError): AppErrorType {
  return {
    code: error.code,
    message: error.message,
    details: error.details,
    timestamp: error.timestamp,
    retry:
      error.canRetry() && !import.meta.env.DEV
        ? async () => {
            // Retry logic to be implemented by caller
          }
        : undefined,
  };
}

/**
 * Retry a failed operation with exponential backoff.
 * @param operation - The operation to retry
 * @param options - Retry options
 * @returns The result of the operation
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options?: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: AppError) => void;
  }
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 100,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    onRetry,
  } = options ?? {};

  let lastError: AppError | null = null;
  let delayMs = initialDelayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = normalizeError(error);

      // Don't retry non-retryable errors
      if (!lastError.canRetry()) {
        throw lastError;
      }

      // Last attempt
      if (attempt === maxRetries) {
        throw lastError;
      }

      lastError.incrementRetryCount();

      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // Exponential backoff with jitter
      const jitter = Math.random() * 0.1 * delayMs;
      await new Promise((resolve) => setTimeout(resolve, delayMs + jitter));

      delayMs = Math.min(delayMs * backoffMultiplier, maxDelayMs);
    }
  }

  throw lastError ?? new AppError('RETRY_FAILED', 'Operation failed after retries', 500);
}

/**
 * Execute operation with timeout.
 * @param operation - The operation to execute
 * @param timeoutMs - Timeout in milliseconds
 * @param operationName - Name of the operation for error messages
 * @returns The result of the operation
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = 30000,
  operationName: string = 'Operation'
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(operationName, timeoutMs));
      }, timeoutMs);
    }),
  ]);
}

/**
 * Execute operation with both retry and timeout.
 * @param operation - The operation to execute
 * @param options - Combined retry and timeout options
 * @returns The result of the operation
 */
export async function withRetryAndTimeout<T>(
  operation: () => Promise<T>,
  options?: {
    timeoutMs?: number;
    maxRetries?: number;
    initialDelayMs?: number;
    operationName?: string;
  }
): Promise<T> {
  const { timeoutMs = 30000, operationName = 'Operation' } = options ?? {};

  return withRetry(
    () => withTimeout(operation, timeoutMs, operationName),
    options
  );
}

/**
 * Create a safe async wrapper that catches and normalizes errors.
 * @param fn - The async function to wrap
 * @returns Wrapped function that returns AsyncState
 */
export function createSafeAsyncFunction<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>
): (...args: TArgs) => Promise<{ success: true; data: TReturn } | { success: false; error: AppError }> {
  return async (...args: TArgs) => {
    try {
      const data = await fn(...args);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: normalizeError(error) };
    }
  };
}
