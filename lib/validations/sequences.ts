import { z } from 'zod';

/**
 * Validation schema for a single email sequence step
 */
export const SequenceStepSchema = z.object({
  delayDays: z
    .number()
    .int()
    .min(0, 'Delay must be 0 or more days')
    .max(365, 'Delay cannot exceed 365 days'),
  subject: z.string().min(1, 'Email subject is required').max(300, 'Subject too long'),
  body: z.string().min(1, 'Email body is required').max(10000, 'Email body too long'),
});

/**
 * Validation schema for creating a new email sequence
 */
export const CreateSequenceSchema = z.object({
  name: z.string().min(1, 'Sequence name is required').max(200, 'Sequence name too long'),
  description: z.string().max(1000, 'Description too long').optional().nullable(),
  active: z.boolean().optional().default(true),
  pauseOnDealCreation: z.boolean().optional().default(true),
  pauseOnDealStages: z.array(z.string()).optional().default(['Demo', 'Proposal']),
  steps: z
    .array(SequenceStepSchema)
    .min(1, 'At least one step is required')
    .max(20, 'Cannot have more than 20 steps'),
});

/**
 * Validation schema for updating a sequence
 */
export const UpdateSequenceSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  active: z.boolean().optional(),
  pauseOnDealCreation: z.boolean().optional(),
  pauseOnDealStages: z.array(z.string()).optional(),
  steps: z
    .array(SequenceStepSchema)
    .min(1)
    .max(20)
    .optional(),
});

/**
 * Validation schema for enrolling a company in a sequence
 * Supports both single and bulk enrollment
 */
export const EnrollSequenceSchema = z.object({
  // Single enrollment fields
  companyId: z.string().cuid('Invalid company ID').optional(),
  contactId: z.string().cuid('Invalid contact ID').optional().nullable(),
  // Bulk enrollment field
  enrollments: z
    .array(
      z.object({
        companyId: z.string().cuid('Invalid company ID'),
        contactId: z.string().cuid('Invalid contact ID').optional().nullable(),
      })
    )
    .optional(),
});

// Type inference for TypeScript
export type SequenceStepInput = z.infer<typeof SequenceStepSchema>;
export type CreateSequenceInput = z.infer<typeof CreateSequenceSchema>;
export type UpdateSequenceInput = z.infer<typeof UpdateSequenceSchema>;
export type EnrollSequenceInput = z.infer<typeof EnrollSequenceSchema>;
