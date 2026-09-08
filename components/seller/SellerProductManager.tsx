'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createProduct, deleteProduct, updateProduct } from '@/app/seller/dashboard/actions';

type ProductForm = { name: string; slug: string; sku: string; brand: string; categoryId: string; price: string; compareAtPrice: string; quantity: string; imageUrl: string; description: string; shortDescription: string };
const emptyForm: ProductForm = { name: '', slug: '', sku: '', brand: '', categoryId: '', price: '', compareAtPrice: '', quantity: '0', imageUrl: '', description: '', shortDescription: '' };

function formFromProduct(product: any): ProductForm {
  return { name: product.name || '', slug: product.slug || '', sku: product.sku || '', brand: product.brand || '', categoryId: product.category_id || '', price: String(product.base_price ?? ''), compareAtPrice: String(product.compare_at_price ?? ''), quantity: String(product.inventory?.[0]?.quantity ?? product.quantity ?? 0), imageUrl: product.image_url || '', description: product.description || '', shortDescription: product.short_description || '' };
}

export function SellerProductManager({ categories, products }: { categories: { id: string; name: string }[]; products: any[] }) {
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  function setField(field: keyof ProductForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    if (field === 'name' && !editingId) setForm((current) => ({ ...current, name: value, slug: value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    const result = editingId ? await updateProduct(editingId, form) : await createProduct(form);
    setMessage(result.success ? (editingId ? 'Product updated and sent for review.' : 'Product submitted for review.') : result.error || 'Unable to save product.');
    if (result.success) { setEditingId(null); setForm(emptyForm); window.location.reload(); }
    setBusy(false);
  }

  async function remove(productId: string) {
    if (!window.confirm('Remove this product from sale? Its record is kept and it can be reactivated later.')) return;
    setBusy(true); const result = await deleteProduct(productId); setMessage(result.success ? 'Product deactivated and removed from sale.' : result.error || 'Unable to update product.');
    if (result.success) window.location.reload(); setBusy(false);
  }

  return <div className="space-y-8">
    <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-white p-6">
      <div className="flex items-center justify-between gap-4"><h2 className="text-lg font-semibold">{editingId ? 'Edit product' : 'Add product'}</h2>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="text-sm text-gray-500">Cancel</button>}</div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <input required placeholder="Product name" value={form.name} onChange={(e) => setField('name', e.target.value)} className="rounded-lg border px-3 py-2" />
        <input required placeholder="Slug" value={form.slug} onChange={(e) => setField('slug', e.target.value)} className="rounded-lg border px-3 py-2" />
        <input placeholder="SKU" value={form.sku} onChange={(e) => setField('sku', e.target.value)} className="rounded-lg border px-3 py-2" />
        <input placeholder="Brand" value={form.brand} onChange={(e) => setField('brand', e.target.value)} className="rounded-lg border px-3 py-2" />
        <select value={form.categoryId} onChange={(e) => setField('categoryId', e.target.value)} className="rounded-lg border px-3 py-2"><option value="">Category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
        <input required type="number" min="0" step="0.01" placeholder="Price (GHS)" value={form.price} onChange={(e) => setField('price', e.target.value)} className="rounded-lg border px-3 py-2" />
        <input type="number" min="0" step="0.01" placeholder="Compare-at price" value={form.compareAtPrice} onChange={(e) => setField('compareAtPrice', e.target.value)} className="rounded-lg border px-3 py-2" />
        <input required type="number" min="0" step="1" placeholder="Quantity" value={form.quantity} onChange={(e) => setField('quantity', e.target.value)} className="rounded-lg border px-3 py-2" />
        <input type="url" placeholder="Product image URL (optional)" value={form.imageUrl} onChange={(e) => setField('imageUrl', e.target.value)} className="rounded-lg border px-3 py-2" />
        <input placeholder="Short description" value={form.shortDescription} onChange={(e) => setField('shortDescription', e.target.value)} className="rounded-lg border px-3 py-2 sm:col-span-2" />
        <textarea placeholder="Full description" value={form.description} onChange={(e) => setField('description', e.target.value)} className="rounded-lg border px-3 py-2 sm:col-span-2 lg:col-span-3" rows={3} />
      </div>
      <button disabled={busy} type="submit" className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50">{busy ? 'Saving...' : editingId ? 'Save changes' : 'Submit product'}</button>{message && <p className="text-sm text-gray-600">{message}</p>}
    </form>
    <section className="rounded-2xl border bg-white p-6"><h2 className="text-lg font-semibold">My products</h2><div className="mt-4 divide-y">{products.length === 0 ? <p className="py-4 text-sm text-gray-500">No products yet.</p> : products.map((product) => <div key={product.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{product.name}</p><p className="text-sm text-gray-500">GHS {Number(product.base_price).toFixed(2)} · {product.status}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setEditingId(product.id); setForm(formFromProduct(product)); setMessage(''); }} className="rounded-lg border px-3 py-2 text-sm">Edit</button><Link href={`/seller/products/${product.id}`} className="rounded-lg border px-3 py-2 text-sm">Variants</Link><button type="button" disabled={busy} onClick={() => remove(product.id)} className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50">Delete</button></div></div>)}</div></section>
  </div>;
}