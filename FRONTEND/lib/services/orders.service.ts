// ==============================================================================
// lib/services/orders.service.ts
// Orders Data Access Layer (Supabase with Demo fallback)
// ==============================================================================

import { Order, OrderStatus, PaymentStatus } from '../shared/types/database';
import { OrderFormData } from '../shared/validation/order.schema';
import { computeOrderFinancials } from '../shared/calculations/currency';
import { demoStore } from './demo-store';
import { customersService } from './customers.service';
import { supabase } from '../supabase/client';

function isLiveSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && !url.includes('placeholder.supabase.co'));
}

export function hydrateOrderFinancials(order: any): Order {
  if (!order) return order;
  const items = order.items || order.order_items || [];
  const payments = order.payments || [];

  // Compute total from items
  const itemsTotal = items.reduce(
    (sum: number, it: any) =>
      sum + (Number(it.total_price) || (Number(it.quantity) * Number(it.unit_price)) || 0),
    0
  );

  const rawTotal = Number(order.total_amount) || 0;
  // If stored total_amount is 0 or less than itemsTotal, and items exist, prefer items total
  const totalAmount = rawTotal > 0 && rawTotal >= itemsTotal ? rawTotal : (itemsTotal > 0 ? itemsTotal : rawTotal);
  const discountAmount = Math.min(totalAmount, Math.max(0, Number(order.discount_amount) || 0));
  const netAmount = Math.max(0, totalAmount - discountAmount);

  // Compute paid amount from recorded payments
  const paymentsSum = payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
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
    items,
    payments,
  };
}

export const ordersService = {
  async getAll(filters?: {
    status?: OrderStatus;
    customerId?: string;
    priority?: string;
    search?: string;
  }): Promise<Order[]> {
    if (isLiveSupabase()) {
      let query = supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*),
          items:order_items(*, worker:workers(*)),
          payments:payments(*),
          status_history:order_status_history(*)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.customerId) query = query.eq('customer_id', filters.customerId);
      if (filters?.priority) query = query.eq('priority', filters.priority);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(hydrateOrderFinancials);
    }
    const demoOrders = demoStore.getOrders(filters);
    return (demoOrders || []).map(hydrateOrderFinancials);
  },

  async getById(id: string): Promise<Order | null> {
    if (isLiveSupabase()) {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*),
          items:order_items(*, worker:workers(*)),
          payments:payments(*),
          status_history:order_status_history(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      const hydrated = hydrateOrderFinancials(data);

      // Auto self-heal in Supabase if total_amount was 0 but items total > 0
      if (Number(data.total_amount) === 0 && hydrated.total_amount > 0) {
        supabase
          .from('orders')
          .update({
            total_amount: hydrated.total_amount,
            net_amount: hydrated.net_amount,
            paid_amount: hydrated.paid_amount,
            balance_amount: hydrated.balance_amount,
            payment_status: hydrated.payment_status,
          })
          .eq('id', id)
          .then();
      }

      return hydrated;
    }
    const demoOrder = demoStore.getOrderById(id);
    return demoOrder ? hydrateOrderFinancials(demoOrder) : null;
  },

  async create(data: OrderFormData): Promise<Order> {
    if (isLiveSupabase()) {
      // 1. Calculate financials properly
      const financials = computeOrderFinancials({
        items: data.items.map((i) => ({ quantity: i.quantity, unit_price: i.unit_price })),
        discountAmount: data.discount_amount || 0,
        paidAmount: data.advance_amount || 0,
      });

      // 2. Generate Order Number
      const { data: numData } = await supabase.rpc('generate_order_number', {
        p_shop_id: (await supabase.auth.getUser()).data.user?.id,
      });
      const orderNumber = numData || `SW-${Date.now().toString().slice(-4)}`;

      // 3. Insert Order with full financial fields
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          customer_id: data.customer_id,
          order_number: orderNumber,
          order_date: data.order_date,
          trial_date: data.trial_date || null,
          delivery_date: data.delivery_date,
          priority: data.priority,
          total_amount: financials.totalAmount,
          discount_amount: financials.discountAmount,
          net_amount: financials.netAmount,
          paid_amount: financials.paidAmount,
          balance_amount: financials.balanceAmount,
          payment_status: financials.paymentStatus,
          notes: data.notes || null,
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      // 4. Insert Items
      const itemsToInsert = data.items.map((item) => ({
        order_id: order.id,
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
      }));

      const { error: itemsErr } = await supabase.from('order_items').insert(itemsToInsert);
      if (itemsErr) throw itemsErr;

      // 5. Advance payment if provided
      if (data.advance_amount && data.advance_amount > 0) {
        await supabase.from('payments').insert({
          order_id: order.id,
          customer_id: data.customer_id,
          amount: data.advance_amount,
          payment_date: data.order_date,
          payment_mode: data.advance_payment_mode || 'cash',
          notes: data.advance_notes || 'Advance booking payment',
        });
      }

      return (await this.getById(order.id))!;
    }

    return demoStore.createOrder({
      customer_id: data.customer_id,
      order_date: data.order_date,
      trial_date: data.trial_date,
      delivery_date: data.delivery_date,
      priority: data.priority,
      notes: data.notes,
      items: data.items.map((i) => ({
        ...i,
        total_price: i.quantity * i.unit_price,
        reference_photos: i.reference_photos || [],
      })),
      discount_amount: data.discount_amount,
      advance_amount: data.advance_amount,
      advance_payment_mode: data.advance_payment_mode,
      advance_notes: data.advance_notes,
    });
  },

  async updateStatus(orderId: string, newStatus: OrderStatus, notes?: string): Promise<Order> {
    if (isLiveSupabase()) {
      const { data: updated, error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return (await this.getById(orderId))!;
    }
    return demoStore.updateOrderStatus(orderId, newStatus, notes);
  },

  async delete(orderId: string): Promise<void> {
    if (isLiveSupabase()) {
      await supabase.from('payments').delete().eq('order_id', orderId);
      await supabase.from('order_items').delete().eq('order_id', orderId);
      await supabase.from('order_status_history').delete().eq('order_id', orderId);

      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
      return;
    }
    demoStore.deleteOrder(orderId);
  },

  async softDelete(orderId: string): Promise<void> {
    return this.delete(orderId);
  },

  async getDashboardStats() {
    if (isLiveSupabase()) {
      const orders = await this.getAll();
      const customers = await customersService.getAll();
      const todayDate = new Date();
      const todayStr = todayDate.toISOString().split('T')[0];

      const startOfWeek = new Date(todayDate);
      startOfWeek.setDate(todayDate.getDate() - todayDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
      const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

      const activeOrders = orders.filter((o) => !o.deleted_at && o.status !== 'cancelled');

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

      const recentCustomers = customers.slice(0, 5);

      return {
        todaysDeliveries,
        dueThisWeek,
        overdueOrders,
        pendingDuesOrders,
        pendingPaymentsTotal,
        urgentOrders,
        statusCounts,
        recentCustomers,
        totalActiveOrders: activeOrders.length,
        allOrders: activeOrders,
      };
    }

    return demoStore.getDashboardStats();
  },
};
