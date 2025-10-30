import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRequest } from '@/lib/middleware/validate';
import { QuickLogEventSchema } from '@/lib/validations/events';
import { logError } from '@/lib/logging';

import { getAuthContext } from '@/lib/auth/context';

export async function POST(request: Request) {
  try {
    // Get authenticated user context
    const { tenantId } = await getAuthContext();

    // Validate request body
    const validation = await validateRequest(request, QuickLogEventSchema);
    if ('error' in validation) {
      return validation.error;
    }

    const data = validation.data;

    const event = await prisma.event.create({
      data: {
        tenantId,
        type: data.type,
        title: data.title,
        description: data.description,
        outcome: data.outcome,
        source: 'manual',
        companyId: data.companyId,
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    logError('Error logging event:', error);
    return NextResponse.json(
      { error: 'Failed to log event' },
      { status: 500 }
    );
  }
}
