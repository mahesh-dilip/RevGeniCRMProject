import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { onDealStageChange } from '@/lib/automations/deal-stage-triggers';
import { getAuthContext } from '@/lib/auth/context';
import { requirePermission } from '@/lib/auth/permissions';
import { validateRequest, UpdateDealStageSchema } from '@/lib/validations/api';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext();
    requirePermission(authContext, 'UPDATE_DEAL');

    const { id } = await params;
    const data = await validateRequest(request, UpdateDealStageSchema);

    // Verify deal belongs to user's tenant
    const currentDeal = await prisma.deal.findFirst({
      where: { id, tenantId: authContext.tenantId },
    });

    if (!currentDeal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const updatedDeal = await prisma.deal.update({
      where: { id },
      data: {
        stage: data.stage,
        lostReason: data.lostReason,
        stageChangedAt: new Date(),
      },
      include: {
        company: true,
        primaryContact: true,
      },
    });

    // Trigger stage change automations
    await onDealStageChange(id, currentDeal.stage, data.stage);

    return NextResponse.json(updatedDeal);
  } catch (error) {
    console.error('Error updating deal stage:', error);
    const status = error instanceof Error && error.message.includes('Forbidden') ? 403 : 
                   error instanceof Error && error.message.includes('Validation') ? 400 : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update deal stage' },
      { status }
    );
  }
}
