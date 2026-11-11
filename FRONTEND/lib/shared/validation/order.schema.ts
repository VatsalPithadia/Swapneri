// ==============================================================================
// lib/shared/validation/order.schema.ts
// Zod schema for Orders and Order Items
// ==============================================================================

import { z } from 'zod';

export const orderItemSchema = z.object({
  garment_type: z.string().min(1, 'Garment type is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
  unit_price: z.number().min(0, 'Price must be 0 or greater'),
  design_notes: z.string().max(1000).optional().nullable(),
  fabric_source: z.enum(['customer', 'shop']).default('customer'),
  fabric_details: z.string().max(500).optional().nullable(),
  measurement_profile_id: z.string().uuid().optional().nullable(),
  assigned_worker_id: z.string().uuid().optional().nullable(),
  reference_photos: z.array(z.string()).default([]),
});

export const orderFormSchema = z
  .object({
    customer_id: z.string().uuid({ message: 'Please select a customer' }),
    order_date: z.string().min(1, 'Order date is required'),
    trial_date: z.string().optional().nullable(),
    delivery_date: z.string().min(1, 'Delivery date is required'),
    priority: z.enum(['normal', 'urgent']).default('normal'),
    notes: z.string().max(1000).optional().nullable(),
    items: z.array(orderItemSchema).min(1, { message: 'Order must contain at least one garment item' }),
    discount_amount: z.number().min(0, 'Discount cannot be negative').default(0),
    // Optional immediate advance payment
    advance_amount: z.number().min(0, 'Advance cannot be negative').default(0),
    advance_payment_mode: z.enum(['cash', 'upi', 'card', 'bank_transfer']).default('cash'),
    advance_notes: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.delivery_date && data.order_date) {
        return new Date(data.delivery_date) >= new Date(data.order_date);
      }
      return true;
    },
    {
      message: 'Delivery date cannot be before order booking date',
      path: ['delivery_date'],
    }
  )
  .refine(
    (data) => {
      if (data.trial_date && data.order_date) {
        return new Date(data.trial_date) >= new Date(data.order_date);
      }
      return true;
    },
    {
      message: 'Trial date cannot be before order date',
      path: ['trial_date'],
    }
  );

export type OrderFormData = z.infer<typeof orderFormSchema>;
export type OrderItemFormData = z.infer<typeof orderItemSchema>;
