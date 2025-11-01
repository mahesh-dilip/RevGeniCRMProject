/**
 * Demo Data Booster
 * Adds significant additional data to make CRM look fully populated
 * Run after initial seed: npm run seed && npx tsx scripts/boost-demo-data.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { addDays, subDays } from 'date-fns';

const prisma = new PrismaClient();

const TENANT_ID = 'demo-tenant';

async function main() {
  console.log('\n🚀 Boosting CRM with additional demo data...\n');

  // === Add 17 more companies ===
  console.log('🏢 Adding 17 more companies...');
  const newCompanies = await Promise.all([
    // SaaS & Tech (7)
    prisma.company.create({ data: { tenantId: TENANT_ID, name: 'MarketFlow AI', website: 'https://marketflow.ai', industry: 'Marketing Tech', size: '50-200 employees', geography: 'Seattle, WA', lifecycleStage: 'sql', leadSource: 'ai_agent', sourceType: 'ai_agent', leadScore: 83, description: 'AI-powered marketing automation and lead scoring', foundedYear: 2020, emailOpens: 28, emailClicks: 15, websiteVisits: 42, lastEngaged: subDays(new Date(), 3) } }),
    prisma.company.create({ data: { tenantId: TENANT_ID, name: 'DevTools Pro', website: 'https://devtools.pro', industry: 'Developer Tools', size: '100-200 employees', geography: 'Portland, OR', lifecycleStage: 'opportunity', leadSource: 'website', sourceType: 'manual', leadScore: 76, description: 'Developer productivity and collaboration tools', foundedYear: 2019, emailOpens: 18, emailClicks: 9, websiteVisits: 31, lastEngaged: subDays(new Date(), 5) } }),
    prisma.company.create({ data: { tenantId: TENANT_ID, name: 'CyberGuard Technologies', website: 'https://cyberguard.tech', industry: 'Cybersecurity', size: '200-500 employees', geography: 'Tel Aviv, Israel', lifecycleStage: 'customer', leadSource: 'partner', sourceType: 'manual', leadScore: 94, description: 'Enterprise threat detection and response platform', foundedYear: 2016, emailOpens: 35, emailClicks: 21, websiteVisits: 58, lastEngaged: subDays(new Date(), 1) } }),
    prisma.company.create({ data: { tenantId: TENANT_ID, name: 'CloudNative Systems', website: 'https://cloudnative.systems', industry: 'Cloud Infrastructure', size: '100-200 employees', geography: 'Dublin, Ireland', lifecycleStage: 'sql', leadSource: 'ai_agent', sourceType: 'ai_agent', leadScore: 81, description: 'Kubernetes-native application platform', foundedYear: 2020, emailOpens: 22, emailClicks: 12, websiteVisits: 38, lastEngaged: subDays(new Date(), 4) } }),
    prisma.company.create({ data: { tenantId: TENANT_ID, name: 'AI Insights Corp', website: 'https://aiinsights.com', industry: 'AI/ML', size: '50-200 employees', geography: 'Cambridge, MA', lifecycleStage: 'opportunity', leadSource: 'ai_agent', sourceType: 'ai_agent', leadScore: 79, description: 'Predictive analytics and business intelligence', foundedYear: 2021, emailOpens: 19, emailClicks: 11, websiteVisits: 29, lastEngaged: subDays(new Date(), 6) } }),
    prisma.company.create({ data: { tenantId: TENANT_ID, name: 'VideoConf Plus', website: 'https://videoconf.plus', industry: 'Collaboration Software', size: '100-200 employees', geography: 'Amsterdam, Netherlands', lifecycleStage: 'sql', leadSource: 'website', sourceType: 'manual', leadScore: 74, description: 'Enterprise video conferencing and webinar platform', foundedYear: 2019, emailOpens: 16, emailClicks: 8, websiteVisits: 27, lastEngaged: subDays(new Date(), 7) } }),
    prisma.company.create({ data: { tenantId: TENANT_ID, name: 'DataViz Studio', website: 'https://dataviz.studio', industry: 'Data Visualization', size: '20-50 employees', geography: 'Stockholm, Sweden', lifecycleStage: 'mql', leadSource: 'social_media', sourceType: 'manual', leadScore: 67, description: 'Interactive data visualization and dashboarding', foundedYear: 2022, emailOpens: 14, emailClicks: 7, websiteVisits: 22, lastEngaged: subDays(new Date(), 9) } }),

    // Vertical SaaS (5)
    prisma.company.create({ data: { tenantId: TENANT_ID, name: 'HospitalityOS', website: 'https://hospitalityos.com', industry: 'Hospitality Tech', size: '50-100 employees', geography: 'Las Vegas, NV', lifecycleStage: 'opportunity', leadSource: 'event', sourceType: 'manual', leadScore: 71, description: 'Hotel and restaurant management platform', foundedYear: 2020, emailOpens: 15, emailClicks: 8, websiteVisits: 24, lastEngaged: subDays(new Date(), 8) } }),
    prisma.company.create({ data: { tenantId: TENANT_ID, name: 'FinanceOps Suite', website: 'https://financeops.io', industry: 'Financial Software', size: '100-200 employees', geography: 'Frankfurt, Germany', lifecycleStage: 'sql', leadSource: 'partner', sourceType: 'manual', leadScore: 80, description: 'CFO and finance team automation platform', foundedYear: 2018, emailOpens: 26, emailClicks: 14, websiteVisits: 36, lastEngaged: subDays(new Date(), 3) } }),
    prisma.company.create({ data: { tenantId: TENANT_ID, name: 'FleetManager Pro', website: 'https://fleetmanager.pro', industry: 'Fleet Management', size: '50-100 employees', geography: 'Dallas, TX', lifecycleStage: 'mql', leadSource: 'website', sourceType: 'manual', leadScore: 69, description: 'Fleet tracking and maintenance optimization', foundedYear: 2021, emailOpens: 12, emailClicks: 6, websiteVisits: 19, lastEngaged: subDays(new Date(), 11) } }),
    prisma.company.create({ data: { tenantId: TENANT_ID, name: 'PharmaTrack Systems', website: 'https://pharmatrack.systems', industry: 'Healthcare Tech', size: '200-500 employees', geography: 'Basel, Switzerland', lifecycleStage: 'customer', leadSource: 'referral', sourceType: 'manual', leadScore: 91, description: 'Pharmaceutical supply chain and compliance', foundedYear: 2015, emailOpens: 38, emailClicks: 22, websiteVisits: 61, lastEngaged: subDays(new Date(), 2) } }),
    prisma.company.create({ data: { tenantId: TENANT_ID, name: 'EventPro Platform', website: 'https://eventpro.platform', industry: 'Event Management', size: '20-50 employees', geography: 'Austin, TX', lifecycleStage: 'lead', leadSource: 'event', sourceType: 'manual', leadScore: 58, description: 'Corporate event planning and management software', foundedYear: 2022, emailOpens: 9, emailClicks: 4, websiteVisits: 15, lastEngaged: subDays(new Date(), 15) } }),

    // Emerging / Early Stage (5)
    prisma.company.create({ data: { tenantId: TENANT_ID, name: 'NFT MarketHub', website: 'https://nftmarkethub.io', industry: 'Web3', size: '10-50 employees', geography: 'San Francisco, CA', lifecycleStage: 'lead', leadSource: 'social_media', sourceType: 'manual', leadScore: 51, description: 'NFT marketplace and digital asset platform', foundedYear: 2023, emailOpens: 7, emailClicks: 3, websiteVisits: 12, lastEngaged: subDays(new Date(), 18) } }),
    prisma.company.create({ data: { tenantId: TENANT_ID, name: 'Metaverse Studios', website: 'https://metaverse.studios', industry: 'VR/AR', size: '20-50 employees', geography: 'Los Angeles, CA', lifecycleStage: 'lead', leadSource: 'website', sourceType: 'manual', leadScore: 46, description: 'Virtual reality experiences for enterprise training', foundedYear: 2023, emailOpens: 5, emailClicks: 2, websiteVisits: 9, lastEngaged: subDays(new Date(), 22) } }),
    prisma.company.create({ data: { tenantId: TENANT_ID, name: 'Quantum Computing Lab', website: 'https://quantumlab.io', industry: 'Quantum Tech', size: '10-20 employees', geography: 'Waterloo, Canada', lifecycleStage: 'other', leadSource: 'referral', sourceType: 'manual', leadScore: 39, description: 'Quantum computing research and applications', foundedYear: 2023, emailOpens: 4, emailClicks: 1, websiteVisits: 6, lastEngaged: subDays(new Date(), 28) } }),
    prisma.company.create({ data: { tenantId: TENANT_ID, name: 'BioTech Innovations', website: 'https://biotech.innovations', industry: 'BioTech', size: '20-50 employees', geography: 'Cambridge, UK', lifecycleStage: 'lead', leadSource: 'event', sourceType: 'manual', leadScore: 54, description: 'Biotechnology and life sciences data platform', foundedYear: 2022, emailOpens: 8, emailClicks: 4, websiteVisits: 13, lastEngaged: subDays(new Date(), 12) } }),
    prisma.company.create({ data: { tenantId: TENANT_ID, name: 'SmartGrid Energy', website: 'https://smartgrid.energy', industry: 'Energy Tech', size: '50-100 employees', geography: 'Oslo, Norway', lifecycleStage: 'mql', leadSource: 'partner', sourceType: 'manual', leadScore: 64, description: 'Smart grid optimization and energy management', foundedYear: 2021, emailOpens: 13, emailClicks: 7, websiteVisits: 21, lastEngaged: subDays(new Date(), 10) } }),
  ]);
  console.log(`✅ Added ${newCompanies.length} companies\n`);

  // Get all companies for reference
  const allCompanies = await prisma.company.findMany({ where: { tenantId: TENANT_ID } });

  // === Add 41 more contacts across companies ===
  console.log('👥 Adding 41 more contacts...');
  const newContacts = await Promise.all([
    // Multiple contacts for new companies
    ...newCompanies.flatMap((company, idx) => [
      prisma.person.create({ data: { tenantId: TENANT_ID, firstName: ['Alex', 'Jamie', 'Morgan', 'Casey', 'Jordan', 'Taylor', 'Riley', 'Drew', 'Quinn', 'Avery', 'Cameron', 'Sage', 'River', 'Phoenix', 'Skylar', 'Dakota', 'Rowan'][idx], lastName: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor'][idx], email: `contact${idx + 1}@${company.website.split('//')[1]}`, phone: `+1-555-${(idx + 1).toString().padStart(4, '0')}`, title: ['CEO', 'VP of Sales', 'CTO', 'Head of Marketing', 'COO', 'VP of Product', 'Director of Engineering', 'Head of Operations', 'VP of Business Development', 'Chief Revenue Officer', 'Head of Customer Success', 'VP of Engineering', 'Director of Sales', 'Product Manager', 'Engineering Manager', 'Sales Director', 'Marketing Director'][idx % 17], linkedin: idx % 3 === 0 ? `https://linkedin.com/in/person-${idx}` : undefined, companyId: company.id } }),
      prisma.person.create({ data: { tenantId: TENANT_ID, firstName: ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'William', 'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia', 'Lucas', 'Harper'][idx], lastName: ['Anderson', 'Thompson', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright'][idx], email: `contact${idx + 2}@${company.website.split('//')[1]}`, title: ['Director of Sales', 'Product Manager', 'Engineering Manager', 'Marketing Manager', 'Operations Manager', 'Sales Manager', 'Customer Success Manager', 'Account Executive', 'Solutions Architect', 'Technical Lead', 'Business Analyst', 'Project Manager', 'Senior Engineer', 'Account Manager', 'Support Manager', 'Finance Manager', 'HR Manager'][idx % 17], companyId: company.id } }),
    ]),

    // Additional contacts for top existing companies
    ...allCompanies.slice(0, 7).map((company, idx) =>
      prisma.person.create({ data: { tenantId: TENANT_ID, firstName: ['Grace', 'Henry', 'Chloe', 'Andrew', 'Zoe', 'Daniel', 'Lily'][idx], lastName: ['Scott', 'Green', 'Adams', 'Baker', 'Nelson', 'Carter', 'Mitchell'][idx], email: `additional${idx}@${company.website?.split('//')[1] || 'example.com'}`, title: ['Account Executive', 'Solutions Engineer', 'Customer Success Manager', 'Sales Engineer', 'Implementation Specialist', 'Technical Account Manager', 'Partnership Manager'][idx], companyId: company.id } })
    ),
  ]);
  console.log(`✅ Added ${newContacts.length} contacts\n`);

  // === Add 33 more deals ===
  console.log('💼 Adding 33 more deals...');
  const allPeople = await prisma.person.findMany({ where: { tenantId: TENANT_ID } });

  const stages = ['Prospecting', 'Qualified', 'Demo', 'Proposal', 'Negotiation', 'Won', 'Lost'];
  const newDeals = await Promise.all([
    // Won deals for new customer companies
    prisma.deal.create({ data: { tenantId: TENANT_ID, title: `${newCompanies[2].name} - Enterprise Security Suite`, value: 525000, stage: 'Won', probability: 100, closeDate: subDays(new Date(), 35), description: 'Complete cybersecurity platform deployment', companyId: newCompanies[2].id, primaryContactId: newContacts[4].id, stageChangedAt: subDays(new Date(), 35) } }),
    prisma.deal.create({ data: { tenantId: TENANT_ID, title: `${newCompanies[10].name} - Pharma Supply Chain System`, value: 685000, stage: 'Won', probability: 100, closeDate: subDays(new Date(), 28), description: 'Enterprise pharmaceutical tracking and compliance', companyId: newCompanies[10].id, primaryContactId: newContacts[20].id, stageChangedAt: subDays(new Date(), 28) } }),

    // Negotiation stage
    ...newCompanies.slice(0, 5).map((company, idx) =>
      prisma.deal.create({ data: { tenantId: TENANT_ID, title: `${company.name} - Growth Package`, value: [185000, 245000, 165000, 295000, 215000][idx], stage: 'Negotiation', probability: [75, 80, 70, 85, 72][idx], closeDate: addDays(new Date(), [15, 18, 22, 17, 20][idx]), description: `${company.industry} solution expansion`, nextAction: 'Finalize contract terms', companyId: company.id, primaryContactId: newContacts[idx * 2].id, stageChangedAt: subDays(new Date(), [3, 4, 5, 2, 6][idx]) } })
    ),

    // Proposal stage
    ...newCompanies.slice(5, 10).map((company, idx) =>
      prisma.deal.create({ data: { tenantId: TENANT_ID, title: `${company.name} - Standard Package`, value: [125000, 145000, 98000, 165000, 135000][idx], stage: 'Proposal', probability: [60, 55, 50, 65, 58][idx], closeDate: addDays(new Date(), [30, 35, 40, 32, 38][idx]), description: `${company.industry} implementation`, nextAction: 'Send revised proposal', companyId: company.id, primaryContactId: newContacts[10 + idx * 2].id, stageChangedAt: subDays(new Date(), [6, 7, 8, 5, 9][idx]) } })
    ),

    // Demo stage
    ...newCompanies.slice(10, 14).map((company, idx) =>
      prisma.deal.create({ data: { tenantId: TENANT_ID, title: `${company.name} - Pilot Program`, value: [85000, 95000, 78000, 105000][idx], stage: 'Demo', probability: [45, 50, 40, 52][idx], closeDate: addDays(new Date(), [45, 50, 48, 52][idx]), description: `Initial ${company.industry} deployment`, nextAction: 'Schedule product demo', companyId: company.id, primaryContactId: newContacts[20 + idx * 2].id, stageChangedAt: subDays(new Date(), [4, 5, 3, 6][idx]) } })
    ),

    // Qualified stage
    ...newCompanies.slice(14, 17).map((company, idx) =>
      prisma.deal.create({ data: { tenantId: TENANT_ID, title: `${company.name} - Starter Package`, value: [55000, 42000, 68000][idx], stage: 'Qualified', probability: [40, 35, 45][idx], closeDate: addDays(new Date(), [60, 65, 62][idx]), description: `Entry-level ${company.industry} solution`, nextAction: 'Discovery call scheduled', companyId: company.id, primaryContactId: newContacts[28 + idx * 2].id, stageChangedAt: subDays(new Date(), [7, 8, 6][idx]) } })
    ),

    // Prospecting stage
    ...allCompanies.slice(8, 13).map((company, idx) =>
      prisma.deal.create({ data: { tenantId: TENANT_ID, title: `${company.name} - Basic Package`, value: [35000, 42000, 38000, 45000, 40000][idx], stage: 'Prospecting', probability: [25, 30, 20, 28, 22][idx], closeDate: addDays(new Date(), [80, 85, 90, 82, 88][idx]), description: 'Initial outreach and qualification', nextAction: 'Schedule discovery call', companyId: company.id, primaryContactId: allPeople.find(p => p.companyId === company.id)?.id, stageChangedAt: subDays(new Date(), [2, 3, 1, 4, 2][idx]) } })
    ),

    // Lost deals
    ...newCompanies.slice(14, 17).map((company, idx) =>
      prisma.deal.create({ data: { tenantId: TENANT_ID, title: `${company.name} - Enterprise Trial`, value: [45000, 38000, 52000][idx], stage: 'Lost', probability: 0, closeDate: subDays(new Date(), [15, 18, 12][idx]), description: 'Trial period evaluation', lostReason: ['Went with competitor', 'Budget cut', 'Not ready'][idx], companyId: company.id, primaryContactId: newContacts[28 + idx * 2].id, stageChangedAt: subDays(new Date(), [15, 18, 12][idx]) } })
    ),
  ]);
  console.log(`✅ Added ${newDeals.length} deals\n`);

  // === Add 84 more activities ===
  console.log('📅 Adding 84 more activities (calls, emails, meetings, tasks, notes)...');
  const allDeals = await prisma.deal.findMany({ where: { tenantId: TENANT_ID } });

  const activities = [];

  // For each new deal, add 2-3 activities
  for (const deal of newDeals) {
    const company = allCompanies.find(c => c.id === deal.companyId);
    const contact = allPeople.find(p => p.id === deal.primaryContactId);

    // Call activity
    activities.push(
      prisma.event.create({ data: { tenantId: TENANT_ID, type: 'call', title: `Discovery call with ${contact?.firstName || 'contact'}`, description: `Discussed ${company?.industry} requirements and current challenges`, outcome: ['Qualified lead', 'Interested - follow up', 'Needs more info'][Math.floor(Math.random() * 3)], source: 'manual', companyId: deal.companyId, personId: deal.primaryContactId, dealId: deal.id, createdAt: subDays(new Date(), Math.floor(Math.random() * 20) + 1) } })
    );

    // Email activity
    activities.push(
      prisma.event.create({ data: { tenantId: TENANT_ID, type: 'email', title: `Sent proposal to ${company?.name}`, description: 'Shared pricing and implementation timeline', source: 'manual', emailStatus: ['sent', 'opened', 'clicked'][Math.floor(Math.random() * 3)], companyId: deal.companyId, dealId: deal.id, createdAt: subDays(new Date(), Math.floor(Math.random() * 15) + 1) } })
    );

    // Task or meeting (alternating)
    if (Math.random() > 0.5) {
      activities.push(
        prisma.event.create({ data: { tenantId: TENANT_ID, type: 'task', title: `Follow up on ${deal.title}`, description: 'Check if they have questions about the proposal', priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)], source: 'manual', dueDate: addDays(new Date(), Math.floor(Math.random() * 10) + 1), completed: Math.random() > 0.7, companyId: deal.companyId, dealId: deal.id, createdAt: subDays(new Date(), Math.floor(Math.random() * 7) + 1) } })
      );
    } else {
      activities.push(
        prisma.event.create({ data: { tenantId: TENANT_ID, type: 'meeting', title: `Product demo for ${company?.name}`, description: 'Demonstrate key features and answer questions', outcome: deal.stage === 'Demo' ? 'Demo completed successfully' : undefined, source: 'manual', dueDate: deal.stage === 'Demo' ? addDays(new Date(), Math.floor(Math.random() * 7) + 1) : undefined, companyId: deal.companyId, personId: deal.primaryContactId, dealId: deal.id, createdAt: subDays(new Date(), Math.floor(Math.random() * 10) + 1) } })
      );
    }
  }

  // Add standalone activities for random companies
  for (let i = 0; i < 20; i++) {
    const randomCompany = allCompanies[Math.floor(Math.random() * allCompanies.length)];
    const randomContact = allPeople.find(p => p.companyId === randomCompany.id);

    activities.push(
      prisma.event.create({ data: { tenantId: TENANT_ID, type: ['call', 'email', 'note'][i % 3], title: [`Outreach call to ${randomCompany.name}`, `Marketing email sent`, `Note: ${randomCompany.name} expressed interest`][i % 3], description: ['Cold outreach call', 'Product update newsletter', 'Lead expressed interest in demo'][i % 3], source: 'manual', companyId: randomCompany.id, personId: randomContact?.id, createdAt: subDays(new Date(), Math.floor(Math.random() * 30) + 1) } })
    );
  }

  const createdActivities = await Promise.all(activities);
  console.log(`✅ Added ${createdActivities.length} activities\n`);

  console.log('✨ Data boost complete!\n');
  console.log('📊 Final Summary:');
  const totalCompanies = await prisma.company.count({ where: { tenantId: TENANT_ID } });
  const totalPeople = await prisma.person.count({ where: { tenantId: TENANT_ID } });
  const totalDeals = await prisma.deal.count({ where: { tenantId: TENANT_ID } });
  const totalEvents = await prisma.event.count({ where: { tenantId: TENANT_ID } });
  const totalValue = (await prisma.deal.aggregate({ where: { tenantId: TENANT_ID }, _sum: { value: true } }))._sum.value || 0;

  console.log(`   📈 Companies: ${totalCompanies}`);
  console.log(`   👥 Contacts: ${totalPeople}`);
  console.log(`   💼 Deals: ${totalDeals}`);
  console.log(`   📅 Activities: ${totalEvents}`);
  console.log(`   💰 Total Pipeline Value: $${totalValue.toLocaleString()}`);
  console.log('\n🎉 Your CRM is now fully populated with professional demo data!\n');
}

main()
  .catch((e) => {
    console.error('❌ Boost failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
