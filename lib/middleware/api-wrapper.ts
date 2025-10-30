import { NextResponse } from 'next/server';
import { getAuthContext, AuthContext } from '@/lib/auth/context';
import { rateLimit, RateLimitType } from './rate-limit';
import { ZodSchema } from 'zod';
import { validateRequest } from '../validations/api';
import { requirePermission, Permission } from '../auth/permissions';

type ApiHandlerOptions = {
  rateLimit?: RateLimitType;
  permission?: Permission;
  requireAuth?: boolean;
};

type ApiHandler<T = any> = (
  data: T,
  context: { auth: AuthContext; request: Request }
) => Promise<Response | object>;

/**
 * Unified API wrapper that handles:
 * 1. Authentication
 * 2. Rate limiting
 * 3. Authorization (permissions)
 * 4. Request validation
 * 5. Error handling with proper status codes
 *
 * @example
 * export const POST = createApiHandler({
 *   schema: CreateCompanySchema,
 *   permission: 'CREATE_COMPANY',
 *   rateLimit: 'api',
 *   handler: async (data, { auth }) => {
 *     const company = await prisma.company.create({
 *       data: { ...data, tenantId: auth.tenantId }
 *     });
 *     return { success: true, company };
 *   }
 * });
 */
export function createApiHandler<T>(options: {
  schema?: ZodSchema<T>;
  permission?: Permission;
  rateLimit?: RateLimitType;
  requireAuth?: boolean;
  handler: ApiHandler<T>;
}) {
  const {
    schema,
    permission,
    rateLimit: rateLimitType,
    requireAuth = true,
    handler,
  } = options;

  return async (request: Request, context?: any) => {
    try {
      // 1. Authentication
      if (requireAuth) {
        const authContext = await getAuthContext();

        // 2. Rate limiting
        if (rateLimitType) {
          const rateLimitResponse = await rateLimit(
            authContext.userId,
            rateLimitType
          );
          if (rateLimitResponse) return rateLimitResponse;
        }

        // 3. Authorization
        if (permission) {
          requirePermission(authContext, permission);
        }

        // 4. Validation
        const data = schema
          ? await validateRequest(request, schema)
          : ({} as T);

        // 5. Execute handler
        const result = await handler(data, { auth: authContext, request });

        // Return response (either NextResponse or plain object)
        return result instanceof Response
          ? result
          : NextResponse.json(result);
      } else {
        // No auth required
        const data = schema
          ? await validateRequest(request, schema)
          : ({} as T);
        const result = await handler(data, {
          auth: null as any,
          request,
        });
        return result instanceof Response
          ? result
          : NextResponse.json(result);
      }
    } catch (error) {
      console.error('API Error:', error);

      // Determine status code based on error type
      let status = 500;
      if (error instanceof Error) {
        if (error.message.includes('Unauthorized')) status = 401;
        else if (error.message.includes('Forbidden')) status = 403;
        else if (error.message.includes('Validation error')) status = 400;
        else if (error.message.includes('Not found')) status = 404;
      }

      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'Internal server error',
          details:
            error instanceof Error ? error.message : 'Unknown error',
        },
        { status }
      );
    }
  };
}

/**
 * Create a GET handler with tenant isolation
 */
export function createGetHandler(options: {
  permission?: Permission;
  handler: (context: { auth: AuthContext; request: Request }) => Promise<Response | object>;
}) {
  return createApiHandler({
    requireAuth: true,
    permission: options.permission,
    rateLimit: 'api',
    handler: async (_, context) => options.handler(context),
  });
}

/**
 * Create a POST handler with validation
 */
export function createPostHandler<T>(options: {
  schema: ZodSchema<T>;
  permission: Permission;
  rateLimit?: RateLimitType;
  handler: ApiHandler<T>;
}) {
  return createApiHandler({
    ...options,
    requireAuth: true,
    rateLimit: options.rateLimit || 'api',
  });
}

/**
 * Create a PUT/PATCH handler with validation
 */
export function createUpdateHandler<T>(options: {
  schema: ZodSchema<T>;
  permission: Permission;
  handler: ApiHandler<T>;
}) {
  return createApiHandler({
    ...options,
    requireAuth: true,
    rateLimit: 'api',
  });
}

/**
 * Create a DELETE handler
 */
export function createDeleteHandler(options: {
  permission: Permission;
  handler: (context: { auth: AuthContext; request: Request; params?: any }) => Promise<Response | object>;
}) {
  return createApiHandler({
    requireAuth: true,
    permission: options.permission,
    rateLimit: 'api',
    handler: async (_, context) => options.handler(context),
  });
}
