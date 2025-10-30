import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { onDealStageChange } from '@/lib/automations/deal-stage-triggers';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { stage, nextAction, lostReason } = await request.json();

    const currentDeal = await prisma.deal.findUnique({
      where: { id: params.id },
    });

    if (!currentDeal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const updatedDeal = await prisma.deal.update({
      where: { id: params.id },
      data: {
        stage,
        nextAction,
        lostReason,
        stageChangedAt: new Date(),
      },
      include: {
        company: true,
        primaryContact: true,
      },
    });

    await onDealStageChange(params.id, currentDeal.stage, stage);

    return NextResponse.json(updatedDeal);
  } catch (error) {
    console.error('Error updating deal stage:', error);
    return NextResponse.json(
      { error: 'Failed to update deal stage' },
      { status: 500 }
    );
  }
}
