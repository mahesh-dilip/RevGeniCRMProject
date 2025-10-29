import { z } from 'zod';

export const LeadResultSchema = z.object({
  name: z.string().min(1),
  website: z.string().url(),
  industry: z.string().min(1),
  size: z.string().min(1),
  geography: z.string().min(1),
  description: z.string().min(1),
  foundedYear: z.number().nullable().optional(),
  confidence: z.number().min(0).max(1),
});

export type ValidatedLeadResult = z.infer<typeof LeadResultSchema>;

export const LeadCriteriaSchema = z.object({
  industry: z.string().min(1, 'Industry is required'),
  geography: z.string().min(1, 'Geography is required'),
  size: z.string().min(1, 'Company size is required'),
  additionalContext: z.string().optional(),
});

export type LeadCriteria = z.infer<typeof LeadCriteriaSchema>;
