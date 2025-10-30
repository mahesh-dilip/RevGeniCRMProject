import { NextResponse } from 'next/server';

/**
 * In-Memory Rate Limiting
 * 
 * This implementation uses an in-memory Map to track rate limits.
 * Perfect for single-server deployments (Vercel, Railway, etc.)
 * 
 * Note: Limits reset on server restart, which is usually acceptable.
 * For multi-server deployments with shared limits, consider Redis or database-based rate limiting.
 */

export type RateLimitType = 'ai' | 'bulk' | 'api' | 'sequences';

// In-memory store for rate limiting
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configurations (requests per window)
const rateLimitConfigs = {
  ai: { limit: 5, windowMs: 60 * 1000 },           // 5 per minute
  bulk: { limit: 3, windowMs: 60 * 1000 },         // 3 per minute
  api: { limit: 60, windowMs: 60 * 1000 },         // 60 per minute
  sequences: { limit: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
};

// Cleanup old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Apply rate limiting to a request.
 * Returns an error response if rate limit is exceeded.
 *
 * @param identifier - Unique identifier for the rate limit (e.g., user ID or IP)
 * @param type - Type of rate limit to apply
 * @returns NextResponse with error if rate limited, null otherwise
 */
export async function rateLimit(
  identifier: string,
  type: RateLimitType = 'api'
): Promise<NextResponse | null> {
  const config = rateLimitConfigs[type];
  const key = `${type}:${identifier}`;
  const now = Date.now();

  // Get or create entry
  let entry = rateLimitStore.get(key);

  // Reset if window expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  // Increment count
  entry.count++;

  // Check if limit exceeded
  if (entry.count > config.limit) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    const resetDate = new Date(entry.resetTime);

    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again in ${retryAfter} seconds.`,
        limit: config.limit,
        remaining: 0,
        reset: resetDate.toISOString(),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': config.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': entry.resetTime.toString(),
          'Retry-After': retryAfter.toString(),
        },
      }
    );
  }

  // Calculate remaining requests
  const remaining = Math.max(0, config.limit - entry.count);

  // Optional: Add rate limit headers to successful responses
  // This could be added to the API wrapper if needed

  // Still within limit
  return null;
}

/**
 * Higher-order function to wrap API routes with rate limiting
 * (Kept for backward compatibility, though not currently used)
 */
export function withRateLimit(
  handler: (request: Request, context?: any) => Promise<Response>,
  type: RateLimitType = 'api'
) {
  return async (request: Request, context?: any) => {
    // Use user ID from auth or IP address as fallback
    const identifier =
      context?.params?.userId ||
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'anonymous';

    const rateLimitResponse = await rateLimit(identifier, type);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    return handler(request, context);
  };
}
