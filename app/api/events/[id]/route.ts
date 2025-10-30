import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth/context';
import { requirePermission } from '@/lib/auth/permissions';
import { validateRequest, UpdateEventSchema } from '@/lib/validations/api';
import { z } from 'zod';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext();
    requirePermission(authContext, 'VIEW_ALL_DATA');

    const { id } = await params;

    // Verify event belongs to user's tenant
    const event = await prisma.event.findFirst({
      where: { id, tenantId: authContext.tenantId },
      include: {
        company: true,
        person: true,
        deal: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    const status = error instanceof Error && error.message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch event' },
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
    requirePermission(authContext, 'UPDATE_EVENT');

    const { id } = await params;
    const data: z.infer<typeof UpdateEventSchema> = await validateRequest(request, UpdateEventSchema);

    // Verify event belongs to user's tenant
    const existingEvent = await prisma.event.findFirst({
      where: { id, tenantId: authContext.tenantId },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        completed: data.completed,
        priority: data.priority,
        outcome: data.outcome,
      },
      include: {
        company: true,
        person: true,
        deal: true,
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    const status = error instanceof Error && error.message.includes('Forbidden') ? 403 : 
                   error instanceof Error && error.message.includes('Validation') ? 400 : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update event' },
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
    requirePermission(authContext, 'DELETE_EVENT');

    const { id } = await params;

    // Verify event belongs to user's tenant
    const event = await prisma.event.findFirst({
      where: { id, tenantId: authContext.tenantId },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    const status = error instanceof Error && error.message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete event' },
      { status }
    );
  }
}
