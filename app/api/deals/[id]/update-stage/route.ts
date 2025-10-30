import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { onDealStageChange } from '@/lib/automations/deal-stage-triggers';
import { validateRequest } from '@/lib/middleware/validate';
import { logError } from '@/lib/logging';

import { UpdateDealStageSchema } from '@/lib/validations/deals';
import { getAuthContext } from '@/lib/auth/context';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user context
    const { tenantId } = await getAuthContext();

    // Validate request body
    const validation = await validateRequest(request, UpdateDealStageSchema);
    if ('error' in validation) {
      return validation.error;
    }

    const { stage, nextAction, lostReason } = validation.data;

    // Verify deal exists and belongs to tenant
    const currentDeal = await prisma.deal.findFirst({
      where: { id: params.id, tenantId },
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
    logError('Error updating deal stage:', error);
    return NextResponse.json(
      { error: 'Failed to update deal stage' },
      { status: 500 }
    );
  }
}
