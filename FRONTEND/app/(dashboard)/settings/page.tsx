'use client';

import React, { useState, useEffect } from 'react';
import { shopService } from '@/lib/services/shop.service';
import { Shop, Worker, GarmentType } from '@/lib/shared/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import {
  Settings,
  Building,
  Tag,
  Users,
  MessageSquare,
  Save,
  Plus,
  CheckCircle2,
  Scissors,
  Trash2,
  Database,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';

export default function SettingsPage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [activeSection, setActiveSection] = useState<'profile' | 'pricing' | 'workers' | 'templates' | 'database'>('profile');
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Settings successfully saved!');
  const [isSaving, setIsSaving] = useState(false);

  // Profile Form state
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [prefix, setPrefix] = useState('SW');

  // Garment Price List state
  const [garmentList, setGarmentList] = useState<GarmentType[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isSavingPrices, setIsSavingPrices] = useState(false);

  // Worker Modal
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [workerName, setWorkerName] = useState('');
  const [workerPhone, setWorkerPhone] = useState('');
  const [workerSpecialty, setWorkerSpecialty] = useState('stitching');

  const loadData = async () => {
    const s = await shopService.getShop();
    setShop(s);
    setShopName(s.name);
    setOwnerName(s.owner_name);
    setPhone(s.phone);
    setAddress(s.address || '');
    setPrefix(s.invoice_prefix || 'SW');

    const w = await shopService.getWorkers();
    setWorkers(w);

    const gTypes = await shopService.getGarmentTypes();
    setGarmentList(gTypes);
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await shopService.updateShop({
        name: shopName,
        owner_name: ownerName,
        phone,
        address,
        invoice_prefix: prefix,
      });
      showToast('Profile changes saved successfully!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddGarmentItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice) return;
    setIsAddingItem(true);
    try {
      await shopService.addGarmentType({
        name: newItemName.trim(),
        default_price: parseFloat(newItemPrice) || 0,
      });
      setNewItemName('');
      setNewItemPrice('');
      const updated = await shopService.getGarmentTypes();
      setGarmentList(updated);
      showToast('New garment item added to price list!');
    } finally {
      setIsAddingItem(false);
    }
  };

  const handlePriceChange = (code: string, newPrice: number) => {
    setGarmentList((prev) =>
      prev.map((g) => (g.code === code ? { ...g, default_price: newPrice } : g))
    );
  };

  const handleSavePrices = async () => {
    setIsSavingPrices(true);
    try {
      await shopService.updateGarmentPrices(
        garmentList.map((g) => ({ code: g.code, name: g.name, default_price: g.default_price }))
      );
      showToast('Garment price list saved successfully!');
    } finally {
      setIsSavingPrices(false);
    }
  };

  const handleDeleteItem = async (code: string) => {
    if (confirm('Are you sure you want to remove this item from the price list?')) {
      await shopService.deleteGarmentType(code);
      const updated = await shopService.getGarmentTypes();
      setGarmentList(updated);
      showToast('Item removed from price list.');
    }
  };

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    await shopService.saveWorker({
      name: workerName,
      phone: workerPhone,
      specialty: workerSpecialty,
    });
    setIsWorkerModalOpen(false);
    setWorkerName('');
    setWorkerPhone('');
    const updated = await shopService.getWorkers();
    setWorkers(updated);
    showToast('New worker added!');
  };

  const handleClearAllData = async () => {
    if (
      confirm(
        'Are you sure you want to clear all customers, orders, and payments to start completely fresh? This cannot be undone.'
      )
    ) {
      await shopService.clearAllData();
      showToast('All workshop records cleared! Started fresh.');
      setTimeout(() => {
        window.location.reload();
      }, 700);
    }
  };

  if (!shop) {
    return <div className="p-8 text-center text-stone-500">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
          Boutique Settings
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Configure shop profile, standard stitching rates, karigars, and WhatsApp templates
        </p>
      </div>

      {isSavedToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 overflow-x-auto pb-1">
        {[
          { key: 'profile', label: 'Shop Profile', icon: Building },
          { key: 'pricing', label: 'Garment Price List', icon: Tag },
          { key: 'workers', label: 'Karigars / Tailors', icon: Users },
          { key: 'templates', label: 'WhatsApp Templates', icon: MessageSquare },
          { key: 'database', label: 'Database & Data', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key as any)}
              className={`flex items-center gap-2 pb-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${isActive
                  ? 'border-[#881337] text-[#881337]'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
                }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Section 1: Shop Profile */}
      {activeSection === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-white rounded-xl border border-stone-200 p-6 shadow-2xs space-y-5">
          <h2 className="text-base font-semibold text-stone-900">Boutique Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Boutique / Shop Name *"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              required
            />

            <Input
              label="Owner / Proprietor Name *"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Primary Phone / WhatsApp *"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />

            <Input
              label="Order Prefix (e.g. SW, BT) *"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
              hint="Prefixed to consecutive bill numbers: e.g. SW-2601"
              required
            />
          </div>

          <Input
            label="Shop Address / Studio Location"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <div className="p-3 bg-stone-50 border border-stone-100 rounded-lg text-xs text-stone-600">
            <span>Currency: <strong>INR (₹) with Lakh formatting</strong> • Measurement Default: <strong>Inches</strong></span>
          </div>

          <div className="flex justify-end pt-3">
            <Button type="submit" variant="primary" isLoading={isSaving}>
              <Save className="w-4 h-4" />
              <span>Save Profile Changes</span>
            </Button>
          </div>
        </form>
      )}

      {/* Section 2: Standard Garment Price List */}
      {activeSection === 'pricing' && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-base font-semibold text-stone-900">Standard Stitching Price List</h2>
              <p className="text-xs text-stone-500">Auto-filled when creating customer garment orders</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSavePrices}
              isLoading={isSavingPrices}
            >
              <Save className="w-4 h-4" />
              <span>Save Rates</span>
            </Button>
          </div>

          {/* Option to Add Item and Price */}
          <form
            onSubmit={handleAddGarmentItem}
            className="p-3.5 bg-stone-50 border border-stone-200 rounded-lg flex flex-col sm:flex-row sm:items-end gap-2.5"
          >
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Item / Garment Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Lehenga, Gown, Anarkali, Designer Blouse..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full h-8 px-2.5 bg-white border border-stone-200 rounded-md text-xs font-medium text-stone-900 focus:outline-none focus:border-[#881337]"
                required
              />
            </div>

            <div className="w-full sm:w-36">
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Price (₹) *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-2.5 text-xs text-stone-400 font-mono">₹</span>
                <input
                  type="number"
                  step="any"
                  placeholder="0"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  className="w-full h-8 pl-6 pr-2.5 bg-white border border-stone-200 rounded-md text-xs font-mono font-bold text-stone-900 focus:outline-none focus:border-[#881337]"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="secondary"
              size="sm"
              className="h-8 text-xs shrink-0"
              isLoading={isAddingItem}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item & Price</span>
            </Button>
          </form>

          {/* Garment Price List Items */}
          <div className="divide-y divide-stone-100">
            {garmentList.map((g) => (
              <div key={g.code} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <span className="font-semibold text-sm text-stone-900 block capitalize">
                    {g.name}
                  </span>
                  <span className="text-[11px] text-stone-400">
                    {g.is_system ? 'Standard item' : 'Custom item'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-stone-500 font-mono text-xs">₹</span>
                    <input
                      type="number"
                      step="any"
                      value={g.default_price}
                      onChange={(e) =>
                        handlePriceChange(g.code, parseFloat(e.target.value) || 0)
                      }
                      className="w-24 h-8 px-2 bg-stone-50 border border-stone-200 rounded-md text-xs font-mono font-bold text-stone-900 text-right focus:bg-white focus:border-[#881337] focus:outline-none"
                    />
                  </div>

                  {!g.is_system && (
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(g.code)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors rounded hover:bg-rose-50 cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 3: Karigars / Tailors */}
      {activeSection === 'workers' && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-stone-900">Master Tailors & Karigars</h2>
              <p className="text-xs text-stone-500">Assign garments to specific workshop staff</p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setIsWorkerModalOpen(true)}>
              <Plus className="w-3.5 h-3.5" />
              <span>Add Worker</span>
            </Button>
          </div>

          <div className="divide-y divide-stone-100">
            {workers.map((w) => (
              <div key={w.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-sm text-stone-900 block">{w.name}</span>
                  <span className="text-xs text-stone-500 block">{w.specialty}</span>
                </div>
                {w.phone && <span className="font-mono text-xs text-stone-600">{w.phone}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 4: WhatsApp Message Templates */}
      {activeSection === 'templates' && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-2xs space-y-5">
          <div>
            <h2 className="text-base font-semibold text-stone-900">WhatsApp Message Templates</h2>
            <p className="text-xs text-stone-500">
              Formatted messages prefilled when clicking WhatsApp button for clients
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-stone-50 rounded-lg border border-stone-100 space-y-1.5">
              <span className="text-xs font-bold text-stone-900 uppercase">1. Order Confirmation & Receipt</span>
              <p className="text-xs text-stone-600">
                ✨ *Swapneri Boutique* ✨ Namaste {'{customer_name}'} ji, Thank you for choosing us! Your order {'{order_number}'} has been booked. Total: ₹{'{total_amount}'}, Advance: ₹{'{paid_amount}'}, Balance: ₹{'{balance_amount}'}. Delivery: {'{delivery_date}'}.
              </p>
            </div>

            <div className="p-4 bg-stone-50 rounded-lg border border-stone-100 space-y-1.5">
              <span className="text-xs font-bold text-stone-900 uppercase">2. Order Ready for Pickup Alert</span>
              <p className="text-xs text-stone-600">
                🎉 *Your Order is Ready for Pickup!* 🎉 Namaste {'{customer_name}'} ji, Delighted to share that order #{'{order_number}'} has been completed and packed. Balance Payable: ₹{'{balance_amount}'}.
              </p>
            </div>

            <div className="p-4 bg-stone-50 rounded-lg border border-stone-100 space-y-1.5">
              <span className="text-xs font-bold text-stone-900 uppercase">3. Payment Receipt & Settlement</span>
              <p className="text-xs text-stone-600">
                🧾 *Payment Receipt - Swapneri Boutique* 🧾 Namaste {'{customer_name}'} ji, We have received your payment of ₹{'{amount}'} for order #{'{order_number}'}. Remaining Balance: ₹{'{balance_amount}'}. Thank you!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section 5: Database & Data Management */}
      {activeSection === 'database' && (
        <div className="space-y-6">
          {/* Supabase Connection Status */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-stone-900">Database Connection Status</h2>
                <p className="text-xs text-stone-500">Live Supabase cloud database vs Dynamic local workshop</p>
              </div>
              <div className="flex items-center gap-2">
                {process.env.NEXT_PUBLIC_SUPABASE_URL &&
                  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co') ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Supabase Connected</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    <Database className="w-4 h-4 text-amber-600" />
                    <span>Dynamic Local Database</span>
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg text-xs space-y-2 text-stone-600">
              <p className="font-semibold text-stone-800">Ready for Supabase Backend:</p>
              <p>
                1. A complete turn-key database setup script is prepared in{' '}
                <code className="bg-white px-1.5 py-0.5 rounded border border-stone-200 font-mono text-[#881337]">
                  supabase/complete_setup.sql
                </code>
                .
              </p>
              <p>
                2. Run the SQL script in your Supabase project&apos;s SQL Editor. It sets up all tables, sequential order numbering, financial recalculations, and multi-tenant security.
              </p>
              <p>
                3. Add your Supabase Project URL and Anon Key in{' '}
                <code className="bg-white px-1.5 py-0.5 rounded border border-stone-200 font-mono">.env.local</code>.
              </p>
            </div>
          </div>

          {/* Reset / Clear Data */}
          <div className="bg-white rounded-xl border border-rose-200 p-6 shadow-2xs space-y-4">
            <div>
              <h2 className="text-base font-semibold text-rose-950 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Reset & Clear Workshop Data</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Permanently wipes all customer records, fitting slips, orders, and payment histories so you can start completely clean.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-stone-600">
                Your boutique profile and price list will be preserved.
              </span>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleClearAllData}
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All Data & Start Fresh</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Worker Modal */}
      <Modal
        isOpen={isWorkerModalOpen}
        onClose={() => setIsWorkerModalOpen(false)}
        title="Add Karigar / Tailor"
        description="Register a workshop tailor to assign garment orders"
      >
        <form onSubmit={handleAddWorker} className="space-y-4">
          <Input
            label="Worker Full Name *"
            placeholder="e.g. Salim Bhai"
            value={workerName}
            onChange={(e) => setWorkerName(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Phone Number (Optional)"
            placeholder="e.g. 9890044556"
            value={workerPhone}
            onChange={(e) => setWorkerPhone(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
              Specialty / Role
            </label>
            <select
              value={workerSpecialty}
              onChange={(e) => setWorkerSpecialty(e.target.value)}
              className="w-full h-11 px-3 bg-white text-stone-900 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#881337]"
            >
              <option value="Master Pattern Cutter">Master Pattern Cutter</option>
              <option value="Designer Blouse Karigar">Designer Blouse Karigar</option>
              <option value="Kurti & Salwar Tailor">Kurti & Salwar Tailor</option>
              <option value="Lehenga Specialist">Lehenga Specialist</option>
              <option value="Handwork & Maggam Specialist">Handwork & Maggam Specialist</option>
              <option value="Finishing & Hemming">Finishing & Hemming</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
            <Button type="button" variant="secondary" onClick={() => setIsWorkerModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add Worker
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
