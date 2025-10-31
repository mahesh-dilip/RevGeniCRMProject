import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logError, logInfo, logWarning } from '@/lib/logging';
import { getAuthContext } from '@/lib/auth/context';
import { ExaWebsetsService } from '@/lib/ai/exa-websets';

/**
 * GET /api/websets/companies/[id]/preview
 * Fetch webset results WITHOUT importing (for review)
 *
 * Security:
 * - Requires authentication (Clerk)
 * - Multi-tenant isolated
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user context
    const { tenantId, userId } = await getAuthContext();

    const websetId = params.id;

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

    // Check if webset is completed
    if (webset.status !== 'completed') {
      return NextResponse.json(
        {
          error: 'Webset is not completed yet',
          status: webset.status,
          websetId: webset.id,
        },
        { status: 400 }
      );
    }

    // Fetch results from Exa (raw data)
    logInfo('Fetching webset preview from Exa', {
      websetId: webset.id,
      exaId: webset.exaId,
      tenantId,
    });

    const exaService = new ExaWebsetsService();
    const { items } = await exaService.getWebsetResults(webset.exaId);

    if (!items || items.length === 0) {
      logWarning('No results found in completed webset', {
        websetId: webset.id,
        exaId: webset.exaId,
      });

      return NextResponse.json({
        success: true,
        count: 0,
        companies: [],
        message: 'No companies found in webset',
      });
    }

    // Parse company data but don't import
    const companies = [];
    const criteria = webset.criteria as any;

    for (const item of items) {
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
          exaId: (item as any).id,
          name: companyInfo.name || getEnrichmentValue('text', 0) || properties.url || 'Unknown',
          website: getEnrichmentValue('url') || properties.url || null,
          industry: companyInfo.industry || criteria.industry || null,
          size: companyInfo.employees
            ? `${companyInfo.employees} employees`
            : (getEnrichmentValue('number') ? `${getEnrichmentValue('number')} employees` : criteria.size),
          geography: companyInfo.location || criteria.geography || null,
          description: companyInfo.about || properties.description || null,
          foundedYear: companyInfo.founded || null,
          // Include raw enrichments for full data display
          enrichments: enrichments.map((e: any) => ({
            format: e.format,
            result: e.result,
          })),
        };

        companies.push(companyData);
      } catch (itemError) {
        logError('Error parsing company from webset', itemError, {
          websetId: webset.id,
          item: item,
        });
      }
    }

    logInfo('Webset preview fetched successfully', {
      websetId: webset.id,
      count: companies.length,
      tenantId,
    });

    return NextResponse.json({
      success: true,
      count: companies.length,
      companies,
      totalResults: items.length,
    });
  } catch (error) {
    logError('Error fetching webset preview', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch webset preview',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
