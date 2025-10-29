import { prisma } from '@/lib/prisma';
import { addDays } from 'date-fns';
import { pauseCompanySequences, resumeCompanySequences } from './sequence-rules';

export async function onDealStageChange(
  dealId: string,
  oldStage: string,
  newStage: string
) {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { company: true },
  });

  if (!deal) return;

  console.log(`🔄 Deal stage changed: ${oldStage} → ${newStage}`);

  await prisma.deal.update({
    where: { id: dealId },
    data: { stageChangedAt: new Date() },
  });

  await prisma.event.create({
    data: {
      type: 'note',
      title: `Deal moved to ${newStage}`,
      description: `Deal stage changed from ${oldStage} to ${newStage}`,
      source: 'automation',
      companyId: deal.companyId,
      dealId: dealId,
    },
  });

  switch (newStage) {
    case 'Demo':
      await handleDemoStage(deal);
      break;
    case 'Proposal':
      await handleProposalStage(deal);
      break;
    case 'Won':
      await handleWonStage(deal);
      break;
    case 'Lost':
      await handleLostStage(deal);
      break;
  }
}

async function handleDemoStage(deal: any) {
  await pauseCompanySequences(deal.companyId, 'Deal moved to Demo stage');

  await prisma.event.create({
    data: {
      type: 'task',
      title: 'Prepare demo environment',
      description: 'Set up demo for client presentation',
      priority: 'high',
      source: 'automation',
      dueDate: addDays(new Date(), 1),
      companyId: deal.companyId,
      dealId: deal.id,
    },
  });

  await prisma.deal.update({
    where: { id: deal.id },
    data: { nextAction: 'Schedule and conduct product demo' },
  });
}

async function handleProposalStage(deal: any) {
  await pauseCompanySequences(deal.companyId, 'Deal in Proposal stage');

  await prisma.event.create({
    data: {
      type: 'task',
      title: 'Follow up on proposal',
      description: 'Check if client has reviewed the proposal',
      priority: 'high',
      source: 'automation',
      dueDate: addDays(new Date(), 3),
      companyId: deal.companyId,
      dealId: deal.id,
    },
  });

  await prisma.deal.update({
    where: { id: deal.id },
    data: { nextAction: 'Follow up on proposal within 3 days' },
  });
}

async function handleWonStage(deal: any) {
  await prisma.sequenceEnrollment.updateMany({
    where: {
      companyId: deal.companyId,
      status: { in: ['active', 'paused'] },
    },
    data: {
      status: 'completed',
      completedAt: new Date(),
    },
  });

  await prisma.company.update({
    where: { id: deal.companyId },
    data: { status: 'Customer' },
  });

  await prisma.event.create({
    data: {
      type: 'note',
      title: '🎉 Deal Won!',
      description: `Successfully closed deal worth $${deal.value || 0}`,
      source: 'automation',
      companyId: deal.companyId,
      dealId: deal.id,
    },
  });
}

async function handleLostStage(deal: any) {
  await resumeCompanySequences(deal.companyId);

  await prisma.event.create({
    data: {
      type: 'note',
      title: 'Deal marked as Lost',
      description: deal.lostReason || 'No reason specified',
      source: 'automation',
      companyId: deal.companyId,
      dealId: deal.id,
    },
  });
}
