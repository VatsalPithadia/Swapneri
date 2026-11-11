'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ordersService } from '@/lib/services/orders.service';
import { customersService } from '@/lib/services/customers.service';
import { shopService } from '@/lib/services/shop.service';
import { formatINR } from '@/lib/shared/calculations/currency';
import { ORDER_STATUS_MAP, ORDER_STATUS_FLOW } from '@/lib/shared/constants/order-status';
import { buildWhatsAppLink, getDeliveryReadyMessage } from '@/lib/shared/constants/whatsapp-templates';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import {
  Calendar,
  AlertCircle,
  Phone,
  MessageSquare,
  Plus,
  UserPlus,
  Search,
} from 'lucide-react';
import { Order, Customer, Shop } from '@/lib/shared/types/database';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [customerError, setCustomerError] = useState('');
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  // Search Customer Modal
  const [isSearchCustModalOpen, setIsSearchCustModalOpen] = useState(false);
  const [custSearchQuery, setCustSearchQuery] = useState('');

  // Delivery Date Modal
  const [isDateLookupModalOpen, setIsDateLookupModalOpen] = useState(false);
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState(todayStr);

  // KPI Details Modal
  const [kpiModalState, setKpiModalState] = useState<{
    isOpen: boolean;
    title: string;
    orders: Order[];
  }>({
    isOpen: false,
    title: '',
    orders: [],
  });

  const loadData = async () => {
    try {
      const [statsData, custData, shopData] = await Promise.all([
        ordersService.getDashboardStats(),
        customersService.getAll(),
        shopService.getShop(),
      ]);
      setStats(statsData);
      setAllCustomers(custData);
      setShop(shopData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  useEffect(() => {
    loadData();

    const handleShopUpdate = (e: any) => {
      if (e?.detail) setShop(e.detail);
      else loadData();
    };
    window.addEventListener('shop-updated', handleShopUpdate);
    return () => window.removeEventListener('shop-updated', handleShopUpdate);
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomerError('');
    setIsSavingCustomer(true);
    try {
      await customersService.create({
        name: customerName,
        phone: customerPhone,
        address: customerAddress || null,
        notes: customerNotes || null,
      });
      setIsCustomerModalOpen(false);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setCustomerNotes('');
      await loadData();
    } catch (err: any) {
      setCustomerError(err.message || 'Failed to create customer');
    } finally {
      setIsSavingCustomer(false);
    }
  };

  const searchedCustomers = useMemo(() => {
    if (!custSearchQuery.trim()) return allCustomers;
    const q = custSearchQuery.toLowerCase();
    return allCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.address && c.address.toLowerCase().includes(q))
    );
  }, [allCustomers, custSearchQuery]);

  const allOrdersList: Order[] = useMemo(() => stats?.allOrders || [], [stats]);

  const deliveryDateOrders = useMemo(() => {
    if (!selectedDeliveryDate) return [];
    return allOrdersList.filter((o) => o.delivery_date === selectedDeliveryDate);
  }, [allOrdersList, selectedDeliveryDate]);

  const openKpiModal = (title: string, orders: Order[]) => {
    setKpiModalState({
      isOpen: true,
      title,
      orders,
    });
  };

  if (!stats) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-stone-200 rounded w-48"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-stone-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const urgentOrders = stats?.urgentOrders || [];
  const todaysDeliveries = stats?.todaysDeliveries || [];
  const dueThisWeek = stats?.dueThisWeek || [];
  const overdueOrders = stats?.overdueOrders || [];
  const pendingDuesOrders = stats?.pendingDuesOrders || [];
  const pendingPaymentsTotal = stats?.pendingPaymentsTotal || 0;
  const statusCounts = stats?.statusCounts || {};
  const recentCustomers = stats?.recentCustomers || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900">{shop?.name || 'Dashboard'}</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {shop?.owner_name ? `Prop: ${shop.owner_name} • ` : ''}Overview of schedule, workshop pipeline, and deliveries
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setCustSearchQuery('');
              setIsSearchCustModalOpen(true);
            }}
            className="text-stone-700 font-medium"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Customer</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsDateLookupModalOpen(true)}
            className="text-stone-700 font-medium"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Deliveries by Date</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIsCustomerModalOpen(true)}
            className="font-medium"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Customer</span>
          </Button>

          <Link href="/orders/new">
            <Button variant="primary" size="sm" className="font-medium">
              <Plus className="w-3.5 h-3.5" />
              <span>Create Order</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Urgent Orders Notice */}
      {urgentOrders.length > 0 && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-rose-900 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
            <span>
              {urgentOrders.length} urgent order{urgentOrders.length > 1 ? 's' : ''} require workshop attention.
            </span>
          </div>
          <Link href="/orders?priority=urgent" className="text-rose-800 font-semibold hover:underline">
            View orders &rarr;
          </Link>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Deliveries */}
        <div
          onClick={() => openKpiModal("Today's Deliveries", todaysDeliveries)}
          className="bg-white p-4 rounded-lg border border-stone-200 hover:border-stone-400 transition-colors cursor-pointer"
        >
          <div className="text-xs font-medium text-stone-500">Today's Deliveries</div>
          <div className="text-2xl sm:text-3xl font-bold text-stone-900 mt-1">{todaysDeliveries.length}</div>
          <div className="text-[11px] text-stone-400 mt-2 hover:text-[#881337]">Click to view details &rarr;</div>
        </div>

        {/* Due This Week */}
        <div
          onClick={() => openKpiModal('Orders Due This Week', dueThisWeek)}
          className="bg-white p-4 rounded-lg border border-stone-200 hover:border-stone-400 transition-colors cursor-pointer"
        >
          <div className="text-xs font-medium text-stone-500">Due This Week</div>
          <div className="text-2xl sm:text-3xl font-bold text-stone-900 mt-1">{dueThisWeek.length}</div>
          <div className="text-[11px] text-stone-400 mt-2 hover:text-[#881337]">Click to view details &rarr;</div>
        </div>

        {/* Overdue Orders */}
        <div
          onClick={() => openKpiModal('Overdue Orders', overdueOrders)}
          className="bg-white p-4 rounded-lg border border-stone-200 hover:border-stone-400 transition-colors cursor-pointer"
        >
          <div className="text-xs font-medium text-stone-500">Overdue Orders</div>
          <div className={`text-2xl sm:text-3xl font-bold mt-1 ${overdueOrders.length > 0 ? 'text-rose-700' : 'text-stone-900'}`}>
            {overdueOrders.length}
          </div>
          <div className="text-[11px] text-stone-400 mt-2 hover:text-[#881337]">Click to view details &rarr;</div>
        </div>

        {/* Pending Dues */}
        <div
          onClick={() => openKpiModal('Pending Dues', pendingDuesOrders)}
          className="bg-white p-4 rounded-lg border border-stone-200 hover:border-stone-400 transition-colors cursor-pointer"
        >
          <div className="text-xs font-medium text-stone-500">Pending Dues</div>
          <div className="text-xl sm:text-2xl font-bold text-stone-900 mt-1 font-mono">{formatINR(pendingPaymentsTotal)}</div>
          <div className="text-[11px] text-stone-400 mt-2 hover:text-[#881337]">Click to view details &rarr;</div>
        </div>
      </div>

      {/* Production Pipeline */}
      <div className="bg-white rounded-lg border border-stone-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-stone-900">Garment Pipeline</h2>
          <Link href="/orders" className="text-xs text-[#881337] hover:underline font-medium">
            View All Orders
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {ORDER_STATUS_FLOW.filter((s) => s.key !== 'cancelled').map((stage) => (
            <Link
              key={stage.key}
              href={`/orders?status=${stage.key}`}
              className="p-3 rounded border border-stone-200 hover:bg-stone-50 transition-colors"
            >
              <div className="text-xs text-stone-500">{stage.label}</div>
              <div className="text-lg font-bold text-stone-900 mt-1">{statusCounts[stage.key] || 0}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Split Section: Today's Deliveries & Recent Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Deliveries List (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-stone-200 p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h2 className="text-sm font-semibold text-stone-900">Today's Deliveries ({todaysDeliveries.length})</h2>
            <Link href="/orders" className="text-xs text-[#881337] hover:underline">
              All Orders
            </Link>
          </div>

          {todaysDeliveries.length === 0 ? (
            <div className="py-10 text-center text-xs text-stone-500">
              No orders scheduled for delivery today.
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {todaysDeliveries.map((order: Order) => {
                const statusMeta = ORDER_STATUS_MAP[order.status];
                const waLink = buildWhatsAppLink(
                  order.customer?.phone || '',
                  getDeliveryReadyMessage({
                    shop: shop || { name: 'Boutique' },
                    customer: order.customer!,
                    order,
                  })
                );

                return (
                  <div key={order.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Link href={`/orders/${order.id}`} className="font-semibold text-sm text-stone-900 hover:text-[#881337]">
                          {order.customer?.name}
                        </Link>
                        <span className="text-xs text-stone-400 font-mono">({order.order_number})</span>
                        {order.priority === 'urgent' && <Badge variant="rose">Urgent</Badge>}
                        <Badge variant={order.status === 'ready' ? 'emerald' : 'amber'}>
                          {statusMeta?.labelEn}
                        </Badge>
                      </div>

                      <div className="text-xs text-stone-500 flex items-center gap-2">
                        <span>{order.customer?.phone}</span>
                        <span>&bull;</span>
                        <span>{order.items?.map((i) => `${i.quantity} ${i.garment_type}`).join(', ')}</span>
                        <span>&bull;</span>
                        <span className="font-medium text-stone-700">Due: {formatINR(order.balance_amount)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={`tel:${order.customer?.phone}`}
                        className="p-1.5 border border-stone-200 rounded text-stone-600 hover:bg-stone-50"
                        title="Call"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>

                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-emerald-300 bg-emerald-50 text-emerald-800 rounded text-xs font-medium hover:bg-emerald-100"
                        title="Send WhatsApp update"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </a>

                      <Link href={`/orders/${order.id}`}>
                        <Button variant="secondary" size="sm" className="h-7 text-xs">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Customers (1 col) */}
        <div className="bg-white rounded-lg border border-stone-200 p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h2 className="text-sm font-semibold text-stone-900">Recent Customers</h2>
            <Link href="/customers" className="text-xs text-[#881337] hover:underline">
              View All
            </Link>
          </div>

          <div className="divide-y divide-stone-100">
            {recentCustomers.map((cust: Customer) => (
              <Link
                key={cust.id}
                href={`/customers/${cust.id}`}
                className="py-2.5 flex items-center justify-between hover:bg-stone-50 rounded px-1 -mx-1"
              >
                <div>
                  <div className="text-sm font-medium text-stone-900">{cust.name}</div>
                  <div className="text-xs text-stone-500 font-mono">{cust.phone}</div>
                </div>
                <span className="text-xs text-stone-400">Profile &rarr;</span>
              </Link>
            ))}
          </div>

          <Button
            variant="outline"
            className="w-full mt-3 text-xs"
            size="sm"
            onClick={() => setIsCustomerModalOpen(true)}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add New Customer</span>
          </Button>
        </div>
      </div>

      {/* Modal 1: Search Customer */}
      <Modal
        isOpen={isSearchCustModalOpen}
        onClose={() => setIsSearchCustModalOpen(false)}
        title="Search Customers"
        maxWidth="lg"
      >
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={custSearchQuery}
              onChange={(e) => setCustSearchQuery(e.target.value)}
              placeholder="Search by name, phone or address..."
              className="w-full h-10 pl-9 pr-3 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-stone-500"
            />
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
            {searchedCustomers.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-500">
                No matching customer found.
              </div>
            ) : (
              searchedCustomers.map((c) => (
                <div key={c.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium text-stone-900">{c.name}</div>
                    <div className="text-xs text-stone-500">
                      {c.phone} {c.address ? `• ${c.address}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`https://wa.me/91${c.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 border border-stone-200 rounded text-stone-600 hover:bg-stone-50"
                      title="WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    </a>
                    <Link href={`/customers/${c.id}`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        Profile
                      </Button>
                    </Link>
                    <Link href={`/orders/new?customerId=${c.id}`}>
                      <Button variant="primary" size="sm" className="h-7 text-xs">
                        New Order
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Modal 2: Deliveries by Date */}
      <Modal
        isOpen={isDateLookupModalOpen}
        onClose={() => setIsDateLookupModalOpen(false)}
        title="Deliveries by Date"
        maxWidth="lg"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDeliveryDate}
              onChange={(e) => setSelectedDeliveryDate(e.target.value)}
              className="h-9 px-2.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-500"
            />
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedDeliveryDate(todayStr)}
                className="px-2 py-1 border border-stone-200 rounded hover:bg-stone-50 text-stone-600"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  const t = new Date();
                  t.setDate(t.getDate() + 1);
                  setSelectedDeliveryDate(t.toISOString().split('T')[0]);
                }}
                className="px-2 py-1 border border-stone-200 rounded hover:bg-stone-50 text-stone-600"
              >
                Tomorrow
              </button>
            </div>
          </div>

          <div className="text-xs text-stone-500">
            {deliveryDateOrders.length} order{deliveryDateOrders.length === 1 ? '' : 's'} on this date
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
            {deliveryDateOrders.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-500">
                No orders scheduled for this date.
              </div>
            ) : (
              deliveryDateOrders.map((o) => (
                <div key={o.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium text-stone-900">
                      {o.customer?.name} <span className="text-xs font-mono text-stone-400">({o.order_number})</span>
                    </div>
                    <div className="text-xs text-stone-500">
                      {o.items?.map((i) => `${i.quantity} ${i.garment_type}`).join(', ')} • Balance: {formatINR(o.balance_amount)}
                    </div>
                  </div>
                  <Link href={`/orders/${o.id}`}>
                    <Button variant="secondary" size="sm" className="h-7 text-xs">
                      View
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Modal 3: KPI Details Modal */}
      <Modal
        isOpen={kpiModalState.isOpen}
        onClose={() => setKpiModalState({ ...kpiModalState, isOpen: false })}
        title={kpiModalState.title}
        maxWidth="lg"
      >
        <div className="space-y-3">
          <div className="text-xs text-stone-500">
            Total {kpiModalState.orders.length} order{kpiModalState.orders.length === 1 ? '' : 's'}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-stone-100">
            {kpiModalState.orders.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-500">No orders to display.</div>
            ) : (
              kpiModalState.orders.map((o) => (
                <div key={o.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium text-stone-900">
                      {o.customer?.name} <span className="text-xs font-mono text-stone-400">({o.order_number})</span>
                    </div>
                    <div className="text-xs text-stone-500">
                      Delivery: {new Date(o.delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • Due: {formatINR(o.balance_amount)}
                    </div>
                  </div>
                  <Link href={`/orders/${o.id}`}>
                    <Button variant="secondary" size="sm" className="h-7 text-xs">
                      View
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Modal 4: Add Customer */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Add Customer"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-3">
          {customerError && (
            <div className="p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800">
              {customerError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Customer Name *</label>
            <input
              type="text"
              required
              autoFocus
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
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
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="10-digit number"
              className="w-full h-9 px-2.5 text-sm font-mono border border-stone-300 rounded focus:outline-none focus:border-stone-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Address / Area</label>
            <input
              type="text"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="e.g. Station Road"
              className="w-full h-9 px-2.5 text-sm border border-stone-300 rounded focus:outline-none focus:border-stone-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Notes (Optional)</label>
            <textarea
              rows={2}
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Any preferences or notes"
              className="w-full p-2 text-xs border border-stone-300 rounded focus:outline-none focus:border-stone-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsCustomerModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSavingCustomer}>
              Save Customer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
