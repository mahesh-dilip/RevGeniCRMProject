import { z } from 'zod';

/**
 * Validation schema for creating a new company
 */
export const CreateCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(200, 'Company name too long'),
  website: z.string().url('Invalid website URL').optional().nullable(),
  industry: z.string().min(1).max(100).optional().nullable(),
  size: z.string().max(100).optional().nullable(),
  geography: z.string().max(200).optional().nullable(),
  status: z.enum(['Lead', 'Qualified', 'Customer', 'Lost']).optional(),
  description: z.string().max(5000, 'Description too long').optional().nullable(),
  foundedYear: z
    .number()
    .int()
    .min(1800, 'Founded year must be after 1800')
    .max(new Date().getFullYear(), 'Founded year cannot be in the future')
    .optional()
    .nullable(),
  sourceType: z.enum(['manual', 'ai_agent', 'import', 'api']).optional(),
  sourceQuery: z.string().max(500).optional().nullable(),
  confidence: z.number().min(0).max(1).optional().nullable(),
  // Lifecycle fields (optional)
  lifecycleStage: z.enum(['lead', 'mql', 'sql', 'opportunity', 'customer', 'other']).optional(),
  leadSource: z.string().max(100).optional().nullable(),
  leadScore: z.number().int().min(0).max(100).optional().nullable(),
});

/**
 * Validation schema for updating a company (all fields optional)
 */
export const UpdateCompanySchema = CreateCompanySchema.partial();

/**
 * Validation schema for bulk company creation
 */
export const BulkCreateCompaniesSchema = z.object({
  companies: z
    .array(CreateCompanySchema)
    .min(1, 'At least one company is required')
    .max(100, 'Cannot create more than 100 companies at once'),
});

/**
 * Validation schema for converting company to deal
 */
export const ConvertToDealSchema = z.object({
  dealTitle: z.string().min(1, 'Deal title is required').max(200).optional(),
  dealValue: z.number().nonnegative('Deal value must be positive').optional().nullable(),
  dealStage: z.enum(['Prospecting', 'Qualification']).optional(),
  primaryContactId: z.string().cuid('Invalid contact ID').optional().nullable(),
});

// Type inference for TypeScript
export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof UpdateCompanySchema>;
export type BulkCreateCompaniesInput = z.infer<typeof BulkCreateCompaniesSchema>;
export type ConvertToDealInput = z.infer<typeof ConvertToDealSchema>;
