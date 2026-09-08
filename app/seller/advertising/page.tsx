'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Ad = {
  id: string;
  seller_id: string;
  name: string;
  placement: string;
  budget: number;
  bid_amount: number;
  spend: number;
  starts_at: string;
  ends_at: string;
  status: string;
  impressions: number;
  clicks: number;
  created_at: string;
};

const PLACEMENTS = [
  { value: 'home_hero', label: 'Homepage Hero Banner', description: 'Featured banner on homepage' },
  { value: 'home_featured', label: 'Homepage Featured', description: 'Featured product grid' },
  { value: 'category_featured', label: 'Category Featured', description: 'Featured in category pages' },
  { value: 'search_sponsored', label: 'Search Sponsored', description: 'Sponsored in search results' },
  { value: 'flash_sale', label: 'Flash Sale', description: 'Flash sale placement' },
];

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  payment_pending: 'bg-yellow-100 text-yellow-800',
  pending: 'bg-amber-100 text-amber-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-orange-100 text-orange-800',
  ended: 'bg-gray-200 text-gray-600',
  expired: 'bg-gray-200 text-gray-600',
  rejected: 'bg-red-100 text-red-800',
};

export default function SellerAdvertising() {
  const [rows, setRows] = useState<Ad[]>([]);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    placement: 'search_sponsored',
    budget: '',
    bid: '',
    startsAt: '',
    endsAt: '',
    imageUrl: '',
    targetUrl: '',
  });

  const load = async () => {
    const s = createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) { location.href = '/login'; return; }
    const { data: sellerData } = await s.from('sellers').select('id').eq('owner_id', user.id).eq('status', 'active').maybeSingle();
    const seller = sellerData as { id: string } | null;
    if (!seller) { setMsg('An active seller account is required.'); return; }
    setSellerId(seller.id);
    const { data } = await (s.from('advertisements' as any) as any)
      .select('*')
      .eq('seller_id', seller.id)
      .order('created_at', { ascending: false });
    setRows((data || []) as Ad[]);
  };

  useEffect(() => {
    // Check for payment callback status
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    if (paymentStatus === 'success') {
      setMsg('Payment successful! Your advertisement is now pending admin review.');
      window.history.replaceState({}, '', '/seller/advertising');
    } else if (paymentStatus === 'failed') {
      setMsg('Payment failed. Please try again.');
      window.history.replaceState({}, '', '/seller/advertising');
    } else if (paymentStatus === 'missing') {
      setMsg('Payment reference missing.');
      window.history.replaceState({}, '', '/seller/advertising');
    }
    load();
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !sellerId) return;
    setSubmitting(true);
    setMsg('');

    const s = createClient();
    const { error } = await (s.from('advertisements' as any) as any).insert({
      seller_id: sellerId,
      name: form.name,
      placement: form.placement,
      budget: Number(form.budget),
      bid_amount: Number(form.bid),
      starts_at: new Date(form.startsAt).toISOString(),
      ends_at: new Date(form.endsAt).toISOString(),
      image_url: form.imageUrl || null,
      target_url: form.targetUrl || null,
      status: 'draft',
    });

    setSubmitting(false);

    if (error) {
      setMsg(error.message || 'Unable to create advertisement.');
    } else {
      setMsg('Advertisement created. Please pay to submit for review.');
      setForm({ name: '', placement: 'search_sponsored', budget: '', bid: '', startsAt: '', endsAt: '', imageUrl: '', targetUrl: '' });
      await load();
    }
  }

  async function handlePay(adId: string) {
    if (paying) return;
    setPaying(adId);
    setMsg('');

    try {
      const res = await fetch('/api/advertising/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advertisementId: adId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.authorization_url) {
        setMsg(data.error || 'Unable to initialize payment.');
        setPaying(null);
        return;
      }
      window.location.assign(data.authorization_url);
    } catch {
      setMsg('Network error. Please try again.');
      setPaying(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl space-y-6 px-4">
        <div>
          <h1 className="text-3xl font-bold">Advertising</h1>
          <p className="mt-1 text-sm text-gray-500">
            Submit sponsored placements for marketplace review. Payment is required before admin review.
          </p>
        </div>

        {msg && (
          <div className={`rounded-xl border p-4 text-sm ${
            msg.includes('success') || msg.includes('Payment successful')
              ? 'border-green-200 bg-green-50 text-green-800'
              : msg.includes('failed') || msg.includes('Error') || msg.includes('Unable')
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-blue-200 bg-blue-50 text-blue-800'
          }`}>
            {msg}
          </div>
        )}

        {/* Create new advertisement */}
        <form onSubmit={submit} className="grid gap-4 rounded-2xl border bg-white p-6 sm:grid-cols-2">
          <h2 className="sm:col-span-2 text-lg font-semibold">Create Advertisement</h2>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Campaign Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Summer Sale Banner"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Placement *</label>
            <select
              value={form.placement}
              onChange={e => set('placement', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PLACEMENTS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {PLACEMENTS.find(p => p.value === form.placement)?.description}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Budget (GHS) *</label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              value={form.budget}
              onChange={e => set('budget', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Bid Amount (GHS) *</label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              value={form.bid}
              onChange={e => set('bid', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date *</label>
            <input
              type="datetime-local"
              required
              value={form.startsAt}
              onChange={e => set('startsAt', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">End Date *</label>
            <input
              type="datetime-local"
              required
              value={form.endsAt}
              onChange={e => set('endsAt', e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Image URL</label>
            <input
              type="url"
              value={form.imageUrl}
              onChange={e => set('imageUrl', e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Target URL</label>
            <input
              type="url"
              value={form.targetUrl}
              onChange={e => set('targetUrl', e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#0f2b5b] px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Advertisement'}
            </button>
          </div>
        </form>

        {/* Existing advertisements */}
        <section className="rounded-2xl border bg-white">
          <div className="border-b bg-gray-50 px-5 py-4">
            <h2 className="text-lg font-semibold">Your Advertisements ({rows.length})</h2>
          </div>
          {rows.length === 0 ? (
            <p className="p-10 text-center text-sm text-gray-500">No advertisements yet.</p>
          ) : (
            <div className="divide-y">
              {rows.map(ad => (
                <div key={ad.id} className="flex flex-wrap items-start justify-between gap-4 p-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{ad.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[ad.status] || 'bg-gray-100'}`}>
                        {ad.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {ad.placement} · Budget GHS {Number(ad.budget).toFixed(2)} · Bid GHS {Number(ad.bid_amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(ad.starts_at).toLocaleDateString()} &rarr; {new Date(ad.ends_at).toLocaleDateString()}
                    </p>
                    {(ad.status === 'active') && (
                      <div className="mt-2 flex gap-4 text-xs text-gray-500">
                        <span>Impressions: {ad.impressions}</span>
                        <span>Clicks: {ad.clicks}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {(ad.status === 'draft' || ad.status === 'payment_pending') && (
                      <button
                        disabled={paying === ad.id}
                        onClick={() => handlePay(ad.id)}
                        className="rounded-lg bg-[#0f2b5b] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {paying === ad.id ? 'Processing...' : 'Pay & Submit'}
                      </button>
                    )}
                    {ad.status === 'active' && (
                      <span className="text-xs text-green-600 font-semibold">Live</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
