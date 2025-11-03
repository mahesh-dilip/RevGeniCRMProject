import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkForDuplicate } from '@/lib/security/duplicate-detection';
import { validateRequest } from '@/lib/middleware/validate';
import { logError } from '@/lib/logging';

import { BulkCreateCompaniesSchema } from '@/lib/validations/companies';
import { rateLimit, getClientIdentifier } from '@/lib/middleware/rate-limit-memory';
import { getAuthContext, requireRole } from '@/lib/auth/context';


export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    // Get authenticated user context
    const { tenantId } = await getAuthContext();
    // Demo: Allow all authenticated users to bulk create companies

    // Rate limiting - Bulk operations can flood the database
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await rateLimit(identifier, 'bulk');

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Too many bulk operations.',
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
    const validation = await validateRequest(request, BulkCreateCompaniesSchema);
    if ('error' in validation) {
      return validation.error;
    }

    const { companies } = validation.data;

    let created = 0;
    let skipped = 0;
    const createdCompanies = [];

    for (const company of companies) {
      // Check for duplicates
      const isDuplicate = await checkForDuplicate(
        company.website || undefined,
        company.name
      );

      if (isDuplicate) {
        console.log(`⚠️ Skipping duplicate: ${company.name}`);
        skipped++;
        continue;
      }

      // Create company
      const newCompany = await prisma.company.create({
        data: {
          tenantId,
          name: company.name,
          website: company.website,
          industry: company.industry,
          size: company.size,
          geography: company.geography,
          description: company.description,
          foundedYear: company.foundedYear,
          confidence: company.confidence,
          status: 'Lead',
          sourceType: 'ai_agent',
          sourceQuery: company.sourceQuery || 'AI Generated'
        }
      });

      createdCompanies.push(newCompany);
      created++;
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      companies: createdCompanies
    });
  } catch (error) {
    logError('Bulk create error:', error);
    return NextResponse.json(
      { error: 'Failed to create companies' },
      { status: 500 }
    );
  }
}
