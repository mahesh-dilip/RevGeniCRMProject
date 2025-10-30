import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { onDealCreated } from '@/lib/automations/triggers';

export async function GET() {
  try {
    const deals = await prisma.deal.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        company: true,
        primaryContact: true,
      },
    });

    return NextResponse.json(deals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deals' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const deal = await prisma.deal.create({
      data: {
        title: body.title,
        value: body.value,
        stage: body.stage || 'Prospecting',
        probability: body.probability,
        closeDate: body.closeDate ? new Date(body.closeDate) : null,
        description: body.description,
        nextAction: body.nextAction,
        companyId: body.companyId,
        primaryContactId: body.primaryContactId,
        stageChangedAt: new Date()
      },
      include: {
        company: true,
        primaryContact: true,
      },
    });

    // Create initial event
    await prisma.event.create({
      data: {
        type: 'note',
        title: `Deal created in ${deal.stage} stage`,
        description: `New deal "${deal.title}" created with ${deal.company.name}`,
        source: 'automation',
        companyId: deal.companyId,
        dealId: deal.id,
      },
    });

    // Trigger automations
    await onDealCreated(deal.id);

    return NextResponse.json(deal);
  } catch (error) {
    console.error('Error creating deal:', error);
    return NextResponse.json(
      { error: 'Failed to create deal' },
      { status: 500 }
    );
  }
}
