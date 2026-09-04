'use client';
import {useEffect, useState} from 'react';
import {createClient} from '@/lib/supabase/client';
import {createCoupon, toggleCoupon, deleteCoupon} from './actions';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [form, setForm] = useState({
    code: '', description: '', discountType: 'percentage', discountValue: '',
    maxUses: '', validUntil: '',
  });
  const [msg, setMsg] = useState('');

  async function load() {
    const s = createClient();
    const {data: {user}} = await s.auth.getUser();
    if (!user) { location.href = '/login'; return; }
    const {data: p} = await s.from('profiles').select('role').eq('id', user.id).single();
    if ((p as any)?.role !== 'admin') { location.href = '/'; return; }
    const {data} = await s.from('coupons').select('*').order('created_at', {ascending: false});
    setCoupons(data || []);
  }
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await createCoupon(form);
    setMsg(r.success ? 'Coupon created' : r.error || 'Unable to create coupon');
    if (r.success) {
      setForm({code: '', description: '', discountType: 'percentage', discountValue: '', maxUses: '', validUntil: ''});
      load();
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-blue-600">Administration</p>
            <h1 className="text-3xl font-bold">Coupons</h1>
          </div>
          <a href="/admin/dashboard" className="text-sm font-medium text-blue-600">Dashboard</a>
        </div>

        <form onSubmit={submit} className="rounded-2xl border bg-white p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input required placeholder="Code" value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="rounded-lg border px-3 py-2" />
            <input placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="rounded-lg border px-3 py-2" />
            <select value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value})} className="rounded-lg border px-3 py-2">
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed GHS</option>
            </select>
            <input required type="number" min="0.01" step="0.01" placeholder="Discount value" value={form.discountValue} onChange={e => setForm({...form, discountValue: e.target.value})} className="rounded-lg border px-3 py-2" />
            <input type="number" min="1" placeholder="Max uses" value={form.maxUses} onChange={e => setForm({...form, maxUses: e.target.value})} className="rounded-lg border px-3 py-2" />
            <input type="datetime-local" placeholder="Valid until" value={form.validUntil} onChange={e => setForm({...form, validUntil: e.target.value})} className="rounded-lg border px-3 py-2" />
          </div>
          {msg && <p className="mt-3 text-sm text-gray-600">{msg}</p>}
          <button className="mt-4 rounded-lg bg-[#0f2b5b] px-5 py-2.5 text-sm font-semibold text-white">Create coupon</button>
        </form>

        <div className="divide-y rounded-2xl border bg-white">
          {!coupons.length && <p className="p-5 text-sm text-gray-500">No coupons yet.</p>}
          {coupons.map(c => (
            <div key={c.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{c.code}</p>
                <p className="text-sm text-gray-500">
                  {c.discount_type === 'percentage' ? `${c.discount_value}%` : `GHS ${c.discount_value}`}
                  {' · used '}
                  {c.used_count}{c.usage_limit ? `/${c.usage_limit}` : ''}
                  {c.expires_at ? ` · expires ${new Date(c.expires_at).toLocaleDateString()}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={async () => { await toggleCoupon(c.id, !c.is_active); load(); }} className="rounded-lg border px-3 py-2 text-xs font-semibold">{c.is_active ? 'Disable' : 'Enable'}</button>
                <button onClick={async () => { if (confirm('Delete this coupon?')) { await deleteCoupon(c.id); load(); } }} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
