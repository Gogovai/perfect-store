import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/database';
import type { ProductWithRelations } from './products';

export type Seller = Tables<'sellers'>;

export type SellerWithProducts = Seller & {
  products: ProductWithRelations[];
  productCount: number;
};

export type PublicSellerOption = Pick<Seller, 'id' | 'store_name' | 'slug'>;

const PRODUCT_SELECT = `*, product_images(id, url, alt_text, sort_order, is_primary), product_variants(id, name, sku, price, compare_at_price, attributes, image_url, is_active), inventory(quantity, reserved_quantity), sellers!inner(id, store_name, logo_url, slug), categories(id, name, slug, parent_id)`;

/**
 * Fetch a seller by their store slug, including their active products.
 */
export async function getSellerBySlug(slug: string): Promise<SellerWithProducts | null> {
  const supabase = await createClient();

  const { data: seller, error } = await supabase
    .from('sellers')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (error || !seller) return null;

  const { data: products } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('seller_id', seller.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  const normalized = (products || []).map((p) => {
    const product = p as unknown as ProductWithRelations;
    return {
      ...product,
      inventory: Array.isArray(product.inventory) ? product.inventory : product.inventory ? [product.inventory] : [],
      sellers: product.sellers ? { ...product.sellers, rating: 0 } : null,
    };
  }) as ProductWithRelations[];

  return {
    ...seller,
    products: normalized,
    productCount: normalized.length,
  };
}

export async function getPublicSellerOptions(): Promise<PublicSellerOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('sellers')
    .select('id, store_name, slug')
    .eq('status', 'active')
    .order('store_name', { ascending: true });

  return error || !data ? [] : data;
}

/**
 * Fetch all active sellers for the stores listing page.
 */
export async function getAllSellers(): Promise<Seller[]> {
  const supabase = await createClient();

  const { data: sellers, error } = await supabase
    .from('sellers')
    .select('*')
    .eq('status', 'active')
    .order('store_name');

  if (error || !sellers) return [];
  return sellers as Seller[];
}
