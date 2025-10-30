import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createGetHandler, createPostHandler } from '@/lib/middleware/api-wrapper';
import { CreateSequenceSchema } from '@/lib/validations/api';

export const GET = createGetHandler({
  permission: 'VIEW_ALL_DATA',
  handler: async () => {
    // Note: Sequences are global (not tenant-specific in schema)
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
  },
});

export const POST = createPostHandler({
  schema: CreateSequenceSchema,
  permission: 'CREATE_SEQUENCE',
  handler: async (data) => {
    const sequence = await prisma.emailSequence.create({
      data: {
        name: data.name,
        description: data.description,
        active: data.active !== false,
        pauseOnDealCreation: data.pauseOnDealCreation !== false,
        pauseOnDealStages: data.pauseOnDealStages || ['Demo', 'Proposal'],
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
  },
});
