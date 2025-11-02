import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',

  // Environment detection
  environment: process.env.NODE_ENV,

  // Configure integrations
  integrations: [
    Sentry.prismaIntegration(),
  ],

  // Enhanced error grouping
  beforeSend(event, hint) {
    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEV_ENABLED) {
      return null;
    }

    // Add custom tags for better filtering
    event.tags = {
      ...event.tags,
      runtime: 'nodejs',
    };

    // Filter out sensitive data from request body
    if (event.request?.data) {
      const sensitiveKeys = ['password', 'apiKey', 'token', 'secret'];
      const data = typeof event.request.data === 'string'
        ? JSON.parse(event.request.data)
        : event.request.data;

      sensitiveKeys.forEach(key => {
        if (data[key]) {
          data[key] = '[REDACTED]';
        }
      });

      event.request.data = JSON.stringify(data);
    }

    return event;
  },

  // Performance monitoring for critical operations
  tracesSampler: (samplingContext) => {
    // Always capture AI generation traces in production
    if (samplingContext.name?.includes('ai/generate-sequence')) {
      return 1.0;
    }

    // Sample other requests at lower rate
    return process.env.NODE_ENV === 'production' ? 0.1 : 1.0;
  },

  // Add release information for better tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'development',
});
