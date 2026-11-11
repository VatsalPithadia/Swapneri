// ==============================================================================
// lib/services/measurements.service.ts
// Measurement Profiles and Values Data Access Layer
// ==============================================================================

import { MeasurementProfile } from '../shared/types/database';
import { MeasurementProfileFormData } from '../shared/validation/measurement.schema';
import { demoStore } from './demo-store';
import { supabase } from '../supabase/client';

function isLiveSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && !url.includes('placeholder.supabase.co'));
}

export const measurementsService = {
  async getByCustomerId(customerId: string): Promise<MeasurementProfile[]> {
    if (isLiveSupabase()) {
      const { data, error } = await supabase
        .from('measurement_profiles')
        .select(`*, values:measurement_values(*)`)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
    return demoStore.getCustomerMeasurementProfiles(customerId);
  },

  async saveProfile(formData: MeasurementProfileFormData, profileId?: string): Promise<MeasurementProfile> {
    if (isLiveSupabase()) {
      let currentId = profileId;

      if (currentId) {
        const { error: pErr } = await supabase
          .from('measurement_profiles')
          .update({
            title: formData.title,
            garment_type: formData.garment_type,
            unit: formData.unit,
            notes: formData.notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentId);
        if (pErr) throw pErr;

        // Clear existing values
        await supabase.from('measurement_values').delete().eq('profile_id', currentId);
      } else {
        const { data: newProfile, error: pErr } = await supabase
          .from('measurement_profiles')
          .insert({
            customer_id: formData.customer_id,
            title: formData.title,
            garment_type: formData.garment_type,
            unit: formData.unit,
            notes: formData.notes || null,
          })
          .select()
          .single();
        if (pErr) throw pErr;
        currentId = newProfile.id;
      }

      // Insert values
      const rows = formData.values.map((v) => ({
        profile_id: currentId,
        field_key: v.field_key,
        value: v.value,
        fraction: v.fraction || '',
        notes: v.notes || null,
      }));
      const { error: vErr } = await supabase.from('measurement_values').insert(rows);
      if (vErr) throw vErr;

      const { data: fullProfile } = await supabase
        .from('measurement_profiles')
        .select('*, values:measurement_values(*)')
        .eq('id', currentId)
        .single();

      return fullProfile;
    }

    return demoStore.saveMeasurementProfile(
      {
        id: profileId,
        customer_id: formData.customer_id,
        garment_type: formData.garment_type,
        title: formData.title,
        unit: formData.unit,
        notes: formData.notes,
      },
      formData.values.map((v) => ({
        field_key: v.field_key,
        value: v.value,
        fraction: v.fraction,
        notes: v.notes ?? undefined,
      }))
    );
  },
};
