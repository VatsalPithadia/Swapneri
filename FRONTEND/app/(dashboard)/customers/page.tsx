'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { customersService } from '@/lib/services/customers.service';
import { ordersService } from '@/lib/services/orders.service';
import { Customer } from '@/lib/shared/types/database';
import { formatINR } from '@/lib/shared/calculations/currency';
import { buildWhatsAppLink } from '@/lib/shared/constants/whatsapp-templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  MessageSquare,
  Ruler,
  ChevronRight,
  Trash2,
  AlertCircle,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // New Customer Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete Confirmation Modal
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await customersService.getAll();
      setCustomers(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSaving(true);
    try {
      await customersService.create(formData);
      setIsModalOpen(false);
      setFormData({
        name: '',
        phone: '',
        address: '',
        notes: '',
      });
      await loadCustomers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create customer');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    try {
      await customersService.delete(customerToDelete.id);
      setCustomerToDelete(null);
      await loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete customer');
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.address && c.address.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Customer Directory
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            {customers.length} registered clients • Profiles, measurements & balance history
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <UserPlus className="w-4 h-4" />
          <span>Add New Customer</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs">
        <div className="relative max-w-md">
          <Input
            placeholder="Search by client name, mobile or area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftAddon={<Search className="w-4 h-4 text-stone-400" />}
          />
        </div>
      </div>

      {/* Customer List (Desktop Table + Mobile Cards) */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center shadow-2xs">
          <Users className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-800">
            {search ? 'No matching clients found' : 'No customers yet'}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
            {search
              ? `No customer matches "${search}". Try searching with a different name or number.`
              : 'Add your first boutique customer to start recording body measurements and orders.'}
          </p>
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
            <UserPlus className="w-4 h-4" />
            <span>Add Customer</span>
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-600 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Client Name</th>
                  <th className="px-6 py-3.5">Phone</th>
                  <th className="px-6 py-3.5">Address</th>
                  <th className="px-6 py-3.5">Notes</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredCustomers.map((cust) => {
                  const waLink = buildWhatsAppLink(
                    cust.phone,
                    `Namaste ${cust.name} ji! Greetings from Swapneri Boutique.`
                  );

                  return (
                    <tr key={cust.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <Link
                          href={`/customers/${cust.id}`}
                          className="font-medium text-stone-900 hover:text-[#881337] transition-colors flex items-center gap-1.5"
                        >
                          <span>{cust.name}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                        </Link>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-stone-700">{cust.phone}</span>
                          <a
                            href={`tel:${cust.phone}`}
                            className="text-stone-400 hover:text-stone-700"
                            title="Call customer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700"
                            title="Message on WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs text-stone-600 max-w-xs truncate">
                        {cust.address || '—'}
                      </td>

                      <td className="px-6 py-4 text-xs text-stone-500 max-w-xs truncate">
                        {cust.notes || '—'}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/customers/${cust.id}/measurements`}>
                            <Button variant="secondary" size="sm" className="h-8 text-xs">
                              <Ruler className="w-3.5 h-3.5" />
                              <span>Measurements</span>
                            </Button>
                          </Link>

                          <Link href={`/orders/new?customerId=${cust.id}`}>
                            <Button variant="outline" size="sm" className="h-8 text-xs">
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>Order</span>
                            </Button>
                          </Link>

                          <button
                            onClick={() => setCustomerToDelete(cust)}
                            className="p-1.5 text-stone-400 hover:text-red-600 transition-colors rounded-md cursor-pointer"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-stone-100">
            {filteredCustomers.map((cust) => {
              const waLink = buildWhatsAppLink(
                cust.phone,
                `Namaste ${cust.name} ji! Greetings from Swapneri Boutique.`
              );

              return (
                <div key={cust.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        href={`/customers/${cust.id}`}
                        className="font-semibold text-base text-stone-900 flex items-center gap-1"
                      >
                        <span>{cust.name}</span>
                        <ChevronRight className="w-4 h-4 text-stone-400" />
                      </Link>
                      <p className="font-mono text-xs text-stone-500 mt-0.5">{cust.phone}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${cust.phone}`}
                        className="w-9 h-9 rounded-lg border border-stone-200 flex items-center justify-center text-stone-700"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {cust.address && (
                    <p className="text-xs text-stone-500 line-clamp-1">{cust.address}</p>
                  )}

                  <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
                    <Link href={`/customers/${cust.id}`} className="flex-1">
                      <Button variant="secondary" size="sm" className="w-full text-xs">
                        View Profile
                      </Button>
                    </Link>
                    <Link href={`/orders/new?customerId=${cust.id}`} className="flex-1">
                      <Button variant="primary" size="sm" className="w-full text-xs">
                        New Order
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Customer"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-3">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Name *</label>
            <input
              type="text"
              placeholder="e.g. Pooja Sharma"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              autoFocus
              className="w-full h-9 px-3 bg-white text-stone-900 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#881337]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Mobile *</label>
            <input
              type="tel"
              maxLength={10}
              placeholder="10-digit number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
              required
              className="w-full h-9 px-3 bg-white text-stone-900 border border-stone-200 rounded-lg text-sm font-mono focus:outline-none focus:border-[#881337]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Address</label>
            <input
              type="text"
              placeholder="Area / Location"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full h-9 px-3 bg-white text-stone-900 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#881337]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Notes</label>
            <textarea
              rows={2}
              placeholder="Fitting preferences / notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-2.5 bg-white text-stone-900 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-[#881337]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              Save Customer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(customerToDelete)}
        onClose={() => setCustomerToDelete(null)}
        title="Remove Customer Profile"
        description="Are you sure you want to remove this customer record?"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-stone-600">
            Customer <strong>{customerToDelete?.name}</strong> ({customerToDelete?.phone}) will be soft deleted. You can restore records anytime.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setCustomerToDelete(null)}>
              Keep Customer
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
