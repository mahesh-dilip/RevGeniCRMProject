import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRequest } from '@/lib/middleware/validate';
import { UpdateSequenceSchema } from '@/lib/validations/sequences';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sequence = await prisma.emailSequence.findUnique({
      where: { id: params.id },
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
    // Validate request body
    const validation = await validateRequest(request, UpdateSequenceSchema);
    if ('error' in validation) {
      return validation.error;
    }

    const data = validation.data;

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
    console.error('Error updating sequence:', error);
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
    await prisma.emailSequence.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Sequence deleted successfully' });
  } catch (error) {
    console.error('Error deleting sequence:', error);
    return NextResponse.json(
      { error: 'Failed to delete sequence' },
      { status: 500 }
    );
  }
}
