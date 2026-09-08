'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { moderateProduct } from './actions';

type Row = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  status: string;
  base_price: number;
  created_at: string;
  rejection_reason: string | null;
  sellers: { store_name: string; status: string } | null;
  categories: { name: string } | null;
  inventory: Array<{ quantity: number; reserved_quantity: number }> | null;
  product_images: Array<{ url: string; is_primary: boolean }> | null;
};

const TABS = [
  { key: 'pending_review', label: 'Pending review' },
  { key: 'active', label: 'Approved / Live' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'all', label: 'All' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const STATUS_STYLES: Record<string, string> = {
  pending_review: 'bg-amber-100 text-amber-800',
  active: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  inactive: 'bg-gray-200 text-gray-700',
  draft: 'bg-blue-100 text-blue-800',
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Row[]>([]);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('pending_review');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  async function load() {
    const client = createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) { location.href = '/login'; return; }
    const { data: p } = await client.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if ((p as { role?: string } | null)?.role !== 'admin') { location.href = '/'; return; }
    const { data } = await client
      .from('products')
      .select('id,name,slug,sku,status,base_price,created_at,rejection_reason,sellers(store_name,status),categories(name),inventory(quantity,reserved_quantity),product_images(url,is_primary)')
      .in('status', ['pending_review', 'active', 'rejected', 'inactive'])
      .order('created_at', { ascending: false });
    setProducts((data || []) as unknown as Row[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function notify(kind: 'ok' | 'err', text: string) {
    setToast({ kind, text });
    window.setTimeout(() => setToast(null), 5000);
  }

  async function act(product: Row, status: 'active' | 'rejected' | 'inactive', reasonText?: string) {
    if (busyId) return;
    setBusyId(product.id);
    setToast(null);
    const r = await moderateProduct({ productId: product.id, status, reason: reasonText || undefined });
    setBusyId(null);
    setRejectFor(null);
    setReason('');
    if (r.success) {
      notify('ok', r.message || 'Product updated.');
    } else {
      notify('err', r.error || 'Unable to update product.');
    }
    // State changed in the database first — reload empties the queue and
    // updates the counts without leaving the page.
    await load();
  }

  if (loading) return <main className="min-h-screen bg-gray-50 p-8">Loading moderation queue…</main>;

  const countFor = (key: TabKey) =>
    key === 'all' ? products.length : products.filter((p) => p.status === key).length;
  const visible = tab === 'all' ? products : products.filter((p) => p.status === tab);
  const pendingCount = countFor('pending_review');

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <p className="text-sm font-semibold text-[#0f2b5b]">Catalogue quality</p>
          <h1 className="text-3xl font-bold text-gray-900">Product moderation</h1>
          <p className="mt-1 text-sm text-gray-500">Review seller submissions before products become visible to customers.</p>
        </header>

        {toast && (
          <div
            role="status"
            className={`rounded-xl border p-4 text-sm ${toast.kind === 'ok' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}
          >
            {toast.text}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === t.key ? 'bg-[#0f2b5b] text-white' : 'border bg-white text-gray-700'}`}
            >
              {t.label}
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${tab === t.key ? 'bg-white/20' : 'bg-gray-100'}`}>
                {countFor(t.key)}
              </span>
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white">
          {visible.length === 0 ? (
            <p className="p-10 text-center text-sm text-gray-500">
              {tab === 'pending_review' ? 'No products awaiting moderation.' : 'No products in this view.'}
            </p>
          ) : (
            visible.map((p) => {
              const stock = (p.inventory?.[0]?.quantity ?? 0) - (p.inventory?.[0]?.reserved_quantity ?? 0);
              const image = p.product_images?.find((i) => i.is_primary) || p.product_images?.[0];
              return (
                <div key={p.id} className="flex flex-wrap items-start justify-between gap-4 border-b p-5 last:border-0">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image.url} alt="" className="h-14 w-14 flex-none rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 flex-none items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">No image</div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">
                        {p.sellers?.store_name || 'Unknown seller'} · {p.categories?.name || 'No category'} · {p.sku || 'No SKU'} · GHS {Number(p.base_price).toFixed(2)} · Stock {Math.max(0, stock)}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">Submitted {new Date(p.created_at).toLocaleDateString()}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[p.status] || 'bg-gray-100'}`}>
                          {p.status.replaceAll('_', ' ')}
                        </span>
                        {p.sellers && p.sellers.status !== 'active' && (
                          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800">
                            Seller {p.sellers.status}
                          </span>
                        )}
                      </div>
                      {p.status === 'rejected' && p.rejection_reason && (
                        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">Rejection reason: {p.rejection_reason}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {(p.status === 'pending_review' || p.status === 'rejected') && (
                      <button
                        disabled={busyId === p.id}
                        onClick={() => act(p, 'active')}
                        className="rounded-lg bg-green-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {busyId === p.id ? 'Working…' : 'Approve'}
                      </button>
                    )}
                    {(p.status === 'pending_review' || p.status === 'active') && (
                      <button
                        disabled={busyId === p.id}
                        onClick={() => { setRejectFor(rejectFor === p.id ? null : p.id); setReason(''); }}
                        className="rounded-lg border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    )}
                    {p.status === 'active' && (
                      <button
                        disabled={busyId === p.id}
                        onClick={() => act(p, 'inactive')}
                        className="rounded-lg border px-4 py-2 text-xs font-semibold disabled:opacity-50"
                      >
                        Deactivate
                      </button>
                    )}
                  </div>

                  {rejectFor === p.id && (
                    <div className="w-full">
                      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-red-50 p-3">
                        <input
                          autoFocus
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Why is this product rejected? The seller will see this."
                          maxLength={500}
                          className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-xs"
                        />
                        <button
                          disabled={!reason.trim() || busyId === p.id}
                          onClick={() => act(p, 'rejected', reason)}
                          className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          Confirm rejection
                        </button>
                        <button onClick={() => setRejectFor(null)} className="rounded-lg border px-4 py-2 text-xs">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {pendingCount === 0 && tab === 'pending_review' && (
          <p className="text-center text-sm text-gray-500">All caught up — the moderation queue is empty.</p>
        )}
      </div>
    </main>
  );
}
