// ==============================================================================
// lib/services/customers.service.ts
// Customer Data Access Layer (Supabase with Demo fallback)
// ==============================================================================

import { Customer } from '../shared/types/database';
import { CustomerFormData } from '../shared/validation/customer.schema';
import { demoStore } from './demo-store';
import { supabase } from '../supabase/client';

function isLiveSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && !url.includes('placeholder.supabase.co'));
}

export const customersService = {
  async getAll(): Promise<Customer[]> {
    if (isLiveSupabase()) {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
    return demoStore.getCustomers();
  },

  async getById(id: string): Promise<Customer | null> {
    if (isLiveSupabase()) {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    }
    return demoStore.getCustomerById(id) || null;
  },

  async create(data: CustomerFormData): Promise<Customer> {
    if (isLiveSupabase()) {
      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert({
          name: data.name,
          phone: data.phone,
          alternate_phone: data.alternate_phone || null,
          address: data.address || null,
          birthday: data.birthday || null,
          anniversary: data.anniversary || null,
          notes: data.notes || null,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }
      return newCustomer;
    }
    return demoStore.saveCustomer(data);
  },

  async update(id: string, data: Partial<CustomerFormData>): Promise<Customer> {
    if (isLiveSupabase()) {
      const { data: updated, error } = await supabase
        .from('customers')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    }
    return demoStore.saveCustomer({ id, ...data });
  },

  async delete(id: string): Promise<void> {
    if (isLiveSupabase()) {
      // 1. Fetch any orders belonging to this customer
      const { data: customerOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('customer_id', id);

      const orderIds = (customerOrders || []).map((o: any) => o.id);

      // 2. Delete payments first (satisfies RESTRICT foreign keys)
      if (orderIds.length > 0) {
        await supabase.from('payments').delete().in('order_id', orderIds);
      }
      await supabase.from('payments').delete().eq('customer_id', id);

      // 3. Delete orders
      await supabase.from('orders').delete().eq('customer_id', id);

      // 4. Delete measurement profiles
      await supabase.from('measurement_profiles').delete().eq('customer_id', id);

      // 5. Delete customer record
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return;
    }
    demoStore.deleteCustomer(id);
  },

  async softDelete(id: string): Promise<void> {
    return this.delete(id);
  },
};
