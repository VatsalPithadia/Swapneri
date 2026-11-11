// ==============================================================================
// lib/services/demo-store.ts
// In-Memory & LocalStorage reactive store initialized with boutique seed data.
// Seamlessly backs data when Supabase credentials are in development or demo mode.
// ==============================================================================

import {
  Shop,
  Customer,
  GarmentType,
  MeasurementFieldDef,
  MeasurementProfile,
  MeasurementValue,
  Worker,
  Order,
  OrderItem,
  OrderStatusHistory,
  Payment,
  PaymentStatus,
  Expense,
  ShopSettings,
  OrderStatus,
} from '../shared/types/database';
import { computeOrderFinancials } from '../shared/calculations/currency';
import { WOMEN_GARMENTS } from '../shared/constants/garments';

const DEMO_STORAGE_KEY = 'swapneri_boutique_live_v1';

export interface DatabaseState {
  shops: Shop[];
  customers: Customer[];
  garment_types: GarmentType[];
  measurement_fields: MeasurementFieldDef[];
  measurement_profiles: MeasurementProfile[];
  measurement_values: MeasurementValue[];
  workers: Worker[];
  orders: Order[];
  order_items: OrderItem[];
  order_status_history: OrderStatusHistory[];
  payments: Payment[];
  expenses: Expense[];
  shop_settings: ShopSettings[];
}

const DEFAULT_SHOP_ID = 'a0000000-0000-0000-0000-000000000001';
function getInitialState(): DatabaseState {
  return {
    shops: [
      {
        id: DEFAULT_SHOP_ID,
        name: 'Swapneri Boutique & Designer Studio',
        owner_name: 'Boutique Owner',
        phone: '9820198201',
        alternate_phone: null,
        address: 'Pune, Maharashtra',
        currency: 'INR',
        measurement_unit: 'inches',
        invoice_prefix: 'SW',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    customers: [],
    garment_types: Object.values(WOMEN_GARMENTS).map((g, idx) => ({
      id: `gt-${g.code}`,
      shop_id: null,
      code: g.code,
      name: g.name,
      default_price: g.defaultPrice,
      is_system: true,
      is_active: true,
      sort_order: idx + 1,
      created_at: new Date().toISOString(),
    })),
    measurement_fields: [],
    measurement_profiles: [],
    measurement_values: [],
    workers: [],
    orders: [],
    order_items: [],
    order_status_history: [],
    payments: [],
    expenses: [],
    shop_settings: [
      {
        id: 'ss-1',
        shop_id: DEFAULT_SHOP_ID,
        whatsapp_template_order_confirm:
          'Hello {customer_name}! Thank you for your order {order_number} at Swapneri Boutique. Total: ₹{total_amount}, Advance Paid: ₹{paid_amount}, Balance: ₹{balance_amount}. Delivery Date: {delivery_date}.',
        whatsapp_template_trial_ready: '',
        whatsapp_template_delivery_ready:
          'Namaste {customer_name}! Great news! Your order {order_number} is ready for pickup at Swapneri Boutique. Balance Due: ₹{balance_amount}.',
        whatsapp_template_payment_reminder:
          'Hello {customer_name}! Friendly reminder regarding pending balance of ₹{balance_amount} for order {order_number} at Swapneri Boutique.',
        terms_and_conditions:
          '1. Complimentary alterations are provided within 7 days from the date of delivery. 2. Please show receipt upon pickup. 3. Finished garments not collected within 45 days are subject to storage terms.',
        updated_at: new Date().toISOString(),
      },
    ],
  };
}

class DemoStore {
  private state: DatabaseState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DatabaseState {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(DEMO_STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch {
        // fallback to initial
      }
    }
    return getInitialState();
  }

  private persist() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(this.state));
      } catch {
        // quota handled
      }
    }
    this.listeners.forEach((listener) => listener());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public resetToSeed() {
    this.state = getInitialState();
    this.persist();
  }

  // --- Customers ---
  public getCustomers(includeDeleted = false): Customer[] {
    return this.state.customers
      .filter((c) => includeDeleted || !c.deleted_at)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.state.customers.find((c) => c.id === id);
  }

  public saveCustomer(customerData: Partial<Customer>): Customer {
    const isEdit = Boolean(customerData.id);
    const existingIndex = isEdit ? this.state.customers.findIndex((c) => c.id === customerData.id) : -1;

    if (isEdit && existingIndex >= 0) {
      const updated: Customer = {
        ...this.state.customers[existingIndex],
        ...customerData,
        updated_at: new Date().toISOString(),
      };
      this.state.customers[existingIndex] = updated;
      this.persist();
      return updated;
    } else {
      const created: Customer = {
        id: customerData.id || `cust-${Date.now()}`,
        shop_id: DEFAULT_SHOP_ID,
        name: customerData.name || 'New Customer',
        phone: customerData.phone || '',
        alternate_phone: customerData.alternate_phone || null,
        address: customerData.address || null,
        birthday: customerData.birthday || null,
        anniversary: customerData.anniversary || null,
        notes: customerData.notes || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      };
      this.state.customers.unshift(created);
      this.persist();
      return created;
    }
  }

  public deleteCustomer(id: string): void {
    this.state.customers = this.state.customers.filter((c) => c.id !== id);
    this.state.measurement_profiles = this.state.measurement_profiles.filter((p) => p.customer_id !== id);
    this.state.orders = this.state.orders.filter((o) => o.customer_id !== id);
    this.state.payments = this.state.payments.filter((p) => p.customer_id !== id);
    this.persist();
  }

  public softDeleteCustomer(id: string): void {
    this.deleteCustomer(id);
  }

  // --- Measurement Profiles & Values ---
  public getCustomerMeasurementProfiles(customerId: string): MeasurementProfile[] {
    const profiles = this.state.measurement_profiles
      .filter((p) => p.customer_id === customerId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return profiles.map((p) => ({
      ...p,
      values: this.state.measurement_values.filter((v) => v.profile_id === p.id),
    }));
  }

  public saveMeasurementProfile(
    profileData: Partial<MeasurementProfile>,
    values: Array<{ field_key: string; value: number; fraction?: string; notes?: string }>
  ): MeasurementProfile {
    const profileId = profileData.id || `prof-${Date.now()}`;
    const newProfile: MeasurementProfile = {
      id: profileId,
      shop_id: DEFAULT_SHOP_ID,
      customer_id: profileData.customer_id!,
      garment_type: profileData.garment_type || 'blouse',
      title: profileData.title || 'Measurement Profile',
      unit: profileData.unit || 'inches',
      notes: profileData.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Replace or add
    const existingIndex = this.state.measurement_profiles.findIndex((p) => p.id === profileId);
    if (existingIndex >= 0) {
      this.state.measurement_profiles[existingIndex] = newProfile;
    } else {
      this.state.measurement_profiles.unshift(newProfile);
    }

    // Replace values
    this.state.measurement_values = this.state.measurement_values.filter((v) => v.profile_id !== profileId);
    values.forEach((v) => {
      this.state.measurement_values.push({
        id: `mv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        profile_id: profileId,
        field_key: v.field_key,
        value: v.value,
        fraction: v.fraction || '',
        notes: v.notes || null,
      });
    });

    this.persist();
    return { ...newProfile, values: this.state.measurement_values.filter((v) => v.profile_id === profileId) };
  }

  // --- Orders ---
  public getOrders(filters?: {
    status?: OrderStatus;
    customerId?: string;
    priority?: string;
    search?: string;
  }): Order[] {
    let list = this.state.orders.filter((o) => !o.deleted_at);

    if (filters?.status) {
      list = list.filter((o) => o.status === filters.status);
    }
    if (filters?.customerId) {
      list = list.filter((o) => o.customer_id === filters.customerId);
    }
    if (filters?.priority) {
      list = list.filter((o) => o.priority === filters.priority);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((o) => {
        const cust = this.getCustomerById(o.customer_id);
        return (
          o.order_number.toLowerCase().includes(q) ||
          cust?.name.toLowerCase().includes(q) ||
          cust?.phone.includes(q)
        );
      });
    }

    // Hydrate joined fields
    return list
      .map((o) => this.hydrateOrder(o))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getOrderById(id: string): Order | undefined {
    const raw = this.state.orders.find((o) => o.id === id);
    if (!raw) return undefined;
    return this.hydrateOrder(raw);
  }

  private hydrateOrder(order: Order): Order {
    const customer = this.getCustomerById(order.customer_id);
    const items = this.state.order_items
      .filter((i) => i.order_id === order.id)
      .map((item) => ({
        ...item,
        worker: this.state.workers.find((w) => w.id === item.assigned_worker_id) || null,
        measurement_profile: this.state.measurement_profiles.find((p) => p.id === item.measurement_profile_id) || null,
      }));
    const payments = this.state.payments
      .filter((p) => p.order_id === order.id)
      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
    const status_history = this.state.order_status_history
      .filter((h) => h.order_id === order.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Calculate financials to guarantee no zero-bill bugs
    const itemsTotal = items.reduce(
      (sum, it) => sum + (Number(it.total_price) || (Number(it.quantity) * Number(it.unit_price)) || 0),
      0
    );
    const rawTotal = Number(order.total_amount) || 0;
    const totalAmount = rawTotal > 0 && rawTotal >= itemsTotal ? rawTotal : (itemsTotal > 0 ? itemsTotal : rawTotal);
    const discountAmount = Math.min(totalAmount, Math.max(0, Number(order.discount_amount) || 0));
    const netAmount = Math.max(0, totalAmount - discountAmount);
    const paymentsSum = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const paidAmount = paymentsSum > 0 ? paymentsSum : (Number(order.paid_amount) || 0);
    const balanceAmount = Math.max(0, netAmount - paidAmount);

    let paymentStatus: PaymentStatus = 'unpaid';
    if (netAmount > 0 && paidAmount >= netAmount) {
      paymentStatus = 'paid';
    } else if (paidAmount > 0) {
      paymentStatus = 'partial';
    }

    return {
      ...order,
      total_amount: totalAmount,
      discount_amount: discountAmount,
      net_amount: netAmount,
      paid_amount: paidAmount,
      balance_amount: balanceAmount,
      payment_status: paymentStatus,
      customer,
      items,
      payments,
      status_history,
    };
  }

  public createOrder(params: {
    customer_id: string;
    order_date: string;
    trial_date?: string | null;
    delivery_date: string;
    priority: 'normal' | 'urgent';
    notes?: string | null;
    items: Array<Omit<OrderItem, 'id' | 'order_id' | 'created_at'>>;
    discount_amount?: number;
    advance_amount?: number;
    advance_payment_mode?: 'cash' | 'upi' | 'card' | 'bank_transfer';
    advance_notes?: string | null;
  }): Order {
    const orderId = `ord-${Date.now()}`;
    const nextSeq = this.state.orders.length + 1;
    const orderNumber = `SW-${new Date().getFullYear().toString().slice(-2)}${String(nextSeq).padStart(3, '0')}`;

    // Compute finances
    const financials = computeOrderFinancials({
      items: params.items,
      discountAmount: params.discount_amount || 0,
      paidAmount: params.advance_amount || 0,
    });

    const newOrder: Order = {
      id: orderId,
      shop_id: DEFAULT_SHOP_ID,
      customer_id: params.customer_id,
      order_number: orderNumber,
      order_date: params.order_date,
      trial_date: params.trial_date || null,
      delivery_date: params.delivery_date,
      priority: params.priority,
      status: 'received',
      total_amount: financials.totalAmount,
      discount_amount: financials.discountAmount,
      net_amount: financials.netAmount,
      paid_amount: financials.paidAmount,
      balance_amount: financials.balanceAmount,
      payment_status: financials.paymentStatus,
      notes: params.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    this.state.orders.unshift(newOrder);

    // Items
    params.items.forEach((item, idx) => {
      this.state.order_items.push({
        id: `oi-${orderId}-${idx + 1}`,
        order_id: orderId,
        garment_type: item.garment_type,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
        design_notes: item.design_notes || null,
        fabric_source: item.fabric_source,
        fabric_details: item.fabric_details || null,
        measurement_profile_id: item.measurement_profile_id || null,
        assigned_worker_id: item.assigned_worker_id || null,
        reference_photos: item.reference_photos || [],
        created_at: new Date().toISOString(),
      });
    });

    // Status history
    this.state.order_status_history.unshift({
      id: `osh-${Date.now()}`,
      order_id: orderId,
      from_status: null,
      to_status: 'received',
      notes: 'Order received and booked',
      created_at: new Date().toISOString(),
    });

    // Advance payment if recorded
    if (params.advance_amount && params.advance_amount > 0) {
      this.state.payments.unshift({
        id: `pay-${Date.now()}`,
        shop_id: DEFAULT_SHOP_ID,
        order_id: orderId,
        customer_id: params.customer_id,
        amount: params.advance_amount,
        payment_date: params.order_date,
        payment_mode: params.advance_payment_mode || 'cash',
        notes: params.advance_notes || 'Booking advance payment',
        created_at: new Date().toISOString(),
      });
    }

    this.persist();
    return this.hydrateOrder(newOrder);
  }

  public updateOrderStatus(orderId: string, newStatus: OrderStatus, notes?: string): Order {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const oldStatus = order.status;
    order.status = newStatus;
    order.updated_at = new Date().toISOString();

    this.state.order_status_history.unshift({
      id: `osh-${Date.now()}`,
      order_id: orderId,
      from_status: oldStatus,
      to_status: newStatus,
      notes: notes || `Status changed from ${oldStatus} to ${newStatus}`,
      created_at: new Date().toISOString(),
    });

    this.persist();
    return this.hydrateOrder(order);
  }

  public deleteOrder(orderId: string): void {
    this.state.orders = this.state.orders.filter((o) => o.id !== orderId);
    this.state.order_items = this.state.order_items.filter((i) => i.order_id !== orderId);
    this.state.order_status_history = this.state.order_status_history.filter((h) => h.order_id !== orderId);
    this.state.payments = this.state.payments.filter((p) => p.order_id !== orderId);
    this.persist();
  }

  public softDeleteOrder(orderId: string): void {
    this.deleteOrder(orderId);
  }

  public clearAllData(): void {
    this.state.customers = [];
    this.state.orders = [];
    this.state.order_items = [];
    this.state.order_status_history = [];
    this.state.payments = [];
    this.state.expenses = [];
    this.state.measurement_profiles = [];
    this.state.measurement_values = [];
    this.state.workers = [];
    this.persist();
  }

  // --- Payments ---
  public recordPayment(params: {
    order_id: string;
    customer_id: string;
    amount: number;
    payment_date: string;
    payment_mode: 'cash' | 'upi' | 'card' | 'bank_transfer';
    transaction_ref?: string | null;
    notes?: string | null;
  }): Payment {
    const order = this.state.orders.find((o) => o.id === params.order_id);
    if (!order) throw new Error('Order not found');

    if (params.amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }
    if (params.amount > order.balance_amount) {
      throw new Error(`Amount ₹ ${params.amount} exceeds remaining balance of ₹ ${order.balance_amount}.`);
    }

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      shop_id: DEFAULT_SHOP_ID,
      order_id: params.order_id,
      customer_id: params.customer_id,
      amount: params.amount,
      payment_date: params.payment_date,
      payment_mode: params.payment_mode,
      transaction_ref: params.transaction_ref || null,
      notes: params.notes || null,
      created_at: new Date().toISOString(),
    };

    this.state.payments.unshift(newPayment);

    // Recalculate order financials
    const allOrderPayments = this.state.payments.filter((p) => p.order_id === params.order_id);
    const totalPaid = allOrderPayments.reduce((sum, p) => sum + p.amount, 0);

    order.paid_amount = totalPaid;
    order.balance_amount = Math.max(0, order.net_amount - totalPaid);
    if (order.paid_amount >= order.net_amount && order.net_amount > 0) {
      order.payment_status = 'paid';
    } else if (order.paid_amount > 0) {
      order.payment_status = 'partial';
    } else {
      order.payment_status = 'unpaid';
    }
    order.updated_at = new Date().toISOString();

    this.persist();
    return newPayment;
  }

  public getPayments(): Payment[] {
    return this.state.payments
      .map((p) => ({
        ...p,
        order: { order_number: this.state.orders.find((o) => o.id === p.order_id)?.order_number || '' },
      }))
      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
  }

  // --- Expenses ---
  public getExpenses(): Expense[] {
    return [...this.state.expenses].sort(
      (a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()
    );
  }

  public addExpense(params: Omit<Expense, 'id' | 'shop_id' | 'created_at'>): Expense {
    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      shop_id: DEFAULT_SHOP_ID,
      category: params.category,
      amount: params.amount,
      expense_date: params.expense_date,
      paid_to: params.paid_to || null,
      payment_mode: params.payment_mode,
      notes: params.notes || null,
      created_at: new Date().toISOString(),
    };
    this.state.expenses.unshift(newExpense);
    this.persist();
    return newExpense;
  }

  // --- Workers ---
  public getWorkers(): Worker[] {
    return this.state.workers.filter((w) => w.is_active);
  }

  public saveWorker(worker: Partial<Worker>): Worker {
    if (worker.id) {
      const idx = this.state.workers.findIndex((w) => w.id === worker.id);
      if (idx >= 0) {
        this.state.workers[idx] = { ...this.state.workers[idx], ...worker };
        this.persist();
        return this.state.workers[idx];
      }
    }
    const created: Worker = {
      id: `w-${Date.now()}`,
      shop_id: DEFAULT_SHOP_ID,
      name: worker.name || 'Worker',
      phone: worker.phone || null,
      specialty: worker.specialty || 'tailor',
      is_active: true,
      created_at: new Date().toISOString(),
    };
    this.state.workers.push(created);
    this.persist();
    return created;
  }

  // --- Shop Settings ---
  public getShop(): Shop {
    return this.state.shops[0];
  }

  public updateShop(data: Partial<Shop>): Shop {
    this.state.shops[0] = { ...this.state.shops[0], ...data, updated_at: new Date().toISOString() };
    this.persist();
    return this.state.shops[0];
  }

  // --- Dashboard KPI Summary ---
  public getDashboardStats() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
    const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

    const activeOrders = this.getOrders().filter((o) => !o.deleted_at && o.status !== 'cancelled');

    const todaysDeliveries = activeOrders.filter(
      (o) => o.delivery_date === todayStr && o.status !== 'delivered'
    );

    const dueThisWeek = activeOrders.filter(
      (o) =>
        o.delivery_date >= startOfWeekStr &&
        o.delivery_date <= endOfWeekStr &&
        o.status !== 'delivered'
    );

    const overdueOrders = activeOrders.filter(
      (o) => o.delivery_date < todayStr && o.status !== 'delivered'
    );

    const pendingDuesOrders = activeOrders.filter((o) => (o.balance_amount || 0) > 0);
    const pendingPaymentsTotal = pendingDuesOrders.reduce((sum, o) => sum + (o.balance_amount || 0), 0);

    const urgentOrders = activeOrders.filter(
      (o) => o.priority === 'urgent' && o.status !== 'delivered'
    );

    // Orders by status
    const statusCounts: Record<OrderStatus, number> = {
      received: 0,
      cutting: 0,
      stitching: 0,
      finishing: 0,
      ready: 0,
      delivered: 0,
      cancelled: 0,
    };
    activeOrders.forEach((o) => {
      if (statusCounts[o.status] !== undefined) {
        statusCounts[o.status]++;
      }
    });

    const recentCustomers = this.getCustomers().slice(0, 5);

    return {
      todaysDeliveries: todaysDeliveries || [],
      dueThisWeek: dueThisWeek || [],
      overdueOrders: overdueOrders || [],
      pendingDuesOrders: pendingDuesOrders || [],
      pendingPaymentsTotal: pendingPaymentsTotal || 0,
      urgentOrders: urgentOrders || [],
      statusCounts: statusCounts || {},
      recentCustomers: recentCustomers || [],
      totalActiveOrders: activeOrders.length || 0,
      allOrders: activeOrders || [],
    };
  }

  // ----------------------------------------------------------------------------
  // Garment Types & Price List
  // ----------------------------------------------------------------------------
  public getGarmentTypes(): GarmentType[] {
    return this.state.garment_types || [];
  }

  public saveGarmentType(data: { name: string; default_price: number; code?: string }): GarmentType {
    const code = data.code || data.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (!this.state.garment_types) {
      this.state.garment_types = [];
    }

    const existingIndex = this.state.garment_types.findIndex((g) => g.code === code);
    if (existingIndex >= 0) {
      this.state.garment_types[existingIndex].default_price = data.default_price;
      this.state.garment_types[existingIndex].name = data.name;
      this.persist();
      return this.state.garment_types[existingIndex];
    } else {
      const newItem: GarmentType = {
        id: `gt-${Date.now()}`,
        shop_id: DEFAULT_SHOP_ID,
        code,
        name: data.name,
        default_price: data.default_price,
        is_system: false,
        is_active: true,
        sort_order: this.state.garment_types.length + 1,
        created_at: new Date().toISOString(),
      };
      this.state.garment_types.push(newItem);
      this.persist();
      return newItem;
    }
  }

  public updateGarmentPrices(updatedPrices: { code: string; name?: string; default_price: number }[]): GarmentType[] {
    if (!this.state.garment_types) {
      this.state.garment_types = [];
    }
    updatedPrices.forEach((u) => {
      const match = this.state.garment_types.find((g) => g.code === u.code);
      if (match) {
        match.default_price = u.default_price;
        if (u.name) match.name = u.name;
      }
    });
    this.persist();
    return this.state.garment_types;
  }

  public deleteGarmentType(code: string): boolean {
    if (!this.state.garment_types) return false;
    this.state.garment_types = this.state.garment_types.filter((g) => g.code !== code);
    this.persist();
    return true;
  }
}

// Export singleton instance
export const demoStore = new DemoStore();
