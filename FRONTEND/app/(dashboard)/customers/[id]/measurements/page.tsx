'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { customersService } from '@/lib/services/customers.service';
import { measurementsService } from '@/lib/services/measurements.service';
import { Customer, MeasurementProfile } from '@/lib/shared/types/database';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Check } from 'lucide-react';

interface SlipState {
  // Top
  top_length: string;
  frock_length: string;
  gown_length: string;
  sleeve_full_len: string;
  sleeve_full_mori: string;
  sleeve_three_fourth_len: string;
  sleeve_three_fourth_mori: string;
  sleeve_short_len: string;
  sleeve_short_mori: string;
  shoulder: string;
  chest: string;
  chest_note: string;
  waist: string;
  waist_note: string;
  seat_hip: string;
  seat_note: string;

  // Bottom
  pant_length: string;
  pant_mori: string;
  pant_other: string;
  plazo_length: string;
  plazo_mori: string;
  panjabi_length: string;
  panjabi_mori: string;

  // Blouse
  blouse_length: string;
  blouse_sleeve_long_len: string;
  blouse_sleeve_long_mori: string;
  blouse_sleeve_short_len: string;
  blouse_sleeve_short_mori: string;
  bicep_bayshep: string;
  armhole_mundo: string;
  blouse_chest: string;
  blouse_waist: string;
  blouse_shoulder: string;

  general_notes: string;
}

const initialSlip: SlipState = {
  top_length: '',
  frock_length: '',
  gown_length: '',
  sleeve_full_len: '',
  sleeve_full_mori: '',
  sleeve_three_fourth_len: '',
  sleeve_three_fourth_mori: '',
  sleeve_short_len: '',
  sleeve_short_mori: '',
  shoulder: '',
  chest: '',
  chest_note: '',
  waist: '',
  waist_note: '',
  seat_hip: '',
  seat_note: '',

  pant_length: '',
  pant_mori: '',
  pant_other: '',
  plazo_length: '',
  plazo_mori: '',
  panjabi_length: '',
  panjabi_mori: '',

  blouse_length: '',
  blouse_sleeve_long_len: '',
  blouse_sleeve_long_mori: '',
  blouse_sleeve_short_len: '',
  blouse_sleeve_short_mori: '',
  bicep_bayshep: '',
  armhole_mundo: '',
  blouse_chest: '',
  blouse_waist: '',
  blouse_shoulder: '',

  general_notes: '',
};

function CustomerMeasurementFormContent() {
  const params = useParams();
  const router = useRouter();
  const customerId = params?.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [slip, setSlip] = useState<SlipState>(initialSlip);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!customerId) return;
    const loadCustomer = async () => {
      const cust = await customersService.getById(customerId);
      if (cust) {
        setCustomer(cust);
        const profiles = await measurementsService.getByCustomerId(customerId);

        const loaded: SlipState = { ...initialSlip };
        profiles.forEach((p) => {
          if (p.notes) loaded.general_notes = p.notes;
          p.values?.forEach((v) => {
            const valStr = v.value ? String(v.value) : '';
            if (p.garment_type === 'top') {
              if (v.field_key === 'chest') loaded.chest = valStr;
              else if (v.field_key === 'waist') loaded.waist = valStr;
              else if (v.field_key === 'shoulder') loaded.shoulder = valStr;
              else if (v.field_key in loaded) {
                (loaded as any)[v.field_key] = valStr || v.notes || '';
              }
            } else if (p.garment_type === 'bottom') {
              if (v.field_key in loaded) {
                (loaded as any)[v.field_key] = valStr || v.notes || '';
              }
            } else if (p.garment_type === 'blouse') {
              if (v.field_key === 'chest') loaded.blouse_chest = valStr;
              else if (v.field_key === 'waist') loaded.blouse_waist = valStr;
              else if (v.field_key === 'shoulder') loaded.blouse_shoulder = valStr;
              else if (v.field_key in loaded) {
                (loaded as any)[v.field_key] = valStr || v.notes || '';
              }
            }
          });
        });

        // Auto sync if blouse is empty but top has values
        if (!loaded.blouse_chest && loaded.chest) loaded.blouse_chest = loaded.chest;
        if (!loaded.blouse_waist && loaded.waist) loaded.blouse_waist = loaded.waist;
        if (!loaded.blouse_shoulder && loaded.shoulder) loaded.blouse_shoulder = loaded.shoulder;

        setSlip(loaded);
      }
    };
    loadCustomer();
  }, [customerId]);

  // Handle Input Changes with Silent Auto-Sync from Top to Blouse
  const handleChange = (field: keyof SlipState, value: string) => {
    setSlip((prev) => {
      const updated = { ...prev, [field]: value };

      // Silent Auto-Sync: Top Chest, Waist, Shoulder automatically sync to Blouse
      if (field === 'chest') {
        updated.blouse_chest = value;
      } else if (field === 'waist') {
        updated.blouse_waist = value;
      } else if (field === 'shoulder') {
        updated.blouse_shoulder = value;
      }

      return updated;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSaving(true);

    try {
      // 1. Top Profile
      const topFields = [
        { k: 'top_length', v: slip.top_length },
        { k: 'frock_length', v: slip.frock_length },
        { k: 'gown_length', v: slip.gown_length },
        { k: 'sleeve_full_len', v: slip.sleeve_full_len },
        { k: 'sleeve_full_mori', v: slip.sleeve_full_mori },
        { k: 'sleeve_three_fourth_len', v: slip.sleeve_three_fourth_len },
        { k: 'sleeve_three_fourth_mori', v: slip.sleeve_three_fourth_mori },
        { k: 'sleeve_short_len', v: slip.sleeve_short_len },
        { k: 'sleeve_short_mori', v: slip.sleeve_short_mori },
        { k: 'shoulder', v: slip.shoulder },
        { k: 'chest', v: slip.chest },
        { k: 'chest_note', v: slip.chest_note, isNote: true },
        { k: 'waist', v: slip.waist },
        { k: 'waist_note', v: slip.waist_note, isNote: true },
        { k: 'seat_hip', v: slip.seat_hip },
        { k: 'seat_note', v: slip.seat_note, isNote: true },
      ];

      const topValues = topFields
        .filter((f) => f.v.trim() !== '')
        .map((f) => ({
          field_key: f.k,
          value: parseFloat(f.v) || 0,
          fraction: '',
          notes: f.isNote ? f.v : undefined,
        }));

      if (topValues.length > 0) {
        await measurementsService.saveProfile({
          customer_id: customerId,
          garment_type: 'top',
          title: 'Top Measurements',
          unit: 'inches',
          notes: slip.general_notes || null,
          values: topValues,
        });
      }

      // 2. Bottom Profile
      const bottomFields = [
        { k: 'pant_length', v: slip.pant_length },
        { k: 'pant_mori', v: slip.pant_mori },
        { k: 'pant_other', v: slip.pant_other, isNote: true },
        { k: 'plazo_length', v: slip.plazo_length },
        { k: 'plazo_mori', v: slip.plazo_mori },
        { k: 'panjabi_length', v: slip.panjabi_length },
        { k: 'panjabi_mori', v: slip.panjabi_mori },
      ];

      const bottomValues = bottomFields
        .filter((f) => f.v.trim() !== '')
        .map((f) => ({
          field_key: f.k,
          value: parseFloat(f.v) || 0,
          fraction: '',
          notes: f.isNote ? f.v : undefined,
        }));

      if (bottomValues.length > 0) {
        await measurementsService.saveProfile({
          customer_id: customerId,
          garment_type: 'bottom',
          title: 'Bottom Measurements',
          unit: 'inches',
          notes: slip.general_notes || null,
          values: bottomValues,
        });
      }

      // 3. Blouse Profile
      const blouseFields = [
        { k: 'blouse_length', v: slip.blouse_length },
        { k: 'blouse_sleeve_long_len', v: slip.blouse_sleeve_long_len },
        { k: 'blouse_sleeve_long_mori', v: slip.blouse_sleeve_long_mori },
        { k: 'blouse_sleeve_short_len', v: slip.blouse_sleeve_short_len },
        { k: 'blouse_sleeve_short_mori', v: slip.blouse_sleeve_short_mori },
        { k: 'bicep_bayshep', v: slip.bicep_bayshep },
        { k: 'armhole_mundo', v: slip.armhole_mundo },
        { k: 'chest', v: slip.blouse_chest },
        { k: 'waist', v: slip.blouse_waist },
        { k: 'shoulder', v: slip.blouse_shoulder },
      ];

      const blouseValues = blouseFields
        .filter((f) => f.v.trim() !== '')
        .map((f) => ({
          field_key: f.k,
          value: parseFloat(f.v) || 0,
          fraction: '',
        }));

      if (blouseValues.length > 0) {
        await measurementsService.saveProfile({
          customer_id: customerId,
          garment_type: 'blouse',
          title: 'Blouse Measurements',
          unit: 'inches',
          notes: slip.general_notes || null,
          values: blouseValues,
        });
      }

      if (topValues.length === 0 && bottomValues.length === 0 && blouseValues.length === 0) {
        setErrorMsg('Please enter at least one measurement value.');
        return;
      }

      setSuccessMsg('Measurements saved successfully!');
      setTimeout(() => {
        router.push(`/customers/${customerId}`);
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save measurements');
    } finally {
      setIsSaving(false);
    }
  };

  if (!customer) {
    return <div className="p-6 text-sm text-stone-500">Loading client slip...</div>;
  }

  return (
    <form onSubmit={handleSave} className="max-w-6xl mx-auto space-y-2.5 pb-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-200">
        <div className="flex items-center gap-2.5">
          <Link
            href={`/customers/${customerId}`}
            className="text-stone-500 hover:text-stone-900 transition-colors p-1 rounded hover:bg-stone-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-stone-900 tracking-tight leading-tight">
              {customer.name}
            </h1>
            <span className="text-[11px] text-stone-500 font-mono">{customer.phone}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/customers/${customerId}`}>
            <Button type="button" variant="secondary" size="sm">
              Cancel
            </Button>
          </Link>
          <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
            <Save className="w-4 h-4" />
            <span>Save Measurements</span>
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 3 Sections Side-By-Side: TOP | BOTTOM | BLOUSE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 items-stretch">
        {/* COLUMN 1: TOP */}
        <div className="bg-white rounded-lg border border-stone-200 p-3 shadow-2xs space-y-2">
          <div className="border-b border-stone-100 pb-1 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900">
              Top
            </h2>
            <span className="text-[10px] text-stone-400 font-medium">Upper Body</span>
          </div>

          {/* Lengths */}
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Length</span>
            <div className="grid grid-cols-3 gap-1.5">
              <div>
                <label className="block text-[10px] text-stone-600 mb-0.5">Top</label>
                <input
                  type="text"
                  value={slip.top_length}
                  onChange={(e) => handleChange('top_length', e.target.value)}
                  placeholder="0"
                  className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 font-mono text-xs font-semibold border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-stone-600 mb-0.5">Frock</label>
                <input
                  type="text"
                  value={slip.frock_length}
                  onChange={(e) => handleChange('frock_length', e.target.value)}
                  placeholder="0"
                  className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 font-mono text-xs font-semibold border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-stone-600 mb-0.5">Gown</label>
                <input
                  type="text"
                  value={slip.gown_length}
                  onChange={(e) => handleChange('gown_length', e.target.value)}
                  placeholder="0"
                  className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 font-mono text-xs font-semibold border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                />
              </div>
            </div>
          </div>

          {/* Sleeves: Full, 3/4, Short */}
          <div className="space-y-1 pt-1.5 border-t border-stone-100">
            <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Sleeve</span>
            <div className="space-y-1">
              {/* Full */}
              <div className="grid grid-cols-12 gap-1.5 items-center">
                <span className="col-span-3 text-[11px] text-stone-600 font-medium">Full</span>
                <div className="col-span-4">
                  <input
                    type="text"
                    placeholder="Length"
                    value={slip.sleeve_full_len}
                    onChange={(e) => handleChange('sleeve_full_len', e.target.value)}
                    className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 font-mono text-xs border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                  />
                </div>
                <div className="col-span-5">
                  <input
                    type="text"
                    placeholder="Mori"
                    value={slip.sleeve_full_mori}
                    onChange={(e) => handleChange('sleeve_full_mori', e.target.value)}
                    className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 font-mono text-xs border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                  />
                </div>
              </div>

              {/* 3/4 */}
              <div className="grid grid-cols-12 gap-1.5 items-center">
                <span className="col-span-3 text-[11px] text-stone-600 font-medium">3/4</span>
                <div className="col-span-4">
                  <input
                    type="text"
                    placeholder="Length"
                    value={slip.sleeve_three_fourth_len}
                    onChange={(e) => handleChange('sleeve_three_fourth_len', e.target.value)}
                    className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 font-mono text-xs border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                  />
                </div>
                <div className="col-span-5">
                  <input
                    type="text"
                    placeholder="Mori"
                    value={slip.sleeve_three_fourth_mori}
                    onChange={(e) => handleChange('sleeve_three_fourth_mori', e.target.value)}
                    className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 font-mono text-xs border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                  />
                </div>
              </div>

              {/* Short */}
              <div className="grid grid-cols-12 gap-1.5 items-center">
                <span className="col-span-3 text-[11px] text-stone-600 font-medium">Short</span>
                <div className="col-span-4">
                  <input
                    type="text"
                    placeholder="Length"
                    value={slip.sleeve_short_len}
                    onChange={(e) => handleChange('sleeve_short_len', e.target.value)}
                    className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 font-mono text-xs border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                  />
                </div>
                <div className="col-span-5">
                  <input
                    type="text"
                    placeholder="Mori"
                    value={slip.sleeve_short_mori}
                    onChange={(e) => handleChange('sleeve_short_mori', e.target.value)}
                    className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 font-mono text-xs border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Shoulder, Chest, Waist, Seat */}
          <div className="space-y-1 pt-1.5 border-t border-stone-100">
            {/* Shoulder */}
            <div className="grid grid-cols-12 gap-1.5 items-center">
              <span className="col-span-3 text-[11px] font-semibold text-stone-700">Shoulder</span>
              <div className="col-span-9">
                <input
                  type="text"
                  value={slip.shoulder}
                  onChange={(e) => handleChange('shoulder', e.target.value)}
                  placeholder="0"
                  className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 font-mono text-xs font-semibold border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                />
              </div>
            </div>

            {/* Chest */}
            <div className="grid grid-cols-12 gap-1.5 items-center">
              <span className="col-span-3 text-[11px] font-semibold text-stone-700">Chest</span>
              <div className="col-span-4">
                <input
                  type="text"
                  value={slip.chest}
                  onChange={(e) => handleChange('chest', e.target.value)}
                  placeholder="0"
                  className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 font-mono text-xs font-semibold border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                />
              </div>
              <div className="col-span-5">
                <input
                  type="text"
                  value={slip.chest_note}
                  onChange={(e) => handleChange('chest_note', e.target.value)}
                  placeholder="Note"
                  className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 text-xs border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                />
              </div>
            </div>

            {/* Waist */}
            <div className="grid grid-cols-12 gap-1.5 items-center">
              <span className="col-span-3 text-[11px] font-semibold text-stone-700">Waist</span>
              <div className="col-span-4">
                <input
                  type="text"
                  value={slip.waist}
                  onChange={(e) => handleChange('waist', e.target.value)}
                  placeholder="0"
                  className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 font-mono text-xs font-semibold border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                />
              </div>
              <div className="col-span-5">
                <input
                  type="text"
                  value={slip.waist_note}
                  onChange={(e) => handleChange('waist_note', e.target.value)}
                  placeholder="Note"
                  className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 text-xs border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                />
              </div>
            </div>

            {/* Seat */}
            <div className="grid grid-cols-12 gap-1.5 items-center">
              <span className="col-span-3 text-[11px] font-semibold text-stone-700">Seat</span>
              <div className="col-span-4">
                <input
                  type="text"
                  value={slip.seat_hip}
                  onChange={(e) => handleChange('seat_hip', e.target.value)}
                  placeholder="0"
                  className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 font-mono text-xs font-semibold border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                />
              </div>
              <div className="col-span-5">
                <input
                  type="text"
                  value={slip.seat_note}
                  onChange={(e) => handleChange('seat_note', e.target.value)}
                  placeholder="Note"
                  className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 text-xs border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: BOTTOM */}
        <div className="bg-white rounded-lg border border-stone-200 p-3 shadow-2xs space-y-2 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="border-b border-stone-100 pb-1 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                Bottom
              </h2>
              <span className="text-[10px] text-stone-400 font-medium">Lower Body</span>
            </div>

            {/* Pant */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-stone-700 block">Pant</span>
              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <label className="block text-[10px] text-stone-500 mb-0.5">Length</label>
                  <input
                    type="text"
                    placeholder="0"
                    value={slip.pant_length}
                    onChange={(e) => handleChange('pant_length', e.target.value)}
                    className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 font-mono text-xs font-semibold border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-stone-500 mb-0.5">Mori</label>
                  <input
                    type="text"
                    placeholder="0"
                    value={slip.pant_mori}
                    onChange={(e) => handleChange('pant_mori', e.target.value)}
                    className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 font-mono text-xs font-semibold border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-stone-500 mb-0.5">Other</label>
                  <input
                    type="text"
                    placeholder="Note"
                    value={slip.pant_other}
                    onChange={(e) => handleChange('pant_other', e.target.value)}
                    className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 text-xs border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                  />
                </div>
              </div>
            </div>

            {/* Palazzo */}
            <div className="space-y-1 pt-1.5 border-t border-stone-100">
              <span className="text-[11px] font-semibold text-stone-700 block">Palazzo</span>
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-[10px] text-stone-500 mb-0.5">Length</label>
                  <input
                    type="text"
                    placeholder="0"
                    value={slip.plazo_length}
                    onChange={(e) => handleChange('plazo_length', e.target.value)}
                    className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 font-mono text-xs font-semibold border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-stone-500 mb-0.5">Mori</label>
                  <input
                    type="text"
                    placeholder="0"
                    value={slip.plazo_mori}
                    onChange={(e) => handleChange('plazo_mori', e.target.value)}
                    className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 font-mono text-xs font-semibold border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                  />
                </div>
              </div>
            </div>

            {/* Punjabi */}
            <div className="space-y-1 pt-1.5 border-t border-stone-100">
              <span className="text-[11px] font-semibold text-stone-700 block">Punjabi Salwar</span>
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-[10px] text-stone-500 mb-0.5">Length</label>
                  <input
                    type="text"
                    placeholder="0"
                    value={slip.panjabi_length}
                    onChange={(e) => handleChange('panjabi_length', e.target.value)}
                    className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 font-mono text-xs font-semibold border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-stone-500 mb-0.5">Mori</label>
                  <input
                    type="text"
                    placeholder="0"
                    value={slip.panjabi_mori}
                    onChange={(e) => handleChange('panjabi_mori', e.target.value)}
                    className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 font-mono text-xs font-semibold border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cutting / Style Notes inside Bottom Column */}
          <div className="pt-2 border-t border-stone-100 space-y-1">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-stone-500">
              Style / Cutting Notes
            </span>
            <textarea
              rows={3}
              value={slip.general_notes}
              onChange={(e) => handleChange('general_notes', e.target.value)}
              placeholder="e.g. Deep back neck, pocket on right side..."
              className="w-full p-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 text-xs border border-stone-200 rounded focus:outline-none focus:border-[#881337] resize-none"
            />
          </div>
        </div>

        {/* COLUMN 3: BLOUSE */}
        <div className="bg-white rounded-lg border border-stone-200 p-3 shadow-2xs space-y-2">
          <div className="border-b border-stone-100 pb-1 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900">
              Blouse
            </h2>
            <span className="text-[10px] text-stone-400 font-medium">Bespoke Fit</span>
          </div>

          {/* Blouse Length */}
          <div className="grid grid-cols-12 gap-1.5 items-center">
            <span className="col-span-4 text-[11px] font-semibold text-stone-700">Length</span>
            <div className="col-span-8">
              <input
                type="text"
                value={slip.blouse_length}
                onChange={(e) => handleChange('blouse_length', e.target.value)}
                placeholder="0"
                className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 font-mono text-xs font-semibold border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
              />
            </div>
          </div>

          {/* Blouse Sleeve: Long & Short */}
          <div className="space-y-1 pt-1.5 border-t border-stone-100">
            <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Sleeve</span>
            <div className="space-y-1">
              <div className="grid grid-cols-12 gap-1.5 items-center">
                <span className="col-span-3 text-[11px] text-stone-600 font-medium">Long</span>
                <div className="col-span-4">
                  <input
                    type="text"
                    placeholder="Length"
                    value={slip.blouse_sleeve_long_len}
                    onChange={(e) => handleChange('blouse_sleeve_long_len', e.target.value)}
                    className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 font-mono text-xs border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                  />
                </div>
                <div className="col-span-5">
                  <input
                    type="text"
                    placeholder="Mori"
                    value={slip.blouse_sleeve_long_mori}
                    onChange={(e) => handleChange('blouse_sleeve_long_mori', e.target.value)}
                    className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 font-mono text-xs border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-1.5 items-center">
                <span className="col-span-3 text-[11px] text-stone-600 font-medium">Short</span>
                <div className="col-span-4">
                  <input
                    type="text"
                    placeholder="Length"
                    value={slip.blouse_sleeve_short_len}
                    onChange={(e) => handleChange('blouse_sleeve_short_len', e.target.value)}
                    className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 font-mono text-xs border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                  />
                </div>
                <div className="col-span-5">
                  <input
                    type="text"
                    placeholder="Mori"
                    value={slip.blouse_sleeve_short_mori}
                    onChange={(e) => handleChange('blouse_sleeve_short_mori', e.target.value)}
                    className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 font-mono text-xs border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bayshep & Armhole */}
          <div className="space-y-1 pt-1.5 border-t border-stone-100">
            <div className="grid grid-cols-12 gap-1.5 items-center">
              <span className="col-span-4 text-[11px] font-semibold text-stone-700">Bayshep</span>
              <div className="col-span-8">
                <input
                  type="text"
                  value={slip.bicep_bayshep}
                  onChange={(e) => handleChange('bicep_bayshep', e.target.value)}
                  placeholder="0"
                  className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 font-mono text-xs font-semibold border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-1.5 items-center">
              <span className="col-span-4 text-[11px] font-semibold text-stone-700">Armhole</span>
              <div className="col-span-8">
                <input
                  type="text"
                  value={slip.armhole_mundo}
                  onChange={(e) => handleChange('armhole_mundo', e.target.value)}
                  placeholder="0"
                  className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 font-mono text-xs font-semibold border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                />
              </div>
            </div>
          </div>

          {/* Chest, Waist, Shoulder */}
          <div className="space-y-1 pt-1.5 border-t border-stone-100">
            <div className="grid grid-cols-12 gap-1.5 items-center">
              <span className="col-span-4 text-[11px] font-semibold text-stone-700">Chest</span>
              <div className="col-span-8">
                <input
                  type="text"
                  value={slip.blouse_chest}
                  onChange={(e) => handleChange('blouse_chest', e.target.value)}
                  placeholder="0"
                  className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 font-mono text-xs font-semibold border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-1.5 items-center">
              <span className="col-span-4 text-[11px] font-semibold text-stone-700">Waist</span>
              <div className="col-span-8">
                <input
                  type="text"
                  value={slip.blouse_waist}
                  onChange={(e) => handleChange('blouse_waist', e.target.value)}
                  placeholder="0"
                  className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 font-mono text-xs font-semibold border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-1.5 items-center">
              <span className="col-span-4 text-[11px] font-semibold text-stone-700">Shoulder</span>
              <div className="col-span-8">
                <input
                  type="text"
                  value={slip.blouse_shoulder}
                  onChange={(e) => handleChange('blouse_shoulder', e.target.value)}
                  placeholder="0"
                  className="w-full h-7 px-1.5 bg-stone-50 hover:bg-white focus:bg-white text-stone-900 font-mono text-xs font-semibold border border-stone-200 rounded focus:outline-none focus:border-[#881337]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default function CustomerMeasurementFormPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-stone-500">Loading slip...</div>}>
      <CustomerMeasurementFormContent />
    </Suspense>
  );
}
