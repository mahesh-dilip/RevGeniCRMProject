import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth/context';
import { requirePermission } from '@/lib/auth/permissions';
import { validateRequest, UpdateSequenceSchema } from '@/lib/validations/api';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext();
    requirePermission(authContext, 'VIEW_ALL_DATA');

    const { id } = await params;

    const sequence = await prisma.emailSequence.findUnique({
      where: { id },
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
    console.error('Error fetching sequence:', error);
    const status = error instanceof Error && error.message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch sequence' },
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
    requirePermission(authContext, 'UPDATE_SEQUENCE');

    const { id } = await params;
    const data = await validateRequest(request, UpdateSequenceSchema);

    // Verify sequence exists
    const existingSequence = await prisma.emailSequence.findUnique({
      where: { id },
    });

    if (!existingSequence) {
      return NextResponse.json(
        { error: 'Sequence not found' },
        { status: 404 }
      );
    }

    // Delete existing steps
    await prisma.emailSequenceStep.deleteMany({
      where: { sequenceId: id },
    });

    // Update sequence with new steps
    const sequence = await prisma.emailSequence.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        active: data.active,
        pauseOnDealCreation: data.pauseOnDealCreation,
        pauseOnDealStages: data.pauseOnDealStages || [],
        steps: {
          create: data.steps?.map((step, index) => ({
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
    console.error('Error updating sequence:', error);
    const status = error instanceof Error && error.message.includes('Forbidden') ? 403 : 
                   error instanceof Error && error.message.includes('Validation') ? 400 : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update sequence' },
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
    requirePermission(authContext, 'DELETE_SEQUENCE');

    const { id } = await params;

    // Verify sequence exists
    const sequence = await prisma.emailSequence.findUnique({
      where: { id },
    });

    if (!sequence) {
      return NextResponse.json(
        { error: 'Sequence not found' },
        { status: 404 }
      );
    }

    await prisma.emailSequence.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Sequence deleted successfully' });
  } catch (error) {
    console.error('Error deleting sequence:', error);
    const status = error instanceof Error && error.message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete sequence' },
      { status }
    );
  }
}
