import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/providers/query-provider';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Swapneri | Boutique & Ladies Tailor Management System',
  description:
    'Calm, easy-to-use bespoke tailoring system for women’s boutiques: blouse, top, bottom measurements, orders, payments, and WhatsApp receipts.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} h-full`}>
      <body className="min-h-full font-sans antialiased bg-stone-50 text-stone-900 selection:bg-rose-100 selection:text-rose-950">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
