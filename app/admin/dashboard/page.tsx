'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { isClothingCategory } from '@/lib/utils/clothing';
import { getStoreLaunchReadiness, type StoreLaunchReadiness } from './actions';

type Order = {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
};

type DashboardData = {
  customers: number;
  products: number;
  outOfStock: number;
  orders: number;
  pendingPayments: number;
  paidPayments: number;
  sales: number;
  recentOrders: Order[];
};

const EMPTY_DATA: DashboardData = {
  customers: 0,
  products: 0,
  outOfStock: 0,
  orders: 0,
  pendingPayments: 0,
  paidPayments: 0,
  sales: 0,
  recentOrders: [],
};

function StatCard({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      {note && <p className="mt-1 text-xs text-gray-500">{note}</p>}
    </section>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
  }).format(value);
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [readiness, setReadiness] = useState<StoreLaunchReadiness | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      const user = authData.user;

      if (authError || !user) {
        window.location.assign('/login');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError || (profile as { role?: string } | null)?.role !== 'admin') {
        window.location.assign('/');
        return;
      }

      const readinessResult = await getStoreLaunchReadiness();
      setReadiness(readinessResult);

      const { data: rawCategoryRows, error: categoriesError } = await supabase
        .from('categories')
        .select('id,name,slug')
        .eq('is_active', true);
      const categoryRows = (rawCategoryRows ?? []) as unknown as Array<{ id: string; name: string; slug: string }>;
      if (categoriesError) throw new Error('Unable to load clothing categories.');
      const clothingCategoryIds = (categoryRows ?? [])
        .filter((category) => isClothingCategory(category.name, category.slug))
        .map((category) => category.id);

      const [
        customersResult,
        productsResult,
        ordersCountResult,
        recentOrdersResult,
        paymentsResult,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
        clothingCategoryIds.length > 0
          ? supabase.from('products').select('id,status,owner_type,inventory(quantity,reserved_quantity)').in('owner_type', ['admin', 'platform']).in('category_id', clothingCategoryIds)
          : supabase.from('products').select('id,status,owner_type,inventory(quantity,reserved_quantity)').eq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id,order_number,status,total_amount,created_at').order('created_at', { ascending: false }).limit(10),
        supabase.from('payments').select('id,status,amount'),
      ]);

      const queryError = customersResult.error || productsResult.error || ordersCountResult.error || recentOrdersResult.error || paymentsResult.error;
      if (queryError) throw new Error('Some store statistics could not be loaded. Check the database schema and permissions.');

      const products = (productsResult.data ?? []) as Array<{
        id: string;
        status: string;
        owner_type: string;
        inventory: Array<{ quantity: number | null; reserved_quantity: number | null }> | null;
      }>;
      const recentOrders = (recentOrdersResult.data ?? []) as Order[];
      const payments = (paymentsResult.data ?? []) as unknown as Array<{ status: string; amount: number | null }>;
      const paidPayments = payments.filter((payment) => payment.status === 'paid');

      setData({
        customers: customersResult.count ?? 0,
        products: products.filter((product) => product.status === 'active').length,
        outOfStock: products.filter((product) => {
          if (product.status !== 'active') return false;
          const inventory = product.inventory?.[0];
          return (Number(inventory?.quantity ?? 0) - Number(inventory?.reserved_quantity ?? 0)) <= 0;
        }).length,
        orders: ordersCountResult.count ?? 0,
        pendingPayments: payments.filter((payment) => payment.status === 'pending' || payment.status === 'processing').length,
        paidPayments: paidPayments.length,
        sales: paidPayments.reduce((total, payment) => total + Number(payment.amount ?? 0), 0),
        recentOrders,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load the store dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-700">Store administration</p>
            <h1 className="mt-1 text-3xl font-bold text-gray-900">Store dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">Manage clothing products, customer orders, inventory, and payments.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/products/new" className="rounded-lg bg-[#0f2b5b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173b78]">
              Add product
            </Link>
            <Link href="/admin/orders" className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Manage orders
            </Link>
          </div>
        </header>

        {error && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <span>{error}</span>
            <button onClick={() => void load()} className="font-semibold underline">Try again</button>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border bg-white p-8 text-sm text-gray-500" role="status">Loading store statistics…</div>
        ) : (
          <>
            <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6" aria-labelledby="launch-readiness-heading">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 id="launch-readiness-heading" className="text-lg font-semibold text-gray-900">Launch readiness</h2>
                  <p className="mt-1 text-sm text-gray-500">Checks that must pass before the store can safely accept public orders.</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${readiness && readiness.activeClothingProducts > 0 && readiness.nationwideStandardConfigured && readiness.nationwideExpressConfigured && readiness.hubtelConfigured ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                  {readiness && readiness.activeClothingProducts > 0 && readiness.nationwideStandardConfigured && readiness.nationwideExpressConfigured && readiness.hubtelConfigured ? 'Checks passed' : 'Action required'}
                </span>
              </div>
              {!readiness ? (
                <p className="mt-4 text-sm text-gray-500">Readiness checks are unavailable. Refresh the dashboard and verify admin permissions.</p>
              ) : (
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-sm font-semibold text-gray-900">Public clothing catalogue</p>
                    <p className={`mt-2 text-sm ${readiness.activeClothingProducts > 0 ? 'text-green-700' : 'text-amber-700'}`}>
                      {readiness.activeClothingProducts > 0 ? `${readiness.activeClothingProducts} active store products` : 'No active owner-owned clothing products'}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">Legacy seller/demo products are not counted as public store inventory.</p>
                    <Link href="/admin/products/new" className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline">Add clothing products</Link>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-sm font-semibold text-gray-900">Ghana-wide delivery</p>
                    <p className="mt-2 text-sm text-gray-600">{readiness.activeDeliveryZones} active zones · {readiness.activeShippingRates} active rates</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Standard: {readiness.nationwideStandardConfigured ? 'configured' : 'missing'} · Express: {readiness.nationwideExpressConfigured ? 'configured' : 'missing'}
                    </p>
                    <Link href="/admin/logistics" className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline">Configure delivery</Link>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-sm font-semibold text-gray-900">Hubtel payments</p>
                    <p className={`mt-2 text-sm ${readiness.hubtelConfigured ? 'text-green-700' : 'text-amber-700'}`}>
                      {readiness.hubtelConfigured ? 'Server credentials detected' : 'Production credentials missing'}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">Configure the three Hubtel secrets in Vercel and verify checkout in the merchant sandbox before enabling live payments.</p>
                  </div>
                </div>
              )}
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Store statistics">
              <StatCard label="Customers" value={data.customers} />
              <StatCard label="Active products" value={data.products} />
              <StatCard label="Out of stock" value={data.outOfStock} note={data.outOfStock > 0 ? 'Review inventory levels' : 'Inventory looks good'} />
              <StatCard label="Orders" value={data.orders} />
              <StatCard label="Payments pending" value={data.pendingPayments} />
              <StatCard label="Successful payments" value={data.paidPayments} />
              <StatCard label="Paid sales total" value={formatMoney(data.sales)} note="Based on payment records marked paid" />
            </section>

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Recent orders</h2>
                  <p className="mt-1 text-sm text-gray-500">The latest customer orders recorded by the store.</p>
                </div>
                <Link href="/admin/orders" className="text-sm font-semibold text-blue-700 hover:underline">View all orders</Link>
              </div>

              {data.recentOrders.length === 0 ? (
                <p className="p-8 text-center text-sm text-gray-500">No orders have been recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Order</th>
                        <th className="px-5 py-3 font-semibold">Date</th>
                        <th className="px-5 py-3 font-semibold">Status</th>
                        <th className="px-5 py-3 text-right font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-5 py-4 font-semibold text-gray-900">{order.order_number}</td>
                          <td className="px-5 py-4 text-gray-600">{new Date(order.created_at).toLocaleDateString()}</td>
                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-700">{order.status.replaceAll('_', ' ')}</span>
                          </td>
                          <td className="px-5 py-4 text-right font-medium text-gray-900">{formatMoney(Number(order.total_amount))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
