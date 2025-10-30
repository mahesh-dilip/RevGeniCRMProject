import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRequest } from '@/lib/middleware/validate';
import { UpdateSequenceSchema } from '@/lib/validations/sequences';
import { logError } from '@/lib/logging';

import { getAuthContext, requireRole } from '@/lib/auth/context';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user context
    const { tenantId } = await getAuthContext();

    const sequence = await prisma.emailSequence.findFirst({
      where: { id: params.id, tenantId },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
    });

    if (!sequence) {
      return NextResponse.json(
        { error: 'Sequence not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(sequence);
  } catch (error) {
    logError('Error fetching sequence:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sequence' },
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
    const validation = await validateRequest(request, UpdateSequenceSchema);
    if ('error' in validation) {
      return validation.error;
    }

    const data = validation.data;

    // Verify sequence exists and belongs to tenant
    const existingSequence = await prisma.emailSequence.findFirst({
      where: { id: params.id, tenantId },
    });

    if (!existingSequence) {
      return NextResponse.json(
        { error: 'Sequence not found' },
        { status: 404 }
      );
    }

    // Delete existing steps
    await prisma.emailSequenceStep.deleteMany({
      where: { sequenceId: params.id },
    });

    // Update sequence with new steps
    const sequence = await prisma.emailSequence.update({
      where: { id: params.id },
      data: {
        name: data.name,
        description: data.description,
        active: data.active,
        pauseOnDealCreation: data.pauseOnDealCreation,
        pauseOnDealStages: data.pauseOnDealStages || [],
        steps: {
          create: data.steps?.map((step, index: number) => ({
            stepOrder: index + 1,
            delayDays: step.delayDays,
            subject: step.subject,
            body: step.body,
          })),
        },
      },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
    });

    return NextResponse.json(sequence);
  } catch (error) {
    logError('Error updating sequence:', error);
    return NextResponse.json(
      { error: 'Failed to update sequence' },
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

    // Verify sequence exists and belongs to tenant
    const existingSequence = await prisma.emailSequence.findFirst({
      where: { id: params.id, tenantId },
    });

    if (!existingSequence) {
      return NextResponse.json(
        { error: 'Sequence not found' },
        { status: 404 }
      );
    }

    await prisma.emailSequence.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Sequence deleted successfully' });
  } catch (error) {
    logError('Error deleting sequence:', error);
    return NextResponse.json(
      { error: 'Failed to delete sequence' },
      { status: 500 }
    );
  }
}
