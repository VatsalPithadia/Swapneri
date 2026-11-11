'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { LayoutDashboard, ShoppingBag, Plus, Users, Menu } from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Home', icon: LayoutDashboard },
    { href: '/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/orders/new', label: 'Create', icon: Plus, isAction: true },
    { href: '/customers', label: 'Clients', icon: Users },
    { href: '/settings', label: 'More', icon: Menu },
  ];

  return (
    <nav className="no-print md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-stone-200 z-40 flex items-center justify-around px-2 shadow-lg safe-area-pb">
      {links.map((link) => {
        const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
        const Icon = link.icon;

        if (link.isAction) {
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center justify-center -mt-5"
              aria-label="New Order"
            >
              <div className="w-12 h-12 rounded-full bg-[#881337] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-medium text-stone-600 mt-0.5">New</span>
            </Link>
          );
        }

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition-colors',
              isActive ? 'text-[#881337] font-semibold' : 'text-stone-500 hover:text-stone-900'
            )}
          >
            <Icon className={cn('w-5 h-5 mb-0.5', isActive ? 'text-[#881337]' : 'text-stone-400')} />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
