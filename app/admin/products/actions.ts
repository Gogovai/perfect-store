'use server';

import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const schema = z.object({
  productId: z.string().uuid(),
  status: z.enum(['active', 'rejected', 'inactive']),
  reason: z.string().trim().max(500).optional(),
});

export type ModerateProductResult = {
  success: boolean;
  error?: string;
  message?: string;
};

/** Validate and publish, reject, or deactivate a product as the store owner. */
export async function moderateProduct(input: unknown): Promise<ModerateProductResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Invalid product update request.' };

  const { productId, status, reason } = parsed.data;
  if (status === 'rejected' && !reason) {
    return { success: false, error: 'A reason is required when rejecting a product.' };
  }

  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated.' };

  const { data: profile } = await session
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.role !== 'admin') return { success: false, error: 'Admin access required.' };

  const { data: product, error: productError } = await session
    .from('products')
    .select('id,name,slug,status,base_price,description,short_description,category_id,categories(id,name,is_active)')
    .eq('id', productId)
    .maybeSingle();

  if (productError) return { success: false, error: 'Unable to load this product.' };
  if (!product) return { success: false, error: 'Product not found.' };

  const category = (product as unknown as {
    categories: { id: string; name: string; is_active: boolean } | null;
  }).categories;

  if (status === 'active') {
    if (product.status === 'active') return { success: false, error: 'Product is already published.' };
    if (!product.name?.trim()) return { success: false, error: 'Product is missing a name.' };
    if (!(Number(product.base_price) > 0)) return { success: false, error: 'Product must have a price greater than zero.' };
    if (!product.description?.trim() && !product.short_description?.trim()) {
      return { success: false, error: 'Add a product description before publishing.' };
    }
    if (!category) return { success: false, error: 'Assign this product to a category before publishing.' };
    if (!category.is_active) return { success: false, error: `Category "${category.name}" is inactive.` };

    const { data: inventory, error: inventoryError } = await session
      .from('inventory')
      .select('product_id')
      .eq('product_id', product.id)
      .maybeSingle();
    if (inventoryError) return { success: false, error: 'Unable to verify product inventory.' };
    if (!inventory) return { success: false, error: 'Set the product stock before publishing.' };
  }

  let adminClient;
  try {
    adminClient = getSupabaseAdmin();
  } catch {
    return { success: false, error: 'Server-side admin database access is not configured.' };
  }

  const { error: updateError } = await adminClient
    .from('products')
    .update({
      status,
      rejection_reason: status === 'rejected' ? reason ?? null : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId);

  if (updateError) return { success: false, error: 'Unable to update the product.' };

  await adminClient.from('audit_logs').insert({
    actor_id: user.id,
    action: status === 'active' ? 'product_published' : status === 'rejected' ? 'product_rejected' : 'product_deactivated',
    entity_type: 'product',
    entity_id: productId,
    old_data: { status: product.status },
    new_data: { status, reason: status === 'rejected' ? reason : null },
  });

  revalidatePath('/admin/products');
  revalidatePath('/admin/dashboard');
  revalidatePath('/products');
  revalidatePath(`/products/${product.slug}`);
  revalidatePath('/');
  revalidatePath('/categories');

  return {
    success: true,
    message: status === 'active'
      ? 'Product published successfully.'
      : status === 'rejected'
        ? 'Product rejected.'
        : 'Product deactivated.',
  };
}
