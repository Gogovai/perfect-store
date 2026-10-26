'use server';

import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { isClothingCategory } from '@/lib/utils/clothing';

const adminProductSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a URL-friendly slug with lowercase letters, numbers and hyphens.'),
  categoryId: z.string().uuid(),
  description: z.string().trim().max(5000).optional(),
  shortDescription: z.string().trim().max(300).optional(),
  sku: z.string().trim().max(80).optional(),
  brand: z.string().trim().max(80).optional(),
  price: z.coerce.number().finite().min(0.01),
  compareAtPrice: z.coerce.number().finite().min(0).optional(),
  quantity: z.coerce.number().int().min(0).max(1000000),
  rating: z.coerce.number().finite().min(0).max(5).default(0),
  imageUrl: z.string().url().optional(),
  isFeatured: z.boolean().optional(),
});

export type AdminProductResult = { success: boolean; productId?: string; error?: string };

export async function adminCreateProduct(input: unknown): Promise<AdminProductResult> {
  const parsed = adminProductSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || 'Invalid product data.' };

  const session = await createClient();
  const { data: { user }, error: authError } = await session.auth.getUser();
  if (authError || !user) return { success: false, error: 'Sign in with an administrator account to continue.' };

  const { data: profile, error: profileError } = await session.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profileError || profile?.role !== 'admin') return { success: false, error: 'Administrator access is required.' };

  let db;
  try { db = getSupabaseAdmin(); } catch { return { success: false, error: 'Product storage is not configured on the server.' }; }
  const d = parsed.data;

  const { data: category, error: categoryError } = await db.from('categories').select('id,name,slug').eq('id', d.categoryId).eq('is_active', true).maybeSingle();
  if (categoryError || !category || !isClothingCategory(category.name, category.slug)) {
    return { success: false, error: 'Choose an active clothing, footwear or fashion-accessory category.' };
  }

  const { data: existingSlug } = await db.from('products').select('id').eq('slug', d.slug).maybeSingle();
  if (existingSlug) return { success: false, error: 'That product URL slug is already in use. Change the slug and try again.' };

  const { data: product, error: productError } = await db.from('products').insert({
    seller_id: null,
    category_id: d.categoryId,
    name: d.name,
    slug: d.slug,
    description: d.description || null,
    short_description: d.shortDescription || null,
    sku: d.sku || null,
    brand: d.brand || null,
    base_price: d.price,
    compare_at_price: d.compareAtPrice && d.compareAtPrice > 0 ? d.compareAtPrice : null,
    status: 'active',
    currency: 'GHS',
    is_featured: Boolean(d.isFeatured),
    rating_average: d.rating,
    review_count: 0,
    owner_type: 'admin',
    created_by: user.id,
  }).select('id,slug').single();

  if (productError || !product) {
    if (productError?.code === '23505') return { success: false, error: 'A product with this name or slug already exists.' };
    return { success: false, error: 'Unable to create product. Check the product details and database configuration.' };
  }

  const { error: inventoryError } = await db.from('inventory').insert({
    product_id: product.id, quantity: d.quantity, reserved_quantity: 0, low_stock_threshold: 5,
  });
  if (inventoryError) {
    await db.from('products').delete().eq('id', product.id);
    return { success: false, error: 'The product could not be saved with inventory. No incomplete product was kept.' };
  }

  if (d.imageUrl) {
    const { error: imageError } = await db.from('product_images').insert({
      product_id: product.id, url: d.imageUrl, alt_text: d.name, sort_order: 0, is_primary: true,
    });
    if (imageError) {
      await db.from('inventory').delete().eq('product_id', product.id);
      await db.from('products').delete().eq('id', product.id);
      return { success: false, error: 'The product image could not be saved. Please upload the image again and retry.' };
    }
  }

  await db.from('audit_logs').insert({
    actor_id: user.id,
    action: 'admin_product_created',
    entity_type: 'product',
    entity_id: product.id,
    new_data: { name: d.name, category_id: d.categoryId, price: d.price, quantity: d.quantity, rating: d.rating },
  });

  revalidatePath('/admin/products');
  revalidatePath('/admin/dashboard');
  revalidatePath('/products');
  revalidatePath('/');
  revalidatePath('/categories');
  revalidatePath(`/products/${product.slug}`);
  return { success: true, productId: product.id };
}
