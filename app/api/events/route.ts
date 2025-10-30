import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    const body = await request.json();

    const event = await prisma.event.create({
      data: {
        type: body.type,
        title: body.title,
        description: body.description,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        completed: body.completed || false,
        source: body.source || 'manual',
        priority: body.priority,
        outcome: body.outcome,
        companyId: body.companyId,
        personId: body.personId,
        dealId: body.dealId,
      },
      include: {
        company: true,
        person: true,
        deal: true,
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
