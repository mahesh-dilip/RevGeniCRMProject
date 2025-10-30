import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth/context';

import { logError } from '@/lib/logging';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user context
    const { tenantId } = await getAuthContext();

    // Verify company exists and belongs to tenant
    const company = await prisma.company.findFirst({
      where: { id: params.id, tenantId },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const deal = await prisma.deal.create({
      data: {
        tenantId,
        title: `Deal with ${company.name}`,
        stage: 'Prospecting',
        companyId: company.id,
        stageChangedAt: new Date()
      },
      include: {
        company: true,
      },
    });

    await prisma.company.update({
      where: { id: company.id },
      data: { status: 'Qualified' },
    });

    await prisma.event.create({
      data: {
        tenantId,
        type: 'note',
        title: 'Deal created from lead',
        description: `Converted ${company.name} to a deal opportunity`,
        source: 'manual',
        companyId: company.id,
        dealId: deal.id,
      },
    });

    return NextResponse.json(deal);
  } catch (error) {
    logError('Error converting to deal:', error);
    return NextResponse.json(
      { error: 'Failed to convert to deal' },
      { status: 500 }
    );
  }
}
