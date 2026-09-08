'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { updateSellerStatus } from '../actions';

type SellerDetail = {
  id: string;
  store_name: string;
  slug: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  commission_rate: number;
  created_at: string;
  updated_at: string;
  owner_id: string;
  rejection_reason: string | null;
  logo_url: string | null;
  banner_url: string | null;
  profiles: { email: string | null; first_name: string | null; last_name: string | null } | null;
  seller_business_profiles: {
    legal_business_name: string | null;
    business_type: string | null;
    registration_number: string | null;
    tax_id: string | null;
    contact_name: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    verification_status: string | null;
  } | null;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  status: string;
  base_price: number;
  created_at: string;
  rejection_reason: string | null;
  categories: { name: string } | null;
  inventory: Array<{ quantity: number; reserved_quantity: number }> | null;
  product_images: Array<{ url: string; is_primary: boolean }> | null;
};

type LedgerEntry = {
  id: string;
  entry_type: string;
  amount: number;
  currency: string;
  description: string | null;
  created_at: string;
};

type AuditLog = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
};

const PRODUCT_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending_review', label: 'Pending' },
  { key: 'active', label: 'Active' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'inactive', label: 'Inactive' },
] as const;

type ProductTabKey = (typeof PRODUCT_TABS)[number]['key'];

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-orange-100 text-orange-800',
  rejected: 'bg-red-100 text-red-800',
  pending_review: 'bg-amber-100 text-amber-800',
  inactive: 'bg-gray-200 text-gray-700',
};

export default function AdminSellerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sellerId = params.id as string;

  const [seller, setSeller] = useState<SellerDetail | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [productTab, setProductTab] = useState<ProductTabKey>('all');
  const [reasonFor, setReasonFor] = useState<{ action: 'rejected' | 'suspended' } | null>(null);
  const [reason, setReason] = useState('');

  async function load() {
    const s = createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) { location.href = '/login'; return; }
    const { data: p } = await s.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if ((p as { role?: string } | null)?.role !== 'admin') { location.href = '/'; return; }

    const [sellerResult, productsResult, ledgerResult, auditResult] = await Promise.all([
      s.from('sellers').select('*, profiles!sellers_owner_id_fkey(email,first_name,last_name), seller_business_profiles(*)').eq('id', sellerId).maybeSingle(),
      s.from('products').select('id,name,slug,sku,status,base_price,created_at,rejection_reason,categories(name),inventory(quantity,reserved_quantity),product_images(url,is_primary)').eq('seller_id', sellerId).order('created_at', { ascending: false }),
      s.from('seller_ledger_entries').select('id,entry_type,amount,currency,description,created_at').eq('seller_id', sellerId).order('created_at', { ascending: false }).limit(50),
      s.from('audit_logs').select('id,action,entity_type,entity_id,old_data,new_data,created_at').eq('entity_id', sellerId).order('created_at', { ascending: false }).limit(30),
    ]);

    setSeller(sellerResult.data as unknown as SellerDetail | null);
    setProducts((productsResult.data || []) as unknown as ProductRow[]);
    setLedger((ledgerResult.data || []) as LedgerEntry[]);
    setAuditLogs((auditResult.data || []) as AuditLog[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [sellerId]);

  function notify(kind: 'ok' | 'err', text: string) {
    setToast({ kind, text });
    window.setTimeout(() => setToast(null), 5000);
  }

  async function decide(status: 'active' | 'rejected' | 'suspended', reasonText?: string) {
    if (busyId || !seller) return;
    setBusyId(seller.id);
    setToast(null);
    const result = await updateSellerStatus({ sellerId: seller.id, status, reason: reasonText || undefined });
    setBusyId(null);
    setReasonFor(null);
    setReason('');
    if (result.success) {
      notify('ok', result.message || `Seller ${status}.`);
      await load();
    } else {
      notify('err', result.error || 'Unable to update seller.');
    }
  }

  if (loading) return <main className="min-h-screen bg-gray-50 p-8">Loading seller details...</main>;
  if (!seller) return <main className="min-h-screen bg-gray-50 p-8">Seller not found.</main>;

  const productCountByStatus = (key: ProductTabKey) =>
    key === 'all' ? products.length : products.filter(p => p.status === key).length;
  const visibleProducts = productTab === 'all' ? products : products.filter(p => p.status === productTab);

  const totalSales = ledger.filter(e => e.entry_type === 'sale').reduce((s, e) => s + Number(e.amount), 0);
  const totalCommission = ledger.filter(e => e.entry_type === 'commission').reduce((s, e) => s + Math.abs(Number(e.amount)), 0);
  const netEarnings = totalSales - totalCommission;

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">&larr; Back</button>
          <Link href="/admin/sellers" className="text-sm text-gray-500 hover:text-gray-700">Sellers</Link>
          <span className="text-sm text-gray-400">/</span>
          <span className="text-sm font-semibold">{seller.store_name}</span>
        </div>

        {toast && (
          <div role="status" className={`rounded-xl border p-4 text-sm ${toast.kind === 'ok' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
            {toast.text}
          </div>
        )}

        {/* Seller Profile */}
        <section className="rounded-2xl border bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{seller.store_name}</h1>
              <p className="text-sm text-gray-500">Seller ID: {seller.id}</p>
              <p className="text-sm text-gray-500">Owner: {seller.profiles?.email || seller.owner_id}</p>
              <p className="text-sm text-gray-500">Registered: {new Date(seller.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[seller.status] || 'bg-gray-100 text-gray-800'}`}>
                {seller.status}
              </span>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                {Number(seller.commission_rate)}% commission
              </span>
            </div>
          </div>

          {seller.description && (
            <p className="mt-4 text-sm text-gray-600">{seller.description}</p>
          )}

          {seller.rejection_reason && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              Rejection/Suspension reason: {seller.rejection_reason}
            </div>
          )}

          {seller.seller_business_profiles && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border p-4">
                <p className="text-xs text-gray-500">Legal Business Name</p>
                <p className="mt-1 text-sm font-medium">{seller.seller_business_profiles.legal_business_name || 'Not provided'}</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-xs text-gray-500">Business Type</p>
                <p className="mt-1 text-sm font-medium">{seller.seller_business_profiles.business_type || 'Not provided'}</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-xs text-gray-500">Registration Number</p>
                <p className="mt-1 text-sm font-medium">{seller.seller_business_profiles.registration_number || 'Not provided'}</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-xs text-gray-500">Tax ID</p>
                <p className="mt-1 text-sm font-medium">{seller.seller_business_profiles.tax_id || 'Not provided'}</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-xs text-gray-500">Contact Name</p>
                <p className="mt-1 text-sm font-medium">{seller.seller_business_profiles.contact_name || 'Not provided'}</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-xs text-gray-500">Verification</p>
                <p className="mt-1 text-sm font-medium">{seller.seller_business_profiles.verification_status || 'pending'}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-2">
            {seller.status === 'pending' && (
              <>
                <button
                  disabled={!!busyId}
                  onClick={() => decide('active')}
                  className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {busyId ? 'Working...' : 'Approve'}
                </button>
                <button
                  disabled={!!busyId}
                  onClick={() => setReasonFor({ action: 'rejected' })}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
                >
                  Reject
                </button>
              </>
            )}
            {seller.status === 'active' && (
              <button
                disabled={!!busyId}
                onClick={() => setReasonFor({ action: 'suspended' })}
                className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700 disabled:opacity-50"
              >
                Suspend
              </button>
            )}
            {(seller.status === 'suspended' || seller.status === 'rejected') && (
              <button
                disabled={!!busyId}
                onClick={() => decide('active')}
                className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Reactivate
              </button>
            )}
          </div>

          {reasonFor && (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-red-50 p-3">
              <input
                autoFocus
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={reasonFor.action === 'rejected' ? 'Why is this seller rejected?' : 'Why is this seller being suspended?'}
                maxLength={500}
                className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"
              />
              <button
                disabled={!reason.trim() || !!busyId}
                onClick={() => decide(reasonFor.action, reason)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Confirm {reasonFor.action}
              </button>
              <button onClick={() => { setReasonFor(null); setReason(''); }} className="rounded-lg border px-4 py-2 text-sm">
                Cancel
              </button>
            </div>
          )}
        </section>

        {/* Financial Summary */}
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="text-lg font-semibold">Financial Summary</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border p-4">
              <p className="text-xs text-gray-500">Gross Sales</p>
              <p className="mt-2 text-2xl font-bold">GHS {totalSales.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-xs text-gray-500">Platform Commission</p>
              <p className="mt-2 text-2xl font-bold">GHS {totalCommission.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-xs text-gray-500">Net Earnings</p>
              <p className="mt-2 text-2xl font-bold">GHS {netEarnings.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-xs text-gray-500">Total Products</p>
              <p className="mt-2 text-2xl font-bold">{products.length}</p>
            </div>
          </div>

          <div className="mt-4 max-h-60 overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {ledger.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">No ledger entries yet.</td></tr>
                ) : ledger.map(e => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="px-4 py-2 text-gray-600">{new Date(e.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2 capitalize">{e.entry_type}</td>
                    <td className="px-4 py-2 text-gray-600">{e.description || '-'}</td>
                    <td className={`px-4 py-2 text-right font-medium ${Number(e.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      GHS {Number(e.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Products */}
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="text-lg font-semibold">Seller Products</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {PRODUCT_TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setProductTab(t.key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${productTab === t.key ? 'bg-[#0f2b5b] text-white' : 'border bg-white text-gray-700'}`}
              >
                {t.label}
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${productTab === t.key ? 'bg-white/20' : 'bg-gray-100'}`}>
                  {productCountByStatus(t.key)}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-4 overflow-x-auto">
            {visibleProducts.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-500">No products in this view.</p>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProducts.map(p => {
                    const stock = (p.inventory?.[0]?.quantity ?? 0) - (p.inventory?.[0]?.reserved_quantity ?? 0);
                    const image = p.product_images?.find(i => i.is_primary) || p.product_images?.[0];
                    return (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={image.url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">-</div>
                            )}
                            <div>
                              <p className="font-medium">{p.name}</p>
                              <p className="text-xs text-gray-400">{p.sku || 'No SKU'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{p.categories?.name || '-'}</td>
                        <td className="px-4 py-3">GHS {Number(p.base_price).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={stock > 0 ? '' : 'text-red-600 font-semibold'}>
                            {stock > 0 ? stock : 'Out of stock'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[p.status] || 'bg-gray-100'}`}>
                            {p.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{new Date(p.created_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Activity / Audit Log */}
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="text-lg font-semibold">Activity History</h2>
          <div className="mt-4 max-h-80 overflow-y-auto space-y-3">
            {auditLogs.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-500">No activity recorded.</p>
            ) : auditLogs.map(log => (
              <div key={log.id} className="flex items-start gap-3 rounded-xl border p-3">
                <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gray-100 text-xs text-gray-500">
                  {log.action.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{log.action.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-500">
                    {log.entity_type} {log.entity_id.slice(0, 8)}...
                    {log.new_data && ` - ${JSON.stringify(log.new_data)}`}
                  </p>
                  <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
