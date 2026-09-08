'use server';

import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const adminProductSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(180),
  categoryId: z.string().uuid(),
  description: z.string().trim().max(5000).optional(),
  shortDescription: z.string().trim().max(300).optional(),
  sku: z.string().trim().max(80).optional(),
  brand: z.string().trim().max(80).optional(),
  price: z.coerce.number().min(0.01),
  compareAtPrice: z.coerce.number().min(0).optional(),
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

  // Get or create admin seller record
  let { data: adminSeller } = await db
    .from('sellers')
    .select('id')
    .eq('owner_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!adminSeller) {
    const { data: newSeller } = await db
      .from('sellers')
      .insert({
        owner_id: user.id,
        store_name: 'Marketplace Admin',
        slug: `marketplace-admin-${user.id.slice(0, 8)}`,
        status: 'active',
        commission_rate: 0,
      })
      .select('id')
      .single();
    adminSeller = newSeller;
  }

  if (!adminSeller) return { success: false, error: 'Unable to create admin seller record' };

  // Validate category
  const { data: category } = await db
    .from('categories')
    .select('id')
    .eq('id', d.categoryId)
    .eq('is_active', true)
    .maybeSingle();
  if (!category) return { success: false, error: 'Invalid or inactive category' };

  // Create product
  const { data: product, error: productError } = await db
    .from('products')
    .insert({
      seller_id: adminSeller.id,
      category_id: d.categoryId,
      name: d.name,
      slug: d.slug,
      description: d.description || null,
      short_description: d.shortDescription || null,
      sku: d.sku || null,
      brand: d.brand || null,
      base_price: d.price,
      compare_at_price: d.compareAtPrice || null,
      status: 'active',
      currency: 'GHS',
      is_featured: d.isFeatured || false,
      owner_type: 'admin',
      created_by: user.id,
    })
    .select('id')
    .single();

  if (productError || !product) return { success: false, error: productError?.message || 'Unable to create product' };

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
    return { success: false, error: 'Unable to create inventory record' };
  }

  // Create product image
  if (d.imageUrl) {
    await db.from('product_images').insert({
      product_id: product.id,
      url: d.imageUrl,
      alt_text: d.name,
      sort_order: 0,
      is_primary: true,
    });
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    action: 'admin_product_created',
    entity_type: 'product',
    entity_id: product.id,
    new_data: { name: d.name, category_id: d.categoryId, price: d.price, quantity: d.quantity },
  });

  revalidatePath('/admin/products');
  revalidatePath('/admin/dashboard');
  revalidatePath('/products');
  revalidatePath('/');
  if (d.categoryId) revalidatePath('/categories');

  return { success: true, productId: product.id };
}
