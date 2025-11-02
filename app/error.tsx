'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry with context
    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'global',
      },
    });
    console.error('Global error caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-lg w-full p-8">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-gray-900">
            Oops! Something went wrong
          </h1>
          <p className="text-gray-600">
            We apologize for the inconvenience. Our team has been notified and is
            working to fix the issue.
          </p>

          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="text-left mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-semibold text-sm text-red-800 mb-2">
                Error Details (Development Only):
              </p>
              <pre className="text-xs text-red-600 overflow-auto whitespace-pre-wrap">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </div>
          )}

          <div className="flex gap-3 justify-center mt-6">
            <Button onClick={() => reset()} variant="default">
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = '/')}
            >
              Go to Dashboard
            </Button>
          </div>

          {error.digest && (
            <p className="text-xs text-gray-500 mt-4">Error ID: {error.digest}</p>
          )}

          <div className="mt-6 text-sm text-gray-600">
            <p>If this problem persists, please:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Try refreshing the page</li>
              <li>Clear your browser cache</li>
              <li>Contact support with the error ID above</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
