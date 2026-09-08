'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { adminCreateProduct } from './actions';
import { ImageUploader } from '@/components/ui/ImageUploader';

type Category = { id: string; name: string; slug: string; parent_id: string | null };

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 180);
}

export default function AdminCreateProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [sku, setSku] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  useEffect(() => {
    async function load() {
      const s = createClient();
      const { data: { user } } = await s.auth.getUser();
      if (!user) { location.href = '/login'; return; }
      const { data: p } = await s.from('profiles').select('role').eq('id', user.id).maybeSingle();
      if ((p as { role?: string } | null)?.role !== 'admin') { location.href = '/'; return; }

      const { data } = await s
        .from('categories')
        .select('id,name,slug,parent_id')
        .eq('is_active', true)
        .order('sort_order');
      setCategories((data || []) as Category[]);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (name && !slug) {
      setSlug(slugify(name));
    }
  }, [name, slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setToast(null);

    const result = await adminCreateProduct({
      name,
      slug: slug || slugify(name),
      categoryId,
      description: description || undefined,
      shortDescription: shortDescription || undefined,
      sku: sku || undefined,
      brand: brand || undefined,
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      quantity: Number(quantity),
      imageUrl: imageUrl || undefined,
      isFeatured,
    });

    setSubmitting(false);

    if (result.success) {
      setToast({ kind: 'ok', text: 'Product created and published successfully.' });
      setTimeout(() => router.push('/admin/products'), 1500);
    } else {
      setError(result.error || 'Unable to create product.');
    }
  }

  if (loading) return <main className="min-h-screen bg-gray-50 p-8">Loading...</main>;

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <p className="text-sm font-semibold text-[#0f2b5b]">Admin product</p>
          <h1 className="text-3xl font-bold">Create Marketplace Product</h1>
          <p className="mt-1 text-sm text-gray-500">
            Admin-created products are published immediately and do not require seller approval.
          </p>
        </header>

        {toast && (
          <div role="status" className={`rounded-xl border p-4 text-sm ${toast.kind === 'ok' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
            {toast.text}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-2xl border bg-white p-6 space-y-4">
            <h2 className="text-lg font-semibold">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700">Product Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={160}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Premium Ghana Cocoa Butter"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                maxLength={180}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="auto-generated-from-name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.parent_id ? '  └ ' : ''}{c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Brand</label>
                <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} maxLength={80}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">SKU</label>
                <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} maxLength={80}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Short Description</label>
              <input type="text" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} maxLength={300}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief summary for product listings" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={5000} rows={5}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Detailed product description" />
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-6 space-y-4">
            <h2 className="text-lg font-semibold">Pricing & Inventory</h2>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Price (GHS) *</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required min="0.01" step="0.01"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Compare-at Price (GHS)</label>
                <input type="number" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} min="0" step="0.01"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Stock Quantity *</label>
                <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required min="0" step="1"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-6 space-y-4">
            <h2 className="text-lg font-semibold">Media</h2>
            <ImageUploader
              value={imageUrl}
              onChange={setImageUrl}
              folder="admin-products"
              label="Product Image"
            />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm font-medium text-gray-700">Featured product</span>
            </label>
          </section>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => router.back()}
              className="rounded-lg border px-4 py-2 text-sm font-semibold">Cancel</button>
            <button type="submit" disabled={submitting}
              className="rounded-lg bg-[#0f2b5b] px-6 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create & Publish Product'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
