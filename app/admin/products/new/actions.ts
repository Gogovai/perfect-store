'use server';

import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { isClothingCategory } from '@/lib/utils/clothing';

const adminProductSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(180),
  categoryId: z.string().uuid(),
  description: z.string().trim().max(5000).optional(),
  shortDescription: z.string().trim().max(300).optional(),
  sku: z.string().trim().max(80).optional(),
  brand: z.string().trim().max(80).optional(),
  price: z.coerce.number().min(0.01),
  compareAtPrice: z.coerce.number().positive().optional(),
  ratingAverage: z.coerce.number().min(0).max(5).default(0),
  reviewCount: z.coerce.number().int().min(0).default(0),
  quantity: z.coerce.number().int().min(0),
  imageUrl: z.string().url().optional(),
  isFeatured: z.boolean().optional(),
});

export type AdminProductResult = {
  success: boolean;
  productId?: string;
  error?: string;
};

export async function adminCreateProduct(input: unknown): Promise<AdminProductResult> {
  const p = adminProductSchema.safeParse(input);
  if (!p.success) return { success: false, error: p.error.issues[0]?.message || 'Invalid product data' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') return { success: false, error: 'Admin access required' };

  const db = getSupabaseAdmin();
  const d = p.data;
  if (d.compareAtPrice !== undefined && d.compareAtPrice <= d.price) {
    return { success: false, error: 'Compare-at price must be higher than the selling price.' };
  }

  // This is a single-owner catalogue. Legacy seller records are not required.

  // Validate category
  const { data: category } = await db
    .from('categories')
    .select('id,name,slug')
    .eq('id', d.categoryId)
    .eq('is_active', true)
    .maybeSingle();
  if (!category || !isClothingCategory(category.name, category.slug)) {
    return { success: false, error: 'Choose an active clothing, footwear, or fashion-accessory category.' };
  }

  // Create product
  const { data: product, error: productError } = await db
    .from('products')
    .insert({
      seller_id: null,
      category_id: d.categoryId,
      name: d.name,
      slug: d.slug,
      description: d.description || null,
      short_description: d.shortDescription || null,
      sku: d.sku || null,
      brand: d.brand || null,
      base_price: d.price,
      compare_at_price: d.compareAtPrice ?? null,
      rating_average: d.ratingAverage,
      review_count: d.reviewCount,
      status: 'active',
      currency: 'GHS',
      is_featured: d.isFeatured || false,
      owner_type: 'admin',
      created_by: user.id,
    })
    .select('id')
    .single();

  if (productError || !product) {
    if (productError?.code === '23505') return { success: false, error: 'A product with this slug or SKU already exists. Change the slug or SKU and try again.' };
    return { success: false, error: productError?.message || 'Unable to create product' };
  }

  // Create inventory
  const { error: invError } = await db
    .from('inventory')
    .insert({
      product_id: product.id,
      quantity: d.quantity,
      reserved_quantity: 0,
      low_stock_threshold: 5,
    });
  if (invError) {
    await db.from('products').delete().eq('id', product.id);
    return { success: false, error: `Unable to create inventory record: ${invError.message}` };
  }

  // Create product image
  if (d.imageUrl) {
    const { error: imageError } = await db.from('product_images').insert({
      product_id: product.id,
      url: d.imageUrl,
      alt_text: d.name,
      sort_order: 0,
      is_primary: true,
    });
    if (imageError) {
      await db.from('inventory').delete().eq('product_id', product.id);
      await db.from('products').delete().eq('id', product.id);
      return { success: false, error: `The product image could not be saved: ${imageError.message}` };
    }
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    action: 'admin_product_created',
    entity_type: 'product',
    entity_id: product.id,
    new_data: { name: d.name, category_id: d.categoryId, price: d.price, compare_at_price: d.compareAtPrice ?? null, rating_average: d.ratingAverage, review_count: d.reviewCount, quantity: d.quantity, has_image: Boolean(d.imageUrl) },
  });

  revalidatePath('/admin/products');
  revalidatePath('/admin/dashboard');
  revalidatePath('/products');
  revalidatePath('/');
  if (d.categoryId) revalidatePath('/categories');

  return { success: true, productId: product.id };
}
