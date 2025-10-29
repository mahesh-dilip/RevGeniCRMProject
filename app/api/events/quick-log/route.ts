import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const event = await prisma.event.create({
      data: {
        type: body.type,
        title: body.title,
        description: body.description,
        outcome: body.outcome,
        source: 'manual',
        companyId: body.companyId,
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error logging event:', error);
    return NextResponse.json(
      { error: 'Failed to log event' },
      { status: 500 }
    );
  }
}
