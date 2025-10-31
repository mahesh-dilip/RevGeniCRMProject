import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logError, logInfo, logWarning } from '@/lib/logging';
import { getAuthContext } from '@/lib/auth/context';
import { ExaWebsetsService } from '@/lib/ai/exa-websets';

/**
 * GET /api/websets/people/[id]/results
 * Fetch and import results from a completed people webset
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
        type: 'person', // Ensure it's a people webset
      },
    });

    if (!webset) {
      return NextResponse.json(
        { error: 'People webset not found or access denied' },
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
    const existingPeople = await prisma.person.findMany({
      where: {
        websetId: webset.id,
        tenantId,
      },
      include: {
        company: true,
      },
    });

    if (existingPeople.length > 0) {
      logInfo('Returning previously imported people webset results', {
        websetId: webset.id,
        count: existingPeople.length,
        tenantId,
      });

      return NextResponse.json({
        success: true,
        count: existingPeople.length,
        people: existingPeople,
        alreadyImported: true,
      });
    }

    // Fetch results from Exa
    logInfo('Fetching people webset results from Exa', {
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

    // Import results as Person records
    const createdPeople = [];
    let skippedDuplicates = 0;
    let skippedNoCompany = 0;
    const criteria = webset.criteria as any;

    for (const item of items) {
      try {
        // Extract person data from enrichment results
        const enrichments = (item as any).enrichments || {};

        const personData = {
          firstName: enrichments['Full name']?.split(' ')[0] || 'Unknown',
          lastName: enrichments['Full name']?.split(' ').slice(1).join(' ') || '',
          email: enrichments['Professional email address'] || enrichments['Email address'] || null,
          phone: enrichments['Phone number'] || null,
          title: enrichments['Current job title'] || null,
          linkedin: enrichments['LinkedIn profile URL'] || null,
          companyName: enrichments['Current company name'] || (criteria.companyNames?.[0]) || null,
        };

        // Skip if no email (critical for deduplication)
        if (!personData.email) {
          logWarning('Skipping person without email', personData);
          skippedNoCompany++;
          continue;
        }

        // Check for duplicate by email
        const existingPerson = await prisma.person.findFirst({
          where: {
            email: personData.email,
            tenantId,
          },
        });

        if (existingPerson) {
          logInfo('Skipping duplicate person from webset', {
            email: personData.email,
            name: `${personData.firstName} ${personData.lastName}`,
          });
          skippedDuplicates++;
          continue;
        }

        // Find or create company for this person
        let company = null;

        if (personData.companyName) {
          // Try to find existing company
          company = await prisma.company.findFirst({
            where: {
              tenantId,
              name: {
                contains: personData.companyName,
                mode: 'insensitive',
              },
            },
          });

          // Create company if it doesn't exist
          if (!company) {
            company = await prisma.company.create({
              data: {
                tenantId,
                name: personData.companyName,
                status: 'Lead',
                sourceType: 'exa_webset',
                sourceQuery: webset.query,
              },
            });

            logInfo('Created company for person', {
              companyName: personData.companyName,
              companyId: company.id,
            });
          }
        } else {
          // If no company name, create a placeholder company
          company = await prisma.company.create({
            data: {
              tenantId,
              name: `Company for ${personData.firstName} ${personData.lastName}`,
              status: 'Lead',
              sourceType: 'exa_webset',
              sourceQuery: webset.query,
            },
          });
        }

        // Create person record
        const person = await prisma.person.create({
          data: {
            tenantId,
            websetId: webset.id,
            companyId: company.id,
            firstName: personData.firstName,
            lastName: personData.lastName,
            email: personData.email,
            phone: personData.phone,
            title: personData.title,
            linkedin: personData.linkedin,
          },
          include: {
            company: true,
          },
        });

        createdPeople.push(person);
      } catch (itemError) {
        logError('Error importing person from webset', itemError, {
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
        resultCount: createdPeople.length,
      },
    });

    logInfo('People webset results imported successfully', {
      websetId: webset.id,
      imported: createdPeople.length,
      skippedDuplicates,
      skippedNoEmail: skippedNoCompany,
      total: items.length,
      tenantId,
    });

    return NextResponse.json({
      success: true,
      count: createdPeople.length,
      people: createdPeople,
      skippedDuplicates,
      skippedNoEmail: skippedNoCompany,
      totalResults: items.length,
    });
  } catch (error) {
    logError('Error fetching people webset results', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch people webset results',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
