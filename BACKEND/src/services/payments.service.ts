import { supabase } from '../config/supabase';
import { Payment } from '../shared/types/database';
import { PaymentFormData } from '../shared/validation/payment.schema';

export const paymentsService = {
  async getAll(): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select(`*, order:orders(order_number), customer:customers(name, phone)`)
      .order('payment_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async record(data: PaymentFormData): Promise<Payment> {
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        order_id: data.order_id,
        customer_id: data.customer_id,
        amount: data.amount,
        payment_date: data.payment_date,
        payment_mode: data.payment_mode,
        transaction_ref: data.transaction_ref || null,
        notes: data.notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Recalculate order financial balance in Supabase
    const { data: allPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('order_id', data.order_id);

    const totalPaid = (allPayments || []).reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

    const { data: ord } = await supabase
      .from('orders')
      .select('total_amount, discount_amount, items:order_items(total_price)')
      .eq('id', data.order_id)
      .single();

    if (ord) {
      let total = Number(ord.total_amount) || 0;
      if (total === 0 && ord.items && (ord.items as any).length > 0) {
        total = (ord.items as any).reduce((s: number, it: any) => s + (Number(it.total_price) || 0), 0);
      }
      const discount = Number(ord.discount_amount) || 0;
      const net = Math.max(0, total - discount);
      const bal = Math.max(0, net - totalPaid);
      const status = totalPaid >= net && net > 0 ? 'paid' : (totalPaid > 0 ? 'partial' : 'unpaid');

      await supabase
        .from('orders')
        .update({
          total_amount: total,
          net_amount: net,
          paid_amount: totalPaid,
          balance_amount: bal,
          payment_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.order_id);
    }

    return payment;
  },
};

