'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { customersService } from '@/lib/services/customers.service';
import { ordersService } from '@/lib/services/orders.service';
import { shopService } from '@/lib/services/shop.service';
import { Customer, GarmentType, Shop, Order } from '@/lib/shared/types/database';
import { WOMEN_GARMENTS } from '@/lib/shared/constants/garments';
import { formatINR, computeOrderFinancials } from '@/lib/shared/calculations/currency';
import {
  buildWhatsAppLink,
  getOrderConfirmationMessage,
} from '@/lib/shared/constants/whatsapp-templates';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import {
  ArrowLeft,
  Plus,
  Trash2,
  UserPlus,
  Save,
  MessageSquare,
  Printer,
  Check,
} from 'lucide-react';

interface OrderItemForm {
  garment_type: string;
  quantity: number;
  unit_price: number;
  design_notes: string;
}

function NewOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams?.get('customerId');

  const [shop, setShop] = useState<Shop | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(preselectedCustomerId || '');
  const [availableGarments, setAvailableGarments] = useState<GarmentType[]>([]);

  // Deduplicated list of garment options
  const garmentOptions = useMemo(() => {
    const list = availableGarments.length > 0 ? availableGarments : Object.values(WOMEN_GARMENTS);
    const seen = new Set<string>();
    return list.filter((g) => {
      if (!g?.code || seen.has(g.code)) return false;
      seen.add(g.code);
      return true;
    });
  }, [availableGarments]);

  // Dates & Priority
  const todayStr = new Date().toISOString().split('T')[0];
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  const [orderDate, setOrderDate] = useState(todayStr);
  const [deliveryDate, setDeliveryDate] = useState(nextWeekStr);
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [orderNotes, setOrderNotes] = useState('');

  // Garment Items
  const [items, setItems] = useState<OrderItemForm[]>([
    {
      garment_type: 'top',
      quantity: 1,
      unit_price: WOMEN_GARMENTS.top?.defaultPrice || 650,
      design_notes: '',
    },
  ]);

  // Billing
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [advanceMode, setAdvanceMode] = useState<'cash' | 'upi' | 'card' | 'bank_transfer'>('cash');

  // Quick Customer Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustNotes, setNewCustNotes] = useState('');
  const [custModalError, setCustModalError] = useState('');
  const [isCreatingCust, setIsCreatingCust] = useState(false);

  // Post-Creation Modal
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const load = async () => {
      const [c, gTypes, s] = await Promise.all([
        customersService.getAll(),
        shopService.getGarmentTypes(),
        shopService.getShop(),
      ]);
      setCustomers(c);
      setAvailableGarments(gTypes);
      setShop(s);
      if (preselectedCustomerId) {
        setSelectedCustomerId(preselectedCustomerId);
      } else if (c.length === 1 && !selectedCustomerId) {
        setSelectedCustomerId(c[0].id);
      }
    };
    load();
  }, [preselectedCustomerId]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const handleAddItem = (garmentKey: string = 'top') => {
    const matched = availableGarments.find((g) => g.code === garmentKey);
    const unitPrice = matched ? matched.default_price : (WOMEN_GARMENTS[garmentKey]?.defaultPrice || 500);
    setItems([
      ...items,
      {
        garment_type: garmentKey,
        quantity: 1,
        unit_price: unitPrice,
        design_notes: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof OrderItemForm, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'garment_type') {
      const matched = availableGarments.find((g) => g.code === value);
      if (matched) {
        updated[index].unit_price = matched.default_price;
      } else if (WOMEN_GARMENTS[value]) {
        updated[index].unit_price = WOMEN_GARMENTS[value].defaultPrice;
      }
    }

    setItems(updated);
  };

  const handleCreateCustomerInline = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustModalError('');
    setIsCreatingCust(true);
    try {
      const created = await customersService.create({
        name: newCustName,
        phone: newCustPhone,
        address: newCustAddress || null,
        notes: newCustNotes || null,
      });
      const updatedList = await customersService.getAll();
      setCustomers(updatedList);
      setSelectedCustomerId(created.id);
      setIsCustomerModalOpen(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustAddress('');
      setNewCustNotes('');
    } catch (err: any) {
      setCustModalError(err.message || 'Failed to create customer');
    } finally {
      setIsCreatingCust(false);
    }
  };

  const financials = computeOrderFinancials({
    items: items.map((i) => ({ quantity: i.quantity, unit_price: i.unit_price })),
    discountAmount,
    paidAmount: advanceAmount,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedCustomerId) {
      setFormError('Please select a customer.');
      return;
    }

    if (items.length === 0) {
      setFormError('Please add at least one garment.');
      return;
    }

    if (new Date(deliveryDate) < new Date(orderDate)) {
      setFormError('Delivery date cannot be before booking date.');
      return;
    }

    if (advanceAmount > financials.netAmount) {
      setFormError(`Advance cannot exceed net amount of ₹ ${financials.netAmount}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const newOrder = await ordersService.create({
        customer_id: selectedCustomerId,
        order_date: orderDate,
        trial_date: null,
        delivery_date: deliveryDate,
        priority,
        notes: orderNotes || null,
        discount_amount: discountAmount,
        advance_amount: advanceAmount,
        advance_payment_mode: advanceMode,
        advance_notes: 'Advance booking payment',
        items: items.map((i) => ({
          garment_type: i.garment_type,
          quantity: i.quantity,
          unit_price: i.unit_price,
          design_notes: i.design_notes || null,
          fabric_source: 'customer' as const,
          fabric_details: null,
          measurement_profile_id: null,
          reference_photos: [],
        })),
      });

      setCreatedOrder(newOrder);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const waConfirmationLink = useMemo(() => {
    if (!createdOrder) return '';
    const cust = createdOrder.customer || selectedCustomer;
    if (!cust) return '';
    return buildWhatsAppLink(
      cust.phone || '',
      getOrderConfirmationMessage({
        shop: shop || { name: 'Boutique' },
        customer: cust,
        order: createdOrder,
      })
    );
  }, [createdOrder, selectedCustomer, shop]);

  const handleResetForAnotherOrder = () => {
    setCreatedOrder(null);
    setItems([
      {
        garment_type: 'top',
        quantity: 1,
        unit_price: WOMEN_GARMENTS.top?.defaultPrice || 650,
        design_notes: '',
      },
    ]);
    setDiscountAmount(0);
    setAdvanceAmount(0);
    setOrderNotes('');
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <Link href="/orders" className="p-1 rounded text-stone-500 hover:text-stone-900 hover:bg-stone-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-stone-900">New Order</h1>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSubmitting}
          className="font-medium"
        >
          <Save className="w-4 h-4" />
          <span>Save Order</span>
        </Button>
      </div>

      {formError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800">
          {formError}
        </div>
      )}

      {/* 1. Customer Selection */}
      <div className="bg-white rounded-lg border border-stone-200 p-4 space-y-2">
        <label className="block text-xs font-semibold text-stone-700">Customer *</label>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="flex-1 h-10 px-3 bg-white text-stone-900 border border-stone-300 rounded text-sm focus:outline-none focus:border-stone-500"
            required
          >
            <option value="" disabled>
              Select customer...
            </option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} - {c.phone} {c.address ? `(${c.address})` : ''}
              </option>
            ))}
          </select>

          <Button
            type="button"
            variant="outline"
            onClick={() => setIsCustomerModalOpen(true)}
            className="h-10 text-xs font-medium shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Customer</span>
          </Button>
        </div>

        {selectedCustomer && (
          <div className="text-xs text-stone-500 pt-1">
            Selected: <span className="font-semibold text-stone-900">{selectedCustomer.name}</span> &bull; {selectedCustomer.phone}
            {selectedCustomer.address && ` &bull; ${selectedCustomer.address}`}
          </div>
        )}
      </div>

      {/* 2. Dates & Priority */}
      <div className="bg-white rounded-lg border border-stone-200 p-4 space-y-3">
        <h2 className="text-xs font-semibold text-stone-700 uppercase tracking-wider">Schedule</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-stone-600 mb-1">Booking Date</label>
            <input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              required
              className="w-full h-9 px-2.5 text-xs border border-stone-300 rounded focus:outline-none focus:border-stone-500"
            />
          </div>

          <div>
            <label className="block text-xs text-stone-600 mb-1">Delivery Date *</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              required
              className="w-full h-9 px-2.5 text-xs font-semibold text-stone-900 border border-stone-300 rounded focus:outline-none focus:border-stone-500"
            />
          </div>

          <div>
            <label className="block text-xs text-stone-600 mb-1">Priority</label>
            <div className="flex items-center gap-2 h-9">
              <button
                type="button"
                onClick={() => setPriority('normal')}
                className={`flex-1 h-9 rounded text-xs font-medium border ${
                  priority === 'normal'
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                }`}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => setPriority('urgent')}
                className={`flex-1 h-9 rounded text-xs font-medium border ${
                  priority === 'urgent'
                    ? 'bg-rose-700 text-white border-rose-700'
                    : 'bg-white text-rose-700 border-stone-300 hover:bg-rose-50'
                }`}
              >
                Urgent
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Garments List */}
      <div className="bg-white rounded-lg border border-stone-200 p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <h2 className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
            Garments ({items.length})
          </h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleAddItem()}
            className="h-7 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="p-3 rounded border border-stone-200 bg-stone-50/50 space-y-2">
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5 sm:col-span-6">
                  <label className="block text-[10px] text-stone-500 mb-0.5">Garment</label>
                  <select
                    value={item.garment_type}
                    onChange={(e) => handleItemChange(index, 'garment_type', e.target.value)}
                    className="w-full h-8 px-2 bg-white text-xs border border-stone-300 rounded focus:outline-none focus:border-stone-500"
                  >
                    {garmentOptions.map((g) => (
                      <option key={g.code} value={g.code}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] text-stone-500 mb-0.5">Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value, 10) || 1)}
                    className="w-full h-8 px-2 text-xs font-mono text-center border border-stone-300 rounded focus:outline-none focus:border-stone-500"
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-[10px] text-stone-500 mb-0.5">Rate (₹)</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="w-full h-8 px-2 text-xs font-mono text-right border border-stone-300 rounded focus:outline-none focus:border-stone-500"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1 text-right pt-3">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-1 text-stone-400 hover:text-rose-600 rounded"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Notes (optional - neck design, length, piping, sleeves)"
                  value={item.design_notes}
                  onChange={(e) => handleItemChange(index, 'design_notes', e.target.value)}
                  className="w-full h-7 px-2 text-xs bg-white border border-stone-200 rounded focus:outline-none focus:border-stone-500 placeholder:text-stone-400"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Billing & Advance */}
      <div className="bg-white rounded-lg border border-stone-200 p-4 space-y-3">
        <h2 className="text-xs font-semibold text-stone-700 uppercase tracking-wider">Payment & Notes</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-stone-600 mb-1">Discount (₹)</label>
            <input
              type="number"
              min={0}
              step="any"
              value={discountAmount || ''}
              onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full h-9 px-2.5 text-xs font-mono border border-stone-300 rounded focus:outline-none focus:border-stone-500"
            />
          </div>

          <div>
            <label className="block text-xs text-stone-600 mb-1">Advance Paid (₹)</label>
            <input
              type="number"
              min={0}
              step="any"
              value={advanceAmount || ''}
              onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full h-9 px-2.5 text-xs font-mono font-bold text-emerald-800 border border-stone-300 rounded focus:outline-none focus:border-stone-500"
            />
          </div>

          <div>
            <label className="block text-xs text-stone-600 mb-1">Payment Mode</label>
            <select
              value={advanceMode}
              onChange={(e) => setAdvanceMode(e.target.value as any)}
              className="w-full h-9 px-2 text-xs border border-stone-300 rounded focus:outline-none focus:border-stone-500"
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-stone-600 mb-1">Order Notes (Optional)</label>
          <input
            type="text"
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            placeholder="Special instructions or fitting preferences"
            className="w-full h-9 px-2.5 text-xs border border-stone-300 rounded focus:outline-none focus:border-stone-500"
          />
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-stone-50 rounded border border-stone-200 text-center">
          <div>
            <div className="text-[10px] text-stone-500 uppercase">Total</div>
            <div className="font-bold text-sm text-stone-900 mt-0.5">{formatINR(financials.totalAmount)}</div>
          </div>
          <div>
            <div className="text-[10px] text-stone-500 uppercase">Net Bill</div>
            <div className="font-bold text-sm text-stone-900 mt-0.5">{formatINR(financials.netAmount)}</div>
          </div>
          <div>
            <div className="text-[10px] text-stone-500 uppercase">Balance Due</div>
            <div className="font-bold text-sm text-rose-700 mt-0.5">{formatINR(financials.balanceAmount)}</div>
          </div>
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Add Customer"
      >
        <form onSubmit={handleCreateCustomerInline} className="space-y-3">
          {custModalError && (
            <div className="p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800">
              {custModalError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Customer Name *</label>
            <input
              type="text"
              required
              autoFocus
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
              placeholder="e.g. Meera Joshi"
              className="w-full h-9 px-2.5 text-sm border border-stone-300 rounded focus:outline-none focus:border-stone-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Mobile Number *</label>
            <input
              type="tel"
              required
              maxLength={10}
              value={newCustPhone}
              onChange={(e) => setNewCustPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="10-digit number"
              className="w-full h-9 px-2.5 text-sm font-mono border border-stone-300 rounded focus:outline-none focus:border-stone-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Address / Area</label>
            <input
              type="text"
              value={newCustAddress}
              onChange={(e) => setNewCustAddress(e.target.value)}
              placeholder="e.g. Station Road"
              className="w-full h-9 px-2.5 text-sm border border-stone-300 rounded focus:outline-none focus:border-stone-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={newCustNotes}
              onChange={(e) => setNewCustNotes(e.target.value)}
              placeholder="Preferences or fitting notes"
              className="w-full p-2 text-xs border border-stone-300 rounded focus:outline-none focus:border-stone-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsCustomerModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isCreatingCust}>
              Save & Select
            </Button>
          </div>
        </form>
      </Modal>

      {/* Order Created Success & Send to WhatsApp Modal */}
      <Modal
        isOpen={Boolean(createdOrder)}
        onClose={() => {
          if (createdOrder) {
            router.push(`/orders/${createdOrder.id}`);
          }
        }}
        title="Order Created"
        maxWidth="md"
      >
        {createdOrder && (
          <div className="space-y-4 py-2">
            <div>
              <div className="text-base font-bold text-stone-900">
                Order #{createdOrder.order_number}
              </div>
              <div className="text-xs text-stone-500 mt-0.5">
                Customer: {createdOrder.customer?.name || selectedCustomer?.name} ({createdOrder.customer?.phone || selectedCustomer?.phone})
              </div>
            </div>

            <div className="p-3 bg-stone-50 border border-stone-200 rounded grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-stone-500 block text-[10px] uppercase">Net Bill</span>
                <span className="font-bold text-stone-900 font-mono">{formatINR(createdOrder.net_amount)}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px] uppercase">Advance</span>
                <span className="font-bold text-emerald-800 font-mono">{formatINR(createdOrder.paid_amount)}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px] uppercase">Balance</span>
                <span className="font-bold text-rose-700 font-mono">{formatINR(createdOrder.balance_amount)}</span>
              </div>
            </div>

            <div className="text-xs text-stone-600">
              Delivery Date: <strong>{new Date(createdOrder.delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
            </div>

            {/* Send to WhatsApp Button */}
            <div>
              <a
                href={waConfirmationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-xs transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send to WhatsApp</span>
              </a>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
              <Link
                href={`/orders/${createdOrder.id}/print`}
                target="_blank"
                className="flex items-center justify-center gap-1.5 h-9 px-3 border border-stone-300 hover:bg-stone-50 rounded text-xs text-stone-700 font-medium"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Bill</span>
              </Link>

              <Link
                href={`/orders/${createdOrder.id}`}
                className="flex items-center justify-center gap-1.5 h-9 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-medium"
              >
                <span>View Order</span>
              </Link>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={handleResetForAnotherOrder}
                className="text-xs text-[#881337] hover:underline"
              >
                + Create another order
              </button>
            </div>
          </div>
        )}
      </Modal>
    </form>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-stone-500">Loading order form...</div>}>
      <NewOrderContent />
    </Suspense>
  );
}
