import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { onDealCreated } from '@/lib/automations/triggers';
import { validateRequest } from '@/lib/middleware/validate';
import { CreateDealSchema } from '@/lib/validations/deals';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }

    const deals = await prisma.deal.findMany({
      where,
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
    // Validate request body
    const validation = await validateRequest(request, CreateDealSchema);
    if ('error' in validation) {
      return validation.error;
    }

    const data = validation.data;

    const deal = await prisma.deal.create({
      data: {
        title: data.title,
        value: data.value,
        stage: data.stage || 'Prospecting',
        probability: data.probability,
        closeDate: data.closeDate ? new Date(data.closeDate) : null,
        description: data.description,
        nextAction: data.nextAction,
        companyId: data.companyId,
        primaryContactId: data.primaryContactId,
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
