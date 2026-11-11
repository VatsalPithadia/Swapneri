import { describe, it, expect } from 'vitest';
import {
  formatINR,
  parseCurrencyInput,
  computeOrderFinancials,
  validatePaymentAmount,
} from '../../lib/shared/calculations/currency';
import { hydrateOrderFinancials } from '../../lib/services/orders.service';

describe('Currency & Financial Calculations', () => {
  it('formats Indian Rupee with lakh grouping', () => {
    expect(formatINR(1500)).toBe('₹ 1,500');
    expect(formatINR(125000)).toBe('₹ 1,25,000');
    expect(formatINR(1000000)).toBe('₹ 10,00,000');
    expect(formatINR(850.5, { showDecimals: true })).toBe('₹ 850.50');
    expect(formatINR(0)).toBe('₹ 0');
  });

  it('parses input strings into clean currency numbers', () => {
    expect(parseCurrencyInput('₹ 1,250')).toBe(1250);
    expect(parseCurrencyInput('2,500.50')).toBe(2500.5);
    expect(parseCurrencyInput('')).toBe(0);
  });

  it('computes order net, paid, and balance correctly', () => {
    const items = [
      { quantity: 2, unit_price: 850 }, // 1700
      { quantity: 1, unit_price: 650 }, // 650 -> Total: 2350
    ];

    // Scenario 1: Partial advance payment with discount
    const calc1 = computeOrderFinancials({
      items,
      discountAmount: 150, // Net: 2200
      paidAmount: 1000,
    });

    expect(calc1.totalAmount).toBe(2350);
    expect(calc1.discountAmount).toBe(150);
    expect(calc1.netAmount).toBe(2200);
    expect(calc1.paidAmount).toBe(1000);
    expect(calc1.balanceAmount).toBe(1200);
    expect(calc1.paymentStatus).toBe('partial');

    // Scenario 2: Fully paid
    const calc2 = computeOrderFinancials({
      items,
      discountAmount: 0,
      paidAmount: 2350,
    });
    expect(calc2.balanceAmount).toBe(0);
    expect(calc2.paymentStatus).toBe('paid');

    // Scenario 3: Unpaid
    const calc3 = computeOrderFinancials({
      items,
      discountAmount: 0,
      paidAmount: 0,
    });
    expect(calc3.balanceAmount).toBe(2350);
    expect(calc3.paymentStatus).toBe('unpaid');
  });

  it('prevents accidental overpayment errors', () => {
    const check1 = validatePaymentAmount(500, 1000);
    expect(check1.isValid).toBe(true);

    const check2 = validatePaymentAmount(1500, 1000);
    expect(check2.isValid).toBe(false);
    expect(check2.errorMessage).toContain('Amount exceeds outstanding balance by ₹ 500');
    expect(check2.excess).toBe(500);

    const check3 = validatePaymentAmount(0, 1000);
    expect(check3.isValid).toBe(false);
    expect(check3.errorMessage).toBe('Payment amount must be greater than zero.');
  });

  it('hydrates zero or missing order totals from items correctly', () => {
    const legacyOrderWithZeroTotals = {
      id: 'test-order-1',
      total_amount: 0,
      discount_amount: 0,
      net_amount: 0,
      paid_amount: 0,
      balance_amount: 0,
      payment_status: 'unpaid',
      items: [
        { garment_type: 'top', quantity: 1, unit_price: 650, total_price: 650 },
        { garment_type: 'lehenga', quantity: 1, unit_price: 2800, total_price: 2800 },
        { garment_type: 'gown', quantity: 1, unit_price: 2200, total_price: 2200 },
      ],
      payments: [],
    };

    const hydrated = hydrateOrderFinancials(legacyOrderWithZeroTotals);
    expect(hydrated.total_amount).toBe(5650);
    expect(hydrated.net_amount).toBe(5650);
    expect(hydrated.balance_amount).toBe(5650);
    expect(hydrated.payment_status).toBe('unpaid');
  });
});
