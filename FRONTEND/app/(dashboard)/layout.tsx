import React, { Suspense } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { TopHeader } from '@/components/layout/top-header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-stone-50">
      {/* Desktop Left Sidebar */}
      <Suspense fallback={<aside className="w-64 bg-white border-r border-stone-200 hidden md:block" />}>
        <Sidebar />
      </Suspense>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopHeader />
        
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto">
            <Suspense fallback={<div className="p-8 text-center text-stone-500">Loading...</div>}>
              {children}
            </Suspense>
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <Suspense fallback={null}>
          <MobileNav />
        </Suspense>
      </div>
    </div>
  );
}
