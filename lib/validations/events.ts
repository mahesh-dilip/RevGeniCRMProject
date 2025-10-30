import { z } from 'zod';

/**
 * Valid event types
 */
const EventTypes = ['call', 'email', 'meeting', 'note', 'task'] as const;

/**
 * Valid priority levels
 */
const PriorityLevels = ['low', 'medium', 'high', 'urgent'] as const;

/**
 * Validation schema for creating a new event (task or activity)
 */
export const CreateEventSchema = z
  .object({
    type: z.enum(EventTypes),
    title: z.string().min(1, 'Event title is required').max(200, 'Event title too long'),
    description: z.string().max(5000, 'Description too long').optional().nullable(),
    dueDate: z
      .string()
      .datetime({ message: 'Invalid date format' })
      .or(z.string().date())
      .optional()
      .nullable(),
    completed: z.boolean().optional().default(false),
    source: z.enum(['manual', 'automation', 'api']).optional().default('manual'),
    priority: z.enum(PriorityLevels).optional().nullable(),
    outcome: z.string().max(1000, 'Outcome too long').optional().nullable(),
    companyId: z.string().cuid('Invalid company ID').optional().nullable(),
    personId: z.string().cuid('Invalid person ID').optional().nullable(),
    dealId: z.string().cuid('Invalid deal ID').optional().nullable(),
  })
  .refine((data) => data.companyId || data.personId || data.dealId, {
    message: 'Event must be linked to at least one of: company, person, or deal',
  });

/**
 * Validation schema for updating an event
 */
export const UpdateEventSchema = z.object({
  type: z.enum(EventTypes).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  dueDate: z
    .string()
    .datetime()
    .or(z.string().date())
    .optional()
    .nullable(),
  completed: z.boolean().optional(),
  priority: z.enum(PriorityLevels).optional().nullable(),
  outcome: z.string().max(1000).optional().nullable(),
  companyId: z.string().cuid().optional().nullable(),
  personId: z.string().cuid().optional().nullable(),
  dealId: z.string().cuid().optional().nullable(),
});

/**
 * Validation schema for quick logging an activity
 */
export const QuickLogEventSchema = z.object({
  type: z.enum(['call', 'email', 'meeting', 'note']),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  outcome: z.string().max(1000, 'Outcome too long').optional().nullable(),
  companyId: z.string().cuid('Invalid company ID').optional().nullable(),
});

// Type inference for TypeScript
export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;
export type QuickLogEventInput = z.infer<typeof QuickLogEventSchema>;
