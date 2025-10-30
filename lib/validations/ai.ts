import { z } from 'zod';

/**
 * Validation schema for AI lead finder
 */
export const FindLeadsSchema = z.object({
  industry: z.string().min(1, 'Industry is required').max(200, 'Industry too long'),
  geography: z.string().min(1, 'Geography is required').max(200, 'Geography too long'),
  size: z.string().min(1, 'Company size is required').max(100, 'Size too long'),
  additionalContext: z.string().max(1000, 'Additional context too long').optional(),
  maxResults: z
    .number()
    .int()
    .min(1, 'Must request at least 1 result')
    .max(50, 'Cannot request more than 50 results')
    .optional()
    .default(10),
  autoCreate: z.boolean().optional().default(true),
});

// Type inference for TypeScript
export type FindLeadsInput = z.infer<typeof FindLeadsSchema>;
