import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRequest } from '@/lib/middleware/validate';
import { createCompanyWebsetSchema } from '@/lib/validation/websets';
import { logError, logInfo } from '@/lib/logging';
import { getAuthContext, requireRole } from '@/lib/auth/context';
import { rateLimit, getClientIdentifier } from '@/lib/middleware/rate-limit-memory';
import { ExaWebsetsService } from '@/lib/ai/exa-websets';


export const dynamic = 'force-dynamic';
/**
 * POST /api/websets/companies/create
 * Create a new company discovery webset using Exa AI
 *
 * Security:
 * - Requires authentication (Clerk)
 * - Requires MANAGER role or higher
 * - Rate limited to 5 requests per hour (expensive Exa API operation)
 * - Multi-tenant isolated
 */
export async function POST(request: Request) {
  try {
    // Get authenticated user context and check permissions
    const { tenantId, userId, role } = await getAuthContext();
    requireRole(role, 'MANAGER'); // Webset operations require MANAGER role or higher

    // Rate limiting - Webset operations are expensive (Exa API)
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await rateLimit(identifier, 'ai');

    if (!rateLimitResult.allowed) {
      logInfo('Rate limit exceeded for webset creation', { userId, tenantId });
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Webset creation is limited to 5 requests per hour.',
          retryAfter: rateLimitResult.retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter),
          },
        }
      );
    }

    // Validate request body
    const validation = await validateRequest(request, createCompanyWebsetSchema);
    if ('error' in validation) {
      return validation.error;
    }

    const { industry, geography, size, additionalContext, maxResults } = validation.data;

    logInfo('Creating company webset', {
      tenantId,
      userId,
      industry,
      geography,
      maxResults
    });

    // Initialize Exa service and create webset
    const exaService = new ExaWebsetsService();
    const websetResult = await exaService.findCompanies({
      industry,
      geography,
      size,
      additionalContext,
      maxResults,
    });

    // Save webset record to database
    const webset = await prisma.webset.create({
      data: {
        tenantId,
        exaId: websetResult.id,
        type: 'company',
        status: websetResult.status,
        query: `${industry} companies in ${geography}`,
        criteria: {
          industry,
          geography,
          size,
          additionalContext,
          maxResults,
        },
        resultCount: 0,
        createdBy: userId,
      },
    });

    logInfo('Company webset created successfully', {
      websetId: webset.id,
      exaId: webset.exaId,
      tenantId
    });

    return NextResponse.json({
      success: true,
      webset: {
        id: webset.id,
        exaId: webset.exaId,
        type: webset.type,
        status: webset.status,
        query: webset.query,
        createdAt: webset.createdAt,
      },
    });
  } catch (error) {
    logError('Error creating company webset', error);
    return NextResponse.json(
      {
        error: 'Failed to create company webset',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
