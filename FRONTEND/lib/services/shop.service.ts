// ==============================================================================
// lib/services/shop.service.ts
// Shop Profile, Karigars (Workers) & Settings Data Access Layer
// ==============================================================================

import { Shop, Worker, ShopSettings, GarmentType } from '../shared/types/database';
import { demoStore } from './demo-store';
import { supabase } from '../supabase/client';

function isLiveSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && !url.includes('placeholder.supabase.co'));
}

export const shopService = {
  async getShop(): Promise<Shop> {
    if (isLiveSupabase()) {
      try {
        const { data, error } = await supabase.from('shops').select('*').limit(1).maybeSingle();
        if (!error && data) {
          demoStore.updateShop(data);
          return data;
        }
      } catch (err) {
        console.warn('Failed to load shop from Supabase, falling back to local store:', err);
      }
    }
    return demoStore.getShop();
  },

  async updateShop(data: Partial<Shop>): Promise<Shop> {
    let resultShop: Shop;

    if (isLiveSupabase()) {
      try {
        const currentShop = await this.getShop();
        if (currentShop?.id) {
          const { data: updated, error } = await supabase
            .from('shops')
            .update({ ...data, updated_at: new Date().toISOString() })
            .eq('id', currentShop.id)
            .select()
            .single();

          if (!error && updated) {
            resultShop = updated;
            demoStore.updateShop(updated);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('shop-updated', { detail: updated }));
            }
            return updated;
          }
        } else {
          const { data: inserted, error } = await supabase
            .from('shops')
            .insert({
              name: data.name || 'Boutique',
              owner_name: data.owner_name || 'Owner',
              phone: data.phone || '9820198201',
              address: data.address || null,
              currency: data.currency || 'INR',
              measurement_unit: data.measurement_unit || 'inches',
              invoice_prefix: data.invoice_prefix || 'SW',
            })
            .select()
            .single();

          if (!error && inserted) {
            resultShop = inserted;
            demoStore.updateShop(inserted);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('shop-updated', { detail: inserted }));
            }
            return inserted;
          }
        }
      } catch (err) {
        console.warn('Failed to update shop in Supabase, saving to local store:', err);
      }
    }

    resultShop = demoStore.updateShop(data);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('shop-updated', { detail: resultShop }));
    }
    return resultShop;
  },

  async getWorkers(): Promise<Worker[]> {
    if (isLiveSupabase()) {
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    }
    return demoStore.getWorkers();
  },

  async saveWorker(worker: Partial<Worker>): Promise<Worker> {
    if (isLiveSupabase()) {
      if (worker.id) {
        const { data, error } = await supabase
          .from('workers')
          .update(worker)
          .eq('id', worker.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('workers')
          .insert({
            name: worker.name || 'Worker',
            phone: worker.phone || null,
            specialty: worker.specialty || 'stitching',
            is_active: true,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    }
    return demoStore.saveWorker(worker);
  },

  async deleteWorker(id: string): Promise<void> {
    if (isLiveSupabase()) {
      const { error } = await supabase.from('workers').update({ is_active: false }).eq('id', id);
      if (error) throw error;
      return;
    }
    const current = demoStore.getWorkers();
    const target = current.find((w) => w.id === id);
    if (target) {
      target.is_active = false;
    }
  },

  async getShopSettings(): Promise<ShopSettings> {
    if (isLiveSupabase()) {
      const { data, error } = await supabase.from('shop_settings').select('*').limit(1).maybeSingle();
      if (error) throw error;
      if (data) return data;
    }
    return demoStore.getState().shop_settings[0];
  },

  async updateShopSettings(data: Partial<ShopSettings>): Promise<ShopSettings> {
    if (isLiveSupabase()) {
      const current = await this.getShopSettings();
      const { data: updated, error } = await supabase
        .from('shop_settings')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', current.id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    }
    const ss = demoStore.getState().shop_settings;
    ss[0] = { ...ss[0], ...data, updated_at: new Date().toISOString() };
    return ss[0];
  },

  async getGarmentTypes(): Promise<GarmentType[]> {
    if (isLiveSupabase()) {
      const { data, error } = await supabase
        .from('garment_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) return data;
    }
    return demoStore.getState().garment_types;
  },

  async saveGarmentType(data: Partial<GarmentType>): Promise<GarmentType> {
    if (isLiveSupabase()) {
      if (data.id) {
        const { data: updated, error } = await supabase
          .from('garment_types')
          .update(data)
          .eq('id', data.id)
          .select()
          .single();
        if (error) throw error;
        return updated;
      } else {
        const { data: inserted, error } = await supabase
          .from('garment_types')
          .insert({
            name: data.name,
            code: data.code || data.name?.toLowerCase().replace(/\s+/g, '_'),
            default_price: data.default_price || 500,
            is_system: false,
            is_active: true,
          })
          .select()
          .single();
        if (error) throw error;
        return inserted;
      }
    }
    const gts = demoStore.getState().garment_types;
    if (data.id) {
      const idx = gts.findIndex((g) => g.id === data.id);
      if (idx >= 0) {
        gts[idx] = { ...gts[idx], ...data } as GarmentType;
        return gts[idx];
      }
    }
    const created: GarmentType = {
      id: `gt-${Date.now()}`,
      shop_id: null,
      name: data.name || 'New Garment',
      code: data.code || data.name?.toLowerCase().replace(/\s+/g, '_') || 'item',
      default_price: data.default_price || 500,
      is_system: false,
      is_active: true,
      sort_order: gts.length + 1,
      created_at: new Date().toISOString(),
    };
    gts.push(created);
    return created;
  },

  async addGarmentType(data: { name: string; default_price: number }): Promise<GarmentType> {
    return this.saveGarmentType(data);
  },

  async updateGarmentPrices(updates: { code: string; default_price: number }[]): Promise<void> {
    if (isLiveSupabase()) {
      for (const u of updates) {
        await supabase
          .from('garment_types')
          .update({ default_price: u.default_price })
          .eq('code', u.code);
      }
    }
    const gts = demoStore.getState().garment_types;
    updates.forEach((u) => {
      const target = gts.find((g) => g.code === u.code);
      if (target) {
        target.default_price = u.default_price;
      }
    });
  },

  async deleteGarmentType(codeOrId: string): Promise<void> {
    if (isLiveSupabase()) {
      await supabase
        .from('garment_types')
        .delete()
        .or(`code.eq.${codeOrId},id.eq.${codeOrId}`);
    }
    const gts = demoStore.getState().garment_types;
    demoStore.getState().garment_types = gts.filter((g) => g.code !== codeOrId && g.id !== codeOrId);
  },

  async clearAllData(): Promise<void> {
    demoStore.clearAllData();
  },
};
