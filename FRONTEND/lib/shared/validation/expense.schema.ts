// ==============================================================================
// lib/shared/validation/expense.schema.ts
// Zod schema for expense records
// ==============================================================================

import { z } from 'zod';

export const expenseFormSchema = z.object({
  category: z.enum([
    'fabric',
    'thread_accessories',
    'rent',
    'salary',
    'electricity',
    'repairs',
    'other',
  ]),
  amount: z.number().positive('Amount must be greater than zero'),
  expense_date: z.string().min(1, 'Date is required'),
  paid_to: z.string().trim().max(100).optional().nullable(),
  payment_mode: z.enum(['cash', 'upi', 'card', 'bank_transfer']).default('cash'),
  notes: z.string().trim().max(500).optional().nullable(),
});

export type ExpenseFormData = z.infer<typeof expenseFormSchema>;
