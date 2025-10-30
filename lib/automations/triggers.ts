import { prisma } from '@/lib/prisma';
import { updateCompanyLeadScore } from '@/lib/scoring/lead-scoring';
import { updateLifecycleStage } from '@/lib/automations/lifecycle-progression';

export async function onCompanyUpdate(companyId: string) {
  // Update lead score
  await updateCompanyLeadScore(companyId);

  // Update lifecycle stage
  await updateLifecycleStage(companyId);
}

export async function onDealCreated(dealId: string) {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { company: true }
  });

  if (!deal) return;

  // Update company lifecycle to "opportunity"
  await prisma.company.update({
    where: { id: deal.companyId },
    data: {
      lifecycleStage: 'opportunity',
      lastEngaged: new Date()
    }
  });

  // Recalculate lead score
  await updateCompanyLeadScore(deal.companyId);
}

export async function onEventCreated(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId }
  });

  if (!event || !event.companyId) return;

  // Update lastEngaged
  await prisma.company.update({
    where: { id: event.companyId },
    data: { lastEngaged: new Date() }
  });

  // Recalculate lead score
  await updateCompanyLeadScore(event.companyId);

  // Update lifecycle stage
  await updateLifecycleStage(event.companyId);
}
