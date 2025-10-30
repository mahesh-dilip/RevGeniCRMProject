import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth/context';
import { requirePermission } from '@/lib/auth/permissions';
import { validateRequest, UpdatePersonSchema } from '@/lib/validations/api';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext();
    requirePermission(authContext, 'VIEW_ALL_DATA');

    const { id } = await params;

    // Verify person belongs to user's tenant
    const person = await prisma.person.findFirst({
      where: { id, tenantId: authContext.tenantId },
      include: {
        company: true,
        events: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        primaryDeals: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!person) {
      return NextResponse.json(
        { error: 'Person not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(person);
  } catch (error) {
    console.error('Error fetching person:', error);
    const status = error instanceof Error && error.message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch person' },
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
    requirePermission(authContext, 'UPDATE_PERSON');

    const { id } = await params;
    const data = await validateRequest(request, UpdatePersonSchema);

    // Verify person belongs to user's tenant
    const existingPerson = await prisma.person.findFirst({
      where: { id, tenantId: authContext.tenantId },
    });

    if (!existingPerson) {
      return NextResponse.json(
        { error: 'Person not found' },
        { status: 404 }
      );
    }

    // If companyId is being updated, verify new company belongs to tenant
    if (data.companyId && data.companyId !== existingPerson.companyId) {
      const company = await prisma.company.findFirst({
        where: { id: data.companyId, tenantId: authContext.tenantId },
      });

      if (!company) {
        return NextResponse.json(
          { error: 'Company not found' },
          { status: 404 }
        );
      }
    }

    const person = await prisma.person.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        title: data.title,
        linkedin: data.linkedin,
        companyId: data.companyId,
      },
      include: {
        company: true,
      },
    });

    return NextResponse.json(person);
  } catch (error) {
    console.error('Error updating person:', error);
    const status = error instanceof Error && error.message.includes('Forbidden') ? 403 : 
                   error instanceof Error && error.message.includes('Validation') ? 400 : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update person' },
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
    requirePermission(authContext, 'DELETE_PERSON');

    const { id } = await params;

    // Verify person belongs to user's tenant
    const person = await prisma.person.findFirst({
      where: { id, tenantId: authContext.tenantId },
    });

    if (!person) {
      return NextResponse.json(
        { error: 'Person not found' },
        { status: 404 }
      );
    }

    await prisma.person.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting person:', error);
    const status = error instanceof Error && error.message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete person' },
      { status }
    );
  }
}
