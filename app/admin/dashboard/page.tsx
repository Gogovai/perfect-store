'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

type DashboardStats = {
  totalCustomers: number;
  activeSellers: number;
  pendingSellers: number;
  activeProducts: number;
  pendingProducts: number;
  outOfStockProducts: number;
  totalOrders: number;
  pendingPayments: number;
  successfulPayments: number;
  grossSales: number;
  platformCommission: number;
  sellerEarnings: number;
  refunds: number;
  advertisingRevenue: number;
  activeCampaigns: number;
};

type RecentOrder = {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  customer_email?: string;
};

type PendingSeller = {
  id: string;
  store_name: string;
  email: string | null;
  status: string;
  created_at: string;
  owner_id: string;
};

type PendingProduct = {
  id: string;
  name: string;
  slug: string;
  status: string;
  base_price: number;
  created_at: string;
  sellers: { store_name: string; status: string } | null;
  categories: { name: string } | null;
  product_images: Array<{ url: string; is_primary: boolean }> | null;
};

type PendingAd = {
  id: string;
  name: string;
  placement: string;
  budget: number;
  bid_amount: number;
  status: string;
  created_at: string;
  sellers: { store_name: string } | null;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingSellers, setPendingSellers] = useState<PendingSeller[]>([]);
  const [pendingProducts, setPendingProducts] = useState<PendingProduct[]>([]);
  const [pendingAds, setPendingAds] = useState<PendingAd[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const s = createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) { location.href = '/login'; return; }
    const { data: p } = await s.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if ((p as { role?: string } | null)?.role !== 'admin') { location.href = '/'; return; }

    const [
      customersResult,
      sellersResult,
      productsResult,
      ordersResult,
      paymentsResult,
      ledgerResult,
      adsResult,
      campaignsResult,
    ] = await Promise.all([
      s.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
      s.from('sellers').select('id,status'),
      s.from('products').select('id,status,inventory(quantity,reserved_quantity)'),
      s.from('orders').select('id,order_number,status,total_amount,created_at'),
      s.from('payments').select('id,status,amount'),
      s.from('seller_ledger_entries').select('entry_type,amount'),
      s.from('advertisements').select('id,name,placement,budget,bid_amount,status,created_at,sellers(store_name)').order('created_at', { ascending: false }),
      s.from('campaigns').select('id,status'),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allSellers = (sellersResult.data || []) as any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allProducts = (productsResult.data || []) as any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allOrders = (ordersResult.data || []) as any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allPayments = (paymentsResult.data || []) as any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allLedger = (ledgerResult.data || []) as any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allAds = (adsResult.data || []) as any[];

    const activeSellers = allSellers.filter(s => s.status === 'active').length;
    const pendingSellersList = allSellers.filter(s => s.status === 'pending');
    const activeProducts = allProducts.filter(p => p.status === 'active').length;
    const pendingProductsList = allProducts.filter(p => p.status === 'pending_review');
    const outOfStockProducts = allProducts.filter(p => {
      const inv = p.inventory?.[0];
      const available = (inv?.quantity ?? 0) - (inv?.reserved_quantity ?? 0);
      return p.status === 'active' && available <= 0;
    }).length;

    const pendingPayments = allPayments.filter(p => p.status === 'pending' || p.status === 'processing').length;
    const successfulPayments = allPayments.filter(p => p.status === 'paid');
    const grossSales = successfulPayments.reduce((s, p) => s + Number(p.amount), 0);

    const totalCommission = allLedger.filter(e => e.entry_type === 'commission').reduce((s, e) => s + Math.abs(Number(e.amount)), 0);
    const totalRefunds = allLedger.filter(e => e.entry_type === 'refund').reduce((s, e) => s + Math.abs(Number(e.amount)), 0);
    const totalEarnings = allLedger.filter(e => e.entry_type === 'sale').reduce((s, e) => s + Number(e.amount), 0) - totalCommission;

    const activeAds = allAds.filter(a => a.status === 'active');
    const adRevenue = activeAds.reduce((s, a) => s + Number(a.budget), 0);

    setStats({
      totalCustomers: customersResult.count || 0,
      activeSellers,
      pendingSellers: pendingSellersList.length,
      activeProducts,
      pendingProducts: pendingProductsList.length,
      outOfStockProducts,
      totalOrders: allOrders.length,
      pendingPayments,
      successfulPayments: successfulPayments.length,
      grossSales,
      platformCommission: totalCommission,
      sellerEarnings: totalEarnings,
      refunds: totalRefunds,
      advertisingRevenue: adRevenue,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      activeCampaigns: (campaignsResult.data as any[])?.filter((c: any) => c.status === 'active').length || 0,
    });

    setPendingSellers(pendingSellersList as PendingSeller[]);

    // Fetch pending products with relations
    const { data: pendingProdData } = await s
      .from('products')
      .select('id,name,slug,status,base_price,created_at,sellers(store_name,status),categories(name),product_images(url,is_primary)')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false })
      .limit(20);
    setPendingProducts((pendingProdData || []) as unknown as PendingProduct[]);

    setPendingAds(allAds.filter(a => a.status === 'pending') as PendingAd[]);

    const recentOrdersList = allOrders
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20) as RecentOrder[];
    setRecentOrders(recentOrdersList);

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function notify(kind: 'ok' | 'err', text: string) {
    setToast({ kind, text });
    window.setTimeout(() => setToast(null), 5000);
  }

  async function handleSellerAction(sellerId: string, action: 'active' | 'rejected', reason?: string) {
    setBusyIds(prev => new Set(prev).add(`seller:${sellerId}`));
    try {
      const res = await fetch('/api/admin/sellers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sellerId, status: action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        notify('err', json.error || 'Failed to update seller.');
      } else {
        notify('ok', action === 'active' ? 'Seller approved successfully' : 'Seller rejected.');
        await load();
      }
    } catch {
      notify('err', 'Network error updating seller.');
    } finally {
      setBusyIds(prev => { const n = new Set(prev); n.delete(`seller:${sellerId}`); return n; });
    }
  }

  async function handleProductAction(productId: string, action: 'active' | 'rejected') {
    setBusyIds(prev => new Set(prev).add(`product:${productId}`));
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, status: action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        notify('err', json.error || 'Failed to update product.');
      } else {
        notify('ok', action === 'active' ? 'Product approved and published successfully' : 'Product rejected.');
        await load();
      }
    } catch {
      notify('err', 'Network error updating product.');
    } finally {
      setBusyIds(prev => { const n = new Set(prev); n.delete(`product:${productId}`); return n; });
    }
  }

  async function handleAdAction(adId: string, status: string) {
    setBusyIds(prev => new Set(prev).add(`ad:${adId}`));
    try {
      const s = createClient();
      const { error } = await (s as any).from('advertisements').update({ status, updated_at: new Date().toISOString() }).eq('id', adId);
      if (error) {
        notify('err', 'Failed to update advertisement.');
      } else {
        notify('ok', `Advertisement ${status}.`);
        await load();
      }
    } catch {
      notify('err', 'Network error updating advertisement.');
    } finally {
      setBusyIds(prev => { const n = new Set(prev); n.delete(`ad:${adId}`); return n; });
    }
  }

  if (loading) return <main className="min-h-screen bg-gray-50 p-8">Loading dashboard...</main>;

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-blue-600">Administration</p>
            <h1 className="text-3xl font-bold">Marketplace Control Center</h1>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/products/new" className="rounded-lg bg-[#0f2b5b] px-4 py-2 text-sm font-semibold text-white">
              Create Product
            </Link>
            <Link href="/admin/coupons" className="text-sm font-medium text-blue-600">Coupons &rarr;</Link>
          </div>
        </div>

        {toast && (
          <div className={`rounded-xl border p-4 text-sm ${toast.kind === 'ok' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
            {toast.text}
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Customers" value={stats.totalCustomers} />
            <StatCard label="Active Sellers" value={stats.activeSellers} accent={stats.pendingSellers > 0 ? `+${stats.pendingSellers} pending` : undefined} />
            <StatCard label="Active Products" value={stats.activeProducts} accent={stats.pendingProducts > 0 ? `+${stats.pendingProducts} pending` : undefined} />
            <StatCard label="Out of Stock" value={stats.outOfStockProducts} danger={stats.outOfStockProducts > 0} />
            <StatCard label="Total Orders" value={stats.totalOrders} />
            <StatCard label="Pending Payments" value={stats.pendingPayments} />
            <StatCard label="Successful Payments" value={stats.successfulPayments} />
            <StatCard label="Gross Sales" value={`GHS ${stats.grossSales.toFixed(2)}`} />
            <StatCard label="Platform Commission" value={`GHS ${stats.platformCommission.toFixed(2)}`} />
            <StatCard label="Seller Earnings" value={`GHS ${stats.sellerEarnings.toFixed(2)}`} />
            <StatCard label="Refunds" value={`GHS ${stats.refunds.toFixed(2)}`} danger={stats.refunds > 0} />
            <StatCard label="Advertising Revenue" value={`GHS ${stats.advertisingRevenue.toFixed(2)}`} />
            <StatCard label="Active Campaigns" value={stats.activeCampaigns} />
          </div>
        )}

        {/* Pending Queues */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sellers Awaiting Approval */}
          <section className="rounded-2xl border bg-white">
            <div className="flex items-center justify-between border-b bg-gray-50 px-5 py-4">
              <h2 className="text-lg font-semibold">Sellers awaiting approval</h2>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">
                {pendingSellers.length}
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y">
              {pendingSellers.length === 0 ? (
                <p className="p-6 text-center text-sm text-gray-500">Queue empty.</p>
              ) : pendingSellers.map(s => (
                <div key={s.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <Link href={`/admin/sellers/${s.id}`} className="text-sm font-semibold text-[#0f2b5b] hover:underline">
                      {s.store_name}
                    </Link>
                    <p className="text-xs text-gray-500">{s.email || 'No email'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={busyIds.has(`seller:${s.id}`)}
                      onClick={() => handleSellerAction(s.id, 'active')}
                      className="rounded-lg bg-green-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      disabled={busyIds.has(`seller:${s.id}`)}
                      onClick={() => handleSellerAction(s.id, 'rejected')}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {pendingSellers.length > 0 && (
              <div className="border-t p-3 text-center">
                <Link href="/admin/sellers" className="text-sm font-medium text-blue-600">View all sellers</Link>
              </div>
            )}
          </section>

          {/* Products Awaiting Approval */}
          <section className="rounded-2xl border bg-white">
            <div className="flex items-center justify-between border-b bg-gray-50 px-5 py-4">
              <h2 className="text-lg font-semibold">Products awaiting approval</h2>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">
                {pendingProducts.length}
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y">
              {pendingProducts.length === 0 ? (
                <p className="p-6 text-center text-sm text-gray-500">Queue empty.</p>
              ) : pendingProducts.map(p => {
                const image = p.product_images?.find(i => i.is_primary) || p.product_images?.[0];
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image.url} alt="" className="h-10 w-10 flex-none rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">-</div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.sellers?.store_name || 'Unknown'} · GHS {Number(p.base_price).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={busyIds.has(`product:${p.id}`)}
                        onClick={() => handleProductAction(p.id, 'active')}
                        className="rounded-lg bg-green-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        disabled={busyIds.has(`product:${p.id}`)}
                        onClick={() => handleProductAction(p.id, 'rejected')}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {pendingProducts.length > 0 && (
              <div className="border-t p-3 text-center">
                <Link href="/admin/products" className="text-sm font-medium text-blue-600">View all products</Link>
              </div>
            )}
          </section>

          {/* Advertisements Awaiting Approval */}
          <section className="rounded-2xl border bg-white">
            <div className="flex items-center justify-between border-b bg-gray-50 px-5 py-4">
              <h2 className="text-lg font-semibold">Ads awaiting approval</h2>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">
                {pendingAds.length}
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y">
              {pendingAds.length === 0 ? (
                <p className="p-6 text-center text-sm text-gray-500">Queue empty.</p>
              ) : pendingAds.map(ad => (
                <div key={ad.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{ad.name}</p>
                    <p className="text-xs text-gray-500">{ad.sellers?.store_name || 'Seller'} · {ad.placement} · GHS {Number(ad.bid_amount).toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={busyIds.has(`ad:${ad.id}`)}
                      onClick={() => handleAdAction(ad.id, 'active')}
                      className="rounded-lg bg-green-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      disabled={busyIds.has(`ad:${ad.id}`)}
                      onClick={() => handleAdAction(ad.id, 'rejected')}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {pendingAds.length > 0 && (
              <div className="border-t p-3 text-center">
                <Link href="/admin/advertising" className="text-sm font-medium text-blue-600">View all advertising</Link>
              </div>
            )}
          </section>
        </div>

        {/* Recent Orders */}
        <section className="rounded-2xl border bg-white">
          <div className="flex items-center justify-between border-b bg-gray-50 px-5 py-4">
            <h2 className="text-lg font-semibold">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm font-medium text-blue-600">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-500">No orders yet.</td></tr>
                ) : recentOrders.map(o => (
                  <tr key={o.id} className="border-b last:border-0">
                    <td className="px-5 py-3 font-medium">{o.order_number}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        o.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        o.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        o.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {o.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">GHS {Number(o.total_amount).toFixed(2)}</td>
                    <td className="px-5 py-3 text-gray-600">{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value, accent, danger }: {
  label: string;
  value: string | number;
  accent?: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${danger ? 'text-red-600' : ''}`}>{value}</p>
      {accent && <p className="mt-1 text-xs text-amber-600">{accent}</p>}
    </div>
  );
}
