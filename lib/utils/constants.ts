export const DEAL_STAGES = [
  'Prospecting',
  'Qualified',
  'Demo',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost',
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

export type DealStage = typeof DEAL_STAGES[number];
export type CompanyStatus = typeof COMPANY_STATUSES[number];
export type EventType = typeof EVENT_TYPES[number];
export type EventSource = typeof EVENT_SOURCES[number];
export type Priority = typeof PRIORITIES[number];
export type SequenceStatus = typeof SEQUENCE_STATUSES[number];
