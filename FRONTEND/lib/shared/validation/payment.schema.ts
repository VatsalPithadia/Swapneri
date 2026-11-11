// ==============================================================================
// lib/shared/validation/payment.schema.ts
// Zod schema for recording order payments
// ==============================================================================

import { z } from 'zod';

export const paymentFormSchema = z.object({
  order_id: z.string().uuid('Valid order is required'),
  customer_id: z.string().uuid('Valid customer is required'),
  amount: z.number().positive('Payment amount must be greater than zero'),
  payment_date: z.string().min(1, 'Payment date is required'),
  payment_mode: z.enum(['cash', 'upi', 'card', 'bank_transfer']),
  transaction_ref: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export type PaymentFormData = z.infer<typeof paymentFormSchema>;
