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
    const criteria = webset.criteria as any;

    // Log initial stats
    logInfo('Starting to process people webset items', {
      websetId: webset.id,
      totalItems: items.length,
      tenantId,
    });

    // OPTIMIZATION: Extract all person data first, then batch database operations
    const extractedPeople = [];
    let skippedNoLinkedIn = 0;

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
          if (index < 3) {
            logWarning('Skipping person without LinkedIn URL', {
              personName: `${personData.firstName} ${personData.lastName}`,
              hasEmail: !!personData.email,
              hasPhone: !!personData.phone,
              hasTitle: !!personData.title,
              itemIndex: index + 1,
            });
          }
          skippedNoLinkedIn++;
          continue;
        }

        // Normalize company name to string
        let companyNameString: string | null = null;
        if (personData.companyName) {
          if (typeof personData.companyName === 'string') {
            companyNameString = personData.companyName;
          } else if (typeof personData.companyName === 'object' && personData.companyName.name) {
            companyNameString = personData.companyName.name;
          }
        }

        // Add to extracted people array
        extractedPeople.push({
          firstName: personData.firstName,
          lastName: personData.lastName,
          email: personData.email,
          phone: personData.phone,
          title: personData.title,
          linkedin: personData.linkedin,
          companyName: companyNameString,
        });

        // Log first few extractions
        if (extractedPeople.length <= 3) {
          logInfo('Successfully extracted person data', {
            personName: `${personData.firstName} ${personData.lastName}`,
            linkedin: personData.linkedin,
            company: companyNameString,
            itemIndex: index + 1,
          });
        }
      } catch (itemError) {
        logError('Error extracting person from webset', itemError, {
          websetId: webset.id,
          itemIndex: index + 1,
          itemPreview: JSON.stringify(item).substring(0, 200),
        });
        // Continue processing other items
      }
    }

    // OPTIMIZATION: Now do batch database operations
    logInfo('Finished extraction, starting batch operations', {
      extractedCount: extractedPeople.length,
      skippedNoLinkedIn,
    });

    // Batch check for existing people by LinkedIn URLs
    const linkedinUrls = extractedPeople.map(p => p.linkedin).filter(Boolean);
    const existingPeopleByLinkedIn = await prisma.person.findMany({
      where: {
        linkedin: { in: linkedinUrls },
        tenantId,
      },
      select: { linkedin: true },
    });
    const existingLinkedInSet = new Set(existingPeopleByLinkedIn.map(p => p.linkedin));

    // Batch fetch all companies by names
    const companyNames = Array.from(new Set(extractedPeople.map(p => p.companyName).filter(Boolean) as string[]));
    const existingCompanies = await prisma.company.findMany({
      where: {
        name: { in: companyNames },
        tenantId,
      },
      select: { id: true, name: true },
    });
    const companyMap = new Map(existingCompanies.map(c => [c.name.toLowerCase(), c.id]));

    // Create missing companies in batch
    const missingCompanyNames = companyNames.filter(name => !companyMap.has(name!.toLowerCase()));
    if (missingCompanyNames.length > 0) {
      const newCompanies = await prisma.company.createManyAndReturn({
        data: missingCompanyNames.map(name => ({
          tenantId,
          name: name!,
          status: 'Lead',
          sourceType: 'exa_webset',
          sourceQuery: webset.query,
        })),
      });
      newCompanies.forEach(c => companyMap.set(c.name.toLowerCase(), c.id));

      logInfo('Created missing companies in batch', {
        count: newCompanies.length,
      });
    }

    // Filter out duplicates and prepare for batch creation
    let skippedDuplicates = 0;
    const peopleToCreate = extractedPeople
      .filter(p => {
        if (existingLinkedInSet.has(p.linkedin)) {
          skippedDuplicates++;
          return false;
        }
        return true;
      })
      .map(p => {
        const companyId = p.companyName ? companyMap.get(p.companyName.toLowerCase()) : null;
        return {
          tenantId,
          websetId: webset.id,
          companyId: companyId || null,
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
          phone: p.phone,
          title: p.title,
          linkedin: p.linkedin,
        };
      })
      .filter((p): p is typeof p & { companyId: string } => p.companyId !== null);

    // Batch create all people
    let createdPeople: any[] = [];
    if (peopleToCreate.length > 0) {
      const createdPeopleResult = await prisma.person.createManyAndReturn({
        data: peopleToCreate,
        include: {
          company: true,
        },
      });
      createdPeople = createdPeopleResult;

      logInfo('Created people in batch', {
        count: createdPeople.length,
      });
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
