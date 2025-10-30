import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// Only create Redis instance if credentials are provided
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Rate limiters for different operation types
export const rateLimiters = {
  // AI operations: 5 requests per minute per user
  ai: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 m'),
        prefix: 'ratelimit:ai',
      })
    : null,

  // Bulk operations: 3 requests per minute per user
  bulk: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, '1 m'),
        prefix: 'ratelimit:bulk',
      })
    : null,

  // Standard API: 60 requests per minute per user
  api: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(60, '1 m'),
        prefix: 'ratelimit:api',
      })
    : null,

  // Sequences: 10 enrollments per hour per user
  sequences: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 h'),
        prefix: 'ratelimit:sequences',
      })
    : null,
};

export type RateLimitType = keyof typeof rateLimiters;

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
  const limiter = rateLimiters[type];

  // If rate limiting is not configured (dev mode), allow all requests
  if (!limiter) {
    console.warn(`Rate limiting not configured for type: ${type}. Allowing request.`);
    return null;
  }

  try {
    const { success, limit, reset, remaining } = await limiter.limit(identifier);

    if (!success) {
      const resetDate = new Date(reset);
      const retryAfter = Math.ceil((resetDate.getTime() - Date.now()) / 1000);

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${retryAfter} seconds.`,
          limit,
          remaining: 0,
          reset: resetDate.toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': reset.toString(),
            'Retry-After': retryAfter.toString(),
          },
        }
      );
    }

    // Rate limit not exceeded
    return null;
  } catch (error) {
    console.error('Rate limiting error:', error);
    // On rate limiting errors, fail open (allow the request)
    return null;
  }
}

/**
 * Higher-order function to wrap API routes with rate limiting
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
