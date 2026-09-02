import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = typeof claimsData?.claims?.sub === 'string' ? claimsData.claims.sub : null;

  if (!userId) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role, first_name').eq('id', userId).single();
  if (profile?.role !== 'admin') redirect('/');

  const [{ count: products }, { count: orders }, { count: customers }, { count: sellers }] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('sellers').select('id', { count: 'exact', head: true }),
  ]);

  const cards = [
    ['Products', products ?? 0, '/products'],
    ['Orders', orders ?? 0, '/account/orders'],
    ['Customers', customers ?? 0, '#'],
    ['Sellers', sellers ?? 0, '#'],
  ];

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Administration</p>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
            <p className="mt-1 text-gray-600">Welcome{profile.first_name ? `, ${profile.first_name}` : ''}. Manage Perfect Store from one place.</p>
          </div>
          <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-700">View storefront →</Link>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([label, value, href]) => (
            <Link key={label} href={href as string} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
            </Link>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Marketplace management</h2>
            <p className="mt-1 text-sm text-gray-600">Core areas are connected to the live Supabase data layer.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link href="/products" className="rounded-xl border border-gray-200 p-4 text-sm font-medium text-gray-800 hover:border-blue-300 hover:text-blue-700">Product catalogue</Link>
              <Link href="/categories" className="rounded-xl border border-gray-200 p-4 text-sm font-medium text-gray-800 hover:border-blue-300 hover:text-blue-700">Categories</Link>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">System status</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-gray-600">Authentication</span><span className="font-medium text-green-700">Connected</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-600">Database</span><span className="font-medium text-green-700">Connected</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-600">Order lifecycle</span><span className="font-medium text-green-700">Enabled</span></div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
