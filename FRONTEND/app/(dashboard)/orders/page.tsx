'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ordersService } from '@/lib/services/orders.service';
import { Order, OrderStatus } from '@/lib/shared/types/database';
import { formatINR } from '@/lib/shared/calculations/currency';
import { ORDER_STATUS_FLOW, ORDER_STATUS_MAP, getNextOrderStatus } from '@/lib/shared/constants/order-status';
import { buildWhatsAppLink, getDeliveryReadyMessage } from '@/lib/shared/constants/whatsapp-templates';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import {
  ShoppingBag,
  Search,
  Plus,
  Phone,
  MessageSquare,
  Printer,
  ChevronRight,
  Calendar,
  AlertCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
  Filter,
} from 'lucide-react';

import { Suspense } from 'react';

function OrdersContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams?.get('status') as OrderStatus | null;
  const initialPriority = searchParams?.get('priority');

  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus || 'all');
  const [priorityFilter, setPriorityFilter] = useState<string>(initialPriority || 'all');
  const [isLoading, setIsLoading] = useState(true);

  // Quick Status Transition Modal
  const [orderToUpdate, setOrderToUpdate] = useState<Order | null>(null);
  const [targetStatus, setTargetStatus] = useState<OrderStatus>('cutting');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await ordersService.getAll();
      setOrders(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleOpenStatusModal = (order: Order) => {
    const next = getNextOrderStatus(order.status) || order.status;
    setOrderToUpdate(order);
    setTargetStatus(next);
    setStatusNotes('');
  };

  const handleConfirmStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToUpdate) return;
    setIsUpdating(true);
    try {
      await ordersService.updateStatus(orderToUpdate.id, targetStatus, statusNotes);
      setOrderToUpdate(null);
      await loadOrders();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch =
      o.order_number.toLowerCase().includes(q) ||
      o.customer?.name.toLowerCase().includes(q) ||
      o.customer?.phone.includes(q);

    let matchFilter = true;
    if (statusFilter === 'urgent') {
      matchFilter = o.priority === 'urgent' && o.status !== 'delivered';
    } else if (statusFilter === 'today') {
      matchFilter = o.delivery_date === todayStr && o.status !== 'delivered';
    } else if (statusFilter === 'unpaid') {
      matchFilter = o.balance_amount > 0 && o.status !== 'delivered';
    } else if (statusFilter !== 'all') {
      matchFilter = o.status === statusFilter;
    }

    const matchPriority = priorityFilter === 'all' || o.priority === priorityFilter;

    return matchSearch && matchFilter && matchPriority;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Orders Pipeline
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            {orders.length} total orders • Track cutting, stitching, and customer deliveries
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/reports">
            <Button variant="outline" size="sm" className="font-medium gap-1.5">
              <Printer className="w-4 h-4 text-stone-600" />
              <span>Download PDF / Reports</span>
            </Button>
          </Link>

          <Link href="/orders/new">
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4" />
              <span>Create New Order</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Input
              placeholder="Search by order #, client name, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftAddon={<Search className="w-4 h-4 text-stone-400" />}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 hidden sm:inline-block">
              Priority:
            </span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs bg-stone-50 border border-stone-200 rounded-lg h-11 px-3 text-stone-700 hover:border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-800/20"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent Only</option>
              <option value="normal">Normal</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-stone-100 pb-1">
          {[
            { key: 'all', label: 'All Orders' },
            { key: 'today', label: "Today's Deliveries" },
            { key: 'urgent', label: 'Urgent' },
            { key: 'received', label: 'Received' },
            { key: 'cutting', label: 'Cutting' },
            { key: 'stitching', label: 'Stitching' },
            { key: 'finishing', label: 'Finishing' },
            { key: 'ready', label: 'Ready for Pickup' },
            { key: 'delivered', label: 'Delivered' },
            { key: 'unpaid', label: 'Pending Dues' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${statusFilter === tab.key
                ? 'bg-[#881337] text-white font-semibold shadow-2xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center shadow-2xs">
          <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-800">No orders match criteria</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
            Try resetting your filters or search keywords to view other tailoring orders.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setPriorityFilter('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const statusMeta = ORDER_STATUS_MAP[order.status];
            const waLink = buildWhatsAppLink(
              order.customer?.phone || '',
              getDeliveryReadyMessage({
                shop: { name: 'Swapneri Boutique', phone: '9820198201' },
                customer: order.customer!,
                order,
              })
            );

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs hover:border-stone-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/orders/${order.id}`}
                      className="font-mono font-bold text-base text-stone-900 hover:text-[#881337] transition-colors"
                    >
                      {order.order_number}
                    </Link>

                    <Link
                      href={`/customers/${order.customer_id}`}
                      className="font-medium text-sm text-stone-800 hover:text-[#881337]"
                    >
                      • {order.customer?.name}
                    </Link>

                    {order.priority === 'urgent' && (
                      <Badge variant="rose" dot>Urgent</Badge>
                    )}

                    <Badge variant={order.status === 'ready' ? 'emerald' : order.status === 'stitching' ? 'blue' : order.status === 'cutting' ? 'amber' : 'stone'}>
                      {statusMeta?.labelEn}
                    </Badge>
                  </div>

                  {/* Items summary */}
                  <div className="text-xs text-stone-600 flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {order.items?.map((i) => `${i.quantity}x ${i.garment_type.replace('_', ' ')}`).join(', ') || 'Custom Garment'}
                    </span>
                    {order.items?.[0]?.assigned_worker_id && (
                      <span className="text-stone-400">
                        (Assigned: {order.items[0].worker?.name})
                      </span>
                    )}
                  </div>

                  {/* Dates & Financials */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      Delivery: <strong className="text-stone-800">{new Date(order.delivery_date).toLocaleDateString('en-IN')}</strong>
                    </span>

                    <span>•</span>

                    <span>
                      Total: <strong className="text-stone-900">{formatINR(order.net_amount)}</strong>
                    </span>

                    {order.balance_amount > 0 ? (
                      <span className="text-rose-700 font-semibold">
                        Due: {formatINR(order.balance_amount)}
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-semibold">Fully Paid</span>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-stone-100 shrink-0">
                  <a
                    href={`tel:${order.customer?.phone}`}
                    className="w-10 h-10 rounded-lg border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors"
                    title="Call Client"
                  >
                    <Phone className="w-4 h-4" />
                  </a>

                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                    title="WhatsApp Update"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </a>

                  <Link
                    href={`/orders/${order.id}/print`}
                    target="_blank"
                    className="w-10 h-10 rounded-lg border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors"
                    title="Print Bill / Challan"
                  >
                    <Printer className="w-4 h-4" />
                  </Link>

                  {/* One-Tap Status Advance Button */}
                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenStatusModal(order)}
                    >
                      <span>Update Status</span>
                    </Button>
                  )}

                  <Link href={`/orders/${order.id}`}>
                    <Button variant="primary" size="sm">
                      <span>Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Status Modal */}
      <Modal
        isOpen={Boolean(orderToUpdate)}
        onClose={() => setOrderToUpdate(null)}
        title="Update Order Status"
        description={`Order #${orderToUpdate?.order_number} for ${orderToUpdate?.customer?.name}`}
      >
        <form onSubmit={handleConfirmStatusChange} className="space-y-4">
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-100 text-xs flex items-center justify-between">
            <div>
              <span className="text-stone-500 block text-[10px] uppercase font-semibold">Current Status</span>
              <span className="font-bold text-stone-900 capitalize">{orderToUpdate?.status}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-stone-400" />
            <div>
              <span className="text-stone-500 block text-[10px] uppercase font-semibold">Next Target</span>
              <span className="font-bold text-[#881337] capitalize">{targetStatus}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
              Select New Status *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ORDER_STATUS_FLOW.map((s) => (
                <button
                  type="button"
                  key={s.key}
                  onClick={() => setTargetStatus(s.key)}
                  className={`p-2.5 rounded-lg border text-left text-xs font-medium transition-colors cursor-pointer ${targetStatus === s.key
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
              Audit Note (Optional)
            </label>
            <Input
              placeholder="e.g. Master Ramesh finished cutting, moved to stitching machine"
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
            <Button type="button" variant="secondary" onClick={() => setOrderToUpdate(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isUpdating}>
              Confirm Status Change
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-500">Loading orders...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
