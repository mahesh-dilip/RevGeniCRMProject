import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { onEventCreated } from '@/lib/automations/triggers';
import { createGetHandler, createPostHandler } from '@/lib/middleware/api-wrapper';
import { CreateEventSchema } from '@/lib/validations/api';

export const GET = createGetHandler({
  permission: 'VIEW_ALL_DATA',
  handler: async ({ auth, request }) => {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const personId = searchParams.get('personId');
    const dealId = searchParams.get('dealId');
    const type = searchParams.get('type');
    const completed = searchParams.get('completed');

    const where: any = { tenantId: auth.tenantId };
    if (companyId) where.companyId = companyId;
    if (personId) where.personId = personId;
    if (dealId) where.dealId = dealId;
    if (type) where.type = type;
    if (completed !== null && completed !== undefined) {
      where.completed = completed === 'true';
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        person: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        deal: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(events);
  },
});

export const POST = createPostHandler({
  schema: CreateEventSchema,
  permission: 'CREATE_EVENT',
  handler: async (data, { auth }) => {
    const event = await prisma.event.create({
      data: {
        tenantId: auth.tenantId,
        type: data.type,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        completed: data.completed || false,
        source: data.source || 'manual',
        priority: data.priority,
        outcome: data.outcome,
        companyId: data.companyId,
        personId: data.personId,
        dealId: data.dealId,
      },
      include: {
        company: true,
        person: true,
        deal: true,
      },
    });

    // Trigger automations
    if (event.companyId) {
      await onEventCreated(event.id);
    }

    return NextResponse.json(event);
  },
});
