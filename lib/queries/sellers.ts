import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/database';
import type { ProductWithRelations } from './products';

type Seller = Tables<'sellers'>;

const PRODUCT_SELECT = `*, product_images(id, url, alt_text, sort_order, is_primary), product_variants(id, name, sku, price, compare_at_price, attributes, image_url, is_active), sellers!inner(id, store_name, logo_url), categories(id, name, slug, parent_id)`;

export type PublicSeller = Pick<
  Seller,
  'id' | 'store_name' | 'slug' | 'description' | 'logo_url' | 'banner_url' | 'phone' | 'email'
>;

export type PublicSellerOption = Pick<Seller, 'id' | 'store_name' | 'slug'>;

export async function getPublicSellerBySlug(slug: string): Promise<PublicSeller | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('sellers')
    .select('id, store_name, slug, description, logo_url, banner_url, phone, email')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  return error || !data ? null : data;
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

export async function getPublicSellerProducts(
  sellerId: string,
  page = 1,
  pageSize = 24
): Promise<{ products: ProductWithRelations[]; total: number; hasMore: boolean }> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const { data, error, count } = await supabase
    .from('products')
    .select(PRODUCT_SELECT, { count: 'exact' })
    .eq('seller_id', sellerId)
    .eq('status', 'active')
    .eq('sellers.status', 'active')
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);

  if (error || !data) return { products: [], total: 0, hasMore: false };

  const products = (data as ProductWithRelations[]).map((product) => ({
    ...product,
    sellers: product.sellers ? { ...product.sellers, rating: 0 } : null,
  }));
  const total = count ?? 0;
  return { products, total, hasMore: from + products.length < total };
}
