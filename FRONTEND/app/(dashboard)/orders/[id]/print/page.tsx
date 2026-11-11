'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { ordersService } from '@/lib/services/orders.service';
import { shopService } from '@/lib/services/shop.service';
import { Order, Shop } from '@/lib/shared/types/database';
import { formatINR } from '@/lib/shared/calculations/currency';
import { Printer, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

function OrderPrintBillContent() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);

  useEffect(() => {
    const load = async () => {
      const o = await ordersService.getById(orderId);
      setOrder(o);
      const s = await shopService.getShop();
      setShop(s);
    };
    if (orderId) load();
  }, [orderId]);

  if (!order) {
    return <div className="p-8 text-center text-stone-500">Loading bill...</div>;
  }

  const itemsTotal = (order.items || []).reduce(
    (sum, it) => sum + (Number(it.total_price) || (Number(it.quantity) * Number(it.unit_price)) || 0),
    0
  );
  const grossTotal = order.total_amount > 0 && order.total_amount >= itemsTotal
    ? order.total_amount
    : (itemsTotal > 0 ? itemsTotal : (order.total_amount || 0));
  const discountAmount = Math.min(grossTotal, Math.max(0, Number(order.discount_amount) || 0));
  const netAmount = Math.max(0, grossTotal - discountAmount);
  const paymentsTotal = (order.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const paidAmount = paymentsTotal > 0 ? paymentsTotal : (Number(order.paid_amount) || 0);
  const balanceDue = Math.max(0, netAmount - paidAmount);

  return (
    <div className="min-h-screen bg-stone-100 p-4 sm:p-8 flex flex-col items-center">
      {/* Top action bar (hidden during print) */}
      <div className="no-print w-full max-w-2xl mb-6 flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Order</span>
        </button>

        <Button variant="primary" size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4" />
          <span>Print Receipt / Bill (Ctrl + P)</span>
        </Button>
      </div>

      {/* Printable Invoice */}
      <div className="print-card w-full max-w-2xl bg-white border border-stone-300 rounded-xl p-8 shadow-sm space-y-6 text-stone-900">
        {/* Header */}
        <div className="border-b-2 border-stone-800 pb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {shop?.name || 'Boutique & Designer Studio'}
            </h1>
            {shop?.address && (
              <p className="text-xs text-stone-600 mt-0.5">{shop.address}</p>
            )}
            <p className="text-xs text-stone-600">
              {shop?.phone ? `Phone: ${shop.phone}` : ''}
              {shop?.owner_name ? ` • Prop: ${shop.owner_name}` : ''}
            </p>
          </div>

          <div className="text-right">
            <span className="inline-block px-2.5 py-1 bg-stone-900 text-white font-mono font-bold text-xs uppercase rounded">
              Tailoring Invoice
            </span>
            <p className="font-mono font-bold text-sm text-stone-900 mt-1">
              {order.order_number}
            </p>
            <p className="text-[11px] text-stone-500">
              Date: {new Date(order.order_date).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>

        {/* Customer & Delivery Box */}
        <div className="grid grid-cols-2 gap-4 bg-stone-50 p-4 rounded-lg border border-stone-200 text-xs">
          <div>
            <span className="text-[10px] font-semibold uppercase text-stone-500 block">Customer Details</span>
            <p className="font-bold text-sm text-stone-900">{order.customer?.name}</p>
            <p className="font-mono text-stone-700">{order.customer?.phone}</p>
            {order.customer?.address && <p className="text-stone-600 mt-0.5">{order.customer.address}</p>}
          </div>

          <div className="text-right sm:text-left">
            <span className="text-[10px] font-semibold uppercase text-stone-500 block">Schedule</span>
            <p className="text-stone-900 font-bold">
              Delivery Date: {new Date(order.delivery_date).toLocaleDateString('en-IN')}
            </p>
            {order.priority === 'urgent' && (
              <span className="inline-block px-1.5 py-0.5 bg-rose-100 text-rose-800 font-bold text-[10px] rounded mt-1">
                URGENT ORDER
              </span>
            )}
          </div>
        </div>

        {/* Itemized Table */}
        <div className="space-y-1">
          <table className="w-full text-left text-xs border-collapse border border-stone-300">
            <thead className="bg-stone-100 uppercase text-stone-700 font-bold">
              <tr>
                <th className="border border-stone-300 px-3 py-2">Item Description</th>
                <th className="border border-stone-300 px-3 py-2 text-center w-16">Qty</th>
                <th className="border border-stone-300 px-3 py-2 text-right w-24">Rate (₹)</th>
                <th className="border border-stone-300 px-3 py-2 text-right w-28">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item) => (
                <tr key={item.id} className="even:bg-stone-50/50">
                  <td className="border border-stone-300 px-3 py-2">
                    <p className="font-bold text-stone-900 capitalize">
                      {item.garment_type.replace('_', ' ')}
                    </p>
                    {item.design_notes && (
                      <p className="text-[11px] text-stone-600 italic mt-0.5">{item.design_notes}</p>
                    )}
                    {item.fabric_details && (
                      <p className="text-[10px] text-stone-500">Fabric: {item.fabric_details}</p>
                    )}
                  </td>
                  <td className="border border-stone-300 px-3 py-2 text-center font-mono font-medium">
                    {item.quantity}
                  </td>
                  <td className="border border-stone-300 px-3 py-2 text-right font-mono">
                    {formatINR(item.unit_price, { showSymbol: false })}
                  </td>
                  <td className="border border-stone-300 px-3 py-2 text-right font-mono font-bold">
                    {formatINR(item.total_price, { showSymbol: false })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Tally */}
        <div className="flex justify-end">
          <div className="w-64 space-y-1.5 text-xs text-stone-700">
            <div className="flex justify-between py-1">
              <span>Gross Total:</span>
              <span className="font-mono font-semibold">{formatINR(grossTotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between py-1 text-stone-600">
                <span>Discount:</span>
                <span className="font-mono">- {formatINR(discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between py-1 font-bold text-sm text-stone-900 border-t border-stone-300">
              <span>Net Payable:</span>
              <span className="font-mono font-bold text-base">{formatINR(netAmount)}</span>
            </div>

            <div className="flex justify-between py-1 text-emerald-700 font-semibold">
              <span>Advance Paid:</span>
              <span className="font-mono">- {formatINR(paidAmount)}</span>
            </div>

            <div className="flex justify-between py-2 border-t-2 border-stone-800 font-bold text-base text-stone-900 bg-stone-50 px-2 rounded">
              <span>Balance Due:</span>
              <span className="font-mono text-rose-800">{formatINR(balanceDue)}</span>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="pt-4 border-t border-stone-200 text-[10px] text-stone-500 space-y-1">
          <p className="font-bold uppercase text-stone-700">Terms & Conditions:</p>
          <p>1. Complimentary alterations are provided within 7 days from the date of delivery.</p>
          <p>2. Please present this bill or order confirmation at the time of pickup.</p>
          <p>3. Finished garments not collected within 45 days will be subject to storage terms.</p>
        </div>

        {/* Signature */}
        <div className="pt-6 flex items-center justify-between text-xs text-stone-600">
          <div>
            <span>Customer Signature: ___________________</span>
          </div>
          <div>
            <span>For {shop?.name || 'Swapneri Boutique'}: ___________________</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderPrintBillPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-500">Loading bill...</div>}>
      <OrderPrintBillContent />
    </Suspense>
  );
}
