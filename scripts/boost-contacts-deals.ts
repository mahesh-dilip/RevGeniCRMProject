import { PrismaClient } from '@prisma/client';
import { subDays, subHours } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Adding contacts, deals, and activities...');

  // Get tenant ID and existing companies
  const companies = await prisma.company.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' }
  });

  if (companies.length === 0) {
    console.log('❌ No companies found. Run base seed first.');
    return;
  }

  const TENANT_ID = companies[0].tenantId;
  console.log(`📋 Found ${companies.length} companies for tenant ${TENANT_ID}`);

  // Add 2-3 contacts per company
  console.log('👥 Adding contacts...');
  const contactsToAdd = [];

  const firstNames = ['Sarah', 'Michael', 'Jennifer', 'David', 'Lisa', 'James', 'Emily', 'Robert', 'Jessica', 'William', 'Amanda', 'Chris', 'Nicole', 'Daniel', 'Michelle'];
  const lastNames = ['Anderson', 'Thompson', 'Martinez', 'Garcia', 'Wilson', 'Brown', 'Davis', 'Miller', 'Johnson', 'Smith', 'Taylor', 'Lee', 'White', 'Harris', 'Clark'];
  const titles = ['CEO', 'CTO', 'VP of Sales', 'VP of Marketing', 'Head of Engineering', 'Director of Product', 'Sales Manager', 'Marketing Director'];

  let contactIndex = 0;
  for (const company of companies.slice(0, 15)) {
    const numContacts = Math.floor(Math.random() * 2) + 2; // 2-3 contacts

    for (let i = 0; i < numContacts; i++) {
      const firstName = firstNames[contactIndex % firstNames.length];
      const lastName = lastNames[Math.floor(contactIndex / firstNames.length) % lastNames.length];
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.website?.replace('https://', '').replace('http://', '') || 'example.com'}`;

      contactsToAdd.push({
        tenantId: TENANT_ID,
        companyId: company.id,
        firstName,
        lastName,
        email,
        title: titles[contactIndex % titles.length],
        phone: `+1-555-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}`,
      });

      contactIndex++;
    }
  }

  // Create contacts in small batches
  const batchSize = 5;
  for (let i = 0; i < contactsToAdd.length; i += batchSize) {
    const batch = contactsToAdd.slice(i, i + batchSize);
    await Promise.all(batch.map(data => prisma.person.create({ data })));
    console.log(`  ✅ Added ${Math.min(i + batchSize, contactsToAdd.length)}/${contactsToAdd.length} contacts`);
  }

  // Get all contacts for creating deals
  const allContacts = await prisma.person.findMany({
    where: { tenantId: TENANT_ID },
    include: { company: true }
  });

  console.log('💼 Adding deals...');
  const dealsToAdd = [];
  const dealStages = ['Prospecting', 'Qualified', 'Demo', 'Proposal', 'Negotiation', 'Won', 'Lost'];
  const dealNames = [
    'Annual Enterprise License',
    'Premium Plan Upgrade',
    'Professional Services Contract',
    'Custom Integration Project',
    'Multi-Year Agreement',
    'Pilot Program',
    'Expansion Deal',
    'Renewal Contract'
  ];

  for (let i = 0; i < Math.min(25, allContacts.length); i++) {
    const contact = allContacts[i % allContacts.length];
    const stage = dealStages[Math.floor(Math.random() * dealStages.length)];
    const amount = Math.floor(Math.random() * 90000) + 10000;

    dealsToAdd.push({
      tenantId: TENANT_ID,
      companyId: contact.companyId,
      primaryContactId: contact.id,
      title: dealNames[i % dealNames.length],
      value: amount,
      stage,
      probability: stage === 'Won' ? 100 : stage === 'Lost' ? 0 : Math.floor(Math.random() * 40) + 30,
      closeDate: stage === 'Won' ? subDays(new Date(), Math.floor(Math.random() * 30)) : new Date(Date.now() + Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000),
      description: `Deal for ${contact.company?.name || 'company'}`,
    });
  }

  // Create deals in small batches
  for (let i = 0; i < dealsToAdd.length; i += batchSize) {
    const batch = dealsToAdd.slice(i, i + batchSize);
    await Promise.all(batch.map(data => prisma.deal.create({ data })));
    console.log(`  ✅ Added ${Math.min(i + batchSize, dealsToAdd.length)}/${dealsToAdd.length} deals`);
  }

  // Get all deals for creating events
  const allDeals = await prisma.deal.findMany({
    where: { tenantId: TENANT_ID },
    include: { primaryContact: true, company: true }
  });

  console.log('📅 Adding activities...');
  const eventsToAdd = [];
  const eventTypes = ['call', 'email', 'meeting', 'task', 'note'];
  const noteTemplates = [
    'Initial discovery call completed',
    'Sent follow-up email with pricing',
    'Demo scheduled for next week',
    'Waiting on decision from procurement',
    'Contract sent for review',
    'Positive feedback on proposal'
  ];

  for (const deal of allDeals) {
    // Add 2-4 events per deal
    const numEvents = Math.floor(Math.random() * 3) + 2;

    for (let i = 0; i < numEvents; i++) {
      const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];

      eventsToAdd.push({
        tenantId: TENANT_ID,
        dealId: deal.id,
        personId: deal.primaryContactId,
        companyId: deal.companyId,
        type,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} with ${deal.primaryContact?.firstName || 'contact'}`,
        description: noteTemplates[Math.floor(Math.random() * noteTemplates.length)],
        dueDate: subDays(new Date(), Math.floor(Math.random() * 20)),
      });
    }
  }

  // Create events in small batches
  for (let i = 0; i < eventsToAdd.length; i += batchSize) {
    const batch = eventsToAdd.slice(i, i + batchSize);
    await Promise.all(batch.map(data => prisma.event.create({ data })));
    console.log(`  ✅ Added ${Math.min(i + batchSize, eventsToAdd.length)}/${eventsToAdd.length} activities`);
  }

  console.log('\n✅ Boost complete!');

  // Show final counts
  const [companyCount, personCount, dealCount, eventCount] = await Promise.all([
    prisma.company.count(),
    prisma.person.count(),
    prisma.deal.count(),
    prisma.event.count()
  ]);

  console.log('\n📊 Final counts:');
  console.log(`  Companies: ${companyCount}`);
  console.log(`  People: ${personCount}`);
  console.log(`  Deals: ${dealCount}`);
  console.log(`  Activities: ${eventCount}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Boost failed:', e.message);
    await prisma.$disconnect();
    process.exit(1);
  });
