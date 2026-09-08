import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProductEditForm, type EditableProduct } from '@/components/seller/ProductEditForm';

export default async function SellerEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) redirect('/login');
  const { data: seller } = await s.from('sellers').select('id,status').eq('owner_id', user.id).maybeSingle();
  if (!seller) redirect('/seller/apply');

  const { data: product } = await s
    .from('products')
    .select('id,name,slug,sku,brand,category_id,description,short_description,base_price,compare_at_price,status,rejection_reason,inventory(quantity),product_images(url,is_primary)')
    .eq('id', id)
    .eq('seller_id', seller.id)
    .maybeSingle();
  if (!product) notFound();

  const { data: categories } = await s
    .from('categories')
    .select('id,name')
    .eq('is_active', true)
    .order('sort_order');

  const images = (product.product_images || []) as Array<{ url: string; is_primary: boolean }>;
  const inventory = (product.inventory || []) as Array<{ quantity: number }>;
  const editable: EditableProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    brand: product.brand,
    category_id: product.category_id,
    description: product.description,
    short_description: product.short_description,
    base_price: product.base_price,
    compare_at_price: product.compare_at_price,
    status: product.status,
    rejection_reason: (product as unknown as { rejection_reason: string | null }).rejection_reason,
    inventory_quantity: inventory[0]?.quantity ?? 0,
    image_url: images.find((i) => i.is_primary)?.url || images[0]?.url || null,
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-3xl px-4">
        <Link href="/seller/products" className="text-sm text-[#0f2b5b]">← Products</Link>
        <div className="mt-3 rounded-2xl border bg-white p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900">Edit product</h1>
          <p className="mt-1 text-sm text-gray-500">
            Saving any listing change sends the product back through marketplace review.
            Stock-only updates can be made from the products list without re-review.
          </p>
          <ProductEditForm product={editable} categories={categories || []} />
        </div>
      </div>
    </main>
  );
}
