import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRequest } from '@/lib/middleware/validate';
import { CreateSequenceSchema } from '@/lib/validations/sequences';
import { logError } from '@/lib/logging';

import { getAuthContext } from '@/lib/auth/context';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get authenticated user context
    const { tenantId } = await getAuthContext();

    const sequences = await prisma.emailSequence.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    return NextResponse.json(sequences);
  } catch (error) {
    logError('Error fetching sequences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sequences' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Get authenticated user context
    const { tenantId } = await getAuthContext();

    // Validate request body
    const validation = await validateRequest(request, CreateSequenceSchema);
    if ('error' in validation) {
      return validation.error;
    }

    const data = validation.data;

    const sequence = await prisma.emailSequence.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        active: data.active !== false,
        pauseOnDealCreation: data.pauseOnDealCreation !== false,
        pauseOnDealStages: data.pauseOnDealStages || ['Demo', 'Proposal'],
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
    logError('Error creating sequence:', error);
    return NextResponse.json(
      { error: 'Failed to create sequence' },
      { status: 500 }
    );
  }
}
