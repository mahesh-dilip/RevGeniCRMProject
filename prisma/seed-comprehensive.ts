import { PrismaClient } from '@prisma/client';
import { addDays, subDays, addHours } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive seed...\n');

  // Get or create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: 'cmhe200q80000196xmwn0p7cy' },
    update: {},
    create: {
      id: 'cmhe200q80000196xmwn0p7cy',
      name: 'RevGeni Demo Workspace',
      domain: 'demo.revgeni.ai',
    },
  });

  console.log('✅ Tenant ready\n');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.scheduledEmail.deleteMany({ where: { enrollment: { company: { tenantId: tenant.id } } } });
  await prisma.sequenceEnrollment.deleteMany({ where: { company: { tenantId: tenant.id } } });
  await prisma.emailSequenceStep.deleteMany({ where: { sequence: { tenantId: tenant.id } } });
  await prisma.emailSequence.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.event.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.deal.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.person.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.company.deleteMany({ where: { tenantId: tenant.id } });
  console.log('✅ Data cleared\n');

  // === COMPANIES (25 realistic tech companies) ===
  console.log('🏢 Creating 25 companies...');

  const companiesData = [
    // Tier 1: Enterprise customers (5)
    { name: 'TechVision Analytics', website: 'techvision.ai', industry: 'SaaS', size: '200-500 employees', geography: 'San Francisco, CA', stage: 'customer', leadSource: 'ai-generated', score: 95, description: 'Enterprise AI analytics platform for Fortune 500 companies', founded: 2018 },
    { name: 'CloudScale Systems', website: 'cloudscale.io', industry: 'Cloud Infrastructure', size: '500-1000 employees', geography: 'Austin, TX', stage: 'customer', leadSource: 'ai-generated', score: 98, description: 'Global cloud infrastructure provider with 50K+ enterprise clients', founded: 2015 },
    { name: 'DataStream Corp', website: 'datastream.com', industry: 'Data Analytics', size: '1000+ employees', geography: 'New York, NY', stage: 'customer', leadSource: 'referral', score: 92, description: 'Real-time data analytics and business intelligence platform', founded: 2012 },
    { name: 'SecureNet Solutions', website: 'securenet.io', industry: 'Cybersecurity', size: '500-1000 employees', geography: 'London, UK', stage: 'customer', leadSource: 'partner', score: 90, description: 'Enterprise cybersecurity and compliance platform', founded: 2014 },
    { name: 'FinanceHub Technologies', website: 'financehub.tech', industry: 'Fintech', size: '200-500 employees', geography: 'Singapore', stage: 'customer', leadSource: 'ai-generated', score: 88, description: 'Banking-as-a-Service platform for Southeast Asia', founded: 2017 },

    // Tier 2: Late-stage opportunities (8)
    { name: 'AutoScale AI', website: 'autoscale.ai', industry: 'AI/ML', size: '100-200 employees', geography: 'Boston, MA', stage: 'sql', leadSource: 'ai-generated', score: 85, description: 'Machine learning ops platform for model deployment', founded: 2019 },
    { name: 'MobileFirst Commerce', website: 'mobilefirst.com', industry: 'E-commerce', size: '50-200 employees', geography: 'Berlin, Germany', stage: 'opportunity', leadSource: 'website', score: 78, description: 'Mobile-optimized e-commerce platform for SMBs', founded: 2020 },
    { name: 'HealthTech Innovations', website: 'healthtech.io', industry: 'Healthcare Tech', size: '100-200 employees', geography: 'Toronto, Canada', stage: 'sql', leadSource: 'event', score: 82, description: 'Patient data platform and telehealth solutions', founded: 2018 },
    { name: 'EduLearn Platform', website: 'edulearn.com', industry: 'EdTech', size: '50-200 employees', geography: 'Sydney, Australia', stage: 'opportunity', leadSource: 'ai-generated', score: 75, description: 'Corporate training and skill development platform', founded: 2021 },
    { name: 'LogiChain Pro', website: 'logichain.pro', industry: 'Supply Chain', size: '200-500 employees', geography: 'Rotterdam, Netherlands', stage: 'sql', leadSource: 'partner', score: 80, description: 'Supply chain visibility and optimization software', founded: 2016 },
    { name: 'MediaStream Plus', website: 'mediastream.plus', industry: 'Media Tech', size: '50-100 employees', geography: 'Los Angeles, CA', stage: 'opportunity', leadSource: 'social', score: 72, description: 'Video streaming infrastructure for content creators', founded: 2020 },
    { name: 'GreenEnergy Solutions', website: 'greenenergy.io', industry: 'CleanTech', size: '100-200 employees', geography: 'Copenhagen, Denmark', stage: 'sql', leadSource: 'ai-generated', score: 77, description: 'Renewable energy monitoring and optimization', founded: 2019 },
    { name: 'RetailPro Analytics', website: 'retailpro.ai', industry: 'Retail Tech', size: '50-200 employees', geography: 'Chicago, IL', stage: 'opportunity', leadSource: 'paid_ads', score: 70, description: 'In-store analytics and customer insights for retailers', founded: 2021 },

    // Tier 3: Early-stage leads (8)
    { name: 'PropTech Ventures', website: 'proptech.ventures', industry: 'Real Estate Tech', size: '20-50 employees', geography: 'Miami, FL', stage: 'mql', leadSource: 'website', score: 62, description: 'Property management automation platform', founded: 2022 },
    { name: 'FoodTech Systems', website: 'foodtech.systems', industry: 'Food Tech', size: '10-50 employees', geography: 'Paris, France', stage: 'lead', leadSource: 'ai-generated', score: 58, description: 'Restaurant automation and delivery optimization', founded: 2023 },
    { name: 'TravelCloud Pro', website: 'travelcloud.pro', industry: 'Travel Tech', size: '50-100 employees', geography: 'Barcelona, Spain', stage: 'mql', leadSource: 'event', score: 65, description: 'Travel booking and itinerary management platform', founded: 2020 },
    { name: 'SportsTech Analytics', website: 'sportstech.ai', industry: 'Sports Tech', size: '10-50 employees', geography: 'Manchester, UK', stage: 'lead', leadSource: 'social', score: 55, description: 'Performance analytics for professional sports teams', founded: 2022 },
    { name: 'AgriSmart Solutions', website: 'agrismart.io', industry: 'AgTech', size: '20-50 employees', geography: 'Amsterdam, Netherlands', stage: 'mql', leadSource: 'ai-generated', score: 60, description: 'IoT sensors and analytics for precision agriculture', founded: 2021 },
    { name: 'LegalTech Pro', website: 'legaltech.pro', industry: 'Legal Tech', size: '50-100 employees', geography: 'Washington DC', stage: 'lead', leadSource: 'referral', score: 52, description: 'Document automation for law firms', founded: 2022 },
    { name: 'InsureTech Hub', website: 'insuretech.hub', industry: 'InsurTech', size: '20-50 employees', geography: 'Zurich, Switzerland', stage: 'mql', leadSource: 'website', score: 63, description: 'Insurance underwriting automation platform', founded: 2021 },
    { name: 'ConstructPro Digital', website: 'constructpro.digital', industry: 'Construction Tech', size: '10-50 employees', geography: 'Dubai, UAE', stage: 'lead', leadSource: 'ai-generated', score: 48, description: 'Project management for construction companies', founded: 2023 },

    // Tier 4: Lower priority / Lost (4)
    { name: 'StartupLabs Inc', website: 'startuplabs.co', industry: 'Business Services', size: '10-20 employees', geography: 'Austin, TX', stage: 'other', leadSource: 'event', score: 35, description: 'Startup incubator and coworking space', founded: 2022 },
    { name: 'BudgetSoft Solutions', website: 'budgetsoft.com', industry: 'Accounting', size: '5-10 employees', geography: 'Portland, OR', stage: 'other', leadSource: 'website', score: 28, description: 'Simple bookkeeping software for freelancers', founded: 2023 },
    { name: 'GenericTech Corp', website: 'generictech.biz', industry: 'IT Services', size: '50-100 employees', geography: 'Mumbai, India', stage: 'other', leadSource: 'cold_email', score: 22, description: 'General IT consulting and outsourcing', founded: 2020 },
  ];

  const companies = await Promise.all(
    companiesData.map((data, idx) => prisma.company.create({
      data: {
        tenantId: tenant.id,
        name: data.name,
        website: `https://${data.website}`,
        industry: data.industry,
        size: data.size,
        geography: data.geography,
        lifecycleStage: data.stage,
        leadSource: data.leadSource,
        sourceType: data.leadSource === 'ai-generated' ? 'ai-generated' : 'manual',
        leadScore: data.score,
        description: data.description,
        foundedYear: data.founded,
        status: data.stage === 'customer' ? 'Customer' : data.stage === 'sql' || data.stage === 'opportunity' ? 'Qualified' : 'Lead',
        emailOpens: Math.floor(Math.random() * 40) + 5,
        emailClicks: Math.floor(Math.random() * 15) + 2,
        websiteVisits: Math.floor(Math.random() * 50) + 10,
        lastEngaged: subDays(new Date(), Math.floor(Math.random() * 30) + 1),
      }
    }))
  );
  console.log(`✅ Created ${companies.length} companies\n`);

  // === PEOPLE (50+ contacts) ===
  console.log('👥 Creating 50+ contacts...');

  const peopleData = [
    // TechVision Analytics (4 contacts)
    { firstName: 'Sarah', lastName: 'Chen', email: 'sarah.chen@techvision.ai', phone: '+1-415-555-0101', title: 'VP of Sales', linkedin: 'sarahchen', companyIdx: 0 },
    { firstName: 'Michael', lastName: 'Rodriguez', email: 'michael.r@techvision.ai', phone: '+1-415-555-0102', title: 'CTO', linkedin: 'mrodriguez-tech', companyIdx: 0 },
    { firstName: 'Emily', lastName: 'Watson', email: 'emily.watson@techvision.ai', phone: '+1-415-555-0103', title: 'CEO', linkedin: 'emilywatson', companyIdx: 0 },
    { firstName: 'James', lastName: 'Park', email: 'james.park@techvision.ai', title: 'Product Manager', companyIdx: 0 },

    // CloudScale Systems (3 contacts)
    { firstName: 'Jennifer', lastName: 'Walsh', email: 'j.walsh@cloudscale.io', phone: '+1-512-555-0201', title: 'CEO', linkedin: 'jenniferwalsh', companyIdx: 1 },
    { firstName: 'Robert', lastName: 'Kim', email: 'robert.kim@cloudscale.io', phone: '+1-512-555-0202', title: 'VP of Engineering', linkedin: 'robert-kim', companyIdx: 1 },
    { firstName: 'Lisa', lastName: 'Martinez', email: 'lisa.m@cloudscale.io', title: 'Head of Sales', companyIdx: 1 },

    // DataStream Corp (3 contacts)
    { firstName: 'David', lastName: 'Thompson', email: 'dthompson@datastream.com', phone: '+1-212-555-0301', title: 'CRO', linkedin: 'davidthompson', companyIdx: 2 },
    { firstName: 'Anna', lastName: 'Kowalski', email: 'anna.k@datastream.com', phone: '+1-212-555-0302', title: 'VP of Product', linkedin: 'anna-kowalski', companyIdx: 2 },
    { firstName: 'Marcus', lastName: 'Johnson', email: 'mjohnson@datastream.com', title: 'Director of Analytics', companyIdx: 2 },

    // SecureNet Solutions (2 contacts)
    { firstName: 'Oliver', lastName: 'Bennett', email: 'o.bennett@securenet.io', phone: '+44-20-5555-0401', title: 'CISO', linkedin: 'oliver-bennett', companyIdx: 3 },
    { firstName: 'Sophie', lastName: 'Clark', email: 'sophie.clark@securenet.io', title: 'VP of Compliance', companyIdx: 3 },

    // FinanceHub Technologies (2 contacts)
    { firstName: 'Wei', lastName: 'Zhang', email: 'wei.zhang@financehub.tech', phone: '+65-6555-0501', title: 'CEO', linkedin: 'wei-zhang-sg', companyIdx: 4 },
    { firstName: 'Priya', lastName: 'Sharma', email: 'priya.s@financehub.tech', title: 'Head of Operations', companyIdx: 4 },

    // AutoScale AI (2 contacts)
    { firstName: 'Rachel', lastName: 'Kim', email: 'rachel@autoscale.ai', phone: '+1-617-555-0601', title: 'VP of ML Engineering', linkedin: 'rachelkim-ai', companyIdx: 5 },
    { firstName: 'Thomas', lastName: 'Anderson', email: 't.anderson@autoscale.ai', title: 'Co-founder & CEO', companyIdx: 5 },

    // MobileFirst Commerce (2 contacts)
    { firstName: 'Hans', lastName: 'Mueller', email: 'hans@mobilefirst.com', phone: '+49-30-5555-0701', title: 'Head of Sales', linkedin: 'hansmueller', companyIdx: 6 },
    { firstName: 'Katrin', lastName: 'Schmidt', email: 'katrin.s@mobilefirst.com', title: 'Product Lead', companyIdx: 6 },

    // HealthTech Innovations (2 contacts)
    { firstName: 'Maria', lastName: 'Rodriguez', email: 'maria@healthtech.io', phone: '+1-416-555-0801', title: 'CEO', linkedin: 'maria-rodriguez-health', companyIdx: 7 },
    { firstName: 'John', lastName: 'Chang', email: 'john.chang@healthtech.io', title: 'CTO', companyIdx: 7 },

    // EduLearn Platform (2 contacts)
    { firstName: 'Emma', lastName: 'Wilson', email: 'emma@edulearn.com', phone: '+61-2-5555-0901', title: 'Head of Product', linkedin: 'emmawilson-edu', companyIdx: 8 },
    { firstName: 'Daniel', lastName: 'Brown', email: 'daniel.b@edulearn.com', title: 'VP of Sales', companyIdx: 8 },

    // LogiChain Pro (2 contacts)
    { firstName: 'Lars', lastName: 'Van Dijk', email: 'lars@logichain.pro', phone: '+31-10-5555-1001', title: 'CEO', linkedin: 'larsvandijk', companyIdx: 9 },
    { firstName: 'Anna', lastName: 'Jansen', email: 'anna.j@logichain.pro', title: 'COO', companyIdx: 9 },

    // MediaStream Plus (2 contacts)
    { firstName: 'Alex', lastName: 'Rivera', email: 'alex@mediastream.plus', phone: '+1-310-555-1101', title: 'Founder & CEO', linkedin: 'alex-rivera-media', companyIdx: 10 },
    { firstName: 'Jessica', lastName: 'Lee', email: 'jessica.lee@mediastream.plus', title: 'VP of Engineering', companyIdx: 10 },

    // GreenEnergy Solutions (2 contacts)
    { firstName: 'Erik', lastName: 'Nielsen', email: 'erik@greenenergy.io', phone: '+45-3555-1201', title: 'CEO', linkedin: 'eriknielsen', companyIdx: 11 },
    { firstName: 'Sofia', lastName: 'Larsen', email: 'sofia.l@greenenergy.io', title: 'Head of Sales', companyIdx: 11 },

    // RetailPro Analytics (2 contacts)
    { firstName: 'Patricia', lastName: 'Davis', email: 'patricia@retailpro.ai', phone: '+1-312-555-1301', title: 'VP of Product', linkedin: 'patricia-davis-retail', companyIdx: 12 },
    { firstName: 'Mark', lastName: 'Taylor', email: 'mark.t@retailpro.ai', title: 'Director of Sales', companyIdx: 12 },

    // PropTech Ventures (2 contacts)
    { firstName: 'Carlos', lastName: 'Gomez', email: 'carlos@proptech.ventures', phone: '+1-305-555-1401', title: 'Founder & CEO', linkedin: 'carlosgomez-prop', companyIdx: 13 },
    { firstName: 'Amanda', lastName: 'White', email: 'amanda.w@proptech.ventures', title: 'Head of Product', companyIdx: 13 },

    // FoodTech Systems (2 contacts)
    { firstName: 'Pierre', lastName: 'Dubois', email: 'pierre@foodtech.systems', phone: '+33-1-5555-1501', title: 'CEO', linkedin: 'pierredubois', companyIdx: 14 },
    { firstName: 'Marie', lastName: 'Laurent', email: 'marie.l@foodtech.systems', title: 'VP of Operations', companyIdx: 14 },

    // TravelCloud Pro (2 contacts)
    { firstName: 'Miguel', lastName: 'Garcia', email: 'miguel@travelcloud.pro', phone: '+34-93-5555-1601', title: 'CEO', linkedin: 'miguelgarcia-travel', companyIdx: 15 },
    { firstName: 'Isabella', lastName: 'Martinez', email: 'isabella.m@travelcloud.pro', title: 'Head of Sales', companyIdx: 15 },

    // SportsTech Analytics (2 contacts)
    { firstName: 'James', lastName: 'Cooper', email: 'james@sportstech.ai', phone: '+44-161-5555-1701', title: 'Founder', linkedin: 'jamescooper-sports', companyIdx: 16 },
    { firstName: 'Lucy', lastName: 'Turner', email: 'lucy.t@sportstech.ai', title: 'Product Manager', companyIdx: 16 },

    // AgriSmart Solutions (2 contacts)
    { firstName: 'Jan', lastName: 'De Vries', email: 'jan@agrismart.io', phone: '+31-20-5555-1801', title: 'CEO', linkedin: 'jandevries', companyIdx: 17 },
    { firstName: 'Eva', lastName: 'Bakker', email: 'eva.b@agrismart.io', title: 'VP of Sales', companyIdx: 17 },

    // LegalTech Pro (2 contacts)
    { firstName: 'Rebecca', lastName: 'Foster', email: 'rebecca@legaltech.pro', phone: '+1-202-555-1901', title: 'CEO', linkedin: 'rebeccafoster-legal', companyIdx: 18 },
    { firstName: 'William', lastName: 'Harris', email: 'william.h@legaltech.pro', title: 'VP of Product', companyIdx: 18 },

    // InsureTech Hub (2 contacts)
    { firstName: 'Klaus', lastName: 'Weber', email: 'klaus@insuretech.hub', phone: '+41-44-5555-2001', title: 'CEO', linkedin: 'klausweber', companyIdx: 19 },
    { firstName: 'Anna', lastName: 'Fischer', email: 'anna.f@insuretech.hub', title: 'Head of Underwriting', companyIdx: 19 },

    // ConstructPro Digital (2 contacts)
    { firstName: 'Ahmed', lastName: 'Al-Maktoum', email: 'ahmed@constructpro.digital', phone: '+971-4-5555-2101', title: 'Founder & CEO', linkedin: 'ahmedalmaktoum', companyIdx: 20 },
    { firstName: 'Fatima', lastName: 'Hassan', email: 'fatima.h@constructpro.digital', title: 'Project Manager', companyIdx: 20 },

    // StartupLabs Inc (1 contact)
    { firstName: 'Jake', lastName: 'Morrison', email: 'jake@startuplabs.co', phone: '+1-512-555-2201', title: 'Founder', linkedin: 'jakemorrison', companyIdx: 21 },

    // BudgetSoft Solutions (1 contact)
    { firstName: 'Linda', lastName: 'Peters', email: 'linda@budgetsoft.com', title: 'CEO', companyIdx: 22 },

    // GenericTech Corp (1 contact)
    { firstName: 'Raj', lastName: 'Patel', email: 'raj.patel@generictech.biz', phone: '+91-22-5555-2301', title: 'Managing Director', companyIdx: 23 },
  ];

  const people = await Promise.all(
    peopleData.map((data) => prisma.person.create({
      data: {
        tenantId: tenant.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        title: data.title,
        linkedin: data.linkedin ? `https://linkedin.com/in/${data.linkedin}` : undefined,
        companyId: companies[data.companyIdx].id,
      }
    }))
  );
  console.log(`✅ Created ${people.length} contacts\n`);

  // === DEALS (40+ deals across all stages) ===
  console.log('💼 Creating 40+ deals...');

  const stages = ['Prospecting', 'Qualified', 'Demo', 'Proposal', 'Negotiation', 'Won', 'Lost'];
  const deals: any[] = [];

  // Enterprise customers - Won deals (5)
  deals.push(
    { title: 'TechVision - Enterprise Analytics Platform', value: 450000, stage: 'Won', prob: 100, closeDate: subDays(new Date(), 45), companyIdx: 0, contactIdx: 0, desc: 'Full enterprise analytics suite with custom integrations and dedicated support' },
    { title: 'CloudScale - Infrastructure Modernization', value: 850000, stage: 'Won', prob: 100, closeDate: subDays(new Date(), 60), companyIdx: 1, contactIdx: 4, desc: 'Multi-year cloud infrastructure transformation project' },
    { title: 'DataStream - Advanced Analytics Package', value: 620000, stage: 'Won', prob: 100, closeDate: subDays(new Date(), 30), companyIdx: 2, contactIdx: 7, desc: 'Real-time analytics platform implementation' },
    { title: 'SecureNet - Enterprise Security Suite', value: 380000, stage: 'Won', prob: 100, closeDate: subDays(new Date(), 20), companyIdx: 3, contactIdx: 10, desc: 'Comprehensive cybersecurity solution rollout' },
    { title: 'FinanceHub - Banking Platform Integration', value: 525000, stage: 'Won', prob: 100, closeDate: subDays(new Date(), 50), companyIdx: 4, contactIdx: 12, desc: 'Core banking system integration project' }
  );

  // Late-stage opportunities - Negotiation (6)
  deals.push(
    { title: 'AutoScale - MLOps Platform', value: 280000, stage: 'Negotiation', prob: 80, closeDate: addDays(new Date(), 15), companyIdx: 5, contactIdx: 14, desc: 'ML model deployment and monitoring platform', nextAction: 'Finalize pricing and contract terms' },
    { title: 'MobileFirst - E-commerce Expansion', value: 185000, stage: 'Negotiation', prob: 75, closeDate: addDays(new Date(), 20), companyIdx: 6, contactIdx: 16, desc: 'Mobile e-commerce platform scaling', nextAction: 'Negotiate payment terms' },
    { title: 'HealthTech - Patient Platform Upgrade', value: 340000, stage: 'Negotiation', prob: 85, closeDate: addDays(new Date(), 18), companyIdx: 7, contactIdx: 18, desc: 'Telehealth platform enhancement', nextAction: 'Get legal approval on MSA' },
    { title: 'LogiChain - Supply Chain Optimization', value: 420000, stage: 'Negotiation', prob: 70, closeDate: addDays(new Date(), 25), companyIdx: 9, contactIdx: 22, desc: 'End-to-end supply chain visibility platform', nextAction: 'Schedule executive review meeting' },
    { title: 'GreenEnergy - Energy Analytics Suite', value: 295000, stage: 'Negotiation', prob: 75, closeDate: addDays(new Date(), 22), companyIdx: 11, contactIdx: 26, desc: 'Renewable energy monitoring and optimization', nextAction: 'Finalize SLA terms' },
    { title: 'RetailPro - Store Analytics Platform', value: 165000, stage: 'Negotiation', prob: 65, closeDate: addDays(new Date(), 30), companyIdx: 12, contactIdx: 28, desc: 'In-store customer analytics solution', nextAction: 'Address data privacy concerns' }
  );

  // Proposal stage (7)
  deals.push(
    { title: 'EduLearn - Corporate Training Platform', value: 145000, stage: 'Proposal', prob: 60, closeDate: addDays(new Date(), 35), companyIdx: 8, contactIdx: 20, desc: 'Employee skill development platform', nextAction: 'Send revised proposal with tier options' },
    { title: 'MediaStream - Infrastructure Upgrade', value: 225000, stage: 'Proposal', prob: 55, closeDate: addDays(new Date(), 40), companyIdx: 10, contactIdx: 24, desc: 'Video streaming CDN expansion', nextAction: 'Schedule technical deep-dive' },
    { title: 'PropTech - Property Management Suite', value: 95000, stage: 'Proposal', prob: 50, closeDate: addDays(new Date(), 45), companyIdx: 13, contactIdx: 30, desc: 'Automated property management platform', nextAction: 'Present ROI analysis' },
    { title: 'TravelCloud - Booking System Integration', value: 175000, stage: 'Proposal', prob: 55, closeDate: addDays(new Date(), 38), companyIdx: 15, contactIdx: 34, desc: 'Travel booking and CRM integration', nextAction: 'Provide integration timeline' },
    { title: 'AgriSmart - IoT Sensor Platform', value: 125000, stage: 'Proposal', prob: 45, closeDate: addDays(new Date(), 50), companyIdx: 17, contactIdx: 38, desc: 'Agricultural IoT deployment', nextAction: 'Send pricing breakdown' },
    { title: 'InsureTech - Underwriting Automation', value: 210000, stage: 'Proposal', prob: 60, closeDate: addDays(new Date(), 42), companyIdx: 19, contactIdx: 42, desc: 'AI-powered underwriting platform', nextAction: 'Demonstrate compliance features' },
    { title: 'TechVision - Additional Module', value: 85000, stage: 'Proposal', prob: 70, closeDate: addDays(new Date(), 28), companyIdx: 0, contactIdx: 1, desc: 'Advanced reporting module add-on', nextAction: 'Finalize scope of work' }
  );

  // Demo stage (6)
  deals.push(
    { title: 'FoodTech - Restaurant Automation', value: 115000, stage: 'Demo', prob: 45, closeDate: addDays(new Date(), 55), companyIdx: 14, contactIdx: 32, desc: 'Restaurant operations automation', nextAction: 'Schedule product demo next week' },
    { title: 'SportsTech - Analytics Platform', value: 88000, stage: 'Demo', prob: 40, closeDate: addDays(new Date(), 60), companyIdx: 16, contactIdx: 36, desc: 'Sports performance analytics', nextAction: 'Prepare customized demo' },
    { title: 'LegalTech - Document Automation', value: 135000, stage: 'Demo', prob: 50, closeDate: addDays(new Date(), 52), companyIdx: 18, contactIdx: 40, desc: 'Legal document automation system', nextAction: 'Demo scheduled for next Tuesday' },
    { title: 'ConstructPro - Project Management', value: 98000, stage: 'Demo', prob: 35, closeDate: addDays(new Date(), 65), companyIdx: 20, contactIdx: 44, desc: 'Construction project tracking platform', nextAction: 'Set up demo environment' },
    { title: 'CloudScale - Additional Services', value: 275000, stage: 'Demo', prob: 65, closeDate: addDays(new Date(), 40), companyIdx: 1, contactIdx: 5, desc: 'Managed services expansion', nextAction: 'Demo new features to ops team' },
    { title: 'DataStream - Expansion Deal', value: 185000, stage: 'Demo', prob: 60, closeDate: addDays(new Date(), 45), companyIdx: 2, contactIdx: 8, desc: 'Additional analytics modules', nextAction: 'Technical demo with data team' }
  );

  // Qualified stage (8)
  deals.push(
    { title: 'AutoScale - Starter Package', value: 75000, stage: 'Qualified', prob: 40, closeDate: addDays(new Date(), 70), companyIdx: 5, contactIdx: 15, desc: 'Entry-level MLOps platform', nextAction: 'Discovery call scheduled' },
    { title: 'MobileFirst - Additional Markets', value: 125000, stage: 'Qualified', prob: 45, closeDate: addDays(new Date(), 65), companyIdx: 6, contactIdx: 17, desc: 'Geographic expansion support', nextAction: 'Needs assessment meeting' },
    { title: 'HealthTech - Compliance Add-on', value: 95000, stage: 'Qualified', prob: 35, closeDate: addDays(new Date(), 75), companyIdx: 7, contactIdx: 19, desc: 'Healthcare compliance module', nextAction: 'Technical requirements review' },
    { title: 'EduLearn - Enterprise Tier', value: 165000, stage: 'Qualified', prob: 50, closeDate: addDays(new Date(), 60), companyIdx: 8, contactIdx: 21, desc: 'Large enterprise deployment', nextAction: 'Qualify budget and timeline' },
    { title: 'MediaStream - Basic Package', value: 85000, stage: 'Qualified', prob: 30, closeDate: addDays(new Date(), 80), companyIdx: 10, contactIdx: 25, desc: 'Streaming infrastructure starter', nextAction: 'Understand technical requirements' },
    { title: 'RetailPro - Pilot Program', value: 45000, stage: 'Qualified', prob: 40, closeDate: addDays(new Date(), 70), companyIdx: 12, contactIdx: 29, desc: 'Limited store pilot deployment', nextAction: 'Define pilot scope' },
    { title: 'PropTech - SMB Package', value: 55000, stage: 'Qualified', prob: 35, closeDate: addDays(new Date(), 75), companyIdx: 13, contactIdx: 31, desc: 'Small property portfolio solution', nextAction: 'Discovery call next week' },
    { title: 'TravelCloud - API Integration', value: 65000, stage: 'Qualified', prob: 45, closeDate: addDays(new Date(), 65), companyIdx: 15, contactIdx: 35, desc: 'Third-party API integrations', nextAction: 'Technical feasibility review' }
  );

  // Prospecting stage (6)
  deals.push(
    { title: 'FoodTech - Basic Automation', value: 48000, stage: 'Prospecting', prob: 25, closeDate: addDays(new Date(), 90), companyIdx: 14, contactIdx: 33, desc: 'Entry-level restaurant automation', nextAction: 'Initial outreach completed' },
    { title: 'SportsTech - Pilot Program', value: 38000, stage: 'Prospecting', prob: 20, closeDate: addDays(new Date(), 95), companyIdx: 16, contactIdx: 37, desc: 'Limited analytics trial', nextAction: 'Schedule discovery call' },
    { title: 'AgriSmart - Basic Sensors', value: 52000, stage: 'Prospecting', prob: 30, closeDate: addDays(new Date(), 85), companyIdx: 17, contactIdx: 39, desc: 'Small farm IoT deployment', nextAction: 'Send information packet' },
    { title: 'LegalTech - Solo Practitioner', value: 28000, stage: 'Prospecting', prob: 25, closeDate: addDays(new Date(), 90), companyIdx: 18, contactIdx: 41, desc: 'Individual lawyer automation', nextAction: 'Cold outreach follow-up' },
    { title: 'InsureTech - Pilot Implementation', value: 75000, stage: 'Prospecting', prob: 30, closeDate: addDays(new Date(), 85), companyIdx: 19, contactIdx: 43, desc: 'Limited underwriting automation trial', nextAction: 'Qualify decision makers' },
    { title: 'ConstructPro - Small Projects', value: 42000, stage: 'Prospecting', prob: 20, closeDate: addDays(new Date(), 100), companyIdx: 20, contactIdx: 45, desc: 'Small construction project tracking', nextAction: 'Initial discovery scheduled' }
  );

  // Lost deals (4)
  deals.push(
    { title: 'StartupLabs - Coworking Platform', value: 35000, stage: 'Lost', prob: 0, closeDate: subDays(new Date(), 10), companyIdx: 21, contactIdx: 46, desc: 'Community management platform', lostReason: 'Budget constraints - went with competitor' },
    { title: 'BudgetSoft - Accounting Integration', value: 18000, stage: 'Lost', prob: 0, closeDate: subDays(new Date(), 25), companyIdx: 22, contactIdx: 47, desc: 'Basic accounting software integration', lostReason: 'Not ready to commit - timing issues' },
    { title: 'GenericTech - Staff Augmentation', value: 45000, stage: 'Lost', prob: 0, closeDate: subDays(new Date(), 15), companyIdx: 23, contactIdx: 48, desc: 'IT consulting services', lostReason: 'Lost to cheaper offshore alternative' },
    { title: 'GreenEnergy - Basic Monitoring', value: 62000, stage: 'Lost', prob: 0, closeDate: subDays(new Date(), 8), companyIdx: 11, contactIdx: 27, desc: 'Simple energy monitoring dashboard', lostReason: 'Feature gaps - building in-house instead' }
  );

  const createdDeals = await Promise.all(
    deals.map(async (data) => {
      const deal = await prisma.deal.create({
        data: {
          tenantId: tenant.id,
          title: data.title,
          value: data.value,
          stage: data.stage,
          probability: data.prob,
          closeDate: data.closeDate,
          description: data.desc,
          nextAction: data.nextAction,
          lostReason: data.lostReason,
          companyId: companies[data.companyIdx].id,
          primaryContactId: people[data.contactIdx].id,
          stageChangedAt: data.stage === 'Won' || data.stage === 'Lost' ? data.closeDate : subDays(new Date(), Math.floor(Math.random() * 14) + 1),
        }
      });
      return deal;
    })
  );
  console.log(`✅ Created ${createdDeals.length} deals\n`);

  console.log('✅ Comprehensive seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - Companies: ${companies.length}`);
  console.log(`   - Contacts: ${people.length}`);
  console.log(`   - Deals: ${createdDeals.length}`);
  console.log(`   - Pipeline Value: $${createdDeals.reduce((sum, d) => sum + (d.value || 0), 0).toLocaleString()}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
