import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function SellerDashboardPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = typeof claimsData?.claims?.sub === 'string' ? claimsData.claims.sub : null;

  if (!userId) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role, first_name').eq('id', userId).single();
  if (profile?.role !== 'seller') redirect('/');

  const { data: seller } = await supabase.from('sellers').select('id, store_name, status, commission_rate').eq('owner_id', userId).maybeSingle();

  if (!seller) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-blue-600">Seller account</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Store setup is incomplete</h1>
          <p className="mt-3 text-gray-600">Your account has seller access, but no seller store record is attached yet. An administrator should complete the seller setup before products can be listed.</p>
          <Link href="/" className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">Return to storefront</Link>
        </div>
      </main>
    );
  }

  const [{ count: products }, { count: orderItems }] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('seller_id', seller.id),
    supabase.from('order_items').select('id', { count: 'exact', head: true }).eq('seller_id', seller.id),
  ]);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Seller Center</p>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{seller.store_name}</h1>
            <p className="mt-1 text-gray-600">Manage your marketplace store and fulfil customer orders.</p>
          </div>
          <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-700">View storefront →</Link>
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm">
          <span className="text-gray-500">Store status:</span>{' '}
          <span className="font-semibold capitalize text-gray-900">{seller.status}</span>
          <span className="ml-4 text-gray-500">Commission:</span>{' '}
          <span className="font-semibold text-gray-900">{seller.commission_rate}%</span>
        </div>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Products</p><p className="mt-2 text-3xl font-bold text-gray-900">{products ?? 0}</p></div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Order items</p><p className="mt-2 text-3xl font-bold text-gray-900">{orderItems ?? 0}</p></div>
        </section>

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Store operations</h2>
          <p className="mt-1 text-sm text-gray-600">Your catalogue and order data are isolated by seller ID at the data layer.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link href="/products" className="rounded-xl border border-gray-200 p-4 text-sm font-medium text-gray-800 hover:border-blue-300 hover:text-blue-700">View products</Link>
            <Link href="/account/orders" className="rounded-xl border border-gray-200 p-4 text-sm font-medium text-gray-800 hover:border-blue-300 hover:text-blue-700">View orders</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
