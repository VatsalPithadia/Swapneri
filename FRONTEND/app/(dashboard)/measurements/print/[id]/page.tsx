'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { customersService } from '@/lib/services/customers.service';
import { measurementsService } from '@/lib/services/measurements.service';
import { shopService } from '@/lib/services/shop.service';
import { Customer, MeasurementProfile, Shop } from '@/lib/shared/types/database';
import { formatMeasurement } from '@/lib/shared/calculations/measurements';
import { WOMEN_GARMENTS } from '@/lib/shared/constants/garments';
import { Printer, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

function PrintMeasurementCardContent() {
  const params = useParams();
  const profileId = params?.id as string;

  const [shop, setShop] = useState<Shop | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [profile, setProfile] = useState<MeasurementProfile | null>(null);

  useEffect(() => {
    const load = async () => {
      const s = await shopService.getShop();
      setShop(s);

      // Find profile across customers
      const customers = await customersService.getAll();
      for (const c of customers) {
        const profs = await measurementsService.getByCustomerId(c.id);
        const match = profs.find((p) => p.id === profileId);
        if (match) {
          setProfile(match);
          setCustomer(c);
          break;
        }
      }
    };
    load();
  }, [profileId]);

  if (!profile || !customer) {
    return <div className="p-8 text-center text-stone-500">Loading measurement card...</div>;
  }

  return (
    <div className="min-h-screen bg-stone-100 p-4 sm:p-8 flex flex-col items-center">
      {/* Top action bar (hidden during print) */}
      <div className="no-print w-full max-w-2xl mb-6 flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <Button variant="primary" size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4" />
          <span>Print Card (Ctrl + P)</span>
        </Button>
      </div>

      {/* Printable Card */}
      <div className="print-card w-full max-w-2xl bg-white border border-stone-300 rounded-xl p-8 shadow-sm space-y-6 text-stone-900">
        {/* Boutique Header */}
        <div className="border-b-2 border-stone-800 pb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tight">
              {shop?.name || 'Boutique & Designer Studio'}
            </h1>
            <p className="text-xs text-stone-600 mt-0.5">
              {shop?.address ? `${shop.address} • ` : ''}{shop?.phone ? `Phone: ${shop.phone}` : ''}
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-1 bg-stone-900 text-white font-mono font-bold text-xs uppercase rounded">
              Measurement Slip
            </span>
            <p className="text-[10px] text-stone-500 mt-1">
              Date: {new Date(profile.created_at).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>

        {/* Client & Garment Info Box */}
        <div className="grid grid-cols-2 gap-4 bg-stone-50 p-4 rounded-lg border border-stone-200 text-xs">
          <div>
            <span className="text-stone-500 font-semibold uppercase block text-[10px]">Client Name</span>
            <span className="font-bold text-base text-stone-900">{customer.name}</span>
            <p className="font-mono text-stone-600">{customer.phone}</p>
          </div>

          <div>
            <span className="text-stone-500 font-semibold uppercase block text-[10px]">Garment</span>
            <span className="font-bold text-base text-stone-900 capitalize">
              {profile.garment_type.replace('_', ' ')}
            </span>
            <p className="font-medium text-stone-600">
              {profile.title}
            </p>
          </div>
        </div>

        {/* Measurements Grid */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">
            Measurements
          </h2>

          <table className="w-full text-left text-sm border-collapse border border-stone-300">
            <thead className="bg-stone-100 text-xs uppercase text-stone-700">
              <tr>
                <th className="border border-stone-300 px-3 py-2">Parameter</th>
                <th className="border border-stone-300 px-3 py-2 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {profile.values?.map((val) => {
                const gConfig = WOMEN_GARMENTS[profile.garment_type];
                const fieldConfig = gConfig?.fields.find((f) => f.key === val.field_key);
                const displayLabel = fieldConfig ? fieldConfig.label : val.field_key.replace(/_/g, ' ');

                return (
                  <tr key={val.field_key} className="even:bg-stone-50/50">
                    <td className="border border-stone-300 px-3 py-2 capitalize font-medium text-stone-800">
                      {displayLabel}
                    </td>
                    <td className="border border-stone-300 px-3 py-2 text-right font-mono font-bold text-base text-stone-900">
                      {val.value > 0 ? (val.fraction ? `${val.value} ${val.fraction}` : String(val.value)) : '-'}
                      {val.notes && <span className="block text-[11px] font-normal text-stone-500 font-sans">{val.notes}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Master Cutter Notes */}
        {profile.notes && (
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs space-y-1">
            <span className="font-bold text-stone-800 uppercase text-[10px]">Cutting & Style Specifications:</span>
            <p className="text-stone-700 whitespace-pre-wrap">{profile.notes}</p>
          </div>
        )}

        {/* Footer Signature Box */}
        <div className="pt-6 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <div>
            <span>Verified By: ___________________</span>
          </div>
          <div>
            <span>Master Cutter Signature: ___________________</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PrintMeasurementCardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-500">Loading measurement card...</div>}>
      <PrintMeasurementCardContent />
    </Suspense>
  );
}
