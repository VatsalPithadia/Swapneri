// ==============================================================================
// lib/shared/constants/whatsapp-templates.ts
// WhatsApp wa.me prefilled message generators for customer updates
// ==============================================================================

import { formatINR } from '../calculations/currency';
import { Shop, Customer, Order, Payment } from '../types/database';

/**
 * Standardize phone number for WhatsApp link (formats 10-digit Indian numbers to +91...)
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
  const shopName = shop.name || 'Our Boutique';
  const deliveryFormatted = order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('en-IN') : 'Scheduled';

  let msg = `✨ *${shopName}* ✨\n\n`;
  msg += `Namaste ${customer.name} ji,\n`;
  msg += `Thank you for choosing us! Your tailoring order has been successfully booked.\n\n`;
  msg += `📋 *Order Number:* ${order.order_number}\n`;
  msg += `💰 *Total Amount:* ${formatINR(order.net_amount)}\n`;
  msg += `💵 *Advance Paid:* ${formatINR(order.paid_amount)}\n`;
  msg += `⏳ *Balance Due:* ${formatINR(order.balance_amount)}\n`;
  msg += `📅 *Delivery Date:* ${deliveryFormatted}\n\n`;
  msg += `We will notify you as soon as your garment is ready for pickup. For any queries, feel free to message or call us at ${shop.phone || ''}.\n\n`;
  msg += `Warm regards,\n*${shopName}*`;

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
  const shopName = shop.name || 'Our Boutique';

  let msg = `🎉 *Your Order is Ready for Pickup!* 🎉\n\n`;
  msg += `Namaste ${customer.name} ji,\n`;
  msg += `Delighted to share that your order *#${order.order_number}* has been beautifully completed and packed.\n\n`;
  msg += `📋 *Order:* ${order.order_number}\n`;
  msg += `💰 *Total Amount:* ${formatINR(order.net_amount)}\n`;
  msg += `💵 *Paid so far:* ${formatINR(order.paid_amount)}\n`;
  msg += `⏳ *Balance Payable:* ${formatINR(order.balance_amount)}\n\n`;
  msg += `You can collect your order during our boutique timings. We accept Cash & UPI.\n\n`;
  if (shop.address) {
    msg += `📍 *Address:* ${shop.address}\n`;
  }
  msg += `📞 *Phone:* ${shop.phone || ''}\n\n`;
  msg += `Warm regards,\n*${shopName}*`;

  return msg;
}

/**
 * 4. Payment Receipt
 */
export function getPaymentReceiptMessage(params: {
  shop: Partial<Shop>;
  customer: Customer;
  order: Order;
  payment: Payment;
}): string {
  const { shop, customer, order, payment } = params;
  const shopName = shop.name || 'Our Boutique';
  const dateFormatted = new Date(payment.payment_date).toLocaleDateString('en-IN');

  let msg = `🧾 *Payment Receipt - ${shopName}* 🧾\n\n`;
  msg += `Namaste ${customer.name} ji,\n`;
  msg += `We have received your payment of *${formatINR(payment.amount)}* on ${dateFormatted}.\n\n`;
  msg += `📋 *Order Number:* ${order.order_number}\n`;
  msg += `💳 *Payment Mode:* ${payment.payment_mode.toUpperCase()}\n`;
  if (payment.transaction_ref) {
    msg += `🔢 *Ref / UPI Txn:* ${payment.transaction_ref}\n`;
  }
  msg += `💰 *Order Total:* ${formatINR(order.net_amount)}\n`;
  msg += `💵 *Total Received:* ${formatINR(order.paid_amount)}\n`;
  msg += `⏳ *Remaining Balance:* ${formatINR(order.balance_amount)}\n\n`;
  msg += `Thank you for your timely payment!\n*${shopName}*`;

  return msg;
}

/**
 * 5. Friendly Balance Reminder
 */
export function getBalanceReminderMessage(params: {
  shop: Partial<Shop>;
  customer: Customer;
  order: Order;
}): string {
  const { shop, customer, order } = params;
  const shopName = shop.name || 'Our Boutique';

  let msg = `✨ *Friendly Reminder - ${shopName}* ✨\n\n`;
  msg += `Namaste ${customer.name} ji,\n`;
  msg += `This is a gentle reminder regarding the outstanding balance of *${formatINR(order.balance_amount)}* for order *#${order.order_number}*.\n\n`;
  msg += `Kindly settle this via UPI or at the boutique at your convenience. If you have already paid, please ignore this message.\n\n`;
  msg += `Thank you,\n*${shopName}*\n📞 ${shop.phone || ''}`;

  return msg;
}
