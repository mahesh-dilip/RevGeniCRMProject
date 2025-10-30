import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth/context';
import { requirePermission } from '@/lib/auth/permissions';
import { rateLimit } from '@/lib/middleware/rate-limit';
import { validateRequest, BulkCreateCompaniesSchema } from '@/lib/validations/api';

export async function POST(request: Request) {
  try {
    // 1. Authentication
    const authContext = await getAuthContext();

    // 2. Rate limiting (bulk operations are expensive)
    const rateLimitResponse = await rateLimit(authContext.userId, 'bulk');
    if (rateLimitResponse) return rateLimitResponse;

    // 3. Authorization
    requirePermission(authContext, 'BULK_CREATE');

    // 4. Validation
    const data = await validateRequest(request, BulkCreateCompaniesSchema);

    let created = 0;
    let skipped = 0;
    const createdCompanies = [];

    for (const company of data.companies) {
      // Check for duplicates within tenant
      const isDuplicate = await prisma.company.findFirst({
        where: {
          tenantId: authContext.tenantId,
          OR: [
            { website: company.website },
            { name: company.name },
          ],
        },
      });

      if (isDuplicate) {
        console.log(`⚠️ Skipping duplicate: ${company.name}`);
        skipped++;
        continue;
      }

      // Create company with tenant isolation
      const newCompany = await prisma.company.create({
        data: {
          tenantId: authContext.tenantId,
          name: company.name,
          website: company.website,
          industry: company.industry,
          size: company.size,
          geography: company.geography,
          description: company.description,
          foundedYear: company.foundedYear,
          confidence: company.confidence,
          status: company.status || 'Lead',
          sourceType: company.sourceType || 'ai_agent',
          sourceQuery: company.sourceQuery || 'Bulk Import'
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
    console.error('Bulk create error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create companies',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 }
    );
  }
}
