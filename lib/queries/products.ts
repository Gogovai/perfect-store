import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/database';

export type ProductRow = Tables<'products'>;
export type ProductImageRow = Tables<'product_images'>;
export type ProductVariantRow = Tables<'product_variants'>;
export type SellerRow = Tables<'sellers'>;
export type CategoryRow = Tables<'categories'>;
export type ProductWithRelations = ProductRow & {
  product_images: ProductImageRow[];
  product_variants: ProductVariantRow[];
  sellers: (Pick<SellerRow, 'id' | 'store_name' | 'logo_url'> & { rating: number }) | null;
  categories: Pick<CategoryRow, 'id' | 'name' | 'slug' | 'parent_id'> | null;
};
export type ProductListResult = {
  products: ProductWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};
export type ProductSortOption =
  | 'newest'
  | 'price_asc'
  | 'price_desc'
  | 'rating'
  | 'most_reviewed'
  | 'popular';
export type ProductFilterOptions = {
  categorySlug?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  search?: string;
  sort?: ProductSortOption;
  page?: number;
  pageSize?: number;
};

const PRODUCT_SELECT = `*, product_images(id, url, alt_text, sort_order, is_primary), product_variants(id, name, sku, price, compare_at_price, attributes, image_url, is_active), sellers!inner(id, store_name, logo_url), categories(id, name, slug, parent_id)`;

async function getProductsQuery() {
  const supabase = await createClient();
  const query = supabase
    .from('products')
    .select(PRODUCT_SELECT, { count: 'exact' })
    .eq('status', 'active')
    .eq('sellers.status', 'active');

  // Do not return the query builder directly from an async function: Supabase
  // query builders are thenables, so returning one causes Promise assimilation
  // and executes the query before callers can add more filters.
  return { query };
}

function normalizeProducts(data: unknown): ProductWithRelations[] {
  return (data as ProductWithRelations[]).map((p) => ({
    ...p,
    sellers: p.sellers ? { ...p.sellers, rating: 0 } : null,
  }));
}

export async function getProducts(
  filters: ProductFilterOptions = {}
): Promise<ProductListResult> {
  const { query: initialQuery } = await getProductsQuery();
  let query = initialQuery;
  const {
    categorySlug,
    categoryId,
    minPrice,
    maxPrice,
    rating,
    search,
    sort = 'newest',
    page = 1,
    pageSize = 20,
  } = filters;

  if (categorySlug || categoryId) {
    const supabase = await createClient();
    const catResult = categorySlug
      ? await supabase
          .from('categories')
          .select('id')
          .eq('is_active', true)
          .eq('slug', categorySlug)
          .single()
      : await supabase
          .from('categories')
          .select('id')
          .eq('is_active', true)
          .eq('id', categoryId!)
          .single();

    const cat = catResult.data;
    if (cat) {
      const { data: subs } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', cat.id)
        .eq('is_active', true);
      query = query.in('category_id', [
        cat.id,
        ...(subs ?? []).map((s) => s.id),
      ]);
    }
  }

  if (minPrice !== undefined) query = query.gte('base_price', minPrice);
  if (maxPrice !== undefined) query = query.lte('base_price', maxPrice);
  if (rating !== undefined) query = query.gte('rating_average', rating);
  if (search?.trim()) {
    const term = search.trim();
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }

  switch (sort) {
    case 'price_asc':
      query = query.order('base_price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('base_price', { ascending: false });
      break;
    case 'rating':
      query = query.order('rating_average', { ascending: false });
      break;
    case 'most_reviewed':
    case 'popular':
      query = query.order('review_count', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  const from = (page - 1) * pageSize;
  const { data, error, count } = await query.range(
    from,
    from + pageSize - 1
  );

  if (error || !data) {
    return { products: [], total: 0, page, pageSize, hasMore: false };
  }

  const products = normalizeProducts(data);
  const total = count ?? 0;
  return {
    products,
    total,
    page,
    pageSize,
    hasMore: from + products.length < total,
  };
}

export async function getProductBySlug(
  slug: string
): Promise<ProductWithRelations | null> {
  const { query } = await getProductsQuery();
  const { data, error } = await query.eq('slug', slug).single();
  if (error || !data) return null;
  return normalizeProducts([data])[0] ?? null;
}

export async function getFeaturedProducts(
  limit = 8
): Promise<ProductWithRelations[]> {
  const { query } = await getProductsQuery();
  const { data, error } = await query
    .eq('is_featured', true)
    .order('rating_average', { ascending: false })
    .limit(limit);
  return error || !data ? [] : normalizeProducts(data);
}

export async function getNewestProducts(
  limit = 8
): Promise<ProductWithRelations[]> {
  const { query } = await getProductsQuery();
  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit);
  return error || !data ? [] : normalizeProducts(data);
}

export async function getTopRatedProducts(
  limit = 8
): Promise<ProductWithRelations[]> {
  const { query } = await getProductsQuery();
  const { data, error } = await query
    .gt('review_count', 0)
    .order('rating_average', { ascending: false })
    .order('review_count', { ascending: false })
    .limit(limit);
  return error || !data ? [] : normalizeProducts(data);
}

export async function getRelatedProducts(
  categoryId: string,
  currentProductId: string,
  limit = 4
): Promise<ProductWithRelations[]> {
  const { query } = await getProductsQuery();
  const { data, error } = await query
    .eq('category_id', categoryId)
    .neq('id', currentProductId)
    .order('rating_average', { ascending: false })
    .limit(limit);
  return error || !data ? [] : normalizeProducts(data);
}