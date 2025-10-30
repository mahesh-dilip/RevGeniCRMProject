import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkForDuplicate } from '@/lib/security/duplicate-detection';

export async function POST(request: Request) {
  try {
    const { companies } = await request.json();

    if (!Array.isArray(companies) || companies.length === 0) {
      return NextResponse.json(
        { error: 'No companies provided' },
        { status: 400 }
      );
    }

    let created = 0;
    let skipped = 0;
    const createdCompanies = [];

    for (const company of companies) {
      // Check for duplicates
      const isDuplicate = await checkForDuplicate(company.website, company.name);

      if (isDuplicate) {
        console.log(`⚠️ Skipping duplicate: ${company.name}`);
        skipped++;
        continue;
      }

      // Create company
      const newCompany = await prisma.company.create({
        data: {
          name: company.name,
          website: company.website,
          industry: company.industry,
          size: company.size,
          geography: company.geography,
          description: company.description,
          foundedYear: company.foundedYear,
          confidence: company.confidence,
          status: 'Lead',
          sourceType: 'ai_agent',
          sourceQuery: company.sourceQuery || 'AI Generated'
        }
      });

      createdCompanies.push(newCompany);
      created++;
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      companies: createdCompanies
    });
  } catch (error) {
    console.error('Bulk create error:', error);
    return NextResponse.json(
      { error: 'Failed to create companies' },
      { status: 500 }
    );
  }
}
