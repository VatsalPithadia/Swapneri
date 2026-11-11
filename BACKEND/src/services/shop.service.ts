import { supabase } from '../config/supabase';
import { Shop, GarmentType } from '../shared/types/database';

export const shopService = {
  async getShop(): Promise<Shop> {
    const { data, error } = await supabase.from('shops').select('*').limit(1).single();
    if (error) {
      return {
        id: 'a0000000-0000-0000-0000-000000000001',
        name: 'Swapneri Boutique',
        owner_name: 'Sunita Deshmukh',
        phone: '9820198201',
        currency: 'INR',
        measurement_unit: 'inches',
        invoice_prefix: 'SW',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    return data;
  },

  async updateShop(data: Partial<Shop>): Promise<Shop> {
    const current = await this.getShop();
    const { data: updated, error } = await supabase
      .from('shops')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', current.id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  },

  async getGarmentTypes(): Promise<GarmentType[]> {
    const { data, error } = await supabase
      .from('garment_types')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async updateGarmentPrice(code: string, price: number): Promise<void> {
    const { error } = await supabase
      .from('garment_types')
      .update({ default_price: price })
      .eq('code', code);

    if (error) throw error;
  },
};

