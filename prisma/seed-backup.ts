import { PrismaClient } from '@prisma/client';
import { addDays, subDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Ensure demo tenant exists for multi-tenancy
  await prisma.tenant.upsert({
    where: { id: 'demo-tenant' },
    update: {},
    create: {
      id: 'demo-tenant',
      name: 'Demo Tenant',
    },
  });

  // Clear existing data (optional - comment out if you want to keep data)
  console.log('🗑️  Clearing existing data...');
  await prisma.scheduledEmail.deleteMany();
  await prisma.sequenceEnrollment.deleteMany();
  await prisma.emailSequenceStep.deleteMany();
  await prisma.emailSequence.deleteMany();
  await prisma.event.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.person.deleteMany();
  await prisma.company.deleteMany();

  // 1. Create Companies with variety
  console.log('🏢 Creating companies...');
  const companies = await Promise.all([
    // AI-Generated High-Quality Leads
    prisma.company.create({
      data: {
        tenantId: 'demo-tenant',
        name: 'TechVision Analytics',
        website: 'https://techvision.ai',
        industry: 'SaaS',
        size: '50-200 employees',
        geography: 'San Francisco, USA',
        description: 'AI-powered analytics platform for enterprise customers',
        status: 'Qualified',
        lifecycleStage: 'sql',
        leadSource: 'ai_agent',
        sourceType: 'ai_agent',
        confidence: 0.92,
        leadScore: 85,
        foundedYear: 2018,
        emailOpens: 15,
        emailClicks: 8,
        websiteVisits: 23,
        lastEngaged: subDays(new Date(), 2),
      },
    }),
    prisma.company.create({
      data: {
        tenantId: 'demo-tenant',
        name: 'CloudScale Systems',
        website: 'https://cloudscale.io',
        industry: 'Cloud Infrastructure',
        size: '200-500 employees',
        geography: 'Austin, Texas',
        description: 'Enterprise cloud infrastructure and DevOps automation',
        status: 'Customer',
        lifecycleStage: 'customer',
        leadSource: 'ai_agent',
        sourceType: 'ai_agent',
        confidence: 0.88,
        leadScore: 95,
        foundedYear: 2016,
        emailOpens: 32,
        emailClicks: 18,
        websiteVisits: 45,
        lastEngaged: subDays(new Date(), 1),
      },
    }),
    prisma.company.create({
      data: {
        tenantId: 'demo-tenant',
        name: 'FinTech Innovations Inc',
        website: 'https://fintechinnovations.com',
        industry: 'Fintech',
        size: '100-200 employees',
        geography: 'London, UK',
        description: 'Payment processing and financial technology solutions',
        status: 'Qualified',
        lifecycleStage: 'opportunity',
        leadSource: 'ai_agent',
        sourceType: 'ai_agent',
        confidence: 0.78,
        leadScore: 72,
        foundedYear: 2019,
        emailOpens: 12,
        emailClicks: 5,
        websiteVisits: 18,
        lastEngaged: subDays(new Date(), 3),
      },
    }),
    // Manual Entries - Various Stages
    prisma.company.create({
      data: {
        tenantId: 'demo-tenant',
        name: 'StartupHub Co',
        website: 'https://startuphub.co',
        industry: 'Business Services',
        size: '10-50 employees',
        geography: 'Berlin, Germany',
        description: 'Coworking and startup acceleration services',
        status: 'Lead',
        lifecycleStage: 'mql',
        leadSource: 'referral',
        sourceType: 'manual',
        leadScore: 55,
        foundedYear: 2021,
        emailOpens: 5,
        emailClicks: 2,
        websiteVisits: 8,
        lastEngaged: subDays(new Date(), 7),
      },
    }),
    prisma.company.create({
      data: {
        tenantId: 'demo-tenant',
        name: 'DataFlow Solutions',
        website: 'https://dataflow.tech',
        industry: 'Data Analytics',
        size: '50-100 employees',
        geography: 'Toronto, Canada',
        description: 'Real-time data pipeline and ETL solutions',
        status: 'Lead',
        lifecycleStage: 'lead',
        leadSource: 'website',
        sourceType: 'manual',
        leadScore: 42,
        foundedYear: 2020,
        emailOpens: 3,
        emailClicks: 1,
        websiteVisits: 5,
        lastEngaged: subDays(new Date(), 14),
      },
    }),
    prisma.company.create({
      data: {
        tenantId: 'demo-tenant',
        name: 'EcoTech Ventures',
        website: 'https://ecotech.ventures',
        industry: 'Clean Technology',
        size: '20-50 employees',
        geography: 'Copenhagen, Denmark',
        description: 'Sustainable technology solutions for enterprises',
        status: 'Lost',
        lifecycleStage: 'other',
        leadSource: 'event',
        sourceType: 'manual',
        leadScore: 28,
        foundedYear: 2022,
        emailOpens: 2,
        emailClicks: 0,
        websiteVisits: 3,
        lastEngaged: subDays(new Date(), 45),
      },
    }),
    prisma.company.create({
      data: {
        tenantId: 'demo-tenant',
        name: 'NextGen Robotics',
        website: 'https://nextgenrobotics.ai',
        industry: 'Robotics & AI',
        size: '100-200 employees',
        geography: 'Tokyo, Japan',
        description: 'Advanced robotics and automation for manufacturing',
        status: 'Qualified',
        lifecycleStage: 'sql',
        leadSource: 'social_media',
        sourceType: 'manual',
        leadScore: 68,
        foundedYear: 2017,
        emailOpens: 10,
        emailClicks: 6,
        websiteVisits: 15,
        lastEngaged: subDays(new Date(), 4),
      },
    }),
    prisma.company.create({
      data: {
        tenantId: 'demo-tenant',
        name: 'HealthSync Platform',
        website: 'https://healthsync.io',
        industry: 'Healthcare Technology',
        size: '50-200 employees',
        geography: 'Boston, USA',
        description: 'Patient engagement and healthcare data platform',
        status: 'Lead',
        lifecycleStage: 'mql',
        leadSource: 'paid_advertising',
        sourceType: 'manual',
        leadScore: 48,
        foundedYear: 2019,
        emailOpens: 6,
        emailClicks: 3,
        websiteVisits: 10,
        lastEngaged: subDays(new Date(), 10),
      },
    }),
  ]);
  console.log(`✅ Created ${companies.length} companies`);

  // 2. Create People (Contacts)
  console.log('👥 Creating contacts...');
  const people = await Promise.all([
    // TechVision Analytics contacts
    prisma.person.create({
      data: {
        tenantId: 'demo-tenant',
        firstName: 'Sarah',
        lastName: 'Chen',
        email: 'sarah.chen@techvision.ai',
        phone: '+1-415-555-0101',
        title: 'VP of Sales',
        linkedin: 'https://linkedin.com/in/sarahchen',
        companyId: companies[0].id,
      },
    }),
    prisma.person.create({
      data: {
        tenantId: 'demo-tenant',
        firstName: 'Michael',
        lastName: 'Rodriguez',
        email: 'michael.r@techvision.ai',
        phone: '+1-415-555-0102',
        title: 'CTO',
        linkedin: 'https://linkedin.com/in/mrodriguez',
        companyId: companies[0].id,
      },
    }),
    // CloudScale Systems contacts
    prisma.person.create({
      data: {
        tenantId: 'demo-tenant',
        firstName: 'Jennifer',
        lastName: 'Walsh',
        email: 'j.walsh@cloudscale.io',
        phone: '+1-512-555-0201',
        title: 'CEO',
        linkedin: 'https://linkedin.com/in/jenniferwalsh',
        companyId: companies[1].id,
      },
    }),
    // FinTech Innovations contacts
    prisma.person.create({
      data: {
        tenantId: 'demo-tenant',
        firstName: 'David',
        lastName: 'Thompson',
        email: 'david.thompson@fintechinnovations.com',
        phone: '+44-20-5555-0301',
        title: 'Head of Operations',
        linkedin: 'https://linkedin.com/in/davidthompson',
        companyId: companies[2].id,
      },
    }),
    prisma.person.create({
      data: {
        tenantId: 'demo-tenant',
        firstName: 'Emma',
        lastName: 'Davies',
        email: 'emma.davies@fintechinnovations.com',
        phone: '+44-20-5555-0302',
        title: 'Product Manager',
        companyId: companies[2].id,
      },
    }),
    // StartupHub Co contacts
    prisma.person.create({
      data: {
        tenantId: 'demo-tenant',
        firstName: 'Klaus',
        lastName: 'Mueller',
        email: 'klaus@startuphub.co',
        phone: '+49-30-5555-0401',
        title: 'Founder & CEO',
        companyId: companies[3].id,
      },
    }),
    // DataFlow Solutions contacts
    prisma.person.create({
      data: {
        tenantId: 'demo-tenant',
        firstName: 'Lisa',
        lastName: 'Anderson',
        email: 'lisa.anderson@dataflow.tech',
        phone: '+1-416-555-0501',
        title: 'Engineering Manager',
        companyId: companies[4].id,
      },
    }),
    // NextGen Robotics contacts
    prisma.person.create({
      data: {
        tenantId: 'demo-tenant',
        firstName: 'Yuki',
        lastName: 'Tanaka',
        email: 'y.tanaka@nextgenrobotics.ai',
        phone: '+81-3-5555-0701',
        title: 'VP of Business Development',
        linkedin: 'https://linkedin.com/in/yukitanaka',
        companyId: companies[6].id,
      },
    }),
    // HealthSync Platform contacts
    prisma.person.create({
      data: {
        tenantId: 'demo-tenant',
        firstName: 'Rachel',
        lastName: 'Kim',
        email: 'rachel.kim@healthsync.io',
        phone: '+1-617-555-0801',
        title: 'Director of Sales',
        companyId: companies[7].id,
      },
    }),
  ]);
  console.log(`✅ Created ${people.length} contacts`);

  // 3. Create Deals
  console.log('💼 Creating deals...');
  const deals = await Promise.all([
    // TechVision - Active deal in Demo stage
    prisma.deal.create({
      data: {
        tenantId: 'demo-tenant',
        title: 'TechVision Analytics - Enterprise Package',
        value: 125000,
        stage: 'Demo',
        probability: 70,
        closeDate: addDays(new Date(), 30),
        description: 'Enterprise analytics platform with custom integrations',
        nextAction: 'Schedule technical demo with CTO',
        companyId: companies[0].id,
        primaryContactId: people[0].id,
        stageChangedAt: subDays(new Date(), 3),
      },
    }),
    // CloudScale - Won deal
    prisma.deal.create({
      data: {
        tenantId: 'demo-tenant',
        title: 'CloudScale Systems - Infrastructure Modernization',
        value: 450000,
        stage: 'Won',
        probability: 100,
        closeDate: subDays(new Date(), 15),
        description: 'Complete cloud infrastructure overhaul and managed services',
        companyId: companies[1].id,
        primaryContactId: people[2].id,
        stageChangedAt: subDays(new Date(), 15),
      },
    }),
    // FinTech - Proposal stage
    prisma.deal.create({
      data: {
        tenantId: 'demo-tenant',
        title: 'FinTech Innovations - Payment Gateway Integration',
        value: 85000,
        stage: 'Proposal',
        probability: 60,
        closeDate: addDays(new Date(), 45),
        description: 'Custom payment processing integration and compliance support',
        nextAction: 'Send revised proposal with pricing options',
        companyId: companies[2].id,
        primaryContactId: people[3].id,
        stageChangedAt: subDays(new Date(), 7),
      },
    }),
    // StartupHub - Prospecting
    prisma.deal.create({
      data: {
        tenantId: 'demo-tenant',
        title: 'StartupHub Co - Growth Package',
        value: 25000,
        stage: 'Prospecting',
        probability: 30,
        closeDate: addDays(new Date(), 60),
        description: 'Small business growth acceleration package',
        nextAction: 'Initial discovery call scheduled',
        companyId: companies[3].id,
        primaryContactId: people[5].id,
        stageChangedAt: subDays(new Date(), 2),
      },
    }),
    // DataFlow - Qualified
    prisma.deal.create({
      data: {
        tenantId: 'demo-tenant',
        title: 'DataFlow Solutions - Data Pipeline Setup',
        value: 65000,
        stage: 'Qualified',
        probability: 50,
        closeDate: addDays(new Date(), 50),
        description: 'Real-time data pipeline implementation',
        nextAction: 'Schedule needs assessment meeting',
        companyId: companies[4].id,
        primaryContactId: people[6].id,
        stageChangedAt: subDays(new Date(), 5),
      },
    }),
    // EcoTech - Lost deal
    prisma.deal.create({
      data: {
        tenantId: 'demo-tenant',
        title: 'EcoTech Ventures - Sustainability Consulting',
        value: 40000,
        stage: 'Lost',
        probability: 0,
        closeDate: subDays(new Date(), 20),
        description: 'Environmental impact tracking and reporting',
        lostReason: 'Budget constraints - chose competitor with lower pricing',
        companyId: companies[5].id,
        stageChangedAt: subDays(new Date(), 20),
      },
    }),
    // NextGen - Negotiation
    prisma.deal.create({
      data: {
        tenantId: 'demo-tenant',
        title: 'NextGen Robotics - AI Training Platform',
        value: 180000,
        stage: 'Negotiation',
        probability: 75,
        closeDate: addDays(new Date(), 20),
        description: 'Custom AI model training and deployment platform',
        nextAction: 'Finalize contract terms and pricing',
        companyId: companies[6].id,
        primaryContactId: people[7].id,
        stageChangedAt: subDays(new Date(), 4),
      },
    }),
  ]);
  console.log(`✅ Created ${deals.length} deals`);

  // 4. Create Events (Activities)
  console.log('📋 Creating events...');
  const events = [];
  // TechVision activities
  events.push(
    await prisma.event.create({
      data: {
        tenantId: 'demo-tenant',
        type: 'call',
        title: 'Discovery call with Sarah Chen',
        description: 'Discussed their analytics needs and current pain points with spreadsheets',
        outcome: 'Interested - Schedule follow-up',
        source: 'manual',
        companyId: companies[0].id,
        personId: people[0].id,
        dealId: deals[0].id,
        createdAt: subDays(new Date(), 10),
      },
    }),
    await prisma.event.create({
      data: {
        tenantId: 'demo-tenant',
        type: 'email',
        title: 'Sent product overview and case studies',
        description: 'Shared enterprise analytics case studies from similar companies',
        source: 'manual',
        emailStatus: 'opened',
        companyId: companies[0].id,
        dealId: deals[0].id,
        createdAt: subDays(new Date(), 8),
      },
    }),
    await prisma.event.create({
      data: {
        tenantId: 'demo-tenant',
        type: 'meeting',
        title: 'Initial product demo',
        description: 'Demonstrated core analytics features and custom dashboards',
        outcome: 'Demo scheduled',
        source: 'manual',
        dueDate: addDays(new Date(), 5),
        companyId: companies[0].id,
        personId: people[0].id,
        dealId: deals[0].id,
        createdAt: subDays(new Date(), 3),
      },
    }),
    await prisma.event.create({
      data: {
        tenantId: 'demo-tenant',
        type: 'task',
        title: 'Prepare technical demo for CTO',
        description: 'Create custom demo showing API integrations and data pipeline capabilities',
        priority: 'high',
        source: 'manual',
        dueDate: addDays(new Date(), 4),
        completed: false,
        companyId: companies[0].id,
        dealId: deals[0].id,
        createdAt: subDays(new Date(), 1),
      },
    }),
  );

  // CloudScale activities
  events.push(
    await prisma.event.create({
      data: {
        tenantId: 'demo-tenant',
        type: 'meeting',
        title: 'Contract signing with Jennifer Walsh',
        description: 'Signed infrastructure modernization contract',
        outcome: 'Deal closed - won',
        source: 'manual',
        completed: true,
        companyId: companies[1].id,
        personId: people[2].id,
        dealId: deals[1].id,
        createdAt: subDays(new Date(), 15),
      },
    }),
    await prisma.event.create({
      data: {
        tenantId: 'demo-tenant',
        type: 'note',
        title: 'Customer onboarding started',
        description: 'Kicked off implementation with technical team',
        source: 'manual',
        companyId: companies[1].id,
        createdAt: subDays(new Date(), 10),
      },
    }),
  );

  // FinTech activities
  events.push(
    await prisma.event.create({
      data: {
        tenantId: 'demo-tenant',
        type: 'email',
        title: 'Sent revised proposal',
        description: 'Sent updated pricing with three tier options',
        source: 'manual',
        emailStatus: 'sent',
        companyId: companies[2].id,
        personId: people[3].id,
        dealId: deals[2].id,
        createdAt: subDays(new Date(), 7),
      },
    }),
    await prisma.event.create({
      data: {
        tenantId: 'demo-tenant',
        type: 'task',
        title: 'Follow up on proposal',
        description: 'Check if they have questions about the pricing tiers',
        priority: 'high',
        source: 'manual',
        dueDate: addDays(new Date(), 2),
        completed: false,
        companyId: companies[2].id,
        dealId: deals[2].id,
        createdAt: subDays(new Date(), 5),
      },
    }),
  );

  // StartupHub activities
  events.push(
    await prisma.event.create({
      data: {
        tenantId: 'demo-tenant',
        type: 'call',
        title: 'Discovery call with Klaus',
        description: 'Discussed their growth plans and budget constraints',
        outcome: 'Qualified - small deal potential',
        source: 'manual',
        companyId: companies[3].id,
        personId: people[5].id,
        dealId: deals[3].id,
        createdAt: subDays(new Date(), 2),
      },
    }),
  );

  // DataFlow activities
  events.push(
    await prisma.event.create({
      data: {
        tenantId: 'demo-tenant',
        type: 'email',
        title: 'Sent technical documentation',
        description: 'Shared data pipeline architecture docs',
        source: 'manual',
        emailStatus: 'opened',
        companyId: companies[4].id,
        personId: people[6].id,
        dealId: deals[4].id,
        createdAt: subDays(new Date(), 6),
      },
    }),
    await prisma.event.create({
      data: {
        tenantId: 'demo-tenant',
        type: 'task',
        title: 'Schedule needs assessment',
        description: 'Set up meeting with their engineering team',
        priority: 'medium',
        source: 'manual',
        dueDate: addDays(new Date(), 7),
        completed: false,
        companyId: companies[4].id,
        dealId: deals[4].id,
        createdAt: subDays(new Date(), 3),
      },
    }),
  );

  // EcoTech activities (lost deal)
  events.push(
    await prisma.event.create({
      data: {
        tenantId: 'demo-tenant',
        type: 'call',
        title: 'Lost deal - competitive pricing',
        description: 'They chose competitor with lower pricing',
        outcome: 'Lost to competition',
        source: 'manual',
        completed: true,
        companyId: companies[5].id,
        dealId: deals[5].id,
        createdAt: subDays(new Date(), 20),
      },
    }),
  );

  // NextGen activities
  events.push(
    await prisma.event.create({
      data: {
        tenantId: 'demo-tenant',
        type: 'meeting',
        title: 'Contract negotiation meeting',
        description: 'Discussed final terms and pricing adjustments',
        outcome: 'Contract terms agreed',
        source: 'manual',
        companyId: companies[6].id,
        personId: people[7].id,
        dealId: deals[6].id,
        createdAt: subDays(new Date(), 4),
      },
    }),
    await prisma.event.create({
      data: {
        tenantId: 'demo-tenant',
        type: 'task',
        title: 'Finalize contract and get signatures',
        description: 'Send final contract for legal review and signatures',
        priority: 'high',
        source: 'manual',
        dueDate: addDays(new Date(), 3),
        completed: false,
        companyId: companies[6].id,
        dealId: deals[6].id,
        createdAt: subDays(new Date(), 2),
      },
    }),
  );

  // HealthSync activities
  events.push(
    await prisma.event.create({
      data: {
        tenantId: 'demo-tenant',
        type: 'email',
        title: 'Sent initial outreach email',
        description: 'Healthcare platform intro and case studies',
        source: 'manual',
        emailStatus: 'opened',
        companyId: companies[7].id,
        personId: people[8].id,
        createdAt: subDays(new Date(), 10),
      },
    }),
    await prisma.event.create({
      data: {
        tenantId: 'demo-tenant',
        type: 'task',
        title: 'Follow up with HealthSync',
        description: 'Check if they are interested in a demo',
        priority: 'low',
        source: 'manual',
        dueDate: addDays(new Date(), 5),
        completed: false,
        companyId: companies[7].id,
        createdAt: subDays(new Date(), 8),
      },
    }),
  );

  console.log(`✅ Created ${events.length} events`);

  // 5. Create Email Sequences
  console.log('📧 Creating email sequences...');

  const sequences = await Promise.all([
    prisma.emailSequence.create({
      data: {
        tenantId: 'demo-tenant',
        name: 'New Lead Nurture Sequence',
        description: 'Welcome series for newly discovered leads',
        active: true,
        pauseOnDealCreation: true,
        steps: {
          create: [
            {
              stepOrder: 1,
              delayDays: 0,
              subject: 'Welcome to {{company.name}}!',
              body: 'Hi {{person.firstName}},\n\nI noticed your company, {{company.name}}, and thought you might be interested in how we help {{company.industry}} companies scale their operations.\n\nWould you be open to a quick 15-minute call to discuss your current challenges?\n\nBest regards,\nSales Team'
            },
            {
              stepOrder: 2,
              delayDays: 3,
              subject: 'Quick question about {{company.name}}',
              body: 'Hi {{person.firstName}},\n\nI wanted to follow up on my previous email. I\'ve been working with similar companies in {{company.geography}} and wanted to share some insights that might be valuable for you.\n\nWould next week work for a brief call?\n\nThanks,\nSales Team'
            },
            {
              stepOrder: 3,
              delayDays: 7,
              subject: 'Case study: How we helped similar companies',
              body: 'Hi {{person.firstName}},\n\nI wanted to share a recent case study of how we helped a {{company.industry}} company similar to {{company.name}} increase their efficiency by 40%.\n\n[Case study would be attached here]\n\nLet me know if you\'d like to discuss how this might apply to your situation.\n\nBest,\nSales Team'
            }
          ]
        }
      }
    }),
    prisma.emailSequence.create({
      data: {
        tenantId: 'demo-tenant',
        name: 'Demo Follow-up Sequence',
        description: 'Post-demo engagement sequence',
        active: true,
        pauseOnDealCreation: false,
        steps: {
          create: [
            {
              stepOrder: 1,
              delayDays: 0,
              subject: 'Thanks for the demo, {{person.firstName}}!',
              body: 'Hi {{person.firstName}},\n\nThank you for taking the time to see our demo today. I hope it gave you a clear picture of how we can help {{company.name}}.\n\nI\'ve attached the materials we discussed. Do you have any questions I can help answer?\n\nBest regards,\nSales Team'
            },
            {
              stepOrder: 2,
              delayDays: 2,
              subject: 'Quick follow-up on your demo',
              body: 'Hi {{person.firstName}},\n\nI wanted to check in and see if you had any questions about what we showed you.\n\nWould it be helpful to have a technical deep-dive with your team?\n\nLet me know!\nSales Team'
            },
            {
              stepOrder: 3,
              delayDays: 5,
              subject: 'Ready to move forward?',
              body: 'Hi {{person.firstName}},\n\nI wanted to reach out one more time to see if you\'re ready to move forward with {{company.name}}.\n\nI can prepare a custom proposal based on your specific needs. Would that be helpful?\n\nBest,\nSales Team'
            }
          ]
        }
      }
    }),
    prisma.emailSequence.create({
      data: {
        tenantId: 'demo-tenant',
        name: 'Re-engagement Sequence',
        description: 'For dormant leads that haven\'t responded',
        active: true,
        steps: {
          create: [
            {
              stepOrder: 1,
              delayDays: 0,
              subject: 'Should I close your file?',
              body: 'Hi {{person.firstName}},\n\nI haven\'t heard from you in a while, and I wanted to check if this is still a priority for {{company.name}}.\n\nIf not, I\'ll close your file. But if timing is just off, let me know when would be better to reconnect.\n\nBest,\nSales Team'
            },
            {
              stepOrder: 2,
              delayDays: 7,
              subject: 'One last check-in',
              body: 'Hi {{person.firstName}},\n\nThis will be my last email unless I hear from you.\n\nIf things change and you\'d like to revisit this conversation, please don\'t hesitate to reach out.\n\nWishing you success,\nSales Team'
            }
          ]
        }
      }
    })
  ]);

  console.log(`✅ Created ${sequences.length} email sequences`);

  // 6. Create Sequence Enrollments
  console.log('👥 Enrolling companies in sequences...');
  const enrollments = await Promise.all([
    prisma.sequenceEnrollment.create({
      data: {
        sequenceId: sequences[0].id,
        companyId: companies[0].id,
        enrolledAt: subDays(new Date(), 10),
        currentStep: 2,
      },
    }),
    prisma.sequenceEnrollment.create({
      data: {
        sequenceId: sequences[0].id,
        companyId: companies[3].id,
        enrolledAt: subDays(new Date(), 8),
        currentStep: 1,
      },
    }),
    prisma.sequenceEnrollment.create({
      data: {
        sequenceId: sequences[1].id,
        companyId: companies[1].id,
        enrolledAt: subDays(new Date(), 5),
        currentStep: 3,
        status: 'paused',
        pauseReason: 'Deal won',
      },
    }),
    prisma.sequenceEnrollment.create({
      data: {
        sequenceId: sequences[2].id,
        companyId: companies[4].id,
        enrolledAt: subDays(new Date(), 3),
        currentStep: 1,
      },
    }),
  ]);
  console.log('✅ Created sequence enrollments');

  // 7. Create Scheduled Emails
  console.log('📬 Creating scheduled emails...');
  const sequenceSteps = await Promise.all([
    prisma.emailSequenceStep.findFirst({
      where: { sequenceId: sequences[0].id, stepOrder: 1 },
    }),
    prisma.emailSequenceStep.findFirst({
      where: { sequenceId: sequences[1].id, stepOrder: 1 },
    }),
    prisma.emailSequenceStep.findFirst({
      where: { sequenceId: sequences[2].id, stepOrder: 1 },
    }),
  ]);

  await Promise.all([
    prisma.scheduledEmail.create({
      data: {
        enrollmentId: enrollments[0].id,
        stepOrder: 3,
        subject: sequenceSteps[0]?.subject || 'Follow up email',
        body: sequenceSteps[0]?.body || 'Follow up message',
        scheduledFor: addDays(new Date(), 1),
        status: 'scheduled',
      },
    }),
    prisma.scheduledEmail.create({
      data: {
        enrollmentId: enrollments[1].id,
        stepOrder: 2,
        subject: sequenceSteps[0]?.subject || 'Follow up email',
        body: sequenceSteps[0]?.body || 'Follow up message',
        scheduledFor: addDays(new Date(), 2),
        status: 'scheduled',
      },
    }),
    prisma.scheduledEmail.create({
      data: {
        enrollmentId: enrollments[3].id,
        stepOrder: 2,
        subject: sequenceSteps[2]?.subject || 'Re-engagement email',
        body: sequenceSteps[2]?.body || 'Re-engagement message',
        scheduledFor: addDays(new Date(), 7),
        status: 'scheduled',
      },
    }),
  ]);
  console.log('✅ Created scheduled emails');

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
