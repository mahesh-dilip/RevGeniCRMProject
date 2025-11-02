/**
 * Sentry Utilities
 *
 * Helper functions for enhanced error tracking and performance monitoring
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Track AI generation performance and errors
 */
export async function trackAIGeneration<T>(
  operation: string,
  metadata: Record<string, any>,
  fn: () => Promise<T>
): Promise<T> {
  // Add breadcrumb for tracking
  Sentry.addBreadcrumb({
    category: 'ai',
    message: `Starting ${operation}`,
    level: 'info',
    data: metadata,
  });

  try {
    const result = await Sentry.startSpan(
      {
        op: 'ai.generation',
        name: operation,
        attributes: metadata,
      },
      async () => {
        return await fn();
      }
    );

    Sentry.addBreadcrumb({
      category: 'ai',
      message: `Completed ${operation}`,
      level: 'info',
    });

    return result;
  } catch (error) {
    // Capture error with context
    Sentry.captureException(error, {
      tags: {
        operation,
        category: 'ai_generation',
      },
      contexts: {
        ai_operation: {
          operation,
          ...metadata,
        },
      },
    });

    throw error;
  }
}

/**
 * Track API route performance
 */
export function trackAPIRoute(
  route: string,
  method: string,
  metadata?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    category: 'api',
    message: `${method} ${route}`,
    level: 'info',
    data: metadata,
  });
}

/**
 * Set user context for better error tracking
 */
export function setUserContext(user: {
  id: string;
  email: string;
  tenantId: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
  });

  Sentry.setContext('tenant', {
    id: user.tenantId,
  });
}

/**
 * Track database operations
 */
export function trackDatabaseOperation(
  operation: string,
  model: string,
  metadata?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    category: 'database',
    message: `${operation} on ${model}`,
    level: 'info',
    data: metadata,
  });
}

/**
 * Track websets operations (Exa API calls)
 */
export async function trackWebsetsOperation<T>(
  operation: string,
  metadata: Record<string, any>,
  fn: () => Promise<T>
): Promise<T> {
  try {
    const result = await Sentry.startSpan(
      {
        op: 'websets.search',
        name: operation,
        attributes: metadata,
      },
      async () => {
        return await fn();
      }
    );
    return result;
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        operation,
        category: 'websets',
      },
      contexts: {
        websets_operation: {
          operation,
          ...metadata,
        },
      },
    });
    throw error;
  }
}

/**
 * Track user actions for debugging
 */
export function trackUserAction(
  action: string,
  metadata?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    category: 'user_action',
    message: action,
    level: 'info',
    data: metadata,
  });
}

/**
 * Capture a message with context
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>
) {
  Sentry.captureMessage(message, {
    level,
    contexts: context ? { custom: context } : undefined,
  });
}
