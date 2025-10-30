import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRequest } from '@/lib/middleware/validate';
import { CreateCompanySchema } from '@/lib/validations/companies';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includePeople = searchParams.get('includePeople') === 'true';

    const companies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        ...(includePeople && { people: true }),
        _count: {
          select: {
            deals: true,
            people: true,
          },
        },
      },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Validate request body
    const validation = await validateRequest(request, CreateCompanySchema);
    if ('error' in validation) {
      return validation.error;
    }

    const data = validation.data;

    const company = await prisma.company.create({
      data: {
        name: data.name,
        website: data.website,
        industry: data.industry,
        size: data.size,
        geography: data.geography,
        status: data.status || 'Lead',
        description: data.description,
        foundedYear: data.foundedYear,
        sourceType: data.sourceType || 'manual',
        sourceQuery: data.sourceQuery,
        confidence: data.confidence,
      },
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json(
      { error: 'Failed to create company' },
      { status: 500 }
    );
  }
}
