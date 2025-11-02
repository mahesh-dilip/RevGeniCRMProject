import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',

  // Environment detection
  environment: process.env.NODE_ENV,

  // Replays are useful for debugging
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.5,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Enhanced error filtering
  beforeSend(event, hint) {
    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEV_ENABLED) {
      return null;
    }

    // Add custom tags for better filtering
    event.tags = {
      ...event.tags,
      runtime: 'browser',
    };

    // Filter out common non-critical errors
    if (event.exception?.values) {
      const shouldIgnore = event.exception.values.some(exception => {
        const message = exception.value || '';
        return (
          // Ignore network errors from ad blockers
          message.includes('Failed to fetch') ||
          message.includes('NetworkError') ||
          // Ignore browser extension errors
          message.includes('chrome-extension://') ||
          message.includes('moz-extension://')
        );
      });

      if (shouldIgnore) {
        return null;
      }
    }

    return event;
  },

  // Performance monitoring for user interactions
  tracesSampler: (samplingContext) => {
    // Always capture AI generation interactions
    if (samplingContext.name?.includes('ai') || samplingContext.name?.includes('sequence')) {
      return 1.0;
    }

    // Sample other interactions at lower rate
    return process.env.NODE_ENV === 'production' ? 0.1 : 1.0;
  },

  // Add release information for better tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'development',
});
