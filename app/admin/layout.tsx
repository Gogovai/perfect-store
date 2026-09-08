'use client';

import Link from 'next/link';
import { useState } from 'react';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/sellers', label: 'Sellers' },
  { href: '/admin/returns', label: 'Returns' },
  { href: '/admin/reviews', label: 'Reviews' },
  { href: '/admin/support', label: 'Support' },
  { href: '/admin/campaigns', label: 'Campaigns' },
  { href: '/admin/coupons', label: 'Coupons' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/payouts', label: 'Payouts' },
  { href: '/admin/logistics', label: 'Logistics' },
  { href: '/admin/advertising', label: 'Advertising' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile hamburger button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-[#0f2b5b] p-2 text-white shadow-lg lg:hidden"
        aria-label="Toggle menu"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {sidebarOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-56 shrink-0 border-r border-gray-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Administration
          </p>
        </div>
        <nav className="space-y-1 px-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-[#0f2b5b]"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/"
            className="mt-4 block rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-100"
          >
            &larr; Back to Store
          </Link>
        </nav>
      </aside>

      <main className="flex-1 pt-14 lg:pt-0">{children}</main>
    </div>
  );
}
