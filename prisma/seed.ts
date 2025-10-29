import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: 'demo-tenant' },
    update: {},
    create: {
      id: 'demo-tenant',
      name: 'Demo Company',
    },
  });

  console.log('✅ Created tenant:', tenant.name);

  // Create demo companies
  const companies = await Promise.all([
    prisma.company.create({
      data: {
        name: 'TechCorp Solutions',
        website: 'https://techcorp.example.com',
        industry: 'SaaS',
        size: '50-200',
        geography: 'London, UK',
        status: 'Lead',
        description: 'Cloud-based enterprise software solutions',
        sourceType: 'manual',
      },
    }),
    prisma.company.create({
      data: {
        name: 'DataFlow AI',
        website: 'https://dataflow.example.com',
        industry: 'AI/ML',
        size: '20-50',
        geography: 'San Francisco, CA',
        status: 'Qualified',
        description: 'AI-powered data analytics platform',
        sourceType: 'ai_agent',
        confidence: 0.92,
        sourceQuery: 'AI companies in San Francisco with 20-50 employees',
      },
    }),
    prisma.company.create({
      data: {
        name: 'CloudSync Ltd',
        website: 'https://cloudsync.example.com',
        industry: 'Cloud Services',
        size: '100-500',
        geography: 'Berlin, Germany',
        status: 'Customer',
        description: 'Enterprise cloud synchronization services',
        sourceType: 'manual',
      },
    }),
  ]);

  console.log(`✅ Created ${companies.length} companies`);

  // Create people
  await prisma.person.create({
    data: {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john@techcorp.example.com',
      title: 'CEO',
      companyId: companies[0].id,
    },
  });

  await prisma.person.create({
    data: {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah@dataflow.example.com',
      title: 'VP of Sales',
      companyId: companies[1].id,
    },
  });

  console.log('✅ Created demo people');

  // Create deals
  const deal1 = await prisma.deal.create({
    data: {
      title: 'Enterprise License Deal',
      value: 50000,
      stage: 'Proposal',
      probability: 75,
      description: 'Annual enterprise license agreement',
      companyId: companies[0].id,
      nextAction: 'Follow up on proposal within 3 days',
    },
  });

  const deal2 = await prisma.deal.create({
    data: {
      title: 'Platform Integration',
      value: 25000,
      stage: 'Demo',
      probability: 50,
      description: 'Integration with existing platform',
      companyId: companies[1].id,
      nextAction: 'Schedule and conduct product demo',
    },
  });

  console.log('✅ Created demo deals');

  // Create events
  await prisma.event.create({
    data: {
      type: 'call',
      title: 'Discovery call with CEO',
      description: 'Discussed requirements and pain points',
      source: 'manual',
      outcome: 'Interested - Schedule follow-up',
      companyId: companies[0].id,
      dealId: deal1.id,
    },
  });

  await prisma.event.create({
    data: {
      type: 'task',
      title: 'Prepare demo environment',
      description: 'Set up demo for client presentation',
      source: 'automation',
      priority: 'high',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      companyId: companies[1].id,
      dealId: deal2.id,
    },
  });

  await prisma.event.create({
    data: {
      type: 'note',
      title: 'Deal moved to Demo',
      description: 'Deal stage changed from Prospecting to Demo',
      source: 'automation',
      companyId: companies[1].id,
      dealId: deal2.id,
    },
  });

  console.log('✅ Created demo events');

  // Create email sequence
  const sequence = await prisma.emailSequence.create({
    data: {
      name: 'Welcome Nurture Sequence',
      description: 'Initial outreach for new leads',
      active: true,
      pauseOnDealCreation: true,
      pauseOnDealStages: ['Demo', 'Proposal'],
      steps: {
        create: [
          {
            stepOrder: 1,
            delayDays: 0,
            subject: 'Introduction to RevGeni CRM',
            body: 'Hi {{person.firstName}},\n\nI noticed {{company.name}} is in the {{company.industry}} space...',
          },
          {
            stepOrder: 2,
            delayDays: 3,
            subject: 'Following up on our solution',
            body: 'Hi {{person.firstName}},\n\nJust wanted to follow up...',
          },
          {
            stepOrder: 3,
            delayDays: 7,
            subject: 'Case study you might find interesting',
            body: 'Hi {{person.firstName}},\n\nThought you might find this relevant...',
          },
        ],
      },
    },
    include: {
      steps: true,
    },
  });

  console.log('✅ Created email sequence with', sequence.steps.length, 'steps');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
