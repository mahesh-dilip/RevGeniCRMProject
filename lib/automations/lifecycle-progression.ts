import { prisma } from '@/lib/prisma';

export async function updateLifecycleStage(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      deals: true,
      events: true,
      people: true
    }
  });

  if (!company) return;

  let newStage = company.lifecycleStage;

  // Has won deals → Customer
  if (company.deals.some(d => d.stage === 'Won')) {
    newStage = 'customer';
  }
  // Has active deal → Opportunity
  else if (company.deals.some(d => !['Won', 'Lost'].includes(d.stage))) {
    newStage = 'opportunity';
  }
  // Has recent activity and contact info → SQL
  else if (
    company.events.length >= 3 &&
    company.people.some(p => p.email) &&
    company.lastEngaged &&
    (Date.now() - new Date(company.lastEngaged).getTime()) < 14 * 24 * 60 * 60 * 1000
  ) {
    newStage = 'sql';
  }
  // Has some engagement → MQL
  else if (
    company.events.length >= 1 ||
    (company.emailOpens || 0) > 0 ||
    (company.websiteVisits || 0) > 0
  ) {
    newStage = 'mql';
  }

  if (newStage !== company.lifecycleStage) {
    await prisma.company.update({
      where: { id: companyId },
      data: {
        lifecycleStage: newStage,
        lastEngaged: new Date()
      }
    });

    // Log the change
    await prisma.event.create({
      data: {
        tenantId: company.tenantId,
        type: 'note',
        title: `Lifecycle stage updated to ${newStage.toUpperCase()}`,
        description: `Company automatically progressed from ${company.lifecycleStage} to ${newStage}`,
        source: 'automation',
        companyId
      }
    });
  }
}
