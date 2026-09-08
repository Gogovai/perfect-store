'use server';

import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Seller product lifecycle actions.
 *
 * Moderation rules enforced here:
 * - Sellers can never publish directly: every path back to the marketplace
 *   goes through `pending_review` for admin approval.
 * - Stock updates are inventory-only and deliberately do NOT re-trigger
 *   moderation (the approved listing does not change).
 * - Removing a product from sale deactivates it; records are never deleted
 *   because a product is no longer published.
 */

const stockSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(0).max(1_000_000),
});

const idSchema = z.object({ productId: z.string().uuid() });

type OwnedProduct =
  | { error: string; product: null; sellerId: null }
  | {
      error: null;
      product: { id: string; name: string; slug: string; status: string };
      sellerId: string;
    };

async function requireOwnedProduct(productId: string): Promise<OwnedProduct> {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return { error: 'Not authenticated', product: null, sellerId: null };
  const { data: seller } = await s
    .from('sellers')
    .select('id,status')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!seller) return { error: 'Seller account required', product: null, sellerId: null };
  if (seller.status !== 'active') {
    return {
      error: `Your seller account is ${seller.status}. Product changes are locked until it is active.`,
      product: null,
      sellerId: null,
    };
  }
  const { data: product } = await s
    .from('products')
    .select('id,name,slug,status,seller_id')
    .eq('id', productId)
    .eq('seller_id', seller.id)
    .maybeSingle();
  if (!product) return { error: 'Product not found', product: null, sellerId: null };
  return {
    error: null,
    product: product as unknown as { id: string; name: string; slug: string; status: string },
    sellerId: seller.id,
  };
}

function refreshProductSurfaces(slug: string) {
  revalidatePath('/seller/products');
  revalidatePath('/seller/dashboard');
  revalidatePath('/admin/products');
  revalidatePath('/admin/dashboard');
  revalidatePath('/products');
  revalidatePath(`/products/${slug}`);
  revalidatePath('/');
}

/** Stock-only update: never sends an approved product back to moderation. */
export async function updateProductStock(formData: FormData) {
  const parsed = stockSchema.safeParse({
    productId: formData.get('productId'),
    quantity: formData.get('quantity'),
  });
  if (!parsed.success) redirect('/seller/products?msg=' + encodeURIComponent(parsed.error.issues[0]?.message || 'Invalid stock update'));

  const owned = await requireOwnedProduct(parsed.data.productId);
  if (owned.error !== null) redirect('/seller/products?msg=' + encodeURIComponent(owned.error));

  const db = getSupabaseAdmin();
  const { data: inv } = await db
    .from('inventory')
    .select('reserved_quantity')
    .eq('product_id', parsed.data.productId)
    .maybeSingle();
  const { error } = await db.from('inventory').upsert(
    {
      product_id: parsed.data.productId,
      quantity: parsed.data.quantity,
      // Reservations from live orders must survive a restock.
      reserved_quantity: inv?.reserved_quantity ?? 0,
      low_stock_threshold: 5,
    },
    { onConflict: 'product_id' }
  );
  if (error) redirect('/seller/products?msg=' + encodeURIComponent(error.message));

  refreshProductSurfaces(owned.product.slug);
  redirect('/seller/products?msg=' + encodeURIComponent(`Stock updated for ${owned.product.name}.`));
}

/** Withdraw a product from sale (active/pending/rejected -> inactive). */
export async function deactivateProduct(formData: FormData) {
  const parsed = idSchema.safeParse({ productId: formData.get('productId') });
  if (!parsed.success) redirect('/seller/products?msg=' + encodeURIComponent('Invalid product'));

  const owned = await requireOwnedProduct(parsed.data.productId);
  if (owned.error !== null) redirect('/seller/products?msg=' + encodeURIComponent(owned.error));
  if (owned.product.status === 'inactive') {
    redirect('/seller/products?msg=' + encodeURIComponent('Product is already inactive.'));
  }

  const db = getSupabaseAdmin();
  const { error } = await db
    .from('products')
    .update({ status: 'inactive', updated_at: new Date().toISOString() })
    .eq('id', parsed.data.productId)
    .eq('seller_id', owned.sellerId);
  if (error) redirect('/seller/products?msg=' + encodeURIComponent(error.message));

  refreshProductSurfaces(owned.product.slug);
  redirect('/seller/products?msg=' + encodeURIComponent(`${owned.product.name} deactivated and removed from the storefront.`));
}

/** Rejected -> pending_review. The previous rejection reason is cleared. */
export async function resubmitProduct(formData: FormData) {
  const parsed = idSchema.safeParse({ productId: formData.get('productId') });
  if (!parsed.success) redirect('/seller/products?msg=' + encodeURIComponent('Invalid product'));

  const owned = await requireOwnedProduct(parsed.data.productId);
  if (owned.error !== null) redirect('/seller/products?msg=' + encodeURIComponent(owned.error));
  if (owned.product.status !== 'rejected') {
    redirect('/seller/products?msg=' + encodeURIComponent('Only rejected products can be resubmitted.'));
  }

  const db = getSupabaseAdmin();
  const { error } = await db
    .from('products')
    .update({ status: 'pending_review', rejection_reason: null, updated_at: new Date().toISOString() })
    .eq('id', parsed.data.productId)
    .eq('seller_id', owned.sellerId);
  if (error) redirect('/seller/products?msg=' + encodeURIComponent(error.message));

  refreshProductSurfaces(owned.product.slug);
  redirect('/seller/products?msg=' + encodeURIComponent(`${owned.product.name} resubmitted for review.`));
}

/** Inactive -> pending_review (back through moderation, never straight live). */
export async function reactivateProduct(formData: FormData) {
  const parsed = idSchema.safeParse({ productId: formData.get('productId') });
  if (!parsed.success) redirect('/seller/products?msg=' + encodeURIComponent('Invalid product'));

  const owned = await requireOwnedProduct(parsed.data.productId);
  if (owned.error !== null) redirect('/seller/products?msg=' + encodeURIComponent(owned.error));
  if (owned.product.status !== 'inactive') {
    redirect('/seller/products?msg=' + encodeURIComponent('Only inactive products can be reactivated.'));
  }

  const db = getSupabaseAdmin();
  const { error } = await db
    .from('products')
    .update({ status: 'pending_review', updated_at: new Date().toISOString() })
    .eq('id', parsed.data.productId)
    .eq('seller_id', owned.sellerId);
  if (error) redirect('/seller/products?msg=' + encodeURIComponent(error.message));

  refreshProductSurfaces(owned.product.slug);
  redirect('/seller/products?msg=' + encodeURIComponent(`${owned.product.name} reactivated and sent for review.`));
}
