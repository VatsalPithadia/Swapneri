'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ordersService } from '@/lib/services/orders.service';
import { paymentsService } from '@/lib/services/payments.service';
import { shopService } from '@/lib/services/shop.service';
import { Order, OrderStatus, Shop, PaymentMode } from '@/lib/shared/types/database';
import { formatINR, validatePaymentAmount } from '@/lib/shared/calculations/currency';
import { ORDER_STATUS_FLOW, ORDER_STATUS_MAP, getNextOrderStatus } from '@/lib/shared/constants/order-status';
import {
  buildWhatsAppLink,
  getOrderConfirmationMessage,
  getDeliveryReadyMessage,
  getBalanceReminderMessage,
} from '@/lib/shared/constants/whatsapp-templates';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import {
  ShoppingBag,
  ArrowLeft,
  Calendar,
  Clock,
  Printer,
  Phone,
  MessageSquare,
  CreditCard,
  Plus,
  CheckCircle2,
  AlertCircle,
  Scissors,
  ArrowRight,
  User,
  History,
  Ruler,
} from 'lucide-react';

import { Suspense } from 'react';

function OrderDetailContent() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Status Change Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState<OrderStatus>('cutting');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const o = await ordersService.getById(orderId);
      setOrder(o);
      const s = await shopService.getShop();
      setShop(s);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) loadData();
  }, [orderId]);

  if (isLoading) {
    return <div className="p-8 text-center text-stone-500">Loading order details...</div>;
  }

  if (!order) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-stone-200 p-8">
        <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-stone-900">Order Not Found</h3>
        <Link href="/orders">
          <Button variant="secondary" size="sm" className="mt-3">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Orders</span>
          </Button>
        </Link>
      </div>
    );
  }

  const nextStep = getNextOrderStatus(order.status);
  const statusMeta = ORDER_STATUS_MAP[order.status];

  // Robust fallback financial calculation ensuring no 0-bill state
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

  const displayOrder: Order = {
    ...order,
    total_amount: grossTotal,
    discount_amount: discountAmount,
    net_amount: netAmount,
    paid_amount: paidAmount,
    balance_amount: balanceDue,
  };

  // Open status modal
  const handleOpenStatusModal = () => {
    setNextStatus(nextStep || order.status);
    setStatusNote('');
    setIsStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingStatus(true);
    try {
      await ordersService.updateStatus(order.id, nextStatus, statusNote);
      setIsStatusModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Open payment modal
  const handleOpenPaymentModal = () => {
    setPaymentAmount(balanceDue);
    setPaymentMode('cash');
    setPaymentRef('');
    setPaymentNote('');
    setPaymentError('');
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');

    // Overpayment validation
    const check = validatePaymentAmount(paymentAmount, balanceDue);
    if (!check.isValid) {
      setPaymentError(check.errorMessage || 'Invalid payment amount');
      return;
    }

    setIsSavingPayment(true);
    try {
      await paymentsService.record({
        order_id: order.id,
        customer_id: order.customer_id,
        amount: paymentAmount,
        payment_date: new Date().toISOString().split('T')[0],
        payment_mode: paymentMode,
        transaction_ref: paymentRef || null,
        notes: paymentNote || null,
      });

      setIsPaymentModalOpen(false);
      await loadData();
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to record payment');
    } finally {
      setIsSavingPayment(false);
    }
  };

  // WhatsApp Messages
  const waConfirmLink = buildWhatsAppLink(
    order.customer?.phone || '',
    getOrderConfirmationMessage({
      shop: shop || { name: 'Boutique' },
      customer: order.customer!,
      order: displayOrder,
    })
  );

  const waDeliveryLink = buildWhatsAppLink(
    order.customer?.phone || '',
    getDeliveryReadyMessage({
      shop: shop || { name: 'Boutique' },
      customer: order.customer!,
      order: displayOrder,
    })
  );

  const waBalanceLink = buildWhatsAppLink(
    order.customer?.phone || '',
    getBalanceReminderMessage({
      shop: shop || { name: 'Boutique' },
      customer: order.customer!,
      order: displayOrder,
    })
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Back link */}
      <div>
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Orders List</span>
        </Link>
      </div>

      {/* Main Order Header Card */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-2xl text-stone-900">
                {order.order_number}
              </span>
              {order.priority === 'urgent' && <Badge variant="rose" dot>Urgent Delivery</Badge>}
              <Badge variant={order.status === 'ready' ? 'emerald' : order.status === 'stitching' ? 'blue' : order.status === 'cutting' ? 'amber' : 'stone'}>
                {statusMeta?.labelEn}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 pt-1">
              <Link
                href={`/customers/${order.customer_id}`}
                className="font-semibold text-stone-900 hover:text-[#881337] flex items-center gap-1"
              >
                <User className="w-3.5 h-3.5 text-stone-400" />
                <span>{order.customer?.name}</span>
              </Link>
              <span>•</span>
              <span className="font-mono">{order.customer?.phone}</span>
              <span>•</span>
              <span>Booked on {new Date(order.order_date).toLocaleDateString('en-IN')}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={waConfirmLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="secondary"
                size="md"
                className="bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 font-semibold gap-2 shadow-2xs"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Send to WhatsApp</span>
              </Button>
            </a>

            <Link href={`/orders/${order.id}/print`} target="_blank">
              <Button variant="secondary" size="md">
                <Printer className="w-4 h-4" />
                <span>Print Bill / Challan</span>
              </Button>
            </Link>

            {nextStep && (
              <Button variant="primary" size="md" onClick={handleOpenStatusModal}>
                <Scissors className="w-4 h-4" />
                <span>Advance to {ORDER_STATUS_MAP[nextStep]?.labelEn}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Visual Production Status Pipeline Stepper */}
        <div className="pt-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 block mb-3">
            Garment Production Progress
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {ORDER_STATUS_FLOW.filter((s) => s.key !== 'cancelled').map((stage, idx) => {
              const stageIndex = ORDER_STATUS_FLOW.findIndex((s) => s.key === stage.key);
              const currentIndex = ORDER_STATUS_FLOW.findIndex((s) => s.key === order.status);
              const isPast = stageIndex <= currentIndex;
              const isCurrent = stage.key === order.status;

              return (
                <div
                  key={stage.key}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    isCurrent
                      ? 'bg-rose-50 border-[#881337] ring-1 ring-[#881337]'
                      : isPast
                      ? 'bg-stone-50/80 border-stone-200 text-stone-800'
                      : 'bg-stone-50/30 border-stone-100 text-stone-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold font-mono text-stone-400">
                      0{idx + 1}
                    </span>
                    {isPast && <CheckCircle2 className={`w-3.5 h-3.5 ${isCurrent ? 'text-[#881337]' : 'text-emerald-600'}`} />}
                  </div>
                  <span className={`text-xs font-semibold block mt-1 ${isCurrent ? 'text-[#881337]' : 'text-stone-800'}`}>
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dates Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-100 text-xs">
          <div className="p-3 bg-stone-50 rounded-lg">
            <span className="text-stone-500 block text-[10px] uppercase font-semibold">Booking Date</span>
            <span className="font-bold text-stone-900">{new Date(order.order_date).toLocaleDateString('en-IN')}</span>
          </div>

          <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-100">
            <span className="text-rose-800 block text-[10px] uppercase font-bold">Delivery Due Date</span>
            <span className="font-bold text-base text-rose-950">
              {new Date(order.delivery_date).toLocaleDateString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* WhatsApp Quick Actions Bar */}
      <div className="bg-white rounded-lg border border-stone-200 p-4 space-y-2">
        <span className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
          <span>Send Customer Updates via WhatsApp</span>
        </span>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <a
            href={waConfirmLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-8 px-3 bg-white text-stone-700 hover:bg-stone-50 border border-stone-300 rounded text-xs font-medium transition-colors"
          >
            <span>Order Receipt</span>
          </a>

          <a
            href={waDeliveryLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-8 px-3 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 rounded text-xs font-medium transition-colors"
          >
            <span>Ready for Pickup</span>
          </a>

          {order.balance_amount > 0 && (
            <a
              href={waBalanceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-8 px-3 bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 rounded text-xs font-medium transition-colors"
            >
              <span>Balance Reminder</span>
            </a>
          )}
        </div>
      </div>

      {/* 2-Column: Items Breakdown & Payments/Financials */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Garment Items (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 p-6 shadow-2xs space-y-4">
          <h2 className="text-base font-semibold text-stone-900">
            Garments in this Order ({order.items?.length || 0})
          </h2>

          <div className="divide-y divide-stone-100">
            {order.items?.map((item) => (
              <div key={item.id} className="py-4 space-y-3 first:pt-0">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-semibold text-base text-stone-900 capitalize">
                      {item.quantity}x {item.garment_type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-stone-500 font-mono block mt-0.5">
                      ₹{item.unit_price} each • Total: {formatINR(item.total_price)}
                    </span>
                  </div>

                  {item.assigned_worker_id && (
                    <Badge variant="stone">
                      Tailor: {item.worker?.name}
                    </Badge>
                  )}
                </div>

                {item.design_notes && (
                  <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-100 text-xs">
                    <span className="font-semibold text-stone-800">Design Specifications: </span>
                    <span className="text-stone-700">{item.design_notes}</span>
                  </div>
                )}

                {item.fabric_details && (
                  <div className="text-xs text-stone-600">
                    <span className="font-semibold text-stone-700">Fabric Source: </span>
                    <span className="capitalize">{item.fabric_source}</span> ({item.fabric_details})
                  </div>
                )}

                {item.measurement_profile_id && (
                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={`/measurements/print/${item.measurement_profile_id}`}
                      target="_blank"
                      className="text-xs text-[#881337] font-medium hover:underline flex items-center gap-1"
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      <span>View Attached Measurement Slip</span>
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary & Payments (1 Col) */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-2xs space-y-6">
          <div>
            <h2 className="text-base font-semibold text-stone-900">Billing & Payments</h2>
            <p className="text-xs text-stone-500">Live order financial ledger</p>
          </div>

          <div className="space-y-2.5 text-xs text-stone-600">
            <div className="flex items-center justify-between">
              <span>Gross Total:</span>
              <span className="font-mono font-medium">{formatINR(grossTotal)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span>Discount:</span>
              <span className="font-mono">- {formatINR(discountAmount)}</span>
            </div>

            <div className="flex items-center justify-between text-sm font-bold text-stone-900 pt-2 border-t border-stone-200">
              <span>Net Amount:</span>
              <span className="font-mono font-bold text-base">{formatINR(netAmount)}</span>
            </div>

            <div className="flex items-center justify-between text-emerald-700 pt-1">
              <span>Total Received:</span>
              <span className="font-mono font-bold">- {formatINR(paidAmount)}</span>
            </div>

            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-between mt-2">
              <span className="font-bold text-stone-700">Balance Due:</span>
              <span className="font-mono font-bold text-base text-rose-800">
                {formatINR(balanceDue)}
              </span>
            </div>
          </div>

          {/* Record Payment Button */}
          {balanceDue > 0 ? (
            <Button variant="primary" className="w-full" onClick={handleOpenPaymentModal}>
              <CreditCard className="w-4 h-4" />
              <span>Record Payment</span>
            </Button>
          ) : (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-center text-xs font-semibold">
              ✓ Fully Settled (No pending balance)
            </div>
          )}

          {/* Payment Receipts History */}
          <div className="pt-4 border-t border-stone-100 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-700 block">
              Payment Receipts ({order.payments?.length || 0})
            </span>

            {order.payments?.map((p) => (
              <div key={p.id} className="p-2.5 bg-stone-50 rounded-lg border border-stone-100 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-900">{formatINR(p.amount)}</span>
                  <span className="text-[11px] text-stone-500 block capitalize">
                    {p.payment_mode} • {new Date(p.payment_date).toLocaleDateString('en-IN')}
                  </span>
                </div>
                {p.transaction_ref && (
                  <span className="font-mono text-[10px] text-stone-400">{p.transaction_ref}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audit History Log */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-2xs space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
          <History className="w-4 h-4 text-stone-400" />
          <span>Status Audit History</span>
        </h3>

        <div className="space-y-2 divide-y divide-stone-100">
          {order.status_history?.map((h) => (
            <div key={h.id} className="pt-2 first:pt-0 text-xs flex items-center justify-between text-stone-600">
              <div>
                <span className="font-semibold text-stone-900 capitalize">{h.to_status}</span>
                {h.from_status && <span className="text-stone-400"> (from {h.from_status})</span>}
                {h.notes && <p className="text-stone-500 text-[11px] mt-0.5">{h.notes}</p>}
              </div>
              <span className="text-[11px] font-mono text-stone-400">
                {new Date(h.created_at).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Status Advance Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Update Production Stage"
        description={`Order #${order.order_number}`}
      >
        <form onSubmit={handleConfirmStatusChange} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
              New Production Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ORDER_STATUS_FLOW.map((s) => (
                <button
                  type="button"
                  key={s.key}
                  onClick={() => setNextStatus(s.key)}
                  className={`p-2.5 rounded-lg border text-left text-xs font-medium transition-colors cursor-pointer ${
                    nextStatus === s.key
                      ? 'bg-rose-50 border-[#881337] text-[#881337] font-semibold ring-1 ring-[#881337]'
                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <span className="block font-medium">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700">Workshop Note (Optional)</label>
            <Input
              placeholder="e.g. Ironed, hooks verified, packed for trial"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
            <Button type="button" variant="secondary" onClick={() => setIsStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isUpdatingStatus}>
              Confirm Status
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Client Payment"
        description={`Remaining balance: ${formatINR(balanceDue)}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          {paymentError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {paymentError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
              Payment Amount (₹) *
            </label>
            <input
              type="number"
              min={1}
              max={balanceDue}
              step="any"
              value={paymentAmount || ''}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              className="w-full h-11 px-3 bg-white text-stone-900 font-mono font-bold text-lg border border-stone-200 rounded-lg focus:outline-none focus:border-[#881337]"
              required
            />
            <p className="text-[11px] text-stone-500">
              Maximum allowable payment is current balance of {formatINR(balanceDue)}.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
              Payment Mode *
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as any)}
              className="w-full h-11 px-3 bg-white text-stone-900 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#881337]"
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
              <option value="card">Card (Debit/Credit)</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>

          <Input
            label="Transaction Reference / UPI ID (Optional)"
            placeholder="e.g. UPI-9820-SETTLEMENT"
            value={paymentRef}
            onChange={(e) => setPaymentRef(e.target.value)}
          />

          <Input
            label="Payment Note (Optional)"
            placeholder="e.g. Final balance paid at pickup"
            value={paymentNote}
            onChange={(e) => setPaymentNote(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
            <Button type="button" variant="secondary" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSavingPayment}>
              Record Payment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-500">Loading order details...</div>}>
      <OrderDetailContent />
    </Suspense>
  );
}
