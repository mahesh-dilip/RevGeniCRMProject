import { z } from 'zod';
import { NextResponse } from 'next/server';

/**
 * Validates a request body against a Zod schema
 *
 * @param request - The incoming request
 * @param schema - Zod schema to validate against
 * @returns Object with either validated data or error response
 *
 * @example
 * const result = await validateRequest(request, CreateCompanySchema);
 * if ('error' in result) return result.error;
 * const data = result.data; // TypeScript knows this is validated
 */
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    // Parse JSON body
    const body = await request.json();

    // Validate against schema
    const data = schema.parse(body);

    return { data };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        error: NextResponse.json(
          {
            error: 'Validation failed',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
          { status: 400 }
        ),
      };
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return {
        error: NextResponse.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 }
        ),
      };
    }

    // Handle other errors
    return {
      error: NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      ),
    };
  }
}

/**
 * Type guard to check if validation result contains an error
 */
export function isValidationError<T>(
  result: { data: T } | { error: NextResponse }
): result is { error: NextResponse } {
  return 'error' in result;
}
