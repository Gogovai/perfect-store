'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { setOrderStatus, setReviewPublished } from './actions';

type Row = Record<string, any>;
type PanelKey = 'sellers' | 'customers' | 'products' | 'orders' | 'reviews';

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'refunded',
] as const;

export default function AdminDashboardPage() {
  const [data, setData] = useState<Record<PanelKey, Row[]>>({
    sellers: [],
    customers: [],
    products: [],
    orders: [],
    reviews: [],
  });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());

  async function load() {
    setLoading(true);
    const s = createClient();
    const {
      data: { user },
    } = await s.auth.getUser();
    if (!user) {
      location.href = '/login';
      return;
    }
    const { data: p } = await s
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if ((p as any)?.role !== 'admin') {
      location.href = '/';
      return;
    }
    const [
      { data: sellers },
      { data: orders },
      { data: products },
      { data: reviews },
      { data: customers },
    ] = await Promise.all([
      s
        .from('sellers')
        .select('id,store_name,status,email,owner_id')
        .order('created_at', { ascending: false }),
      s
        .from('orders')
        .select('id,order_number,status,total_amount')
        .order('created_at', { ascending: false })
        .limit(50),
      s
        .from('products')
        .select('id,name,status,base_price')
        .order('created_at', { ascending: false })
        .limit(100),
      s
        .from('reviews')
        .select('id,rating,title,body,is_published')
        .order('created_at', { ascending: false })
        .limit(100),
      s
        .from('profiles')
        .select('id,email,first_name,last_name,is_active')
        .eq('role', 'customer')
        .order('created_at', { ascending: false })
        .limit(100),
    ]);
    setData({
      sellers: sellers || [],
      orders: orders || [],
      products: products || [],
      reviews: reviews || [],
      customers: customers || [],
    });
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  /**
   * Optimistically patch the row in local state, PATCH the admin API,
   * then revert + surface the error if the request fails.
   */
  async function runUpdate(
    panel: PanelKey,
    endpoint: string,
    id: string,
    payload: Record<string, unknown>,
    patch: Partial<Row>,
    okText: string
  ) {
    const key = `${panel}:${id}`;
    if (pending.has(key)) return;
    setPending((prev) => new Set(prev).add(key));
    const snapshot = data;
    setData((d) => ({
      ...d,
      [panel]: (d[panel] as Row[]).map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
    setMsg(null);
    try {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setData(snapshot); // revert optimistic update
        setMsg({ kind: 'err', text: json.error || `Request failed (${res.status}).` });
        return;
      }
      setMsg({ kind: 'ok', text: json.message || okText });
      load(); // background refresh to sync any derived server state
    } catch {
      setData(snapshot);
      setMsg({ kind: 'err', text: 'Network error — please try again.' });
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  const busy = (panel: PanelKey, id: string) => pending.has(`${panel}:${id}`);

  if (loading) return <main className="p-8">Loading administration…</main>;

  const stat = [
    ['Sellers', data.sellers.length],
    ['Customers', data.customers.length],
    ['Products', data.products.length],
    ['Orders', data.orders.length],
  ];

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-blue-600">Administration</p>
            <h1 className="text-3xl font-bold">Marketplace Control Center</h1>
          </div>
          <a href="/admin/coupons" className="text-sm font-medium text-blue-600">
            Coupons →
          </a>
        </div>

        {msg && (
          <div
            className={`rounded-xl border p-4 text-sm ${
              msg.kind === 'ok'
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {msg.text}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stat.map((x) => (
            <div key={x[0] as string} className="rounded-2xl border bg-white p-5">
              <p className="text-sm text-gray-500">{x[0] as string}</p>
              <p className="mt-2 text-3xl font-bold">{x[1] as number}</p>
            </div>
          ))}
        </div>

        <Panel title="Seller applications">
          {data.sellers.map((x) => (
            <Row key={x.id} title={x.store_name} sub={`${x.email || 'No email'} · ${x.status}`}>
              <ActionButton
                disabled={busy('sellers', x.id)}
                onClick={() =>
                  runUpdate(
                    'sellers',
                    '/api/admin/sellers',
                    x.id,
                    { id: x.id, status: 'active' },
                    { status: 'active' },
                    'Seller approved.'
                  )
                }
                className="rounded bg-green-700 px-3 py-2 text-xs text-white"
              >
                Approve
              </ActionButton>
              <ActionButton
                disabled={busy('sellers', x.id)}
                onClick={() =>
                  runUpdate(
                    'sellers',
                    '/api/admin/sellers',
                    x.id,
                    { id: x.id, status: 'suspended' },
                    { status: 'suspended' },
                    'Seller suspended.'
                  )
                }
                className="rounded bg-amber-600 px-3 py-2 text-xs text-white"
              >
                Suspend
              </ActionButton>
              <ActionButton
                disabled={busy('sellers', x.id)}
                onClick={() =>
                  runUpdate(
                    'sellers',
                    '/api/admin/sellers',
                    x.id,
                    { id: x.id, status: 'rejected' },
                    { status: 'rejected' },
                    'Seller rejected.'
                  )
                }
                className="rounded bg-red-600 px-3 py-2 text-xs text-white"
              >
                Reject
              </ActionButton>
            </Row>
          ))}
        </Panel>

        <Panel title="Customers">
          {data.customers.map((x) => (
            <Row
              key={x.id}
              title={`${x.first_name || ''} ${x.last_name || ''}`.trim() || 'Customer'}
              sub={x.email || 'No email'}
            >
              <ActionButton
                disabled={busy('customers', x.id)}
                onClick={() =>
                  runUpdate(
                    'customers',
                    '/api/admin/customers',
                    x.id,
                    { id: x.id, is_active: !x.is_active },
                    { is_active: !x.is_active },
                    `Customer ${x.is_active ? 'deactivated' : 'activated'}.`
                  )
                }
                className="rounded border px-3 py-2 text-xs font-semibold"
              >
                {x.is_active ? 'Deactivate' : 'Activate'}
              </ActionButton>
            </Row>
          ))}
        </Panel>

        <Panel title="Products">
          {data.products.map((x) => (
            <Row key={x.id} title={x.name} sub={`GHS ${Number(x.base_price).toFixed(2)} · ${x.status}`}>
              <ActionButton
                disabled={busy('products', x.id)}
                onClick={() =>
                  runUpdate(
                    'products',
                    '/api/admin/products',
                    x.id,
                    { id: x.id, status: 'active' },
                    { status: 'active' },
                    'Product published.'
                  )
                }
                className="rounded bg-green-700 px-3 py-2 text-xs text-white"
              >
                Publish
              </ActionButton>
              <ActionButton
                disabled={busy('products', x.id)}
                onClick={() =>
                  runUpdate(
                    'products',
                    '/api/admin/products',
                    x.id,
                    { id: x.id, status: 'rejected' },
                    { status: 'rejected' },
                    'Product rejected.'
                  )
                }
                className="rounded bg-red-600 px-3 py-2 text-xs text-white"
              >
                Reject
              </ActionButton>
            </Row>
          ))}
        </Panel>

        <Panel title="Orders">
          {data.orders.map((x) => (
            <Row
              key={x.id}
              title={x.order_number}
              sub={`GHS ${Number(x.total_amount).toFixed(2)} · ${x.status}`}
            >
              <select
                value={x.status}
                onChange={async (e) => {
                  const v = e.target.value;
                  try {
                    const r = await setOrderStatus(x.id, v as (typeof ORDER_STATUSES)[number]);
                    setMsg(
                      r.success
                        ? { kind: 'ok', text: `Order marked ${v}.` }
                        : { kind: 'err', text: r.error || 'Unable to update order.' }
                    );
                  } catch {
                    setMsg({ kind: 'err', text: 'Unable to update order.' });
                  }
                  load();
                }}
                className="rounded border px-2 py-2 text-xs"
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </Row>
          ))}
        </Panel>

        <Panel title="Review moderation">
          {data.reviews.map((x) => (
            <Row key={x.id} title={`${'★'.repeat(x.rating)} ${x.title || 'Review'}`} sub={x.body || ''}>
              <ActionButton
                disabled={busy('reviews', x.id)}
                onClick={async () => {
                  const pub = !x.is_published;
                  setData((d) => ({
                    ...d,
                    reviews: (d.reviews as Row[]).map((r) =>
                      r.id === x.id ? { ...r, is_published: pub } : r
                    ),
                  }));
                  try {
                    const r = await setReviewPublished(x.id, pub);
                    setMsg(
                      r.success
                        ? { kind: 'ok', text: `Review ${pub ? 'published' : 'unpublished'}.` }
                        : { kind: 'err', text: r.error || 'Unable to update review.' }
                    );
                  } catch {
                    setMsg({ kind: 'err', text: 'Unable to update review.' });
                  }
                  load();
                }}
                className="rounded border px-3 py-2 text-xs font-semibold"
              >
                {x.is_published ? 'Unpublish' : 'Publish'}
              </ActionButton>
            </Row>
          ))}
        </Panel>
      </div>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-white p-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-4 divide-y">{children}</div>
    </section>
  );
}

function Row({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-gray-500">{sub}</p>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function ActionButton({
  disabled,
  onClick,
  className,
  children,
}: {
  disabled?: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`${className || ''} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      {children}
    </button>
  );
}