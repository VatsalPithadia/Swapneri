'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { paymentsService } from '@/lib/services/payments.service';
import { ordersService } from '@/lib/services/orders.service';
import { customersService } from '@/lib/services/customers.service';
import { Payment, Order, Customer, PaymentMode } from '@/lib/shared/types/database';
import { formatINR, validatePaymentAmount } from '@/lib/shared/calculations/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  Plus,
  Search,
  ArrowUpRight,
  Receipt,
  AlertCircle,
  Building,
  Smartphone,
  Banknote,
  Calendar,
} from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [ordersWithBalance, setOrdersWithBalance] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // New Payment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [txRef, setTxRef] = useState('');
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const p = await paymentsService.getAll();
      setPayments(p);
      const allOrders = await ordersService.getAll();
      setOrdersWithBalance(allOrders.filter((o) => o.balance_amount > 0));
      const c = await customersService.getAll();
      setCustomers(c);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedOrder = ordersWithBalance.find((o) => o.id === selectedOrderId);

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(orderId);
    const ord = ordersWithBalance.find((o) => o.id === orderId);
    if (ord) {
      setAmount(ord.balance_amount);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedOrder) {
      setErrorMsg('Please choose an order to record payment for.');
      return;
    }

    const check = validatePaymentAmount(amount, selectedOrder.balance_amount);
    if (!check.isValid) {
      setErrorMsg(check.errorMessage || 'Invalid payment amount');
      return;
    }

    setIsSaving(true);
    try {
      await paymentsService.record({
        order_id: selectedOrder.id,
        customer_id: selectedOrder.customer_id,
        amount,
        payment_date: new Date().toISOString().split('T')[0],
        payment_mode: paymentMode,
        transaction_ref: txRef || null,
        notes: note || null,
      });

      setIsModalOpen(false);
      setSelectedOrderId('');
      setAmount(0);
      setTxRef('');
      setNote('');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record payment');
    } finally {
      setIsSaving(false);
    }
  };

  // Financial aggregates
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalCash = payments.filter((p) => p.payment_mode === 'cash').reduce((sum, p) => sum + p.amount, 0);
  const totalUpi = payments.filter((p) => p.payment_mode === 'upi').reduce((sum, p) => sum + p.amount, 0);

  const filteredPayments = payments.filter((p) => {
    const q = search.toLowerCase();
    const orderNum = p.order?.order_number?.toLowerCase() || '';
    const matchSearch = orderNum.includes(q) || (p.transaction_ref && p.transaction_ref.toLowerCase().includes(q));
    const matchMode = modeFilter === 'all' || p.payment_mode === modeFilter;
    return matchSearch && matchMode;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Payments Register
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Incoming cash and digital UPI payments ledger
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          <span>Record Payment</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Received</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-800 tracking-tight">
            {formatINR(totalCollected)}
          </p>
          <p className="text-xs text-stone-500 mt-1">All verified client settlements</p>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">UPI Collections</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-900 tracking-tight">
            {formatINR(totalUpi)}
          </p>
          <p className="text-xs text-stone-500 mt-1">GPay, PhonePe, Paytm QR</p>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Cash at Boutique</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-900 tracking-tight">
            {formatINR(totalCash)}
          </p>
          <p className="text-xs text-stone-500 mt-1">Desk cash drawer receipts</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search by order # or transaction ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftAddon={<Search className="w-4 h-4 text-stone-400" />}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['all', 'cash', 'upi', 'card', 'bank_transfer'].map((m) => (
            <button
              key={m}
              onClick={() => setModeFilter(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer capitalize shrink-0 ${
                modeFilter === m
                  ? 'bg-[#881337] text-white font-semibold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {m.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      {filteredPayments.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center shadow-2xs">
          <CreditCard className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-800">No payment records found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
            Record customer advances or final order settlements to update account ledgers.
          </p>
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
            Record Payment
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-600 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Payment Date</th>
                <th className="px-6 py-3.5">Order</th>
                <th className="px-6 py-3.5">Mode</th>
                <th className="px-6 py-3.5">Reference / Notes</th>
                <th className="px-6 py-3.5 text-right">Amount Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-stone-700">
                    {new Date(p.payment_date).toLocaleDateString('en-IN')}
                  </td>

                  <td className="px-6 py-4">
                    <Link
                      href={`/orders/${p.order_id}`}
                      className="font-mono font-bold text-xs text-[#881337] hover:underline"
                    >
                      {p.order?.order_number || 'View Order'}
                    </Link>
                  </td>

                  <td className="px-6 py-4">
                    <Badge variant={p.payment_mode === 'upi' ? 'blue' : p.payment_mode === 'cash' ? 'amber' : 'purple'}>
                      {p.payment_mode.toUpperCase()}
                    </Badge>
                  </td>

                  <td className="px-6 py-4 text-xs text-stone-600">
                    {p.transaction_ref && (
                      <span className="font-mono font-medium block text-stone-800">{p.transaction_ref}</span>
                    )}
                    {p.notes && <span className="text-stone-500">{p.notes}</span>}
                    {!p.transaction_ref && !p.notes && '—'}
                  </td>

                  <td className="px-6 py-4 text-right font-mono font-bold text-base text-stone-900">
                    {formatINR(p.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Client Payment"
        description="Select an order with pending balance to settle"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
              Select Order with Balance *
            </label>
            <select
              value={selectedOrderId}
              onChange={(e) => handleOrderSelect(e.target.value)}
              className="w-full h-11 px-3 bg-white text-stone-900 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#881337]"
              required
            >
              <option value="" disabled>
                -- Choose order to settle --
              </option>
              {ordersWithBalance.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.order_number} ({o.customer?.name}) — Balance Due: {formatINR(o.balance_amount)}
                </option>
              ))}
            </select>
          </div>

          {selectedOrder && (
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-100 text-xs flex justify-between">
              <span className="text-stone-600">Total Net: {formatINR(selectedOrder.net_amount)}</span>
              <span className="text-rose-800 font-bold">
                Max Allowed: {formatINR(selectedOrder.balance_amount)}
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
              Amount Paid (₹) *
            </label>
            <input
              type="number"
              min={1}
              max={selectedOrder ? selectedOrder.balance_amount : undefined}
              step="any"
              value={amount || ''}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full h-11 px-3 bg-white text-stone-900 font-mono font-bold text-lg border border-stone-200 rounded-lg focus:outline-none focus:border-[#881337]"
              required
            />
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
            value={txRef}
            onChange={(e) => setTxRef(e.target.value)}
          />

          <Input
            label="Note (Optional)"
            placeholder="e.g. Paid by client via UPI on pickup"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSaving}>
              Confirm Payment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
