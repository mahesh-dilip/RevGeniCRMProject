import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth/context';
import { requirePermission } from '@/lib/auth/permissions';
import { validateRequest, UpdateCompanySchema } from '@/lib/validations/api';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext();
    requirePermission(authContext, 'VIEW_ALL_DATA');

    const { id } = await params;

    // Verify company belongs to user's tenant
    const company = await prisma.company.findFirst({
      where: { id, tenantId: authContext.tenantId },
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
    const status = error instanceof Error && error.message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch company' },
      { status }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext();
    requirePermission(authContext, 'UPDATE_COMPANY');

    const { id } = await params;
    const data = await validateRequest(request, UpdateCompanySchema);

    // Verify company belongs to user's tenant
    const existingCompany = await prisma.company.findFirst({
      where: { id, tenantId: authContext.tenantId },
    });

    if (!existingCompany) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        name: data.name,
        website: data.website,
        industry: data.industry,
        size: data.size,
        geography: data.geography,
        status: data.status,
        description: data.description,
        foundedYear: data.foundedYear,
        sourceType: data.sourceType,
        sourceQuery: data.sourceQuery,
        confidence: data.confidence,
      },
      include: {
        people: true,
        deals: true,
      },
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    const status = error instanceof Error && error.message.includes('Forbidden') ? 403 : 
                   error instanceof Error && error.message.includes('Validation') ? 400 : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update company' },
      { status }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext();
    requirePermission(authContext, 'DELETE_COMPANY');

    const { id } = await params;

    // Verify company belongs to user's tenant
    const company = await prisma.company.findFirst({
      where: { id, tenantId: authContext.tenantId },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    await prisma.company.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting company:', error);
    const status = error instanceof Error && error.message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete company' },
      { status }
    );
  }
}
