'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { customersService } from '@/lib/services/customers.service';
import { measurementsService } from '@/lib/services/measurements.service';
import { Customer } from '@/lib/shared/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Ruler, Search, ChevronRight, User, Phone } from 'lucide-react';

interface CustomerMeasurementItem {
  customer: Customer;
  garments: Set<string>;
}

export default function GeneralMeasurementsPage() {
  const [items, setItems] = useState<CustomerMeasurementItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGarment, setSelectedGarment] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const custs = await customersService.getAll();
        const map = new Map<string, CustomerMeasurementItem>();

        for (const c of custs) {
          const profs = await measurementsService.getByCustomerId(c.id);
          if (profs.length > 0) {
            const garments = new Set<string>();
            profs.forEach((p) => {
              if (p.garment_type === 'top' || p.garment_type === 'kurti') garments.add('top');
              else if (p.garment_type === 'bottom' || p.garment_type === 'salwar') garments.add('bottom');
              else if (p.garment_type === 'blouse') garments.add('blouse');
              else garments.add(p.garment_type);
            });
            map.set(c.id, { customer: c, garments });
          }
        }
        setItems(Array.from(map.values()));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch =
      item.customer.name.toLowerCase().includes(q) ||
      item.customer.phone.includes(q);
    const matchGarment =
      selectedGarment === 'all' || item.garments.has(selectedGarment);
    return matchSearch && matchGarment;
  });

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            Measurements Book
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Select a client to view and edit their full fitting slip
          </p>
        </div>

        <Link href="/customers">
          <Button variant="primary" size="sm">
            <User className="w-4 h-4" />
            <span>Select Customer to Measure</span>
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-lg border border-stone-200 p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search by client name or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftAddon={<Search className="w-4 h-4 text-stone-400" />}
          />
        </div>

        {/* Garment type pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Garments' },
            { id: 'top', label: 'Top' },
            { id: 'bottom', label: 'Bottom' },
            { id: 'blouse', label: 'Blouse' },
          ].map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGarment(g.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                selectedGarment === g.id
                  ? 'bg-[#881337] text-white font-semibold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Measurement Customers Grid: ONLY Name & Number on each card */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-16 bg-white border border-stone-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-stone-200 p-8 text-center shadow-2xs">
          <Ruler className="w-10 h-10 text-stone-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-stone-800">No measurement records found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-3">
            Select a customer from your directory to record their first custom fitting profile.
          </p>
          <Link href="/customers">
            <Button variant="secondary" size="sm">
              Go to Customer Directory
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((item) => (
            <Link
              key={item.customer.id}
              href={`/customers/${item.customer.id}`}
              className="bg-white hover:bg-stone-50/80 rounded-lg border border-stone-200 hover:border-[#881337]/50 p-3 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-[#881337] font-bold text-sm shrink-0 group-hover:bg-[#881337] group-hover:text-white transition-colors">
                  {item.customer.name.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-stone-900 group-hover:text-[#881337] transition-colors truncate">
                    {item.customer.name}
                  </h3>
                  <p className="font-mono text-xs text-stone-500 mt-0.5 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                    <span>{item.customer.phone}</span>
                  </p>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#881337] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
