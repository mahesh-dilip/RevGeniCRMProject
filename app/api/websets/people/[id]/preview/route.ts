import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logError, logInfo, logWarning } from '@/lib/logging';
import { getAuthContext } from '@/lib/auth/context';
import { ExaWebsetsService } from '@/lib/ai/exa-websets';

/**
 * GET /api/websets/people/[id]/preview
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
    logInfo('Fetching people webset preview from Exa', {
      websetId: webset.id,
      exaId: webset.exaId,
      tenantId,
    });

    const exaService = new ExaWebsetsService();
    const { items } = await exaService.getWebsetResults(webset.exaId);

    if (!items || items.length === 0) {
      logWarning('No results found in completed people webset', {
        websetId: webset.id,
        exaId: webset.exaId,
      });

      return NextResponse.json({
        success: true,
        count: 0,
        people: [],
        message: 'No people found in webset',
      });
    }

    // Parse people data but don't import
    const people = [];
    const criteria = webset.criteria as any;

    for (const item of items) {
      try {
        const properties = (item as any).properties || {};
        const enrichments = (item as any).enrichments || [];

        const getEnrichmentValue = (formatType?: string, index: number = 0): string | null => {
          const enrichment = formatType
            ? enrichments.find((e: any) => e.format === formatType)
            : enrichments[index];
          return enrichment?.result?.[0] || null;
        };

        const personData = {
          exaId: (item as any).id,
          name: getEnrichmentValue('text', 0) || properties.name || 'Unknown',
          email: getEnrichmentValue('email') || null,
          linkedinUrl: getEnrichmentValue('url') || properties.url || null,
          jobTitle: getEnrichmentValue('text', 1) || properties.title || null,
          companyName: properties.company || null,
          location: properties.location || null,
          // Include raw enrichments for full data display
          enrichments: enrichments.map((e: any) => ({
            format: e.format,
            result: e.result,
          })),
        };

        people.push(personData);
      } catch (itemError) {
        logError('Error parsing person from webset', itemError, {
          websetId: webset.id,
          item: item,
        });
      }
    }

    logInfo('People webset preview fetched successfully', {
      websetId: webset.id,
      count: people.length,
      tenantId,
    });

    return NextResponse.json({
      success: true,
      count: people.length,
      people,
      totalResults: items.length,
    });
  } catch (error) {
    logError('Error fetching people webset preview', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch webset preview',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
