import { describe, it, expect } from 'vitest';
import { hydrateOrderFinancials } from '@/lib/services/orders.service';
import { validatePaymentAmount } from '@/lib/shared/calculations/currency';

describe('Billing & Financial Hydration Self-Healing', () => {
  it('correctly calculates gross, net, and balance when order totals in DB are zero but garments exist', () => {
    // Exact scenario from user screenshot: Top (650), Lehenga (2800), Gown (2200)
    const rawOrderWithZeroTotals = {
      id: 'ord-test-123',
      order_number: 'SW-26001',
      total_amount: 0,
      net_amount: 0,
      paid_amount: 0,
      balance_amount: 0,
      discount_amount: 0,
      payment_status: 'unpaid',
      items: [
        { garment_type: 'Top', quantity: 1, unit_price: 650, total_price: 650 },
        { garment_type: 'Lehenga', quantity: 1, unit_price: 2800, total_price: 2800 },
        { garment_type: 'Gown', quantity: 1, unit_price: 2200, total_price: 2200 },
      ],
      payments: [],
    };

    const hydrated = hydrateOrderFinancials(rawOrderWithZeroTotals);

    expect(hydrated.total_amount).toBe(5650);
    expect(hydrated.discount_amount).toBe(0);
    expect(hydrated.net_amount).toBe(5650);
    expect(hydrated.paid_amount).toBe(0);
    expect(hydrated.balance_amount).toBe(5650);
    expect(hydrated.payment_status).toBe('unpaid');
  });

  it('validates payment amount of ₹5,650 against balance of ₹5,650 without step error', () => {
    const balance = 5650;
    const paymentAmount = 5650;

    const validation = validatePaymentAmount(paymentAmount, balance);
    expect(validation.isValid).toBe(true);
    expect(validation.errorMessage).toBeUndefined();
  });

  it('rejects payment amount exceeding balance', () => {
    const balance = 5650;
    const overPayment = 6000;

    const validation = validatePaymentAmount(overPayment, balance);
    expect(validation.isValid).toBe(false);
    expect(validation.errorMessage).toBeDefined();
  });
});

