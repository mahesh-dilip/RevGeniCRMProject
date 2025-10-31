import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logError, logInfo } from '@/lib/logging';
import { getAuthContext } from '@/lib/auth/context';
import { ExaWebsetsService } from '@/lib/ai/exa-websets';
import { checkForDuplicate } from '@/lib/security/duplicate-detection';
import { z } from 'zod';

const importSchema = z.object({
  selectedIds: z.array(z.string()).min(1, 'At least one company must be selected'),
});

/**
 * POST /api/websets/companies/[id]/import
 * Import selected companies from webset results
 *
 * Security:
 * - Requires authentication (Clerk)
 * - Multi-tenant isolated
 * - Duplicate detection enabled
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user context
    const { tenantId, userId } = await getAuthContext();

    const websetId = params.id;

    // Validate request body
    const body = await request.json();
    const validation = importSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { selectedIds } = validation.data;

    // Find webset and verify it belongs to user's tenant
    const webset = await prisma.webset.findFirst({
      where: {
        id: websetId,
        tenantId,
      },
    });

    if (!webset) {
      return NextResponse.json(
        { error: 'Webset not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch results from Exa
    logInfo('Importing selected companies from webset', {
      websetId: webset.id,
      selectedCount: selectedIds.length,
      tenantId,
    });

    const exaService = new ExaWebsetsService();
    const { items } = await exaService.getWebsetResults(webset.exaId);

    // Filter to only selected items
    const selectedItems = items.filter((item: any) =>
      selectedIds.includes(item.id)
    );

    // Import selected companies
    const createdCompanies = [];
    let skippedDuplicates = 0;
    const criteria = webset.criteria as any;

    for (const item of selectedItems) {
      try {
        const properties = (item as any).properties || {};
        const companyInfo = properties.company || {};
        const enrichments = (item as any).enrichments || [];

        const getEnrichmentValue = (formatType?: string, index: number = 0): string | null => {
          const enrichment = formatType
            ? enrichments.find((e: any) => e.format === formatType)
            : enrichments[index];
          return enrichment?.result?.[0] || null;
        };

        const companyData = {
          name: companyInfo.name || getEnrichmentValue('text', 0) || properties.url || 'Unknown',
          website: getEnrichmentValue('url') || properties.url || null,
          industry: companyInfo.industry || criteria.industry || null,
          size: companyInfo.employees
            ? `${companyInfo.employees} employees`
            : (getEnrichmentValue('number') ? `${getEnrichmentValue('number')} employees` : criteria.size),
          geography: companyInfo.location || criteria.geography || null,
          description: companyInfo.about || properties.description || null,
          foundedYear: companyInfo.founded || null,
        };

        // Check for duplicates
        const duplicate = await checkForDuplicate(companyData.website, companyData.name);

        if (duplicate) {
          logInfo('Skipping duplicate company from webset', {
            name: companyData.name,
            website: companyData.website,
          });
          skippedDuplicates++;
          continue;
        }

        // Create company record
        const company = await prisma.company.create({
          data: {
            tenantId,
            websetId: webset.id,
            name: companyData.name,
            website: companyData.website,
            industry: companyData.industry,
            size: companyData.size,
            geography: companyData.geography,
            description: companyData.description,
            foundedYear: companyData.foundedYear,
            status: 'Lead',
            sourceType: 'exa_webset',
            sourceQuery: webset.query,
            confidence: 0.85,
          },
        });

        createdCompanies.push(company);
      } catch (itemError) {
        logError('Error importing company from webset', itemError, {
          websetId: webset.id,
          item: item,
        });
      }
    }

    // Update webset result count
    await prisma.webset.update({
      where: { id: webset.id },
      data: {
        resultCount: createdCompanies.length,
      },
    });

    logInfo('Selected companies imported successfully', {
      websetId: webset.id,
      imported: createdCompanies.length,
      skipped: skippedDuplicates,
      selected: selectedIds.length,
      tenantId,
    });

    return NextResponse.json({
      success: true,
      count: createdCompanies.length,
      companies: createdCompanies,
      skippedDuplicates,
    });
  } catch (error) {
    logError('Error importing selected companies', error);
    return NextResponse.json(
      {
        error: 'Failed to import selected companies',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
