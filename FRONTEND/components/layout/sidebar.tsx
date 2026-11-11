'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { shopService } from '@/lib/services/shop.service';
import { Shop } from '@/lib/shared/types/database';
import { supabase } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Ruler,
  CreditCard,
  FileText,
  Settings,
  PlusCircle,
  Scissors,
  LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/measurements', label: 'Measurements', icon: Ruler },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/reports', label: 'Reports & PDF', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    router.push('/login');
  };

  return (
    <aside className="no-print hidden md:flex flex-col w-64 bg-white border-r border-stone-200 shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-18 flex items-center px-5 border-b border-stone-100 gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#881337] flex items-center justify-center text-white shrink-0 shadow-2xs">
          <Scissors className="w-5 h-5 rotate-45" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-base text-stone-900 tracking-tight leading-tight truncate">
            {shop?.name || 'Swapneri Boutique'}
          </h1>
          <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider mt-0.5 truncate">
            {shop?.owner_name ? `Prop: ${shop.owner_name}` : 'Ladies Tailor Studio'}
          </p>
        </div>
      </div>

      {/* Quick Action */}
      <div className="p-3 border-b border-stone-100">
        <Link
          href="/orders/new"
          className="flex items-center justify-center gap-2 w-full h-10 bg-[#881337] hover:bg-[#701a2e] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Order</span>
        </Link>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                isActive
                  ? 'bg-rose-50 text-[#881337] font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-[#881337]' : 'text-stone-400')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User / Shop Footer & Logout */}
      <div className="p-3 border-t border-stone-100 flex items-center justify-between text-xs bg-stone-50/50">
        <div className="min-w-0 pr-2">
          <div className="font-semibold text-stone-800 text-xs truncate">
            {shop?.owner_name || 'Boutique User'}
          </div>
          <div className="text-[11px] text-stone-500 font-mono truncate">
            {shop?.phone || ''}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer shrink-0"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
