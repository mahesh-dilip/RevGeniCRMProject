import * as Sentry from '@sentry/nextjs';

/**
 * Log an error with context to Sentry and console
 * Use this instead of console.error for production error tracking
 */
export function logError(message: string, error: unknown, context?: Record<string, any>) {
  console.error(message, error);

  // Only send to Sentry if DSN is configured
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: {
        message,
        ...context,
      },
    });
  }
}

/**
 * Log informational message with context
 * Use this for important operational logs
 */
export function logInfo(message: string, context?: Record<string, any>) {
  console.log(message, context);
}

/**
 * Log a warning with context to Sentry
 */
export function logWarning(message: string, context?: Record<string, any>) {
  console.warn(message, context);

  // Only send to Sentry if DSN is configured
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureMessage(message, {
      level: 'warning',
      extra: context,
    });
  }
}

/**
 * Manually capture a message to Sentry (for non-error events you want to track)
 */
export function logEvent(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
  console.log(`[${level.toUpperCase()}] ${message}`, context);

  // Only send to Sentry if DSN is configured
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  }
}
