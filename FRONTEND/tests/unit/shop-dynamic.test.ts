import { describe, it, expect, beforeEach } from 'vitest';
import { demoStore } from '@/lib/services/demo-store';
import { shopService } from '@/lib/services/shop.service';
import {
  getOrderConfirmationMessage,
  getDeliveryReadyMessage,
  getPaymentReceiptMessage,
  getBalanceReminderMessage,
} from '@/lib/shared/constants/whatsapp-templates';
import { Customer, Order } from '@/lib/shared/types/database';

describe('Dynamic Shop Profile across Dashboard, Bills & Templates', () => {
  beforeEach(() => {
    demoStore.resetToSeed();
  });

  it('dynamically updates and returns new shop name, owner, and address', async () => {
    const updated = await shopService.updateShop({
      name: 'Swapneri Dresses',
      owner_name: 'Radha Patil',
      phone: '9876543210',
      address: 'Shop 12, Market Yard, Pune',
    });

    expect(updated.name).toBe('Swapneri Dresses');
    expect(updated.owner_name).toBe('Radha Patil');
    expect(updated.phone).toBe('9876543210');
    expect(updated.address).toBe('Shop 12, Market Yard, Pune');

    const shop = await shopService.getShop();
    expect(shop.name).toBe('Swapneri Dresses');
    expect(shop.owner_name).toBe('Radha Patil');
    expect(shop.phone).toBe('9876543210');
  });

  it('reflects dynamic shop name and phone in WhatsApp order confirmation', async () => {
    const shop = await shopService.updateShop({
      name: 'Priya Designer Boutique',
      owner_name: 'Priya Kulkarni',
      phone: '9811223344',
      address: 'FC Road, Pune',
    });

    const mockCustomer: Customer = {
      id: 'c-1',
      shop_id: 's-1',
      name: 'Anjali Shah',
      phone: '9822334455',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockOrder: Order = {
      id: 'o-1',
      shop_id: 's-1',
      customer_id: 'c-1',
      order_number: 'SW-260001',
      order_date: '2026-11-06',
      delivery_date: '2026-11-12',
      priority: 'normal',
      status: 'received',
      payment_status: 'partial',
      total_amount: 1500,
      discount_amount: 0,
      net_amount: 1500,
      paid_amount: 500,
      balance_amount: 1000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const confirmMsg = getOrderConfirmationMessage({
      shop,
      customer: mockCustomer,
      order: mockOrder,
    });

    expect(confirmMsg).toContain('Priya Designer Boutique');
    expect(confirmMsg).toContain('Anjali Shah');
    expect(confirmMsg).toContain('SW-260001');
    expect(confirmMsg).toContain('9811223344');

    const readyMsg = getDeliveryReadyMessage({
      shop,
      customer: mockCustomer,
      order: mockOrder,
    });

    expect(readyMsg).toContain('Priya Designer Boutique');
    expect(readyMsg).toContain('FC Road, Pune');
  });
});

