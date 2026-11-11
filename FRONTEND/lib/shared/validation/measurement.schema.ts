// ==============================================================================
// lib/shared/validation/measurement.schema.ts
// Zod schema for Measurement Profile and Values
// ==============================================================================

import { z } from 'zod';

export const measurementValueSchema = z.object({
  field_key: z.string().min(1, 'Field key is required'),
  value: z
    .number()
    .min(0, 'Measurement must be 0 or greater')
    .max(300, 'Measurement seems unrealistically large'),
  fraction: z.string().optional().default(''),
  notes: z.string().max(200).optional().nullable(),
});

export const measurementProfileSchema = z.object({
  customer_id: z.string().uuid({ message: 'Valid customer is required' }),
  garment_type: z.string().min(1, { message: 'Garment type is required' }),
  title: z
    .string()
    .min(2, { message: 'Profile title is required (e.g., "Regular Fit" or "Bridal Blouse")' })
    .max(100, { message: 'Title cannot exceed 100 characters' })
    .trim(),
  unit: z.enum(['inches', 'cm']),
  notes: z.string().max(1000).optional().nullable(),
  values: z.array(measurementValueSchema).min(1, { message: 'At least one measurement value is required' }),
});

export type MeasurementProfileFormData = z.infer<typeof measurementProfileSchema>;
export type MeasurementValueItem = z.infer<typeof measurementValueSchema>;
