import { SequenceTemplate } from '@/lib/ai/sequence-generator';

/**
 * Pre-built email sequence templates
 * Each template defines the structure, timing, and purpose of emails in the sequence
 */

export const SEQUENCE_TEMPLATES: SequenceTemplate[] = [
  {
    id: 'cold-outreach-3',
    name: 'Cold Outreach (3 emails)',
    description:
      'Initial contact sequence for prospects who have never engaged with you. Focuses on building awareness, demonstrating value, and starting a conversation.',
    emailCount: 3,
    emails: [
      {
        stepNumber: 1,
        delayDays: 0,
        purpose: 'Initial contact - introduce yourself and establish relevance',
        guidelines: [
          'Lead with a specific observation about their company or industry',
          'Clearly state your value proposition in context of their business',
          'Include one concrete success story or proof point',
          'End with a low-friction call-to-action (e.g., "Would you be open to a brief conversation?")',
          'Keep it concise - 150-200 words maximum',
        ],
      },
      {
        stepNumber: 2,
        delayDays: 3,
        purpose: 'Follow-up - provide additional value and address potential objections',
        guidelines: [
          'Acknowledge your previous email briefly and naturally',
          'Introduce a different value angle or use case',
          'Share a relevant resource, insight, or case study',
          'Make it even shorter than Email 1 (100-150 words)',
          'Lower the friction further (e.g., "Happy to share more details if this resonates")',
        ],
      },
      {
        stepNumber: 3,
        delayDays: 7,
        purpose: 'Final touch - last value-add before graceful exit',
        guidelines: [
          'Open with genuine value (free resource, insight, or helpful content)',
          'Be transparent that this is your final follow-up',
          'Leave the door open for future contact',
          'No pressure - make it easy for them to say no or defer',
          'Under 100 words - shortest of the sequence',
        ],
      },
    ],
  },
  {
    id: 'demo-followup-2',
    name: 'Follow-up After Demo (2 emails)',
    description:
      'Nurture sequence for prospects who have attended a demo or initial meeting. Reinforces value discussed and moves them toward next steps.',
    emailCount: 2,
    emails: [
      {
        stepNumber: 1,
        delayDays: 0,
        purpose: 'Immediate demo follow-up - recap and reinforce value',
        guidelines: [
          'Reference specific points discussed in the demo',
          'Reiterate how your solution addresses their stated pain points',
          'Attach relevant resources mentioned during the demo',
          'Propose clear next steps or timeline',
          'Include a specific call-to-action (schedule next meeting, review proposal, etc.)',
        ],
      },
      {
        stepNumber: 2,
        delayDays: 4,
        purpose: 'Check-in and remove barriers to next step',
        guidelines: [
          'Check if they had a chance to review materials sent',
          'Address any questions or concerns proactively',
          'Share an additional success story highly relevant to their use case',
          'Make it easy to move forward with specific time/date options',
          'Express genuine interest in helping them solve their challenge',
        ],
      },
    ],
  },
  {
    id: 'customer-onboarding-5',
    name: 'Customer Onboarding (5 emails)',
    description:
      'Welcome and onboarding sequence for new customers. Guides them through setup, highlights key features, and ensures early success.',
    emailCount: 5,
    emails: [
      {
        stepNumber: 1,
        delayDays: 0,
        purpose: 'Welcome and first steps',
        guidelines: [
          'Welcome them warmly and express appreciation for their business',
          'Outline what they can expect during onboarding',
          'Provide immediate next steps (e.g., setup guide, first login)',
          'Include key contact information for support',
          'Set expectations for follow-up communication',
        ],
      },
      {
        stepNumber: 2,
        delayDays: 2,
        purpose: 'Getting started guide',
        guidelines: [
          'Check in on their progress with initial setup',
          'Highlight 3-4 essential features to start with',
          'Provide quick-start resources or video tutorials',
          'Offer specific office hours or onboarding call if appropriate',
          'Reassure them that support is available',
        ],
      },
      {
        stepNumber: 3,
        delayDays: 5,
        purpose: 'Advanced features and best practices',
        guidelines: [
          'Congratulate them on getting started',
          'Introduce more advanced features that add value',
          'Share best practices from similar customers',
          'Highlight time-saving tips or shortcuts',
          'Invite questions or feedback',
        ],
      },
      {
        stepNumber: 4,
        delayDays: 10,
        purpose: 'Success stories and community',
        guidelines: [
          'Share success stories from similar customers',
          'Invite them to join community resources (forums, webinars, user groups)',
          'Highlight upcoming training or educational opportunities',
          'Check in on overall experience so far',
          'Reinforce value they\'re gaining',
        ],
      },
      {
        stepNumber: 5,
        delayDays: 20,
        purpose: 'Optimization and growth',
        guidelines: [
          'Acknowledge their progress as a customer',
          'Share optimization tips based on their usage',
          'Introduce complementary features or services that could add value',
          'Request feedback or testimonial if appropriate',
          'Confirm they know how to reach support and success team',
        ],
      },
    ],
  },
  {
    id: 're-engagement-4',
    name: 'Re-engagement Campaign (4 emails)',
    description:
      'Win-back sequence for prospects who engaged previously but went cold. Aims to reignite interest with new value and fresh perspective.',
    emailCount: 4,
    emails: [
      {
        stepNumber: 1,
        delayDays: 0,
        purpose: 'Re-introduction with new value',
        guidelines: [
          'Acknowledge previous interaction without being pushy',
          'Share what\'s new or changed since your last conversation',
          'Introduce a fresh value angle they may not have considered',
          'Keep it light and low-pressure',
          'Express genuine interest in reconnecting',
        ],
      },
      {
        stepNumber: 2,
        delayDays: 4,
        purpose: 'Industry insight or relevant news',
        guidelines: [
          'Share valuable industry insight or trend relevant to their business',
          'Position your solution in context of current market changes',
          'Include a compelling statistic or data point',
          'Make it about helping them, not selling',
          'Simple, clear call-to-action',
        ],
      },
      {
        stepNumber: 3,
        delayDays: 8,
        purpose: 'Success story from similar company',
        guidelines: [
          'Share a highly relevant customer success story',
          'Focus on measurable outcomes and specific results',
          'Draw clear parallels to their situation or industry',
          'Keep it brief and results-focused',
          'Offer to discuss how similar results could be achieved for them',
        ],
      },
      {
        stepNumber: 4,
        delayDays: 14,
        purpose: 'Final check-in with exclusive offer or resource',
        guidelines: [
          'Acknowledge this is your final outreach',
          'Provide genuine value (exclusive resource, special offer, or valuable content)',
          'Express respect for their time and inbox',
          'Make it clear the door is always open',
          'End on a positive, helpful note regardless of response',
        ],
      },
    ],
  },
  {
    id: 'product-launch-3',
    name: 'Product Launch (3 emails)',
    description:
      'Announcement sequence for existing contacts when launching a new product, feature, or service. Builds excitement and drives early adoption.',
    emailCount: 3,
    emails: [
      {
        stepNumber: 1,
        delayDays: 0,
        purpose: 'Announcement and early access invitation',
        guidelines: [
          'Announce the new product/feature with enthusiasm',
          'Explain the problem it solves in context of their business',
          'Highlight key benefits and differentiators',
          'Offer early access or exclusive preview if available',
          'Include clear next step to learn more or get access',
        ],
      },
      {
        stepNumber: 2,
        delayDays: 3,
        purpose: 'Deep dive on value and use cases',
        guidelines: [
          'Dive deeper into specific features and capabilities',
          'Share 2-3 compelling use cases relevant to their industry',
          'Include early customer feedback or testimonials if available',
          'Provide demo video or detailed walkthrough',
          'Invite them to see it in action (schedule demo or trial)',
        ],
      },
      {
        stepNumber: 3,
        delayDays: 7,
        purpose: 'Limited-time offer or urgency driver',
        guidelines: [
          'Create appropriate urgency (limited early pricing, exclusive access, etc.)',
          'Reinforce the key value proposition',
          'Share impressive early results or adoption metrics',
          'Make it very easy to take action now',
          'Clear expiration or deadline for special offer',
        ],
      },
    ],
  },
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): SequenceTemplate | undefined {
  return SEQUENCE_TEMPLATES.find(t => t.id === id);
}

/**
 * Get all templates
 */
export function getAllTemplates(): SequenceTemplate[] {
  return SEQUENCE_TEMPLATES;
}
