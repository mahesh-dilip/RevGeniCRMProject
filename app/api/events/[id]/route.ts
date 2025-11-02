import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRequest } from '@/lib/middleware/validate';
import { UpdateEventSchema } from '@/lib/validations/events';
import { logError } from '@/lib/logging';

import { getAuthContext, requireRole } from '@/lib/auth/context';


export const dynamic = 'force-dynamic';
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user context
    const { tenantId } = await getAuthContext();

    const event = await prisma.event.findFirst({
      where: { id: params.id, tenantId },
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
    logError('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
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
    const validation = await validateRequest(request, UpdateEventSchema);
    if ('error' in validation) {
      return validation.error;
    }

    const data = validation.data;

    // Verify event exists and belongs to tenant
    const existingEvent = await prisma.event.findFirst({
      where: { id: params.id, tenantId },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const event = await prisma.event.update({
      where: { id: params.id },
      data: {
        type: data.type,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        completed: data.completed,
        priority: data.priority,
        outcome: data.outcome,
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    logError('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
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

    // Verify event exists and belongs to tenant
    const existingEvent = await prisma.event.findFirst({
      where: { id: params.id, tenantId },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    await prisma.event.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
