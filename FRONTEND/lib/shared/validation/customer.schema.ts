// ==============================================================================
// lib/shared/validation/customer.schema.ts
// Zod schema for Customer form validation
// ==============================================================================

import { z } from 'zod';

// Indian phone regex: 10 digits starting with 6, 7, 8, or 9 (with optional +91 or 0 prefix)
export const phoneRegex = /^(?:(?:\+|0{0,2})91(\s*[-]\s*)?|[0]?)?[6789]\d{9}$/;

export const customerSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Customer name must be at least 2 characters.' })
    .max(100, { message: 'Name cannot exceed 100 characters.' })
    .trim(),
  phone: z
    .string()
    .trim()
    .refine((val) => phoneRegex.test(val.replace(/\s+/g, '')), {
      message: 'Please enter a valid 10-digit mobile number (e.g., 9822334455).',
    }),
  alternate_phone: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine((val) => !val || phoneRegex.test(val.replace(/\s+/g, '')), {
      message: 'Alternate phone must be a valid 10-digit mobile number.',
    }),
  address: z.string().trim().max(300, { message: 'Address cannot exceed 300 characters.' }).optional().nullable(),
  birthday: z.string().optional().nullable(),
  anniversary: z.string().optional().nullable(),
  notes: z.string().trim().max(1000, { message: 'Notes cannot exceed 1000 characters.' }).optional().nullable(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
