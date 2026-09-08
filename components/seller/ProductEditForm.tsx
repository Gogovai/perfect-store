'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateProduct } from '@/app/seller/dashboard/actions';
import { ImageUploader } from '@/components/ui/ImageUploader';

export type EditableProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  brand: string | null;
  category_id: string | null;
  description: string | null;
  short_description: string | null;
  base_price: number;
  compare_at_price: number | null;
  status: string;
  rejection_reason: string | null;
  inventory_quantity: number;
  image_url: string | null;
};

export function ProductEditForm({
  product,
  categories,
}: {
  product: EditableProduct;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: product.name,
    slug: product.slug,
    sku: product.sku || '',
    brand: product.brand || '',
    categoryId: product.category_id || '',
    description: product.description || '',
    shortDescription: product.short_description || '',
    price: String(product.base_price ?? ''),
    compareAtPrice: product.compare_at_price != null ? String(product.compare_at_price) : '',
    quantity: String(product.inventory_quantity ?? 0),
    imageUrl: product.image_url || '',
  });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg('Saving…');
    const r = await updateProduct(product.id, form);
    setBusy(false);
    if (!r.success) {
      setMsg(r.error || 'Unable to update product');
      return;
    }
    // Any listing edit re-enters moderation, so the seller sees the new state.
    router.push(`/seller/products?tab=pending_review&msg=${encodeURIComponent(`${product.name} updated and sent for review.`)}`);
  }

  const willRemoderate = product.status === 'active';

  return (
    <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
      {willRemoderate && (
        <p className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          This product is live. Saving changes sends it back through marketplace review before it is visible again.
        </p>
      )}
      {product.status === 'rejected' && product.rejection_reason && (
        <p className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Previous rejection reason: {product.rejection_reason}
        </p>
      )}
      <label className="sm:col-span-2 text-sm font-medium">
        Product name
        <input required value={form.name} onChange={(e) => set('name', e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-3" />
      </label>
      <label className="text-sm font-medium">
        Slug
        <input required value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="product-name" className="mt-1 w-full rounded-xl border px-3 py-3" />
      </label>
      <label className="text-sm font-medium">
        SKU
        <input value={form.sku} onChange={(e) => set('sku', e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-3" />
      </label>
      <label className="text-sm font-medium">
        Brand
        <input value={form.brand} onChange={(e) => set('brand', e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-3" />
      </label>
      <label className="text-sm font-medium">
        Category
        <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-3" required>
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium">
        Price (GHS)
        <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-3" />
      </label>
      <label className="text-sm font-medium">
        Compare-at price
        <input type="number" min="0" step="0.01" value={form.compareAtPrice} onChange={(e) => set('compareAtPrice', e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-3" />
      </label>
      <label className="text-sm font-medium">
        Stock
        <input required type="number" min="0" step="1" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-3" />
      </label>
      <div className="sm:col-span-2">
        <ImageUploader
          value={form.imageUrl}
          onChange={(url) => set('imageUrl', url)}
          folder="seller-products"
          label="Product Image"
        />
      </div>
      <label className="sm:col-span-2 text-sm font-medium">
        Short description
        <textarea maxLength={300} rows={2} value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-3" />
      </label>
      <label className="sm:col-span-2 text-sm font-medium">
        Description
        <textarea maxLength={5000} rows={6} value={form.description} onChange={(e) => set('description', e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-3" />
      </label>
      {msg && <p className="sm:col-span-2 text-sm text-gray-600">{msg}</p>}
      <button disabled={busy} className="sm:col-span-2 rounded-xl bg-[#0f2b5b] px-5 py-3 font-semibold text-white disabled:opacity-50">
        {busy ? 'Saving…' : willRemoderate ? 'Save and send for review' : 'Save changes'}
      </button>
    </form>
  );
}
