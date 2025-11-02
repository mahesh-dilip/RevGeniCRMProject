'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/error-boundary';

/**
 * AI Operation Error Fallback
 * Specialized error UI for AI-related failures
 */
interface ErrorInfo {
  title: string;
  description: string;
  icon: string;
  canRetry: boolean;
}

export function AIErrorFallback({
  error,
  resetError,
}: {
  error?: Error;
  resetError?: () => void;
}) {
  const getErrorMessage = (): ErrorInfo => {
    if (!error) {
      return {
        title: 'An Unexpected Error Occurred',
        description: 'Something went wrong. Please try again.',
        icon: '🤖',
        canRetry: true,
      };
    }

    const message = error.message.toLowerCase();

    if (message.includes('rate limit')) {
      return {
        title: 'Rate Limit Reached',
        description:
          'Too many AI requests in a short time. Please wait a moment and try again.',
        icon: '⏱️',
        canRetry: true,
      };
    }

    if (message.includes('api key') || message.includes('unauthorized')) {
      return {
        title: 'API Configuration Issue',
        description:
          'There seems to be an issue with the AI service configuration. Please contact support.',
        icon: '🔑',
        canRetry: false,
      };
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return {
        title: 'Request Timeout',
        description:
          'The AI request took too long to complete. Please try again with a simpler request.',
        icon: '⏰',
        canRetry: true,
      };
    }

    if (message.includes('network') || message.includes('fetch')) {
      return {
        title: 'Connection Error',
        description:
          'Unable to connect to the AI service. Please check your internet connection and try again.',
        icon: '🌐',
        canRetry: true,
      };
    }

    return {
      title: 'AI Generation Failed',
      description:
        'The AI encountered an error while generating content. Please try again or adjust your inputs.',
      icon: '🤖',
      canRetry: true,
    };
  };

  const errorInfo = getErrorMessage();

  return (
    <Card className="p-8">
      <div className="text-center space-y-4">
        <div className="text-6xl mb-4">{errorInfo.icon}</div>
        <h2 className="text-2xl font-bold text-gray-900">{errorInfo.title}</h2>
        <p className="text-gray-600 max-w-md mx-auto">{errorInfo.description}</p>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="text-left mt-4 p-4 bg-gray-100 rounded-lg">
            <summary className="cursor-pointer font-semibold text-sm text-gray-700 mb-2">
              Technical Details (Development Only)
            </summary>
            <pre className="text-xs text-red-600 overflow-auto whitespace-pre-wrap">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}

        <div className="flex gap-3 justify-center mt-6">
          {errorInfo.canRetry && resetError && (
            <Button onClick={resetError} variant="default">
              Try Again
            </Button>
          )}
          <Button onClick={() => (window.location.href = '/')} variant="outline">
            Go to Dashboard
          </Button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">💡 Troubleshooting Tips:</span>
          </p>
          <ul className="text-sm text-blue-700 mt-2 space-y-1 text-left list-disc list-inside">
            <li>Ensure your inputs are clear and not too complex</li>
            <li>Try reducing the number of emails in your sequence</li>
            <li>Check that all required fields are filled out</li>
            <li>If the issue persists, try a different template</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}

/**
 * AI Error Boundary
 * Wraps AI-related components with specialized error handling
 */
export function AIOperationErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary
      fallback={<AIErrorFallback />}
      onReset={() => {
        // Could add custom reset logic here
        // For now, just let the boundary reset
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Hook-based error state handler for AI operations
 * Use this in components that handle AI operations with try-catch
 */
export function useAIErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((err: unknown) => {
    const error = err instanceof Error ? err : new Error(String(err));
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    hasError: error !== null,
    handleError,
    clearError,
    ErrorDisplay: error ? (
      <AIErrorFallback error={error} resetError={clearError} />
    ) : null,
  };
}
