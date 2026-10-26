'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Order = { id: string; order_number: string; status: string; total_amount: number; created_at: string };
type Stats = { products: number; activeProducts: number; lowStock: number; orders: number; customers: number; paidSales: number; recentOrders: Order[] };
const EMPTY: Stats = { products: 0, activeProducts: 0, lowStock: 0, orders: 0, customers: 0, paidSales: 0, recentOrders: [] };
const money = (amount: number) => new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount);

function StatCard({ title, value, hint, icon }: { title: string; value: string | number; hint: string; icon: string }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-500">{title}</p><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-lg text-blue-900">{icon}</span></div>
    <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-500">{hint}</p>
  </section>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const db = createClient();
      const { data: { user }, error: authError } = await db.auth.getUser();
      if (authError || !user) { window.location.assign('/login'); return; }
      const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
      if ((profile as { role?: string } | null)?.role !== 'admin') { window.location.assign('/'); return; }

      const [productsRes, ordersRes, customersRes, recentRes, paymentsRes] = await Promise.all([
        db.from('products').select('id,status,inventory(quantity,reserved_quantity)').eq('owner_type', 'admin'),
        db.from('orders').select('id', { count: 'exact', head: true }),
        db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
        db.from('orders').select('id,order_number,status,total_amount,created_at').order('created_at', { ascending: false }).limit(8),
        db.from('payments').select('amount,status').eq('status', 'paid'),
      ]);
      const queryError = productsRes.error || ordersRes.error || customersRes.error || recentRes.error || paymentsRes.error;
      if (queryError) throw new Error('Could not load dashboard data. Check database permissions and try again.');
      const products = (productsRes.data ?? []) as Array<{ id: string; status: string; inventory: Array<{ quantity: number | null; reserved_quantity: number | null }> | null }>;
      const payments = (paymentsRes.data ?? []) as Array<{ amount: number | null; status: string }>;
      setStats({
        products: products.length,
        activeProducts: products.filter(p => p.status === 'active').length,
        lowStock: products.filter(p => { const i = p.inventory?.[0]; return Number(i?.quantity ?? 0) - Number(i?.reserved_quantity ?? 0) <= 5; }).length,
        orders: ordersRes.count ?? 0,
        customers: customersRes.count ?? 0,
        paidSales: payments.reduce((sum, p) => sum + Number(p.amount ?? 0), 0),
        recentOrders: (recentRes.data ?? []) as Order[],
      });
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load dashboard.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return <main className="min-h-screen bg-slate-50 p-4 sm:p-7 lg:p-9">
    <div className="mx-auto max-w-7xl space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-800">Perfect Store · Admin</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Overview</h1><p className="mt-2 max-w-2xl text-sm text-slate-500">Manage your product catalogue, inventory, customer orders and store performance from one place.</p></div>
        <div className="flex flex-wrap gap-3"><Link href="/admin/products/new" className="rounded-xl bg-[#0f2b5b] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-950">＋ Add product</Link><Link href="/admin/orders" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">View orders</Link></div>
      </header>

      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}<button onClick={() => void load()} className="font-semibold underline">Try again</button></div>}

      {loading ? <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading store overview…</div> : <>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard title="Total products" value={stats.products} hint="Products in your catalogue" icon="▦" />
          <StatCard title="Published products" value={stats.activeProducts} hint="Visible to customers" icon="✓" />
          <StatCard title="Low stock" value={stats.lowStock} hint="Five units or fewer available" icon="!" />
          <StatCard title="Customer orders" value={stats.orders} hint="All recorded orders" icon="▤" />
          <StatCard title="Customers" value={stats.customers} hint="Registered customer accounts" icon="♙" />
          <StatCard title="Paid sales" value={money(stats.paidSales)} hint="Payments marked as paid" icon="₵" />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.5fr_0.8fr]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5"><div><h2 className="text-lg font-bold text-slate-950">Recent orders</h2><p className="mt-1 text-sm text-slate-500">Latest activity from your customers.</p></div><Link href="/admin/orders" className="text-sm font-semibold text-blue-800 hover:underline">All orders →</Link></div>
            {stats.recentOrders.length === 0 ? <div className="p-10 text-center"><p className="font-semibold text-slate-800">No orders yet</p><p className="mt-1 text-sm text-slate-500">Orders will appear here when customers place them.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[540px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Order</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Total</th></tr></thead><tbody className="divide-y divide-slate-100">{stats.recentOrders.map(order => <tr key={order.id} className="hover:bg-slate-50"><td className="px-5 py-4 font-semibold text-slate-900">{order.order_number}</td><td className="px-5 py-4 text-slate-500">{new Date(order.created_at).toLocaleDateString()}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">{order.status.replaceAll('_', ' ')}</span></td><td className="px-5 py-4 text-right font-semibold text-slate-900">{money(Number(order.total_amount))}</td></tr>)}</tbody></table></div>}
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#0f2b5b] p-6 text-white shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-200">Quick action</p><h2 className="mt-3 text-2xl font-bold">Add a new product</h2><p className="mt-2 text-sm leading-6 text-blue-100">Upload product images, set pricing and stock, choose a category and control the display rating.</p><Link href="/admin/products/new" className="mt-5 inline-flex rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#0f2b5b] hover:bg-blue-50">Create product →</Link></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-950">Catalogue shortcuts</h2><div className="mt-4 space-y-2"><Link href="/admin/products" className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><span>Manage products</span><span>→</span></Link><Link href="/admin/categories" className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><span>Manage categories</span><span>→</span></Link><Link href="/admin/logistics" className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><span>Delivery settings</span><span>→</span></Link></div></div>
          </div>
        </section>
      </>}
    </div>
  </main>;
}
