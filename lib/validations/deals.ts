import { z } from 'zod';

/**
 * Valid deal stages
 */
const DealStages = [
  'Prospecting',
  'Qualification',
  'Proposal',
  'Negotiation',
  'Closed Won',
  'Closed Lost',
] as const;

/**
 * Validation schema for creating a new deal
 */
export const CreateDealSchema = z.object({
  title: z.string().min(1, 'Deal title is required').max(200, 'Deal title too long'),
  value: z.number().nonnegative('Deal value must be positive').optional().nullable(),
  stage: z.enum(DealStages).optional().default('Prospecting'),
  probability: z
    .number()
    .int()
    .min(0, 'Probability must be between 0-100')
    .max(100, 'Probability must be between 0-100')
    .optional()
    .nullable(),
  closeDate: z
    .string()
    .datetime({ message: 'Invalid date format' })
    .or(z.string().date())
    .optional()
    .nullable(),
  description: z.string().max(5000, 'Description too long').optional().nullable(),
  nextAction: z.string().max(500, 'Next action too long').optional().nullable(),
  lostReason: z.string().max(500, 'Lost reason too long').optional().nullable(),
  companyId: z.string().cuid('Invalid company ID'),
  primaryContactId: z.string().cuid('Invalid contact ID').optional().nullable(),
});

/**
 * Validation schema for updating a deal
 */
export const UpdateDealSchema = CreateDealSchema.partial().omit({ companyId: true });

/**
 * Validation schema for updating deal stage
 */
export const UpdateDealStageSchema = z.object({
  stage: z.enum(DealStages),
  nextAction: z.string().max(500, 'Next action too long').optional().nullable(),
  lostReason: z.string().max(500, 'Lost reason too long').optional().nullable(),
});

// Type inference for TypeScript
export type CreateDealInput = z.infer<typeof CreateDealSchema>;
export type UpdateDealInput = z.infer<typeof UpdateDealSchema>;
export type UpdateDealStageInput = z.infer<typeof UpdateDealStageSchema>;
