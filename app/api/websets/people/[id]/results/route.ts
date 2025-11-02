import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logError, logInfo, logWarning } from '@/lib/logging';
import { getAuthContext } from '@/lib/auth/context';
import { ExaWebsetsService } from '@/lib/ai/exa-websets';


export const dynamic = 'force-dynamic';
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
    let skippedNoLinkedIn = 0;
    const criteria = webset.criteria as any;

    // Log initial stats
    logInfo('Starting to process people webset items', {
      websetId: webset.id,
      totalItems: items.length,
      tenantId,
    });

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      try {
        // Extract person data from Exa response
        // Exa returns enrichments as an array of objects with result arrays
        const properties = (item as any).properties || {};
        const personInfo = properties.person || {};
        const enrichments = (item as any).enrichments || [];

        // Log detailed info for first 3 items to understand structure
        if (index < 3) {
          logInfo('Sample people webset item structure', {
            index: index + 1,
            hasProperties: !!properties,
            propertiesKeys: Object.keys(properties),
            hasPersonInfo: !!personInfo,
            personInfoKeys: personInfo ? Object.keys(personInfo) : [],
            enrichmentCount: enrichments.length,
            enrichmentFormats: enrichments.map((e: any) => e.format),
            enrichmentDescriptions: enrichments.map((e: any) => ({
              format: e.format,
              hasResult: !!e.result?.[0],
              resultPreview: e.result?.[0]?.substring(0, 80),
            })),
          });
        }

        // Helper to get enrichment result by matching common patterns in the result
        const getEnrichmentByFormat = (formatType: string): string | null => {
          const enrichment = enrichments.find((e: any) => e.format === formatType);
          return enrichment?.result?.[0] || null;
        };

        // Helper to find LinkedIn URL from enrichments (check URL format and verify it's LinkedIn)
        const getLinkedInUrl = (): string | null => {
          // First check personInfo
          if (personInfo.linkedin) {
            return personInfo.linkedin;
          }
          
          // Check URL format enrichments for LinkedIn URLs
          const urlEnrichment = enrichments.find((e: any) => {
            if (e.format === 'url' && e.result?.[0]) {
              const url = e.result[0].toLowerCase();
              return url.includes('linkedin.com');
            }
            return false;
          });
          
          return urlEnrichment?.result?.[0] || null;
        };

        // Get enrichment values - Exa enrichments are in array format
        const fullName = getEnrichmentByFormat('text') || personInfo.name || 'Unknown';
        const nameParts = fullName.split(' ');
        
        // Extract company name - can be in enrichments (text format) or personInfo.company (object or string)
        // From logs: enrichments structure is [name, location, email, phone, url, company, title, ...]
        // Company is typically at enrichments[5] when filtered by text format it's at index 2
        const textEnrichments = enrichments.filter((e: any) => e.format === 'text');
        const companyFromEnrichment = textEnrichments.length >= 3 
          ? textEnrichments[2]?.result?.[0] // Index 2 is company (0=name, 1=location, 2=company)
          : null;
        
        // Handle personInfo.company - could be object or string
        // From logs: personInfo.company appears to be an object with { name, location } structure
        let companyFromPersonInfo: string | null = null;
        if (personInfo.company) {
          if (typeof personInfo.company === 'string') {
            companyFromPersonInfo = personInfo.company;
          } else if (typeof personInfo.company === 'object') {
            // Handle both { name: "..." } and potentially nested structures
            companyFromPersonInfo = personInfo.company.name || 
                                   (personInfo.company as any).companyName ||
                                   null;
          }
        }
        
        const personData = {
          firstName: nameParts[0] || 'Unknown',
          lastName: nameParts.slice(1).join(' ') || '',
          email: getEnrichmentByFormat('email') || personInfo.email || null,
          phone: enrichments.find((e: any) => e.format === 'phone_number' || e.format === 'text' && e.result?.[0]?.includes('+'))?.result?.[0] || null,
          title: personInfo.position || personInfo.title || enrichments.find((e: any) => e.result?.[0]?.toLowerCase()?.includes('engineer') || e.result?.[0]?.toLowerCase()?.includes('manager'))?.result?.[0] || null,
          linkedin: getLinkedInUrl(),
          companyName: companyFromPersonInfo || companyFromEnrichment || (criteria.companyNames?.[0]) || null,
        };

        // Skip if no LinkedIn URL (critical for deduplication)
        if (!personData.linkedin) {
          logWarning('Skipping person without LinkedIn URL', {
            personName: `${personData.firstName} ${personData.lastName}`,
            hasEmail: !!personData.email,
            hasPhone: !!personData.phone,
            hasTitle: !!personData.title,
            enrichmentCount: enrichments.length,
            enrichmentFormats: enrichments.map((e: any) => e.format),
            urlEnrichments: enrichments
              .filter((e: any) => e.format === 'url')
              .map((e: any) => e.result?.[0]),
            personInfoKeys: personInfo ? Object.keys(personInfo) : [],
            itemIndex: index + 1,
            totalItems: items.length,
          });
          skippedNoLinkedIn++;
          continue;
        }

        // Check for duplicate by LinkedIn URL
        const existingPerson = await prisma.person.findFirst({
          where: {
            linkedin: personData.linkedin,
            tenantId,
          },
        });

        if (existingPerson) {
          logInfo('Skipping duplicate person from webset', {
            linkedin: personData.linkedin,
            name: `${personData.firstName} ${personData.lastName}`,
          });
          skippedDuplicates++;
          continue;
        }

        // Find or create company for this person
        let company = null;

        // Ensure companyName is a string (handle edge cases where it might still be an object)
        let companyNameString: string | null = null;
        if (personData.companyName) {
          if (typeof personData.companyName === 'string') {
            companyNameString = personData.companyName;
          } else if (typeof personData.companyName === 'object' && personData.companyName.name) {
            companyNameString = personData.companyName.name;
          }
        }

        if (companyNameString) {
          // Try to find existing company
          company = await prisma.company.findFirst({
            where: {
              tenantId,
              name: {
                contains: companyNameString,
                mode: 'insensitive',
              },
            },
          });

          // Create company if it doesn't exist
          if (!company) {
            company = await prisma.company.create({
              data: {
                tenantId,
                name: companyNameString,
                status: 'Lead',
                sourceType: 'exa_webset',
                sourceQuery: webset.query,
              },
            });

            logInfo('Created company for person', {
              companyName: companyNameString,
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
        
        // Log successful import for first few
        if (createdPeople.length <= 3) {
          logInfo('Successfully imported person from webset', {
            personName: `${personData.firstName} ${personData.lastName}`,
            linkedin: personData.linkedin,
            company: personData.companyName,
            itemIndex: index + 1,
          });
        }
      } catch (itemError) {
        logError('Error importing person from webset', itemError, {
          websetId: webset.id,
          itemIndex: index + 1,
          itemPreview: JSON.stringify(item).substring(0, 200),
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
      skippedNoLinkedIn,
      skippedTotal: skippedDuplicates + skippedNoLinkedIn,
      totalItems: items.length,
      successRate: items.length > 0 ? `${((createdPeople.length / items.length) * 100).toFixed(1)}%` : '0%',
      tenantId,
    });

    return NextResponse.json({
      success: true,
      count: createdPeople.length,
      people: createdPeople,
      skippedDuplicates,
      skippedNoLinkedIn,
      skippedTotal: skippedDuplicates + skippedNoLinkedIn,
      totalResults: items.length,
      successRate: items.length > 0 ? `${((createdPeople.length / items.length) * 100).toFixed(1)}%` : '0%',
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
