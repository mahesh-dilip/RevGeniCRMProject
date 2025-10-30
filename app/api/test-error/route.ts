import { NextResponse } from 'next/server';
import { logError, logWarning, logInfo } from '@/lib/logging';

/**
 * Test route for Sentry integration
 * This route demonstrates different error scenarios
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'error';

  try {
    switch (type) {
      case 'error':
        // Test a caught error
        throw new Error('This is a test error from /api/test-error');

      case 'warning':
        // Test a warning
        logWarning('This is a test warning', {
          route: '/api/test-error',
          type: 'warning',
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json({
          success: true,
          message: 'Warning logged successfully',
          checkConsole: true,
        });

      case 'info':
        // Test info logging
        logInfo('This is a test info message', {
          route: '/api/test-error',
          type: 'info',
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json({
          success: true,
          message: 'Info logged successfully',
          checkConsole: true,
        });

      case 'unhandled':
        // Test an unhandled error (will be caught by global error handler)
        const obj: any = null;
        return NextResponse.json({ value: obj.someProperty });

      case 'success':
        return NextResponse.json({
          success: true,
          message: 'No error - everything working normally',
          availableTests: [
            '/api/test-error?type=error - Test caught error',
            '/api/test-error?type=warning - Test warning',
            '/api/test-error?type=info - Test info logging',
            '/api/test-error?type=unhandled - Test unhandled error',
            '/api/test-error?type=success - No error',
          ],
        });

      default:
        return NextResponse.json({
          error: 'Unknown test type',
          availableTypes: ['error', 'warning', 'info', 'unhandled', 'success'],
        });
    }
  } catch (error) {
    // This demonstrates our error logging in action
    logError('Test error caught in /api/test-error', error, {
      type,
      requestUrl: request.url,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      {
        error: 'Test error triggered successfully',
        message: error instanceof Error ? error.message : 'Unknown error',
        checkConsole: 'Error logged to console',
        checkSentry: 'If SENTRY_DSN is configured, error sent to Sentry',
      },
      { status: 500 }
    );
  }
}
