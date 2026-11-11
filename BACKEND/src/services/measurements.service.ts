import { supabase } from '../config/supabase';
import { MeasurementProfile, MeasurementValue } from '../shared/types/database';

export const measurementsService = {
  async getByCustomerId(customerId: string): Promise<MeasurementProfile[]> {
    const { data: profiles, error } = await supabase
      .from('measurement_profiles')
      .select('*, values:measurement_values(*)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return profiles || [];
  },

  async getById(id: string): Promise<MeasurementProfile | null> {
    const { data, error } = await supabase
      .from('measurement_profiles')
      .select('*, values:measurement_values(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async saveProfile(
    profile: {
      customer_id: string;
      garment_type: string;
      title: string;
      unit: 'inches' | 'cm';
      notes?: string | null;
    },
    values: Array<{ field_key: string; value: number; fraction?: string; notes?: string | null }>
  ): Promise<MeasurementProfile> {
    const { data: newProfile, error: profErr } = await supabase
      .from('measurement_profiles')
      .insert({
        customer_id: profile.customer_id,
        garment_type: profile.garment_type,
        title: profile.title,
        unit: profile.unit,
        notes: profile.notes || null,
      })
      .select()
      .single();

    if (profErr) throw profErr;

    if (values.length > 0) {
      const rows = values.map((v) => ({
        profile_id: newProfile.id,
        field_key: v.field_key,
        value: v.value,
        fraction: v.fraction || null,
        notes: v.notes || null,
      }));

      const { error: valErr } = await supabase.from('measurement_values').insert(rows);
      if (valErr) throw valErr;
    }

    return (await this.getById(newProfile.id))!;
  },

  async deleteProfile(id: string): Promise<void> {
    await supabase.from('measurement_values').delete().eq('profile_id', id);
    const { error } = await supabase.from('measurement_profiles').delete().eq('id', id);
    if (error) throw error;
  },
};

