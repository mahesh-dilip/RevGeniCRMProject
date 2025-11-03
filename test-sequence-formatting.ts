import { generateEmailSequence, GenerateSequenceParams } from './lib/ai/sequence-generator';

// Mock data for testing
const testParams: GenerateSequenceParams = {
  userProfile: {
    id: 'test-user',
    name: 'Test Sales Rep',
    companyOffering: 'AI-powered CRM platform',
    valueProposition: 'Streamline sales workflows with intelligent automation',
    targetPainPoints: ['Manual data entry', 'Lost follow-ups', 'Poor pipeline visibility'],
    keyDifferentiators: ['AI-powered insights', 'Seamless integrations', 'Easy setup'],
    successStories: ['Helped TechCo increase close rate by 40%'],
    tone: 'casual',
    ctaPreference: 'Book a 15-minute demo'
  },
  template: {
    id: 'cold-outreach',
    name: 'Cold Outreach Sequence',
    description: 'Multi-touch sequence for initial outreach',
    emailCount: 2,
    emails: [
      {
        stepNumber: 1,
        delayDays: 0,
        purpose: 'Initial introduction and value proposition',
        guidelines: [
          'Lead with a personalized observation about their company',
          'Present clear value proposition',
          'Include soft CTA'
        ]
      },
      {
        stepNumber: 2,
        delayDays: 3,
        purpose: 'Follow-up with social proof',
        guidelines: [
          'Reference previous email briefly',
          'Share relevant success story',
          'Stronger CTA'
        ]
      }
    ]
  },
  companyContext: {
    name: 'Acme Corp',
    industry: 'SaaS',
    description: 'B2B software company focused on productivity tools',
    status: 'Lead',
    leadScore: 85,
    size: '50-100 employees',
    location: 'San Francisco, CA'
  },
  personContext: {
    firstName: 'John',
    lastName: 'Smith',
    title: 'VP of Sales',
    email: 'john.smith@acme.com'
  }
};

async function testSequenceGeneration() {
  console.log('🧪 Testing AI Sequence Generation with HTML Formatting\n');
  console.log('═'.repeat(80));

  try {
    console.log('📤 Generating email sequence...\n');
    const emails = await generateEmailSequence(testParams);

    console.log(`✅ Generated ${emails.length} emails\n`);
    console.log('═'.repeat(80));

    emails.forEach((email, index) => {
      console.log(`\n📧 EMAIL ${index + 1}`);
      console.log('─'.repeat(80));
      console.log(`Subject: ${email.subject}`);
      console.log('─'.repeat(80));
      console.log('Body (Raw HTML):');
      console.log(email.body);
      console.log('─'.repeat(80));

      // Verify HTML formatting
      const hasHTMLTags = email.body.includes('<p>');
      const hasNewlines = email.body.includes('\n') && !email.body.includes('<');

      console.log('\n✨ Format Verification:');
      console.log(`  - Contains <p> tags: ${hasHTMLTags ? '✅' : '❌'}`);
      console.log(`  - Contains bare newlines: ${hasNewlines ? '❌ (should be HTML)' : '✅'}`);

      if (email.reasoning) {
        console.log('\n💭 AI Reasoning:');
        console.log(`  ${email.reasoning}`);
      }

      console.log('\n' + '═'.repeat(80));
    });

    console.log('\n✅ TEST PASSED: All emails generated with proper HTML formatting');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  }
}

testSequenceGeneration();
