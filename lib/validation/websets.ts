import { z } from 'zod';

/**
 * Validation schema for creating a company webset
 * Used in /api/websets/companies/create
 */
export const createCompanyWebsetSchema = z.object({
  industry: z.string().min(1, 'Industry is required').max(200),
  geography: z.string().min(1, 'Geography is required').max(200),
  size: z.string().max(100).optional(),
  additionalContext: z.string().max(1000).optional(),
  maxResults: z.number().int().min(1).max(100).default(50)
});

/**
 * Validation schema for creating a people webset
 * Used in /api/websets/people/create
 */
export const createPeopleWebsetSchema = z.object({
  companyNames: z.array(z.string()).optional(),
  jobTitles: z.array(z.string()).optional(),
  seniority: z.array(z.string()).optional(),
  location: z.string().max(200).optional(),
  industries: z.array(z.string()).optional(),
  maxResults: z.number().int().min(1).max(100).default(50)
}).refine(
  data =>
    data.companyNames?.length ||
    data.jobTitles?.length ||
    data.industries?.length ||
    data.location,
  { message: 'At least one search criteria is required' }
);

export type CreateCompanyWebsetInput = z.infer<typeof createCompanyWebsetSchema>;
export type CreatePeopleWebsetInput = z.infer<typeof createPeopleWebsetSchema>;
