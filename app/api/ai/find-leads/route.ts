import { NextResponse } from 'next/server';
import { findLeads } from '@/lib/ai/lead-finder';
import { prisma } from '@/lib/prisma';
import { checkForDuplicate } from '@/lib/security/duplicate-detection';
import { validateRequest } from '@/lib/middleware/validate';
import { FindLeadsSchema } from '@/lib/validations/ai';

export async function POST(request: Request) {
  try {
    // Validate request body
    const validation = await validateRequest(request, FindLeadsSchema);
    if ('error' in validation) {
      return validation.error;
    }

    const {
      industry,
      geography,
      size,
      additionalContext,
      maxResults,
      autoCreate,
    } = validation.data;

    console.log('🤖 Starting AI lead generation...');
    const leads = await findLeads(
      { industry, geography, size, additionalContext },
      maxResults
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

    if (autoCreate) {
      for (const lead of leads) {
        const duplicate = await checkForDuplicate(lead.website, lead.name);

        if (duplicate) {
          console.log(`⚠️ Skipping duplicate: ${lead.name}`);
          skippedDuplicates++;
          continue;
        }

        const company = await prisma.company.create({
          data: {
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
            sourceQuery: `${industry} in ${geography} with ${size}`,
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
      count: autoCreate ? createdCompanies.length : leads.length,
      companies: autoCreate ? createdCompanies : leads,
      skippedDuplicates: skippedDuplicates,
    });
  } catch (error) {
    console.error('❌ AI lead generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate leads',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
