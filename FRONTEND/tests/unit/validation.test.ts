import { describe, it, expect } from 'vitest';
import { customerSchema } from '@/lib/shared/validation/customer.schema';
import { paymentFormSchema } from '@/lib/shared/validation/payment.schema';
import { validatePaymentAmount } from '@/lib/shared/calculations/currency';

describe('Zod Validation Schemas', () => {
  describe('Customer Validation', () => {
    it('should accept valid 10-digit Indian phone numbers', () => {
      const validCustomer = {
        name: 'Sunita Sharma',
        phone: '9876543210',
        alternate_phone: '9812345678',
        address: 'B-12, Sector 4, Gandhinagar',
        notes: 'Prefers loose fitting'
      };
      const result = customerSchema.safeParse(validCustomer);
      expect(result.success).toBe(true);
    });

    it('should reject phone numbers that do not match 10-digit Indian pattern', () => {
      const invalidCustomers = [
        { name: 'Sunita', phone: '12345' }, // Too short
        { name: 'Sunita', phone: '12345678901' }, // Too long
        { name: 'Sunita', phone: '5987654321' }, // Does not start with 6, 7, 8, or 9
        { name: 'Sunita', phone: '98765abcd0' }, // Contains letters
      ];

      for (const item of invalidCustomers) {
        const result = customerSchema.safeParse(item);
        expect(result.success).toBe(false);
      }
    });

    it('should require a customer name with at least 2 characters', () => {
      const result = customerSchema.safeParse({ name: 'A', phone: '9876543210' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2 characters');
      }
    });
  });

  describe('Payment Validation and Overpayment Guard', () => {
    it('should validate normal positive payment amounts with valid UUIDs', () => {
      const payment = {
        order_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        customer_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        amount: 500,
        payment_mode: 'upi' as const,
        payment_date: '2026-10-31',
        notes: 'GPay advance'
      };
      const result = paymentFormSchema.safeParse(payment);
      expect(result.success).toBe(true);
    });

    it('should reject non-positive amounts', () => {
      const zeroPayment = {
        order_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        customer_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        amount: 0,
        payment_mode: 'cash' as const,
        payment_date: '2026-10-31'
      };
      const result = paymentFormSchema.safeParse(zeroPayment);
      expect(result.success).toBe(false);
    });

    it('should strictly detect overpayment using validatePaymentAmount calculation helper', () => {
      // Order balance is ₹800
      const currentBalance = 800;

      // Paying ₹500 is valid
      const validCheck = validatePaymentAmount(500, currentBalance);
      expect(validCheck.isValid).toBe(true);
      expect(validCheck.errorMessage).toBeUndefined();

      // Paying ₹800 is valid (exact settlement)
      const exactCheck = validatePaymentAmount(800, currentBalance);
      expect(exactCheck.isValid).toBe(true);

      // Paying ₹850 is invalid overpayment
      const overCheck = validatePaymentAmount(850, currentBalance);
      expect(overCheck.isValid).toBe(false);
      expect(overCheck.errorMessage).toContain('Amount exceeds outstanding balance');
      expect(overCheck.excess).toBe(50);
    });
  });
});
