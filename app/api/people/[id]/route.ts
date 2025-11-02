import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRequest } from '@/lib/middleware/validate';
import { UpdatePersonSchema } from '@/lib/validations/people';
import { logError } from '@/lib/logging';

import { getAuthContext, requireRole } from '@/lib/auth/context';


export const dynamic = 'force-dynamic';
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user context
    const { tenantId } = await getAuthContext();

    const person = await prisma.person.findFirst({
      where: { id: params.id, tenantId },
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
    logError('Error fetching person:', error);
    return NextResponse.json(
      { error: 'Failed to fetch person' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user context
    const { tenantId } = await getAuthContext();

    // Validate request body
    const validation = await validateRequest(request, UpdatePersonSchema);
    if ('error' in validation) {
      return validation.error;
    }

    const data = validation.data;

    // Verify person exists and belongs to tenant
    const existingPerson = await prisma.person.findFirst({
      where: { id: params.id, tenantId },
    });

    if (!existingPerson) {
      return NextResponse.json(
        { error: 'Person not found' },
        { status: 404 }
      );
    }

    const person = await prisma.person.update({
      where: { id: params.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        title: data.title,
        linkedin: data.linkedin,
      },
    });

    return NextResponse.json(person);
  } catch (error) {
    logError('Error updating person:', error);
    return NextResponse.json(
      { error: 'Failed to update person' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user context and check permissions
    const { tenantId, role } = await getAuthContext();
    requireRole(role, 'MANAGER'); // Deleting requires MANAGER role or higher

    // Verify person exists and belongs to tenant
    const existingPerson = await prisma.person.findFirst({
      where: { id: params.id, tenantId },
    });

    if (!existingPerson) {
      return NextResponse.json(
        { error: 'Person not found' },
        { status: 404 }
      );
    }

    await prisma.person.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError('Error deleting person:', error);
    return NextResponse.json(
      { error: 'Failed to delete person' },
      { status: 500 }
    );
  }
}
