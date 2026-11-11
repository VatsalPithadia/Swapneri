// ==============================================================================
// lib/shared/constants/whatsapp-templates.ts
// Clean, professional WhatsApp message generators for customer communication
// ==============================================================================

import { formatINR } from '../calculations/currency';
import { Shop, Customer, Order, Payment } from '../types/database';

/**
 * Standardize phone number for WhatsApp link (formats 10-digit Indian numbers to 91...)
 */
export function sanitizePhoneForWhatsApp(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length === 10) {
    return `91${digitsOnly}`;
  }
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return digitsOnly;
  }
  return digitsOnly;
}

/**
 * Generate a wa.me URL with pre-encoded message text
 */
export function buildWhatsAppLink(phone: string, message: string): string {
  const sanitized = sanitizePhoneForWhatsApp(phone);
  const encoded = encodeURIComponent(message.trim());
  return `https://wa.me/${sanitized}?text=${encoded}`;
}

/**
 * 1. Order Confirmation & Advance Receipt
 */
export function getOrderConfirmationMessage(params: {
  shop: Partial<Shop>;
  customer: Customer;
  order: Order;
}): string {
  const { shop, customer, order } = params;
  const shopName = shop.name || 'Boutique';
  const deliveryFormatted = order.delivery_date
    ? new Date(order.delivery_date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Scheduled';

  let msg = `Hello ${customer.name},\n\n`;
  msg += `Thank you for your order at *${shopName}*.\n\n`;
  msg += `*Order Details:*\n`;
  msg += `• Order No: ${order.order_number}\n`;
  msg += `• Total Amount: ${formatINR(order.net_amount)}\n`;
  msg += `• Advance Paid: ${formatINR(order.paid_amount)}\n`;
  msg += `• Balance Due: ${formatINR(order.balance_amount)}\n`;
  msg += `• Delivery Date: ${deliveryFormatted}\n\n`;
  msg += `We will inform you once your order is ready for pickup.\n\n`;
  msg += `Regards,\n*${shopName}*`;
  if (shop.phone) {
    msg += `\nPhone: ${shop.phone}`;
  }

  return msg;
}

/**
 * 2. Delivery Ready for Pickup Alert
 */
export function getDeliveryReadyMessage(params: {
  shop: Partial<Shop>;
  customer: Customer;
  order: Order;
}): string {
  const { shop, customer, order } = params;
  const shopName = shop.name || 'Boutique';

  let msg = `Hello ${customer.name},\n\n`;
  msg += `Your order *#${order.order_number}* is ready for pickup at *${shopName}*.\n\n`;
  msg += `• Order No: ${order.order_number}\n`;
  msg += `• Total Amount: ${formatINR(order.net_amount)}\n`;
  msg += `• Paid: ${formatINR(order.paid_amount)}\n`;
  msg += `• Balance Due: ${formatINR(order.balance_amount)}\n\n`;
  msg += `You can collect it during regular boutique hours.\n\n`;
  msg += `Regards,\n*${shopName}*`;
  if (shop.address) {
    msg += `\nAddress: ${shop.address}`;
  }
  if (shop.phone) {
    msg += `\nPhone: ${shop.phone}`;
  }

  return msg;
}

/**
 * 3. Payment Receipt
 */
export function getPaymentReceiptMessage(params: {
  shop: Partial<Shop>;
  customer: Customer;
  order: Order;
  payment: Payment;
}): string {
  const { shop, customer, order, payment } = params;
  const shopName = shop.name || 'Swapneri Boutique';
  const dateFormatted = new Date(payment.payment_date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  let msg = `Hello ${customer.name},\n\n`;
  msg += `Payment receipt from *${shopName}*:\n\n`;
  msg += `• Order No: ${order.order_number}\n`;
  msg += `• Amount Received: ${formatINR(payment.amount)}\n`;
  msg += `• Date: ${dateFormatted}\n`;
  msg += `• Mode: ${payment.payment_mode.toUpperCase()}\n`;
  if (payment.transaction_ref) {
    msg += `• Reference: ${payment.transaction_ref}\n`;
  }
  msg += `• Balance Due: ${formatINR(order.balance_amount)}\n\n`;
  msg += `Thank you,\n*${shopName}*`;

  return msg;
}

/**
 * 4. Friendly Balance Reminder
 */
export function getBalanceReminderMessage(params: {
  shop: Partial<Shop>;
  customer: Customer;
  order: Order;
}): string {
  const { shop, customer, order } = params;
  const shopName = shop.name || 'Boutique';

  let msg = `Hello ${customer.name},\n\n`;
  msg += `This is a reminder regarding the pending balance of *${formatINR(order.balance_amount)}* for order *#${order.order_number}* at *${shopName}*.\n\n`;
  msg += `Kindly settle this at your convenience. If already paid, please disregard this note.\n\n`;
  msg += `Thank you,\n*${shopName}*`;
  if (shop.phone) {
    msg += `\nPhone: ${shop.phone}`;
  }

  return msg;
}
