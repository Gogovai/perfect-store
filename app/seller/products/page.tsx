import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { deactivateProduct, reactivateProduct, resubmitProduct, updateProductStock } from './actions';

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  status: string;
  base_price: number;
  created_at: string;
  updated_at: string;
  rejection_reason: string | null;
  categories: { name: string } | null;
  inventory: Array<{ quantity: number; reserved_quantity: number }> | null;
  product_images: Array<{ url: string; is_primary: boolean }> | null;
};

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'pending_review', label: 'Pending review' },
  { key: 'active', label: 'Approved / Live' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'out_of_stock', label: 'Out of stock' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-blue-100 text-blue-800',
  pending_review: 'bg-amber-100 text-amber-800',
  active: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  inactive: 'bg-gray-200 text-gray-700',
};

function matchesTab(p: ProductRow, tab: TabKey): boolean {
  const available = (p.inventory?.[0]?.quantity ?? 0) - (p.inventory?.[0]?.reserved_quantity ?? 0);
  if (tab === 'all') return true;
  if (tab === 'out_of_stock') return available <= 0;
  return p.status === tab;
}

export default async function SellerProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; msg?: string }>;
}) {
  const { tab: tabParam, msg } = await searchParams;
  const tab: TabKey = (TABS.find((t) => t.key === tabParam)?.key ?? 'all') as TabKey;

  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) redirect('/login');
  const { data: seller } = await s.from('sellers').select('id,store_name,status').eq('owner_id', user.id).maybeSingle();
  if (!seller) redirect('/seller/apply');

  const { data: products } = await s
    .from('products')
    .select('id,name,slug,sku,status,base_price,created_at,updated_at,rejection_reason,categories(name),inventory(quantity,reserved_quantity),product_images(url,is_primary)')
    .eq('seller_id', seller.id)
    .order('created_at', { ascending: false });

  const rows = (products || []) as unknown as ProductRow[];
  const visible = rows.filter((p) => matchesTab(p, tab));
  const countFor = (key: TabKey) => rows.filter((p) => matchesTab(p, key)).length;

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#0f2b5b]">{seller.store_name}</p>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="mt-1 text-sm text-gray-500">Create, edit and submit products for marketplace review.</p>
          </div>
          <Link href="/seller/products/new" className="rounded-xl bg-[#0f2b5b] px-5 py-3 text-sm font-semibold text-white">Add product</Link>
        </div>

        {seller.status !== 'active' && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Your seller account is {seller.status}. Product publishing is available after activation.
          </div>
        )}

        {msg && (
          <div role="status" className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            {msg}
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/seller/products?tab=${t.key}`}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === t.key ? 'bg-[#0f2b5b] text-white' : 'border bg-white text-gray-700'}`}
            >
              {t.label}
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${tab === t.key ? 'bg-white/20' : 'bg-gray-100'}`}>
                {countFor(t.key)}
              </span>
            </Link>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white">
          {visible.length === 0 ? (
            <p className="p-10 text-center text-sm text-gray-500">
              No products in this view. Add your first product when your seller account is active.
            </p>
          ) : (
            visible.map((p) => {
              const available = (p.inventory?.[0]?.quantity ?? 0) - (p.inventory?.[0]?.reserved_quantity ?? 0);
              const image = p.product_images?.find((i) => i.is_primary) || p.product_images?.[0];
              const isLocked = seller.status !== 'active';
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
                        {p.sku || 'No SKU'} · {p.categories?.name || 'No category'} · GHS {Number(p.base_price).toFixed(2)}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        Submitted {new Date(p.created_at).toLocaleDateString()}
                        {p.updated_at !== p.created_at && ` · updated ${new Date(p.updated_at).toLocaleDateString()}`}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[p.status] || 'bg-gray-100'}`}>
                          {p.status.replaceAll('_', ' ')}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${available > 0 ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'}`}>
                          {available > 0 ? `Stock: ${available}` : 'Out of stock'}
                        </span>
                      </div>
                      {p.status === 'rejected' && p.rejection_reason && (
                        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                          Rejected by the marketplace: {p.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {!isLocked && (
                    <div className="flex flex-col items-stretch gap-2 sm:items-end">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link href={`/seller/products/${p.id}/edit`} className="rounded-lg border px-3 py-2 text-xs font-semibold">
                          Edit
                        </Link>
                        <Link href={`/seller/products/${p.id}`} className="rounded-lg border px-3 py-2 text-xs font-semibold">
                          Variants
                        </Link>
                        {p.status !== 'inactive' && (
                          <form action={deactivateProduct}>
                            <input type="hidden" name="productId" value={p.id} />
                            <button className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-700">
                              Deactivate
                            </button>
                          </form>
                        )}
                        {p.status === 'inactive' && (
                          <form action={reactivateProduct}>
                            <input type="hidden" name="productId" value={p.id} />
                            <button className="rounded-lg bg-[#0f2b5b] px-3 py-2 text-xs font-semibold text-white">
                              Reactivate for review
                            </button>
                          </form>
                        )}
                        {p.status === 'rejected' && (
                          <form action={resubmitProduct}>
                            <input type="hidden" name="productId" value={p.id} />
                            <button className="rounded-lg bg-[#0f2b5b] px-3 py-2 text-xs font-semibold text-white">
                              Resubmit
                            </button>
                          </form>
                        )}
                      </div>
                      <form action={updateProductStock} className="flex items-center gap-2">
                        <input type="hidden" name="productId" value={p.id} />
                        <label className="text-xs text-gray-500">Stock</label>
                        <input
                          type="number"
                          name="quantity"
                          min={0}
                          step={1}
                          defaultValue={p.inventory?.[0]?.quantity ?? 0}
                          className="w-24 rounded-lg border px-2 py-1.5 text-xs"
                          required
                        />
                        <button className="rounded-lg border px-3 py-1.5 text-xs font-semibold">
                          Save stock
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
