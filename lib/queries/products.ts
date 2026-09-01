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
  sellers: Pick<SellerRow, 'id' | 'shop_name' | 'logo_url' | 'rating'> | null;
  categories: Pick<CategoryRow, 'id' | 'name' | 'slug' | 'parent_id'> | null;
};

export type ProductListResult = {
  products: ProductWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type ProductSortOption = 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'most_reviewed' | 'popular';

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

const PRODUCT_SELECT = `
  *,
  product_images!inner(id, url, alt_text, sort_order, is_primary),
  product_variants(id, name, sku, price, is_active),
  sellers!inner(id, shop_name, logo_url, rating),
  categories!inner(id, name, slug, parent_id)
`;

/**
 * Fetch a paginated list of products with filters and sorting.
 */
export async function getProducts(
  filters: ProductFilterOptions = {}
): Promise<ProductListResult> {
  const supabase = await createClient();
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

  let query = supabase
    .from('products')
    .select(PRODUCT_SELECT, { count: 'exact' })
    .eq('status', 'active')
    .eq('is_active', true)
    .eq('sellers.status', 'active');

  // Category filter — if slug provided, first resolve the category ID and include subcategories
  if (categorySlug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .eq('is_active', true)
      .single();

    if (cat) {
      const catId = (cat as { id: string }).id;
      // Also fetch subcategory IDs
      const { data: subs } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', catId)
        .eq('is_active', true);

      const categoryIds = [catId, ...((subs as { id: string }[])?.map((s) => s.id) || [])];
      query = query.in('category_id', categoryIds);
    }
  } else if (categoryId) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('id', categoryId)
      .single();

    if (cat) {
      const catId = (cat as { id: string }).id;
      const { data: subs } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', catId)
        .eq('is_active', true);

      const categoryIds = [catId, ...((subs as { id: string }[])?.map((s) => s.id) || [])];
      query = query.in('category_id', categoryIds);
    }
  }

  // Price filter
  if (minPrice !== undefined) {
    query = query.gte('base_price', minPrice);
  }
  if (maxPrice !== undefined) {
    query = query.lte('base_price', maxPrice);
  }

  // Rating filter
  if (rating !== undefined) {
    query = query.gte('average_rating', rating);
  }

  // Text search
  if (search && search.trim()) {
    query = query.or(`name.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`);
  }

  // Sorting
  switch (sort) {
    case 'price_asc':
      query = query.order('base_price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('base_price', { ascending: false });
      break;
    case 'rating':
      query = query.order('average_rating', { ascending: false });
      break;
    case 'most_reviewed':
      query = query.order('review_count', { ascending: false });
      break;
    case 'popular':
      query = query.order('sold_count', { ascending: false });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error || !data) {
    return { products: [], total: 0, page, pageSize, hasMore: false };
  }

  const total = count || 0;

  return {
    products: data as unknown as ProductWithRelations[],
    total,
    page,
    pageSize,
    hasMore: from + data.length < total,
  };
}

/**
 * Fetch a single product by slug with all relations.
 */
export async function getProductBySlug(slug: string): Promise<ProductWithRelations | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .eq('status', 'active')
    .eq('is_active', true)
    .single();

  if (error || !data) return null;

  return data as unknown as ProductWithRelations;
}

/**
 * Fetch featured/popular products for the homepage.
 */
export async function getFeaturedProducts(limit: number = 8): Promise<ProductWithRelations[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('status', 'active')
    .eq('is_active', true)
    .eq('sellers.status', 'active')
    .order('sold_count', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data as unknown as ProductWithRelations[];
}

/**
 * Fetch newest products for the homepage.
 */
export async function getNewestProducts(limit: number = 8): Promise<ProductWithRelations[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('status', 'active')
    .eq('is_active', true)
    .eq('sellers.status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data as unknown as ProductWithRelations[];
}

/**
 * Fetch products with the highest ratings.
 */
export async function getTopRatedProducts(limit: number = 8): Promise<ProductWithRelations[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('status', 'active')
    .eq('is_active', true)
    .eq('sellers.status', 'active')
    .gt('review_count', 0)
    .order('average_rating', { ascending: false })
    .order('review_count', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data as unknown as ProductWithRelations[];
}

/**
 * Fetch related products (same category, excluding current product).
 */
export async function getRelatedProducts(
  categoryId: string,
  currentProductId: string,
  limit: number = 4
): Promise<ProductWithRelations[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('category_id', categoryId)
    .eq('status', 'active')
    .eq('is_active', true)
    .eq('sellers.status', 'active')
    .neq('id', currentProductId)
    .order('sold_count', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data as unknown as ProductWithRelations[];
}
