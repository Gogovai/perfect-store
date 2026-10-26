'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV = [
  { href: '/admin/dashboard', label: 'Overview', icon: '▦' },
  { href: '/admin/products', label: 'Products', icon: '□' },
  { href: '/admin/categories', label: 'Categories', icon: '▤' },
  { href: '/admin/orders', label: 'Orders', icon: '↗' },
  { href: '/admin/returns', label: 'Returns', icon: '↩' },
  { href: '/admin/reviews', label: 'Reviews', icon: '☆' },
  { href: '/admin/support', label: 'Customer support', icon: '○' },
  { href: '/admin/logistics', label: 'Delivery settings', icon: '⌁' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return <div className="min-h-screen bg-slate-50 lg:flex">
    {sidebarOpen && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-[#0b1f42] text-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="border-b border-white/10 px-6 py-6"><Link href="/admin/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg font-black text-[#0f2b5b]">P</span><span><span className="block text-base font-bold tracking-tight">Perfect Store</span><span className="mt-0.5 block text-xs text-blue-200">Administration</span></span></Link></div>
      <div className="px-4 pt-6"><p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">Workspace</p><nav className="mt-3 space-y-1" aria-label="Admin navigation">{NAV.map(item => { const active = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href + '/')); return <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} aria-current={active ? 'page' : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? 'bg-white text-[#0b1f42] shadow-sm' : 'text-blue-100 hover:bg-white/10 hover:text-white'}`}><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-base">{item.icon}</span>{item.label}{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-700" />}</Link>; })}</nav></div>
      <div className="mt-auto border-t border-white/10 p-4"><Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-blue-100 hover:bg-white/10 hover:text-white"><span>←</span> View storefront</Link><div className="mt-3 rounded-xl bg-white/5 p-3"><p className="text-xs font-semibold text-white">Admin workspace</p><p className="mt-1 text-[11px] leading-5 text-blue-200">Manage products, customers and store operations.</p></div></div>
    </aside>
    <div className="min-w-0 flex-1">
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7"><button onClick={() => setSidebarOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden" aria-label="Open navigation"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button><div className="hidden text-sm text-slate-500 sm:block">Store management <span className="mx-2 text-slate-300">/</span><span className="font-semibold capitalize text-slate-800">{pathname.split('/').filter(Boolean).slice(1).join(' / ').replaceAll('-', ' ') || 'overview'}</span></div><div className="ml-auto flex items-center gap-3"><span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 sm:inline-flex">Admin access</span><Link href="/" className="text-sm font-semibold text-blue-900 hover:underline">Storefront ↗</Link></div></div>
      <main className="min-w-0">{children}</main>
    </div>
  </div>;
}
