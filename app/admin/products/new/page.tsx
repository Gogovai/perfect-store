'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { adminCreateProduct } from './actions';
import { isClothingCategory } from '@/lib/utils/clothing';
import { ImageUploader } from '@/components/ui/ImageUploader';

type Category = { id: string; name: string; slug: string; parent_id: string | null };
const field = 'mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100';
const label = 'block text-sm font-semibold text-slate-700';

function slugify(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 180);
}

export default function AdminCreateProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [sku, setSku] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [rating, setRating] = useState('0');
  const [imageUrl, setImageUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  useEffect(() => {
    async function load() {
      const db = createClient();
      const { data: { user }, error: authError } = await db.auth.getUser();
      if (authError || !user) { window.location.assign('/login'); return; }
      const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
      if ((profile as { role?: string } | null)?.role !== 'admin') { window.location.assign('/'); return; }
      const { data, error: categoryError } = await db.from('categories').select('id,name,slug,parent_id').eq('is_active', true).order('sort_order');
      if (categoryError) setError('Could not load product categories. Refresh the page and try again.');
      setCategories(((data ?? []) as Category[]).filter(c => isClothingCategory(c.name, c.slug)));
      setLoading(false);
    }
    void load();
  }, []);

  useEffect(() => {
    if (!slugEdited) setSlug(slugify(name));
  }, [name, slugEdited]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true); setError('');
    const result = await adminCreateProduct({
      name, slug: slug || slugify(name), categoryId, description: description || undefined,
      shortDescription: shortDescription || undefined, sku: sku || undefined, brand: brand || undefined,
      price: Number(price), compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      quantity: Number(quantity), rating: Number(rating), imageUrl: imageUrl || undefined, isFeatured,
    });
    setSubmitting(false);
    if (result.success) router.push('/admin/products?created=1');
    else setError(result.error || 'Unable to create product. Please review the fields and retry.');
  }

  if (loading) return <main className="min-h-screen bg-slate-50 p-8"><div className="mx-auto max-w-4xl rounded-2xl border bg-white p-8 text-sm text-slate-500">Loading product editor…</div></main>;

  return <main className="min-h-screen bg-slate-50 p-4 sm:p-7 lg:p-9">
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><Link href="/admin/products" className="text-sm font-semibold text-blue-800 hover:underline">← Back to products</Link><p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-blue-800">Catalogue management</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Add a product</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Create a product listing, upload its image, set the price and stock, and configure how it appears in the store.</p></div><span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">Admin catalogue</span></div>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-900">01</span><div><h2 className="text-lg font-bold text-slate-950">Product information</h2><p className="mt-1 text-sm text-slate-500">Name, category and details customers will see.</p></div></div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className={label}>Product name <span className="text-red-600">*</span></label><input className={field} value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={160} placeholder="e.g. Classic leather handbag" /></div>
            <div><label className={label}>Product URL slug <span className="text-red-600">*</span></label><input className={field} value={slug} onChange={e => { setSlugEdited(true); setSlug(slugify(e.target.value)); }} required maxLength={180} placeholder="classic-leather-handbag" /><p className="mt-1.5 text-xs text-slate-500">Generated from the name; must be unique.</p></div>
            <div><label className={label}>Category <span className="text-red-600">*</span></label><select className={field} value={categoryId} onChange={e => setCategoryId(e.target.value)} required><option value="">Choose a category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.parent_id ? '— ' : ''}{c.name}</option>)}</select>{categories.length === 0 && <p className="mt-1 text-xs text-amber-700">Create or activate a valid category before adding products.</p>}</div>
            <div><label className={label}>Brand</label><input className={field} value={brand} onChange={e => setBrand(e.target.value)} maxLength={80} placeholder="Brand name" /></div>
            <div><label className={label}>SKU / product code</label><input className={field} value={sku} onChange={e => setSku(e.target.value)} maxLength={80} placeholder="Optional internal code" /></div>
            <div className="sm:col-span-2"><label className={label}>Short description</label><input className={field} value={shortDescription} onChange={e => setShortDescription(e.target.value)} maxLength={300} placeholder="A short summary for product cards" /></div>
            <div className="sm:col-span-2"><label className={label}>Full description</label><textarea className={field} value={description} onChange={e => setDescription(e.target.value)} rows={5} maxLength={5000} placeholder="Describe materials, features, sizing, care instructions and other useful details." /><p className="mt-1.5 text-right text-xs text-slate-400">{description.length}/5000</p></div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-900">02</span><div><h2 className="text-lg font-bold text-slate-950">Pricing & inventory</h2><p className="mt-1 text-sm text-slate-500">Set your selling price, optional crossed-out price and available quantity.</p></div></div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div><label className={label}>Selling price (GHS) <span className="text-red-600">*</span></label><div className="relative"><span className="absolute left-3.5 top-3 text-sm text-slate-400">₵</span><input className={field + ' pl-8'} type="number" value={price} onChange={e => setPrice(e.target.value)} required min="0.01" step="0.01" placeholder="0.00" /></div></div>
            <div><label className={label}>Compare-at price (GHS)</label><div className="relative"><span className="absolute left-3.5 top-3 text-sm text-slate-400">₵</span><input className={field + ' pl-8'} type="number" value={compareAtPrice} onChange={e => setCompareAtPrice(e.target.value)} min="0" step="0.01" placeholder="Optional" /></div><p className="mt-1.5 text-xs text-slate-500">Use a higher original price to show a discount.</p></div>
            <div><label className={label}>Stock quantity <span className="text-red-600">*</span></label><input className={field} type="number" value={quantity} onChange={e => setQuantity(e.target.value)} required min="0" max="1000000" step="1" /><p className="mt-1.5 text-xs text-slate-500">How many units are available now.</p></div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-900">03</span><div><h2 className="text-lg font-bold text-slate-950">Product image & display</h2><p className="mt-1 text-sm text-slate-500">Add clear product photography and configure merchandising.</p></div></div>
          <div className="max-w-xl"><ImageUploader value={imageUrl} onChange={setImageUrl} folder="admin-products" label="Main product image" /></div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between gap-3"><div><label htmlFor="rating" className={label}>Display rating</label><p className="mt-1 text-xs leading-5 text-slate-500">Set the initial catalogue rating from 0 to 5. This is a display value, not a verified customer review.</p></div><strong className="whitespace-nowrap text-xl text-amber-600">★ {Number(rating).toFixed(1)}</strong></div><input id="rating" className="mt-4 w-full accent-amber-500" type="range" min="0" max="5" step="0.1" value={rating} onChange={e => setRating(e.target.value)} /><div className="mt-1 flex justify-between text-xs text-slate-400"><span>0 stars</span><span>5 stars</span></div></div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4"><input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 accent-blue-900" /><span><span className="block text-sm font-semibold text-slate-800">Feature this product</span><span className="mt-1 block text-xs leading-5 text-slate-500">Mark this item for featured product placements where supported.</span></span></label>
          </div>
        </section>

        <div className="sticky bottom-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur"><p className="text-xs text-slate-500"><span className="text-red-600">*</span> Required fields · Product will publish after successful creation.</p><div className="flex gap-3"><Link href="/admin/products" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</Link><button type="submit" disabled={submitting || categories.length === 0} className="rounded-xl bg-[#0f2b5b] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? 'Saving product…' : 'Create & publish product'}</button></div></div>
      </form>
    </div>
  </main>;
}
