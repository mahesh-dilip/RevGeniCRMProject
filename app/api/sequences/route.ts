import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const sequences = await prisma.emailSequence.findMany({
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
    console.error('Error fetching sequences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sequences' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const sequence = await prisma.emailSequence.create({
      data: {
        name: body.name,
        description: body.description,
        active: body.active !== false,
        pauseOnDealCreation: body.pauseOnDealCreation !== false,
        pauseOnDealStages: body.pauseOnDealStages || ['Demo', 'Proposal'],
        steps: {
          create: body.steps?.map((step: any, index: number) => ({
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
    console.error('Error creating sequence:', error);
    return NextResponse.json(
      { error: 'Failed to create sequence' },
      { status: 500 }
    );
  }
}
