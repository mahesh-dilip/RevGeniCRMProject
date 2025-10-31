import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logError, logInfo, logWarning } from '@/lib/logging';
import { getAuthContext } from '@/lib/auth/context';
import { ExaWebsetsService } from '@/lib/ai/exa-websets';
import { checkForDuplicate } from '@/lib/security/duplicate-detection';

/**
 * GET /api/websets/companies/[id]/results
 * Fetch and import results from a completed company webset
 *
 * Security:
 * - Requires authentication (Clerk)
 * - Multi-tenant isolated
 * - Duplicate detection enabled
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
        tenantId, // Multi-tenancy: only show websets from same tenant
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

    // Check if results already imported
    const existingCompanies = await prisma.company.findMany({
      where: {
        websetId: webset.id,
        tenantId,
      },
    });

    if (existingCompanies.length > 0) {
      logInfo('Returning previously imported webset results', {
        websetId: webset.id,
        count: existingCompanies.length,
        tenantId,
      });

      return NextResponse.json({
        success: true,
        count: existingCompanies.length,
        companies: existingCompanies,
        alreadyImported: true,
      });
    }

    // Fetch results from Exa
    logInfo('Fetching webset results from Exa', {
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

    // Import results as Company records
    const createdCompanies = [];
    let skippedDuplicates = 0;

    for (const item of items) {
      try {
        // Extract company data from enrichment results
        const enrichments = (item as any).enrichments || {};

        const companyData = {
          name: enrichments['Company name'] || enrichments['Official company website URL'] || 'Unknown',
          website: enrichments['Official company website URL'] || null,
          industry: enrichments['Primary industry and business model'] || (webset.criteria as any).industry,
          size: enrichments['Number of employees'] || (webset.criteria as any).size,
          geography: enrichments['Company headquarters location with city and country'] || (webset.criteria as any).geography,
          description: enrichments['Company description and what they do'] || null,
          foundedYear: enrichments['Year the company was founded']
            ? parseInt(enrichments['Year the company was founded'])
            : null,
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
            confidence: 0.85, // High confidence for Exa results
          },
        });

        createdCompanies.push(company);
      } catch (itemError) {
        logError('Error importing company from webset', itemError, {
          websetId: webset.id,
          item: item,
        });
        // Continue processing other items
      }
    }

    // Update webset result count
    await prisma.webset.update({
      where: { id: webset.id },
      data: {
        resultCount: createdCompanies.length,
      },
    });

    logInfo('Webset results imported successfully', {
      websetId: webset.id,
      imported: createdCompanies.length,
      skipped: skippedDuplicates,
      total: items.length,
      tenantId,
    });

    return NextResponse.json({
      success: true,
      count: createdCompanies.length,
      companies: createdCompanies,
      skippedDuplicates,
      totalResults: items.length,
    });
  } catch (error) {
    logError('Error fetching webset results', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch webset results',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
