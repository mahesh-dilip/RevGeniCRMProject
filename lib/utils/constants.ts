export const DEAL_STAGES = [
  { value: 'Prospecting', label: 'Prospecting' },
  { value: 'Qualified', label: 'Qualified' },
  { value: 'Demo', label: 'Demo' },
  { value: 'Proposal', label: 'Proposal' },
  { value: 'Negotiation', label: 'Negotiation' },
  { value: 'Won', label: 'Won' },
  { value: 'Lost', label: 'Lost' },
] as const;

export const COMPANY_STATUSES = [
  'Lead',
  'Qualified',
  'Customer',
  'Lost',
] as const;

export const EVENT_TYPES = [
  'note',
  'call',
  'email',
  'meeting',
  'task',
] as const;

export const EVENT_SOURCES = [
  'manual',
  'sequence',
  'ai_suggested',
  'automation',
] as const;

export const PRIORITIES = [
  'low',
  'medium',
  'high',
] as const;

export const SEQUENCE_STATUSES = [
  'active',
  'completed',
  'paused',
  'unsubscribed',
] as const;

export const LIFECYCLE_STAGES = [
  { value: 'subscriber', label: 'Subscriber', description: 'Subscribed to blog/newsletter' },
  { value: 'lead', label: 'Lead', description: 'Basic contact information collected' },
  { value: 'mql', label: 'Marketing Qualified Lead', description: 'Engaged with marketing content' },
  { value: 'sql', label: 'Sales Qualified Lead', description: 'Ready for sales outreach' },
  { value: 'opportunity', label: 'Opportunity', description: 'Active deal in progress' },
  { value: 'customer', label: 'Customer', description: 'Closed won deal' },
  { value: 'evangelist', label: 'Evangelist', description: 'Active promoter/referrer' },
  { value: 'other', label: 'Other', description: 'Doesn\'t fit other categories' }
] as const;

export const LEAD_SOURCES = [
  { value: 'ai_agent', label: 'AI Agent', icon: '🤖' },
  { value: 'website', label: 'Website', icon: '🌐' },
  { value: 'referral', label: 'Referral', icon: '👥' },
  { value: 'social_media', label: 'Social Media', icon: '📱' },
  { value: 'email_campaign', label: 'Email Campaign', icon: '📧' },
  { value: 'event', label: 'Event/Conference', icon: '🎪' },
  { value: 'cold_outreach', label: 'Cold Outreach', icon: '❄️' },
  { value: 'paid_advertising', label: 'Paid Advertising', icon: '💰' },
  { value: 'partner', label: 'Partner', icon: '🤝' },
  { value: 'manual', label: 'Manual Entry', icon: '✍️' },
  { value: 'other', label: 'Other', icon: '📋' }
] as const;

export type DealStage = typeof DEAL_STAGES[number];
export type CompanyStatus = typeof COMPANY_STATUSES[number];
export type EventType = typeof EVENT_TYPES[number];
export type EventSource = typeof EVENT_SOURCES[number];
export type Priority = typeof PRIORITIES[number];
export type SequenceStatus = typeof SEQUENCE_STATUSES[number];
