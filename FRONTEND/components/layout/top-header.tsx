'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Store } from 'lucide-react';
import { shopService } from '@/lib/services/shop.service';
import { Shop } from '@/lib/shared/types/database';

export function TopHeader() {
  const [currentDate, setCurrentDate] = useState('');
  const [shop, setShop] = useState<Shop | null>(null);

  const loadShop = async () => {
    try {
      const s = await shopService.getShop();
      setShop(s);
    } catch {
      // keep default
    }
  };

  useEffect(() => {
    setCurrentDate(
      new Date().toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    );

    loadShop();

    const handleShopUpdate = (e: any) => {
      if (e?.detail) {
        setShop(e.detail);
      } else {
        loadShop();
      }
    };

    window.addEventListener('shop-updated', handleShopUpdate);
    return () => window.removeEventListener('shop-updated', handleShopUpdate);
  }, []);

  return (
    <header className="no-print h-14 bg-white border-b border-stone-200 px-4 sm:px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-stone-900 md:hidden">
          <Store className="w-4 h-4 text-[#881337]" />
          <span className="truncate max-w-[180px]">{shop?.name || 'Swapneri Boutique'}</span>
        </div>
        {currentDate && (
          <span className="text-xs text-stone-500 hidden sm:inline-block">
            {currentDate}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="flex items-center gap-2 text-xs font-medium text-stone-700 hover:text-stone-900 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="hidden sm:inline-block font-semibold">
            {shop?.owner_name || shop?.name || 'Settings'}
          </span>
        </Link>
      </div>
    </header>
  );
}
