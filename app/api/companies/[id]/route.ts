import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRequest } from '@/lib/middleware/validate';
import { UpdateCompanySchema } from '@/lib/validations/companies';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: params.id },
      include: {
        people: {
          orderBy: { createdAt: 'desc' },
        },
        deals: {
          orderBy: { createdAt: 'desc' },
        },
        events: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            person: true,
            deal: true,
          },
        },
        _count: {
          select: {
            people: true,
            deals: true,
            events: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate request body
    const validation = await validateRequest(request, UpdateCompanySchema);
    if ('error' in validation) {
      return validation.error;
    }

    const data = validation.data;

    const company = await prisma.company.update({
      where: { id: params.id },
      data: {
        name: data.name,
        website: data.website,
        industry: data.industry,
        size: data.size,
        geography: data.geography,
        status: data.status,
        description: data.description,
        foundedYear: data.foundedYear,
      },
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json(
      { error: 'Failed to update company' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.company.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json(
      { error: 'Failed to delete company' },
      { status: 500 }
    );
  }
}
