import { z } from 'zod';

// ============================================
// COMPANY VALIDATIONS
// ============================================

export const CreateCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(200),
  website: z.string().url('Invalid website URL').optional().nullable(),
  industry: z.string().min(1).max(100).optional().nullable(),
  size: z.string().max(100).optional().nullable(),
  geography: z.string().max(200).optional().nullable(),
  status: z.enum(['Lead', 'Qualified', 'Customer', 'Lost']).optional(),
  description: z.string().max(5000).optional().nullable(),
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional().nullable(),
  sourceType: z.enum(['manual', 'ai_agent', 'import', 'api']).optional(),
  sourceQuery: z.string().max(500).optional().nullable(),
  confidence: z.number().min(0).max(1).optional().nullable(),
});

export const UpdateCompanySchema = CreateCompanySchema.partial();

export const BulkCreateCompaniesSchema = z.object({
  companies: z.array(CreateCompanySchema).min(1).max(100),
});

// ============================================
// PERSON VALIDATIONS
// ============================================

export const CreatePersonSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email').optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  title: z.string().max(200).optional().nullable(),
  linkedin: z.string().url('Invalid LinkedIn URL').optional().nullable(),
  companyId: z.string().cuid('Invalid company ID'),
});

export const UpdatePersonSchema = CreatePersonSchema.partial().extend({
  companyId: z.string().cuid().optional(),
});

// ============================================
// DEAL VALIDATIONS
// ============================================

export const CreateDealSchema = z.object({
  title: z.string().min(1, 'Deal title is required').max(200),
  value: z.number().nonnegative('Deal value must be positive').optional().nullable(),
  stage: z.enum(['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']).optional(),
  probability: z.number().int().min(0).max(100, 'Probability must be between 0-100').optional().nullable(),
  closeDate: z.string().datetime().or(z.string().date()).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  nextAction: z.string().max(500).optional().nullable(),
  lostReason: z.string().max(500).optional().nullable(),
  companyId: z.string().cuid('Invalid company ID'),
  primaryContactId: z.string().cuid('Invalid contact ID').optional().nullable(),
});

export const UpdateDealSchema = CreateDealSchema.partial();

export const UpdateDealStageSchema = z.object({
  stage: z.enum(['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']),
  lostReason: z.string().max(500).optional(),
});

// ============================================
// EVENT VALIDATIONS
// ============================================

export const CreateEventSchema = z.object({
  type: z.enum(['call', 'email', 'meeting', 'note', 'task']),
  title: z.string().min(1, 'Event title is required').max(200),
  description: z.string().max(5000).optional().nullable(),
  dueDate: z.string().datetime().or(z.string().date()).optional().nullable(),
  completed: z.boolean().optional(),
  source: z.enum(['manual', 'automation', 'api']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().nullable(),
  outcome: z.string().max(1000).optional().nullable(),
  companyId: z.string().cuid('Invalid company ID').optional().nullable(),
  personId: z.string().cuid('Invalid person ID').optional().nullable(),
  dealId: z.string().cuid('Invalid deal ID').optional().nullable(),
}).refine(
  (data) => data.companyId || data.personId || data.dealId,
  'Event must be linked to at least one of: company, person, or deal'
);

export const UpdateEventSchema = CreateEventSchema.partial().omit({ type: true });

export const QuickLogEventSchema = z.object({
  type: z.enum(['call', 'email', 'meeting', 'note']),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  companyId: z.string().cuid().optional(),
});

// ============================================
// SEQUENCE VALIDATIONS
// ============================================

export const CreateSequenceStepSchema = z.object({
  delayDays: z.number().int().min(0).max(365),
  subject: z.string().min(1, 'Email subject is required').max(300),
  body: z.string().min(1, 'Email body is required').max(10000),
});

export const CreateSequenceSchema = z.object({
  name: z.string().min(1, 'Sequence name is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  active: z.boolean().optional(),
  pauseOnDealCreation: z.boolean().optional(),
  pauseOnDealStages: z.array(z.string()).optional(),
  steps: z.array(CreateSequenceStepSchema).min(1, 'At least one step is required').max(20),
});

export const UpdateSequenceSchema = CreateSequenceSchema.partial();

export const EnrollSequenceSchema = z.object({
  companyId: z.string().cuid('Invalid company ID'),
});

// ============================================
// AI LEAD FINDER VALIDATIONS
// ============================================

export const FindLeadsSchema = z.object({
  industry: z.string().min(1, 'Industry is required').max(200),
  geography: z.string().min(1, 'Geography is required').max(200),
  size: z.string().min(1, 'Company size is required').max(100),
  additionalContext: z.string().max(1000).optional(),
  maxResults: z.number().int().min(1).max(50).optional().default(10),
  autoCreate: z.boolean().optional().default(true),
});

// ============================================
// CONVERT TO DEAL VALIDATION
// ============================================

export const ConvertToDealSchema = z.object({
  dealTitle: z.string().min(1, 'Deal title is required').max(200),
  dealValue: z.number().nonnegative().optional(),
  dealStage: z.enum(['Prospecting', 'Qualification']).optional(),
  primaryContactId: z.string().cuid().optional(),
});

// ============================================
// HELPER: Validate Request Body
// ============================================

export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Validation error: ${message}`);
    }
    throw error;
  }
}
