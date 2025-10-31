import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logError, logInfo } from '@/lib/logging';
import { getAuthContext } from '@/lib/auth/context';
import { ExaWebsetsService } from '@/lib/ai/exa-websets';
import { checkForDuplicate } from '@/lib/security/duplicate-detection';
import { z } from 'zod';

const importSchema = z.object({
  selectedIds: z.array(z.string()).min(1, 'At least one person must be selected'),
});

/**
 * POST /api/websets/people/[id]/import
 * Import selected people from webset results
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
    logInfo('Importing selected people from webset', {
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

    // Import selected people
    const createdPeople = [];
    let skippedDuplicates = 0;
    let skippedNoLinkedIn = 0;
    let skippedNoCompanyMatch = 0;
    const criteria = webset.criteria as any;
    const searchedCompany = criteria?.companyNames?.[0] || '';

    // Log first item to understand structure
    if (selectedItems.length > 0) {
      logInfo('Sample selected item structure', {
        properties: (selectedItems[0] as any).properties,
        enrichments: (selectedItems[0] as any).enrichments,
        searchedCompany,
      });
    }

    // Fuzzy company name matching function
    const companiesMatch = (company1: string | null, company2: string | null): boolean => {
      if (!company1 || !company2) return false;

      const normalize = (str: string) => str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      const c1 = normalize(company1);
      const c2 = normalize(company2);

      // Exact match after normalization
      if (c1 === c2) return true;

      // One contains the other (handles cases like "Acin" vs "Acin Inc")
      if (c1.includes(c2) || c2.includes(c1)) return true;

      return false;
    };

    for (const item of selectedItems) {
      try {
        const properties = (item as any).properties || {};
        const enrichments = (item as any).enrichments || [];
        const personProps = properties.person || {};

        // Extract data from person object and enrichments
        // Enrichments are in order: [name, email, linkedin, company, job title, location]
        const textEnrichments = enrichments.filter((e: any) => e.format === 'text');
        const emailEnrichment = enrichments.find((e: any) => e.format === 'email');
        const urlEnrichments = enrichments.filter((e: any) => e.format === 'url');

        const personName = personProps.name || textEnrichments[0]?.result?.[0] || 'Unknown';
        const email = emailEnrichment?.result?.[0] || null;
        const linkedinUrl = properties.url || urlEnrichments[0]?.result?.[0] || null;
        const companyName = personProps.company?.name || textEnrichments[1]?.result?.[0] || null;
        const jobTitle = personProps.position || textEnrichments[2]?.result?.[0] || null;
        const location = personProps.location || textEnrichments[3]?.result?.[0] || null;

        const personData = {
          name: personName,
          email: email,
          linkedinUrl: linkedinUrl,
          jobTitle: jobTitle,
          companyName: companyName,
          location: location,
        };

        logInfo('Extracted person data from webset', {
          personData,
          searchedCompany,
        });

        // Skip if company doesn't match the searched company
        if (searchedCompany && !companiesMatch(personData.companyName, searchedCompany)) {
          logInfo('Skipping person - company name does not match', {
            name: personData.name,
            extractedCompany: personData.companyName,
            searchedCompany: searchedCompany,
          });
          skippedNoCompanyMatch++;
          continue;
        }

        // Skip if no LinkedIn URL (required for deduplication)
        if (!personData.linkedinUrl) {
          logInfo('Skipping person without LinkedIn URL', {
            name: personData.name,
          });
          skippedNoLinkedIn++;
          continue;
        }

        // Check for duplicates using LinkedIn URL
        const existingPerson = await prisma.person.findFirst({
          where: {
            linkedin: personData.linkedinUrl,
            tenantId,
          },
        });

        if (existingPerson) {
          logInfo('Skipping duplicate person from webset', {
            name: personData.name,
            linkedinUrl: personData.linkedinUrl,
          });
          skippedDuplicates++;
          continue;
        }

        // Parse name into firstName and lastName
        const nameParts = personData.name.trim().split(' ');
        const firstName = nameParts[0] || 'Unknown';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Try to find existing company by name
        let companyId = null;
        if (personData.companyName) {
          const existingCompany = await prisma.company.findFirst({
            where: {
              name: personData.companyName,
              tenantId,
            },
          });

          if (existingCompany) {
            companyId = existingCompany.id;
          } else {
            // Create a basic company record for this person
            const newCompany = await prisma.company.create({
              data: {
                tenantId,
                name: personData.companyName,
                status: 'Lead',
                sourceType: 'exa_webset',
                sourceQuery: webset.query,
              },
            });
            companyId = newCompany.id;
          }
        }

        // Skip if no company could be found or created
        if (!companyId) {
          logInfo('Skipping person without company', {
            name: personData.name,
          });
          continue;
        }

        // Create person record
        const person = await prisma.person.create({
          data: {
            tenantId,
            websetId: webset.id,
            companyId,
            firstName,
            lastName,
            email: personData.email,
            linkedin: personData.linkedinUrl,
            title: personData.jobTitle,
          },
        });

        createdPeople.push(person);
      } catch (itemError) {
        logError('Error importing person from webset', itemError, {
          websetId: webset.id,
          item: item,
        });
      }
    }

    // Update webset result count
    await prisma.webset.update({
      where: { id: webset.id },
      data: {
        resultCount: createdPeople.length,
      },
    });

    logInfo('Selected people imported successfully', {
      websetId: webset.id,
      imported: createdPeople.length,
      skippedDuplicates,
      skippedNoLinkedIn,
      skippedNoCompanyMatch,
      selected: selectedIds.length,
      tenantId,
    });

    return NextResponse.json({
      success: true,
      count: createdPeople.length,
      people: createdPeople,
      skippedDuplicates,
      skippedNoLinkedIn,
      skippedNoCompanyMatch,
    });
  } catch (error) {
    logError('Error importing selected people', error);
    return NextResponse.json(
      {
        error: 'Failed to import selected people',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
