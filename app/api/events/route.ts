import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { onEventCreated } from '@/lib/automations/triggers';
import { validateRequest } from '@/lib/middleware/validate';
import { CreateEventSchema } from '@/lib/validations/events';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const personId = searchParams.get('personId');
    const dealId = searchParams.get('dealId');
    const type = searchParams.get('type');
    const completed = searchParams.get('completed');

    const where: any = {};
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
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Validate request body
    const validation = await validateRequest(request, CreateEventSchema);
    if ('error' in validation) {
      return validation.error;
    }

    const data = validation.data;

    const event = await prisma.event.create({
      data: {
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
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
