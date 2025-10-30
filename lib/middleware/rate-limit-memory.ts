/**
 * Simple in-memory rate limiter (no Redis dependency)
 *
 * Note: This implementation resets on server restart and doesn't work
 * across multiple server instances. For production with clustering,
 * consider using Redis or a distributed cache.
 */

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

type RateLimitStore = Map<string, RateLimitRecord>;

/**
 * Separate stores for different rate limit types
 */
const stores = {
  ai: new Map() as RateLimitStore,      // AI/expensive operations
  bulk: new Map() as RateLimitStore,    // Bulk operations
  api: new Map() as RateLimitStore,     // Regular API calls
};

/**
 * Rate limit configuration
 */
const limits = {
  ai: { max: 5, window: 60000 },    // 5 requests per minute
  bulk: { max: 3, window: 60000 },  // 3 requests per minute
  api: { max: 60, window: 60000 },  // 60 requests per minute
};

/**
 * Check if a request should be rate limited
 *
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param type - Type of rate limit to apply
 * @returns Object with allowed flag and optional retryAfter seconds
 *
 * @example
 * const result = await rateLimit('192.168.1.1', 'ai');
 * if (!result.allowed) {
 *   return NextResponse.json(
 *     { error: 'Rate limit exceeded', retryAfter: result.retryAfter },
 *     { status: 429, headers: { 'Retry-After': String(result.retryAfter) } }
 *   );
 * }
 */
export async function rateLimit(
  identifier: string,
  type: 'ai' | 'bulk' | 'api' = 'api'
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const store = stores[type];
  const limit = limits[type];
  const now = Date.now();

  const record = store.get(identifier);

  // No record or window expired - allow and create new record
  if (!record || now > record.resetAt) {
    store.set(identifier, {
      count: 1,
      resetAt: now + limit.window,
    });
    return { allowed: true };
  }

  // Limit exceeded - deny request
  if (record.count >= limit.max) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Increment counter and allow
  record.count++;
  return { allowed: true };
}

/**
 * Get client identifier from request
 * Uses IP address from various headers (for proxy support)
 * Falls back to 'unknown' if IP cannot be determined
 *
 * @param request - Next.js Request object
 * @returns Client identifier string
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from common headers (for proxy/CDN support)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // In development or if no headers available
  return 'unknown';
}

/**
 * Clean up old records periodically to prevent memory leaks
 * Called automatically every 10 minutes
 */
function cleanupOldRecords() {
  const now = Date.now();

  Object.values(stores).forEach(store => {
    Array.from(store.entries()).forEach(([key, record]) => {
      if (now > record.resetAt) {
        store.delete(key);
      }
    });
  });
}

// Run cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupOldRecords, 10 * 60 * 1000);
}
