import { NextResponse } from 'next/server';
import { findLeads } from '@/lib/ai/lead-finder';
import { prisma } from '@/lib/prisma';
import { checkForDuplicate } from '@/lib/security/duplicate-detection';
import { getAuthContext } from '@/lib/auth/context';
import { requirePermission } from '@/lib/auth/permissions';
import { rateLimit } from '@/lib/middleware/rate-limit';
import { validateRequest, FindLeadsSchema } from '@/lib/validations/api';

export async function POST(request: Request) {
  try {
    // 1. Authentication
    const authContext = await getAuthContext();

    // 2. Rate limiting (AI operations are expensive)
    const rateLimitResponse = await rateLimit(authContext.userId, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    // 3. Authorization
    requirePermission(authContext, 'USE_AI_LEAD_FINDER');

    // 4. Validation
    const data = await validateRequest(request, FindLeadsSchema);

    console.log('🤖 Starting AI lead generation...');
    const leads = await findLeads(
      {
        industry: data.industry,
        geography: data.geography,
        size: data.size,
        additionalContext: data.additionalContext,
      },
      data.maxResults
    );

    if (leads.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        companies: [],
        message: 'No leads found matching criteria',
      });
    }

    let createdCompanies = [];
    let skippedDuplicates = 0;

    if (data.autoCreate) {
      for (const lead of leads) {
        // Check for duplicates within tenant
        const duplicate = await prisma.company.findFirst({
          where: {
            tenantId: authContext.tenantId,
            OR: [
              { website: lead.website },
              { name: lead.name },
            ],
          },
        });

        if (duplicate) {
          console.log(`⚠️ Skipping duplicate: ${lead.name}`);
          skippedDuplicates++;
          continue;
        }

        // Create company with tenant isolation
        const company = await prisma.company.create({
          data: {
            tenantId: authContext.tenantId,
            name: lead.name,
            website: lead.website,
            industry: lead.industry,
            size: lead.size,
            geography: lead.geography,
            description: lead.description,
            foundedYear: lead.foundedYear,
            confidence: lead.confidence,
            status: 'Lead',
            sourceType: 'ai_agent',
            sourceQuery: `${data.industry} in ${data.geography} with ${data.size}`,
          },
        });

        createdCompanies.push(company);
      }

      console.log(
        `✅ Created ${createdCompanies.length} companies, skipped ${skippedDuplicates} duplicates`
      );
    }

    return NextResponse.json({
      success: true,
      count: data.autoCreate ? createdCompanies.length : leads.length,
      companies: data.autoCreate ? createdCompanies : leads,
      skippedDuplicates: skippedDuplicates,
    });
  } catch (error) {
    console.error('❌ AI lead generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate leads',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: error instanceof Error && error.message.includes('Forbidden') ? 403 : 500 }
    );
  }
}
