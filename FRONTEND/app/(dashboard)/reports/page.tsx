'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ordersService } from '@/lib/services/orders.service';
import { shopService } from '@/lib/services/shop.service';
import { Order, Shop, OrderStatus } from '@/lib/shared/types/database';
import { formatINR } from '@/lib/shared/calculations/currency';
import { ORDER_STATUS_MAP } from '@/lib/shared/constants/order-status';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Printer,
  Download,
  Calendar,
  Search,
  Filter,
  FileText,
  ShoppingBag,
  ArrowLeft,
} from 'lucide-react';

type PeriodType = 'week' | 'month' | 'last_week' | 'last_month' | 'today' | 'all' | 'custom';

export default function OrderReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [period, setPeriod] = useState<PeriodType>('month');
  const [dateField, setDateField] = useState<'order_date' | 'delivery_date'>('order_date');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [o, s] = await Promise.all([
          ordersService.getAll(),
          shopService.getShop(),
        ]);
        setOrders(o);
        setShop(s);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Compute active date range based on selected period
  const dateRange = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (period === 'today') {
      return { start: todayStr, end: todayStr, label: 'Today' };
    }

    if (period === 'week') {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(d.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return {
        start: monday.toISOString().split('T')[0],
        end: sunday.toISOString().split('T')[0],
        label: 'This Week',
      };
    }

    if (period === 'last_week') {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1) - 7;
      const monday = new Date(d.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return {
        start: monday.toISOString().split('T')[0],
        end: sunday.toISOString().split('T')[0],
        label: 'Last Week',
      };
    }

    if (period === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        start: firstDay.toISOString().split('T')[0],
        end: lastDay.toISOString().split('T')[0],
        label: 'This Month',
      };
    }

    if (period === 'last_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        start: firstDay.toISOString().split('T')[0],
        end: lastDay.toISOString().split('T')[0],
        label: 'Last Month',
      };
    }

    if (period === 'all') {
      return { start: '', end: '', label: 'All Time' };
    }

    // Custom
    return {
      start: customStart,
      end: customEnd,
      label: customStart && customEnd ? `${customStart} to ${customEnd}` : 'Custom Range',
    };
  }, [period, customStart, customEnd]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Date Range Filter
      if (dateRange.start || dateRange.end) {
        const orderDateVal = dateField === 'order_date' ? o.order_date : o.delivery_date;
        if (dateRange.start && orderDateVal < dateRange.start) return false;
        if (dateRange.end && orderDateVal > dateRange.end) return false;
      }

      // 2. Status Filter
      if (statusFilter === 'unpaid') {
        if ((o.balance_amount || 0) <= 0) return false;
      } else if (statusFilter === 'delivered') {
        if (o.status !== 'delivered') return false;
      } else if (statusFilter === 'in_progress') {
        if (o.status === 'delivered' || o.status === 'cancelled') return false;
      } else if (statusFilter !== 'all') {
        if (o.status !== statusFilter) return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          o.order_number.toLowerCase().includes(q) ||
          o.customer?.name.toLowerCase().includes(q) ||
          o.customer?.phone.includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [orders, dateRange, dateField, statusFilter, searchQuery]);

  // Totals for filtered orders
  const totals = useMemo(() => {
    let bill = 0;
    let paid = 0;
    let balance = 0;
    let garments = 0;

    filteredOrders.forEach((o) => {
      bill += o.net_amount || 0;
      paid += o.paid_amount || 0;
      balance += o.balance_amount || 0;
      o.items?.forEach((i) => {
        garments += i.quantity || 1;
      });
    });

    return { bill, paid, balance, garments };
  }, [filteredOrders]);

  // Export to CSV for Excel / Google Sheets
  const handleExportCSV = () => {
    let csv = 'data:text/csv;charset=utf-8,';

    // Header Info
    csv += `"${shop?.name || 'Swapneri Boutique'}" - Orders Report\r\n`;
    csv += `Period: ${dateRange.label} (${dateRange.start || 'Start'} to ${dateRange.end || 'End'})\r\n`;
    csv += `Generated On: ${new Date().toLocaleDateString('en-IN')}\r\n\r\n`;

    // Summary
    csv += 'SUMMARY\r\n';
    csv += `Total Orders,${filteredOrders.length}\r\n`;
    csv += `Total Bill Amount,${totals.bill}\r\n`;
    csv += `Total Advance/Paid,${totals.paid}\r\n`;
    csv += `Total Balance Due,${totals.balance}\r\n`;
    csv += `Total Garments,${totals.garments}\r\n\r\n`;

    // Orders Register
    csv += 'Order Number,Booking Date,Delivery Date,Customer Name,Phone,Garments,Status,Total Bill,Paid Amount,Balance Due\r\n';
    filteredOrders.forEach((o) => {
      const garmentsList = o.items?.map((i) => `${i.quantity} ${i.garment_type}`).join('; ') || '';
      csv += `"${o.order_number}","${o.order_date}","${o.delivery_date}","${o.customer?.name || ''}","${o.customer?.phone || ''}","${garmentsList}","${o.status}",${o.net_amount},${o.paid_amount},${o.balance_amount}\r\n`;
    });

    const encodedUri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const fileName = `Swapneri_Orders_Report_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Printable Report Header (Visible only when printing) */}
      <div className="hidden print:block border-b-2 border-stone-800 pb-4 mb-4 text-stone-900">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{shop?.name || 'Swapneri Boutique & Designer Studio'}</h1>
            <p className="text-xs text-stone-600 mt-0.5">{shop?.address || 'Boutique & Ladies Tailors'}</p>
            <p className="text-xs text-stone-600">Phone: {shop?.phone || ''}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">Orders & Deliveries Report</span>
            <p className="font-bold text-sm text-stone-900 mt-0.5">{dateRange.label}</p>
            <p className="text-[11px] text-stone-500">
              {dateRange.start && dateRange.end ? `${dateRange.start} to ${dateRange.end}` : 'Complete records'}
            </p>
            <p className="text-[10px] text-stone-400 mt-1">
              Printed on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Printable Summary Matrix */}
        <div className="grid grid-cols-4 gap-3 pt-3 mt-3 border-t border-stone-200 text-center text-xs">
          <div className="p-2 bg-stone-50 rounded">
            <span className="text-[10px] text-stone-500 uppercase block">Total Orders</span>
            <span className="font-bold text-base text-stone-900">{filteredOrders.length}</span>
          </div>
          <div className="p-2 bg-stone-50 rounded">
            <span className="text-[10px] text-stone-500 uppercase block">Total Bill</span>
            <span className="font-bold text-base text-stone-900">{formatINR(totals.bill)}</span>
          </div>
          <div className="p-2 bg-stone-50 rounded">
            <span className="text-[10px] text-stone-500 uppercase block">Total Collected</span>
            <span className="font-bold text-base text-emerald-800">{formatINR(totals.paid)}</span>
          </div>
          <div className="p-2 bg-stone-50 rounded">
            <span className="text-[10px] text-stone-500 uppercase block">Balance Due</span>
            <span className="font-bold text-base text-rose-800">{formatINR(totals.balance)}</span>
          </div>
        </div>
      </div>

      {/* Screen Page Header (Hidden when printing) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900">Orders Report & PDF Export</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Download or print order registers, delivery schedules, and client balances by week, month, or custom period.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-stone-700 font-medium"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handlePrintPDF}
            className="font-medium gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Download PDF / Print</span>
          </Button>
        </div>
      </div>

      {/* Period Selection Tabs (Hidden when printing) */}
      <div className="no-print bg-white rounded-lg border border-stone-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Quick Period Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: 'last_week', label: 'Last Week' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'all', label: 'All Orders' },
              { id: 'custom', label: 'Custom Range' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPeriod(tab.id as PeriodType)}
                className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer ${
                  period === tab.id
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Date Type Selector */}
          <div className="flex items-center gap-1 text-xs text-stone-600">
            <span className="text-stone-400">Filter By:</span>
            <select
              value={dateField}
              onChange={(e) => setDateField(e.target.value as any)}
              className="h-8 px-2 bg-stone-50 border border-stone-200 rounded text-xs focus:outline-none"
            >
              <option value="order_date">Booking Date</option>
              <option value="delivery_date">Delivery Date</option>
            </select>
          </div>
        </div>

        {/* Custom Date Pickers */}
        {period === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-100">
            <div className="flex items-center gap-2">
              <label className="text-xs text-stone-600">From:</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="h-8 px-2 text-xs border border-stone-300 rounded focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-stone-600">To:</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="h-8 px-2 text-xs border border-stone-300 rounded focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-stone-100">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer, phone, or order #..."
              className="w-full h-8 pl-8 pr-3 text-xs border border-stone-300 rounded focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-2 text-xs bg-white border border-stone-300 rounded focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="unpaid">Pending Dues Only</option>
              <option value="in_progress">In Workshop (Active)</option>
              <option value="ready">Ready for Pickup</option>
              <option value="delivered">Delivered</option>
              <option value="stitching">Stitching</option>
              <option value="cutting">Cutting</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Metrics Cards (Screen View) */}
      <div className="no-print grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-lg border border-stone-200">
          <div className="text-xs font-medium text-stone-500">Orders in Period</div>
          <div className="text-2xl font-bold text-stone-900 mt-1">{filteredOrders.length}</div>
          <div className="text-[11px] text-stone-400 mt-1">{totals.garments} total garments</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-stone-200">
          <div className="text-xs font-medium text-stone-500">Total Order Value</div>
          <div className="text-2xl font-bold text-stone-900 mt-1 font-mono">{formatINR(totals.bill)}</div>
          <div className="text-[11px] text-stone-400 mt-1">Gross turnover</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-stone-200">
          <div className="text-xs font-medium text-stone-500">Advance / Collected</div>
          <div className="text-2xl font-bold text-emerald-800 mt-1 font-mono">{formatINR(totals.paid)}</div>
          <div className="text-[11px] text-stone-400 mt-1">Realized payment</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-stone-200">
          <div className="text-xs font-medium text-stone-500">Outstanding Balance</div>
          <div className="text-2xl font-bold text-rose-700 mt-1 font-mono">{formatINR(totals.balance)}</div>
          <div className="text-[11px] text-stone-400 mt-1">Pending client collection</div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-2xs">
        <div className="no-print p-4 border-b border-stone-100 flex items-center justify-between">
          <div className="text-xs font-semibold text-stone-800">
            Orders Register ({filteredOrders.length} records)
          </div>
          <div className="text-xs text-stone-500">
            {dateRange.label}: {dateRange.start ? dateRange.start : ''} {dateRange.end ? `to ${dateRange.end}` : ''}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold">
                <th className="py-2.5 px-3 w-8">#</th>
                <th className="py-2.5 px-3">Order No</th>
                <th className="py-2.5 px-3">Booking</th>
                <th className="py-2.5 px-3">Delivery</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Garments</th>
                <th className="py-2.5 px-3 text-right">Bill</th>
                <th className="py-2.5 px-3 text-right">Paid</th>
                <th className="py-2.5 px-3 text-right">Balance</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-xs text-stone-400">
                    No orders found for this period and filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o, idx) => (
                  <tr key={o.id} className="hover:bg-stone-50/70">
                    <td className="py-2.5 px-3 text-stone-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-stone-900">
                      <Link href={`/orders/${o.id}`} className="hover:text-[#881337] hover:underline">
                        {o.order_number}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 text-stone-600">
                      {new Date(o.order_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="py-2.5 px-3 text-stone-600 font-medium">
                      {new Date(o.delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-stone-900">{o.customer?.name}</div>
                      <div className="text-[11px] text-stone-500 font-mono">{o.customer?.phone}</div>
                    </td>
                    <td className="py-2.5 px-3 text-stone-700">
                      {o.items?.map((i) => `${i.quantity}x ${i.garment_type}`).join(', ') || 'Custom'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-stone-900">
                      {formatINR(o.net_amount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-800">
                      {formatINR(o.paid_amount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-700">
                      {formatINR(o.balance_amount)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge variant={o.status === 'delivered' ? 'emerald' : o.status === 'ready' ? 'blue' : 'stone'}>
                        {ORDER_STATUS_MAP[o.status]?.labelEn || o.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredOrders.length > 0 && (
              <tfoot>
                <tr className="bg-stone-50 font-bold border-t-2 border-stone-300 text-stone-900">
                  <td colSpan={6} className="py-2.5 px-3 text-right uppercase text-[11px] tracking-wider">
                    Total ({filteredOrders.length} orders):
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-sm">
                    {formatINR(totals.bill)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-sm text-emerald-800">
                    {formatINR(totals.paid)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-sm text-rose-700">
                    {formatINR(totals.balance)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
