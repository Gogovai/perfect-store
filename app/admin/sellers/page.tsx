'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { updateSellerStatus } from './actions';

type Seller = {
  id: string;
  store_name: string;
  email: string | null;
  status: string;
  commission_rate: number;
  created_at: string;
  owner_id: string;
  rejection_reason: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-orange-100 text-orange-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function AdminSellersPage() {
  const [rows, setRows] = useState<Seller[]>([]);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reasonFor, setReasonFor] = useState<{ id: string; action: 'rejected' | 'suspended' } | null>(null);
  const [reason, setReason] = useState('');

  async function load() {
    const client = createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) { location.href = '/login'; return; }
    const { data: p } = await client.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if ((p as { role?: string } | null)?.role !== 'admin') { location.href = '/'; return; }
    const { data } = await client.from('sellers').select('id,store_name,email,status,commission_rate,created_at,owner_id,rejection_reason').order('created_at', { ascending: false });
    setRows((data || []) as Seller[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function notify(kind: 'ok' | 'err', text: string) {
    setToast({ kind, text });
    window.setTimeout(() => setToast(null), 5000);
  }

  async function decide(seller: Seller, status: 'active' | 'rejected' | 'suspended', reasonText?: string) {
    if (busyId) return;
    setBusyId(seller.id);
    setToast(null);
    const result = await updateSellerStatus({ sellerId: seller.id, status, reason: reasonText || undefined });
    setBusyId(null);
    setReasonFor(null);
    setReason('');
    if (result.success) {
      notify('ok', result.message || `Seller ${status}.`);
    } else {
      notify('err', result.error || 'Unable to update seller.');
    }
    // The database state has changed — reload so the queue empties and the
    // pending count drops without leaving the page.
    await load();
  }

  function startReasonFlow(id: string, action: 'rejected' | 'suspended') {
    setReasonFor({ id, action });
    setReason('');
  }

  if (loading) {
    return <main className="min-h-screen bg-gray-50 p-8">Loading sellers…</main>;
  }

  const pending = rows.filter((r) => r.status === 'pending');
  const others = rows.filter((r) => r.status !== 'pending');

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-sm font-semibold text-[#0f2b5b]">Marketplace partners</p>
          <h1 className="text-3xl font-bold">Sellers</h1>
          <p className="mt-1 text-sm text-gray-500">Review applications, activation, suspension and marketplace commission settings.</p>
        </header>

        {toast && (
          <div
            role="status"
            className={`rounded-xl border p-4 text-sm ${toast.kind === 'ok' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}
          >
            {toast.text}
          </div>
        )}

        {/* Pending approval queue */}
        <section className="overflow-hidden rounded-2xl border bg-white">
          <div className="flex items-center justify-between border-b bg-gray-50 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold">Sellers awaiting approval</h2>
              <p className="text-sm text-gray-500">Applications that need a decision before they can access the seller dashboard.</p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800" data-testid="pending-seller-count">
              {pending.length}
            </span>
          </div>
          {pending.length === 0 ? (
            <p className="p-10 text-center text-sm text-gray-500">No sellers awaiting approval.</p>
          ) : (
            <ul className="divide-y">
              {pending.map((s) => (
                <li key={s.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <Link href={`/admin/sellers/${s.id}`} className="font-semibold text-[#0f2b5b] hover:underline">
                        {s.store_name}
                      </Link>
                      <p className="text-xs text-gray-500">{s.email || 'No email'} · applied {new Date(s.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        disabled={busyId === s.id}
                        onClick={() => decide(s, 'active')}
                        className="rounded-lg bg-green-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {busyId === s.id ? 'Working…' : 'Approve'}
                      </button>
                      <button
                        disabled={busyId === s.id}
                        onClick={() => startReasonFlow(s.id, 'rejected')}
                        className="rounded-lg border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                      {reasonFor?.id === s.id && reasonFor.action === 'rejected' && (
                        <ReasonInput
                          value={reason}
                          onChange={setReason}
                          onCancel={() => setReasonFor(null)}
                          onConfirm={() => decide(s, 'rejected', reason)}
                          placeholder="Why is this application rejected?"
                          confirmLabel="Confirm rejection"
                        />
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* All sellers */}
        <section className="overflow-hidden rounded-2xl border bg-white">
          <div className="border-b bg-gray-50 px-5 py-4">
            <h2 className="text-lg font-semibold">All sellers ({rows.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-white text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Store</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Commission</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {others.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="px-5 py-4">
                      <Link href={`/admin/sellers/${s.id}`} className="font-semibold text-[#0f2b5b] hover:underline">
                        {s.store_name}
                      </Link>
                      <p className="text-xs text-gray-400">{s.email || `Owner ${s.owner_id.slice(0, 8)}`}</p>
                      {s.rejection_reason && (
                        <p className="mt-1 text-xs text-red-600">Reason: {s.rejection_reason}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[s.status] || 'bg-gray-100 text-gray-800'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">{Number(s.commission_rate).toFixed(2)}%</td>
                    <td className="px-5 py-4 text-gray-600">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {s.status === 'active' && (
                          <button
                            disabled={busyId === s.id}
                            onClick={() => startReasonFlow(s.id, 'suspended')}
                            className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-700 disabled:opacity-50"
                          >
                            Suspend
                          </button>
                        )}
                        {(s.status === 'suspended' || s.status === 'rejected') && (
                          <button
                            disabled={busyId === s.id}
                            onClick={() => decide(s, 'active')}
                            className="rounded-lg bg-green-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            Reactivate
                          </button>
                        )}
                        {reasonFor?.id === s.id && reasonFor.action === 'suspended' && (
                          <ReasonInput
                            value={reason}
                            onChange={setReason}
                            onCancel={() => setReasonFor(null)}
                            onConfirm={() => decide(s, 'suspended', reason)}
                            placeholder="Why is this seller being suspended?"
                            confirmLabel="Confirm suspension"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {others.length === 0 && <p className="p-10 text-center text-sm text-gray-500">No decided seller accounts yet.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}

function ReasonInput({
  value,
  onChange,
  onCancel,
  onConfirm,
  placeholder,
  confirmLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  placeholder: string;
  confirmLabel: string;
}) {
  return (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={500}
        className="w-full rounded-lg border px-3 py-2 text-xs sm:w-72"
      />
      <button
        disabled={!value.trim()}
        onClick={onConfirm}
        className="whitespace-nowrap rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
      >
        {confirmLabel}
      </button>
      <button onClick={onCancel} className="rounded-lg border px-3 py-2 text-xs">
        Cancel
      </button>
    </div>
  );
}
