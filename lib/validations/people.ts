import { z } from 'zod';

/**
 * Validation schema for creating a new person/contact
 */
export const CreatePersonSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name too long'),
  email: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().max(50, 'Phone number too long').optional().nullable(),
  title: z.string().max(200, 'Title too long').optional().nullable(),
  linkedin: z.string().url('Invalid LinkedIn URL').optional().nullable(),
  companyId: z.string().cuid('Invalid company ID'),
});

/**
 * Validation schema for updating a person (all fields optional except relationships)
 */
export const UpdatePersonSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  title: z.string().max(200).optional().nullable(),
  linkedin: z.string().url().optional().nullable(),
  companyId: z.string().cuid().optional(),
});

// Type inference for TypeScript
export type CreatePersonInput = z.infer<typeof CreatePersonSchema>;
export type UpdatePersonInput = z.infer<typeof UpdatePersonSchema>;
