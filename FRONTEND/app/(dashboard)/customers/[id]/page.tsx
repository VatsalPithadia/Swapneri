'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { customersService } from '@/lib/services/customers.service';
import { measurementsService } from '@/lib/services/measurements.service';
import { ordersService } from '@/lib/services/orders.service';
import { Customer, MeasurementProfile, Order } from '@/lib/shared/types/database';
import { formatINR } from '@/lib/shared/calculations/currency';
import { buildWhatsAppLink } from '@/lib/shared/constants/whatsapp-templates';
import { ORDER_STATUS_MAP } from '@/lib/shared/constants/order-status';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Phone,
  MessageSquare,
  Ruler,
  ShoppingBag,
  Plus,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Edit2,
} from 'lucide-react';

function CustomerDetailContent() {
  const params = useParams();
  const customerId = params?.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [profiles, setProfiles] = useState<MeasurementProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!customerId) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const cust = await customersService.getById(customerId);
        if (cust) {
          setCustomer(cust);
          const p = await measurementsService.getByCustomerId(customerId);
          setProfiles(p);
          const o = await ordersService.getAll({ customerId });
          setOrders(o);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [customerId]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse max-w-6xl mx-auto">
        <div className="h-16 bg-white border border-stone-200 rounded-lg"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-7 h-96 bg-white border border-stone-200 rounded-lg"></div>
          <div className="lg:col-span-5 h-96 bg-white border border-stone-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-16 bg-white rounded-lg border border-stone-200 p-8 max-w-md mx-auto">
        <User className="w-10 h-10 text-stone-300 mx-auto mb-2" />
        <h3 className="text-base font-semibold text-stone-900">Customer Not Found</h3>
        <p className="text-xs text-stone-500 mt-1 mb-4">The customer may have been deleted.</p>
        <Link href="/customers">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Customers</span>
          </Button>
        </Link>
      </div>
    );
  }

  // Financial totals
  const totalBilled = orders.reduce((sum, o) => sum + o.net_amount, 0);
  const totalPaid = orders.reduce((sum, o) => sum + o.paid_amount, 0);
  const totalBalanceDue = orders.reduce((sum, o) => sum + o.balance_amount, 0);

  const waLink = buildWhatsAppLink(
    customer.phone,
    `Namaste ${customer.name} ji! Greetings from Swapneri Boutique.`
  );

  // Measurements mapping
  const topProf = profiles.find((p) => p.garment_type === 'top' || p.garment_type === 'kurti');
  const bottomProf = profiles.find((p) => p.garment_type === 'bottom' || p.garment_type === 'salwar');
  const blouseProf = profiles.find((p) => p.garment_type === 'blouse');

  const getVal = (prof: MeasurementProfile | undefined, key: string) => {
    if (!prof?.values) return '-';
    const item = prof.values.find((v) => v.field_key === key);
    if (!item) return '-';
    if (item.value && item.value > 0) return String(item.value);
    if (item.notes) return item.notes;
    return '-';
  };

  const hasAnyMeasurements = profiles.some((p) => p.values && p.values.length > 0);
  const notesSnippet = customer.notes || profiles.find((p) => p.notes)?.notes;

  return (
    <div className="space-y-2.5 max-w-6xl mx-auto pb-4">
      {/* Top Header Card: Profile + Financial Summary + Quick Actions in 1 Row */}
      <div className="bg-white rounded-lg border border-stone-200 px-3.5 py-2.5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Customer Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/customers"
              className="p-1 text-stone-400 hover:text-stone-800 transition-colors rounded hover:bg-stone-100 shrink-0"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="w-9 h-9 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-[#881337] font-bold text-sm shrink-0">
              {customer.name.slice(0, 1)}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold text-stone-900 leading-tight truncate">
                  {customer.name}
                </h1>
                {customer.address && (
                  <span className="text-[11px] text-stone-500 hidden sm:inline truncate max-w-xs">
                    • {customer.address}
                  </span>
                )}
              </div>
              <p className="font-mono text-xs text-stone-600 mt-0.5 flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-stone-400" />
                <span>{customer.phone}</span>
                {customer.notes && (
                  <span className="text-stone-400 font-sans ml-1 text-[11px] truncate max-w-xs hidden md:inline">
                    ({customer.notes})
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Unified Financial Badges (Total Billed | Total Paid | Balance Due) */}
          <div className="flex items-center gap-2.5 bg-stone-50 border border-stone-200/80 rounded-md px-3 py-1.5 text-xs shrink-0">
            <div>
              <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-medium">Billed</span>
              <span className="font-mono font-bold text-stone-900">{formatINR(totalBilled)}</span>
            </div>
            <div className="h-6 w-px bg-stone-200" />
            <div>
              <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-medium">Paid</span>
              <span className="font-mono font-bold text-emerald-700">{formatINR(totalPaid)}</span>
            </div>
            <div className="h-6 w-px bg-stone-200" />
            <div>
              <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-medium">Due</span>
              <span className={`font-mono font-bold ${totalBalanceDue > 0 ? 'text-rose-700' : 'text-stone-700'}`}>
                {formatINR(totalBalanceDue)}
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={`tel:${customer.phone}`}
              className="h-7 px-2.5 rounded border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-medium inline-flex items-center gap-1"
              title="Call Client"
            >
              <Phone className="w-3 h-3 text-stone-500" />
              <span>Call</span>
            </a>

            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="h-7 px-2.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs font-medium inline-flex items-center gap-1"
              title="WhatsApp"
            >
              <MessageSquare className="w-3 h-3 text-emerald-600" />
              <span>WhatsApp</span>
            </a>

            <Link href={`/customers/${customer.id}/measurements`}>
              <Button variant="secondary" size="sm" className="h-7 text-xs">
                <Ruler className="w-3 h-3" />
                <span>Measurements</span>
              </Button>
            </Link>

            <Link href={`/orders/new?customerId=${customer.id}`}>
              <Button variant="primary" size="sm" className="h-7 text-xs">
                <Plus className="w-3 h-3" />
                <span>New Order</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Single-Window Grid: Measurements (Left) & Orders/Payments (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-start">
        {/* LEFT COLUMN: Customer Measurements Slip (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-stone-200 p-3 shadow-2xs space-y-2">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-stone-100 pb-1.5">
            <div className="flex items-center gap-2">
              <Ruler className="w-3.5 h-3.5 text-[#881337]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                Measurements Slip
              </h2>
            </div>

            <Link href={`/customers/${customer.id}/measurements`}>
              <Button variant="outline" size="sm" className="h-6 text-[11px] px-2">
                <Edit2 className="w-3 h-3" />
                <span>Edit Measurements</span>
              </Button>
            </Link>
          </div>

          {!hasAnyMeasurements ? (
            <div className="p-8 text-center bg-stone-50/60 rounded border border-stone-100 space-y-2">
              <p className="text-xs text-stone-600 font-medium">No measurements recorded for {customer.name} yet</p>
              <Link href={`/customers/${customer.id}/measurements`}>
                <Button variant="primary" size="sm" className="h-7 text-xs">
                  <Plus className="w-3 h-3" />
                  <span>Record Measurements</span>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {/* 3 Columns Side-by-Side: TOP | BOTTOM | BLOUSE */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                {/* Column 1: TOP */}
                <div className="bg-stone-50/80 rounded border border-stone-100 p-2 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-800 block border-b border-stone-200 pb-0.5">
                    Top
                  </span>
                  <div className="space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-stone-500 font-sans">Length:</span>
                      <span className="font-semibold text-stone-900">{getVal(topProf, 'top_length')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500 font-sans">Frock/Gown:</span>
                      <span className="font-semibold text-stone-900">{getVal(topProf, 'frock_length')} / {getVal(topProf, 'gown_length')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500 font-sans">Chest:</span>
                      <span className="font-semibold text-stone-900">{getVal(topProf, 'chest')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500 font-sans">Waist:</span>
                      <span className="font-semibold text-stone-900">{getVal(topProf, 'waist')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500 font-sans">Seat:</span>
                      <span className="font-semibold text-stone-900">{getVal(topProf, 'seat_hip')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500 font-sans">Shoulder:</span>
                      <span className="font-semibold text-stone-900">{getVal(topProf, 'shoulder')}</span>
                    </div>
                    <div className="pt-1 border-t border-stone-200/60">
                      <span className="text-[10px] text-stone-500 font-sans uppercase block">Sleeve (L / M)</span>
                      <span className="text-stone-800 font-semibold block">
                        F: {getVal(topProf, 'sleeve_full_len')}/{getVal(topProf, 'sleeve_full_mori')}
                      </span>
                      <span className="text-stone-800 font-semibold block">
                        3/4: {getVal(topProf, 'sleeve_three_fourth_len')}/{getVal(topProf, 'sleeve_three_fourth_mori')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Column 2: BOTTOM */}
                <div className="bg-stone-50/80 rounded border border-stone-100 p-2 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-800 block border-b border-stone-200 pb-0.5">
                    Bottom
                  </span>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div>
                      <span className="text-[10px] text-stone-500 font-sans block font-semibold">Pant</span>
                      <div className="flex justify-between">
                        <span className="text-stone-500 font-sans">Len / Mori:</span>
                        <span className="font-semibold text-stone-900">{getVal(bottomProf, 'pant_length')} / {getVal(bottomProf, 'pant_mori')}</span>
                      </div>
                      {getVal(bottomProf, 'pant_other') !== '-' && (
                        <span className="text-[10px] text-stone-500 font-sans block truncate">
                          Note: {getVal(bottomProf, 'pant_other')}
                        </span>
                      )}
                    </div>

                    <div className="pt-1 border-t border-stone-200/60">
                      <span className="text-[10px] text-stone-500 font-sans block font-semibold">Palazzo</span>
                      <div className="flex justify-between">
                        <span className="text-stone-500 font-sans">Len / Mori:</span>
                        <span className="font-semibold text-stone-900">{getVal(bottomProf, 'plazo_length')} / {getVal(bottomProf, 'plazo_mori')}</span>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-stone-200/60">
                      <span className="text-[10px] text-stone-500 font-sans block font-semibold">Punjabi Salwar</span>
                      <div className="flex justify-between">
                        <span className="text-stone-500 font-sans">Len / Mori:</span>
                        <span className="font-semibold text-stone-900">{getVal(bottomProf, 'panjabi_length')} / {getVal(bottomProf, 'panjabi_mori')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 3: BLOUSE */}
                <div className="bg-stone-50/80 rounded border border-stone-100 p-2 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-800 block border-b border-stone-200 pb-0.5">
                    Blouse
                  </span>
                  <div className="space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-stone-500 font-sans">Length:</span>
                      <span className="font-semibold text-stone-900">{getVal(blouseProf, 'blouse_length')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500 font-sans">Chest:</span>
                      <span className="font-semibold text-stone-900">{getVal(blouseProf, 'chest')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500 font-sans">Waist:</span>
                      <span className="font-semibold text-stone-900">{getVal(blouseProf, 'waist')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500 font-sans">Shoulder:</span>
                      <span className="font-semibold text-stone-900">{getVal(blouseProf, 'shoulder')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500 font-sans">Bayshep:</span>
                      <span className="font-semibold text-stone-900">{getVal(blouseProf, 'bicep_bayshep')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500 font-sans">Armhole:</span>
                      <span className="font-semibold text-stone-900">{getVal(blouseProf, 'armhole_mundo')}</span>
                    </div>
                    <div className="pt-1 border-t border-stone-200/60">
                      <span className="text-[10px] text-stone-500 font-sans uppercase block">Sleeve (L / M)</span>
                      <span className="text-stone-800 font-semibold block">
                        Long: {getVal(blouseProf, 'blouse_sleeve_long_len')}/{getVal(blouseProf, 'blouse_sleeve_long_mori')}
                      </span>
                      <span className="text-stone-800 font-semibold block">
                        Short: {getVal(blouseProf, 'blouse_sleeve_short_len')}/{getVal(blouseProf, 'blouse_sleeve_short_mori')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Style / Cutting Notes Footer */}
              {notesSnippet && (
                <div className="p-2 bg-stone-50 rounded border border-stone-100 text-xs text-stone-700 flex items-baseline gap-1.5">
                  <span className="font-semibold text-stone-900 shrink-0 text-[11px]">Style Notes:</span>
                  <span className="text-[11px] text-stone-600 truncate">{notesSnippet}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Orders & Payments History (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-lg border border-stone-200 p-3 shadow-2xs space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-100 pb-1.5">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-3.5 h-3.5 text-[#881337]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                Orders & Payments
              </h2>
              <span className="text-[10px] text-stone-500 font-medium">({orders.length})</span>
            </div>

            <Link href={`/orders/new?customerId=${customer.id}`}>
              <Button variant="primary" size="sm" className="h-6 text-[11px] px-2">
                <Plus className="w-3 h-3" />
                <span>New Order</span>
              </Button>
            </Link>
          </div>

          {/* Orders List */}
          {orders.length === 0 ? (
            <div className="p-8 text-center bg-stone-50/60 rounded border border-stone-100 space-y-2">
              <p className="text-xs text-stone-600 font-medium">No orders created for {customer.name} yet</p>
              <Link href={`/orders/new?customerId=${customer.id}`}>
                <Button variant="primary" size="sm" className="h-7 text-xs">
                  <Plus className="w-3 h-3" />
                  <span>Create First Order</span>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-0.5">
              {orders.map((order) => {
                const statusMeta = ORDER_STATUS_MAP[order.status];
                return (
                  <div
                    key={order.id}
                    className="p-2.5 rounded border border-stone-100 bg-stone-50/70 hover:bg-stone-50 hover:border-stone-200 transition-all flex items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/orders/${order.id}`}
                          className="font-bold text-xs text-stone-900 hover:text-[#881337] transition-colors"
                        >
                          {order.order_number}
                        </Link>
                        <Badge
                          variant={order.status === 'ready' ? 'emerald' : order.status === 'delivered' ? 'stone' : 'amber'}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {statusMeta?.labelEn || order.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-stone-500">
                        <span>Due: {new Date(order.delivery_date).toLocaleDateString('en-IN')}</span>
                        <span>•</span>
                        <span className="font-mono font-semibold text-stone-800">
                          {formatINR(order.net_amount)}
                        </span>
                        {order.balance_amount > 0 ? (
                          <span className="font-mono text-rose-700 font-bold">
                            (Due: {formatINR(order.balance_amount)})
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium text-[10px]">Paid</span>
                        )}
                      </div>
                    </div>

                    <Link href={`/orders/${order.id}`}>
                      <Button variant="secondary" size="sm" className="h-6 text-[11px] px-2 shrink-0">
                        <span>View</span>
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CustomerDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-stone-500">Loading customer profile...</div>}>
      <CustomerDetailContent />
    </Suspense>
  );
}
