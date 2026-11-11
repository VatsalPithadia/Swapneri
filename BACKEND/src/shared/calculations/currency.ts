// ==============================================================================
// lib/shared/calculations/currency.ts
// Indian Rupee currency formatting and financial computations
// ==============================================================================

import { PaymentStatus } from '../types/database';

/**
 * Format a number into Indian Rupee format with proper lakh grouping
 * e.g. 150000 -> "₹ 1,50,000" or "₹ 1,50,000.00"
 */
export function formatINR(amount: number | null | undefined, options?: { showDecimals?: boolean; showSymbol?: boolean }): string {
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const showDecimals = options?.showDecimals ?? false;
  const showSymbol = options?.showSymbol ?? true;

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'decimal',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(num);

  return showSymbol ? `₹ ${formatted}` : formatted;
}

/**
 * Parse an input string into a valid decimal amount (e.g. "₹ 1,500.50" -> 1500.5)
 */
export function parseCurrencyInput(value: string | number): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
}

/**
 * Compute item totals and overall order balance
 */
export function computeOrderFinancials(params: {
  items: Array<{ quantity: number; unit_price: number }>;
  discountAmount?: number;
  paidAmount?: number;
}): {
  totalAmount: number;
  discountAmount: number;
  netAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: PaymentStatus;
} {
  const totalAmount = params.items.reduce((sum, item) => {
    const qty = Math.max(0, item.quantity || 0);
    const price = Math.max(0, item.unit_price || 0);
    return sum + (qty * price);
  }, 0);

  const discountAmount = Math.min(totalAmount, Math.max(0, params.discountAmount || 0));
  const netAmount = Math.max(0, totalAmount - discountAmount);
  const paidAmount = Math.max(0, params.paidAmount || 0);
  const balanceAmount = Math.max(0, netAmount - paidAmount);

  let paymentStatus: PaymentStatus = 'unpaid';
  if (netAmount > 0 && paidAmount >= netAmount) {
    paymentStatus = 'paid';
  } else if (paidAmount > 0) {
    paymentStatus = 'partial';
  }

  return {
    totalAmount: Math.round(totalAmount * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    netAmount: Math.round(netAmount * 100) / 100,
    paidAmount: Math.round(paidAmount * 100) / 100,
    balanceAmount: Math.round(balanceAmount * 100) / 100,
    paymentStatus,
  };
}

/**
 * Validate payment input against pending balance to prevent accidental overpayment
 */
export function validatePaymentAmount(amountToPay: number, pendingBalance: number): {
  isValid: boolean;
  errorMessage?: string;
  excess?: number;
} {
  if (amountToPay <= 0) {
    return { isValid: false, errorMessage: 'Payment amount must be greater than zero.' };
  }
  if (amountToPay > pendingBalance) {
    const excess = Math.round((amountToPay - pendingBalance) * 100) / 100;
    return {
      isValid: false,
      errorMessage: `Amount exceeds outstanding balance by ₹ ${excess}. Maximum allowed is ₹ ${pendingBalance}.`,
      excess,
    };
  }
  return { isValid: true };
}
