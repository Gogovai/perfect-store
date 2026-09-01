'use server';

/**
 * Wishlist server actions.
 * Handles database wishlist operations for authenticated users.
 */

import { createClient } from '@/lib/supabase/server';
import type { TablesInsert } from '@/types/database';

export type WishlistActionResult = {
  success: boolean;
  error?: string;
  inWishlist?: boolean;
};

/**
 * A wishlist item with full product data from the database.
 */
export type WishlistItemWithProduct = {
  id: string;
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  slug: string;
  sellerName: string;
  averageRating: number;
  reviewCount: number;
};

/**
 * Get the authenticated user's full wishlist with product data.
 */
export async function getUserWishlistItems(): Promise<WishlistItemWithProduct[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: wl } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!wl) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: items } = await (supabase as any)
    .from('wishlist_items')
    .select(`
      id,
      product_id,
      products!inner(
        id,
        name,
        slug,
        base_price,
        is_active,
        status,
        average_rating,
        review_count,
        product_images(url, is_primary),
        sellers!inner(shop_name)
      )
    `)
    .eq('wishlist_id', wl.id);

  if (!items) return [];

  return items
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((item: any) => {
      const product = item.products;
      return product.is_active && product.status === 'active';
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((item: any) => {
      const product = item.products;
      const images = product.product_images as Array<{ url: string; is_primary: boolean }>;
      const primaryImage = images?.find((img: { is_primary: boolean }) => img.is_primary) || images?.[0];

      return {
        id: item.id,
        productId: item.product_id,
        name: product.name,
        price: product.base_price,
        imageUrl: primaryImage?.url || '',
        slug: product.slug,
        sellerName: product.sellers?.shop_name || '',
        averageRating: product.average_rating || 0,
        reviewCount: product.review_count || 0,
      };
    });
}

/**
 * Check if a product is in the user's wishlist.
 */
export async function isInWishlist(productId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: wl } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!wl) return false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: item } = await (supabase as any)
    .from('wishlist_items')
    .select('id')
    .eq('wishlist_id', wl.id)
    .eq('product_id', productId)
    .single();

  return !!item;
}

/**
 * Toggle a product in the user's wishlist.
 */
export async function toggleWishlistItem(productId: string): Promise<WishlistActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  let { data: wl } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!wl) {
    const { data: newWl } = await supabase
      .from('wishlists')
      .insert({ user_id: user.id } as TablesInsert<'wishlists'>)
      .select('id')
      .single();
    wl = newWl;
  }

  if (!wl) return { success: false, error: 'Failed to create wishlist' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('wishlist_items')
    .select('id')
    .eq('wishlist_id', wl.id)
    .eq('product_id', productId)
    .single();

  if (existing) {
    await supabase.from('wishlist_items').delete().eq('id', existing.id);
    return { success: true, inWishlist: false };
  }

  await supabase
    .from('wishlist_items')
    .insert({
      wishlist_id: wl.id,
      product_id: productId,
    } as TablesInsert<'wishlist_items'>);

  return { success: true, inWishlist: true };
}

/**
 * Remove a product from the user's wishlist.
 */
export async function removeFromWishlist(productId: string): Promise<WishlistActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: wl } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!wl) return { success: true };

  await supabase
    .from('wishlist_items')
    .delete()
    .eq('wishlist_id', wl.id)
    .eq('product_id', productId);

  return { success: true, inWishlist: false };
}

/**
 * Get wishlist item count.
 */
export async function getWishlistItemCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data: wl } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!wl) return 0;

  const { count } = await supabase
    .from('wishlist_items')
    .select('*', { count: 'exact', head: true })
    .eq('wishlist_id', wl.id);

  return count || 0;
}
