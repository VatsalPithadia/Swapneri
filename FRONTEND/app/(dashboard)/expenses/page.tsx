'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ExpensesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/reports');
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-stone-500">
      Redirecting to Reports & PDF Export...
    </div>
  );
}
