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

/**
 * Full product moderation lifecycle (approve / reject / deactivate).
 *
 * Approval gates every pre-condition the marketplace depends on before a
 * product may go live: the product exists, its seller is active, required
 * listing information is present, the category is valid and an inventory
 * record exists. The state change, audit log and seller notification are all
 * performed server-side, so the client never supplies status or reason
 * directly to the database.
 */
export async function moderateProduct(input: unknown): Promise<ModerateProductResult> {
  const p = schema.safeParse(input);
  if (!p.success) return { success: false, error: 'Invalid moderation request' };

  const { productId, status, reason } = p.data;
  if (status === 'rejected' && !reason) {
    return { success: false, error: 'A rejection reason is required.' };
  }

  const s = await createClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  const { data: profile } = await s
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') return { success: false, error: 'Admin access required' };

  const { data: product } = await s
    .from('products')
    .select('id,seller_id,name,slug,status,base_price,description,short_description,category_id,categories(id,name,is_active),sellers(id,store_name,status,owner_id)')
    .eq('id', productId)
    .maybeSingle();
  if (!product) return { success: false, error: 'Product not found' };

  const seller = (product as unknown as {
    sellers: { id: string; store_name: string; status: string; owner_id: string } | null;
  }).sellers;
  const category = (product as unknown as {
    categories: { id: string; name: string; is_active: boolean } | null;
  }).categories;

  if (status === 'active') {
    // Approval pre-conditions — every gate is verified server-side.
    if (product.status === 'active') {
      return { success: false, error: 'Product is already published.' };
    }
    if (!seller) {
      return { success: false, error: 'Product has no seller owner.' };
    }
    if (seller.status !== 'active') {
      return {
        success: false,
        error: `Seller "${seller.store_name}" is ${seller.status}. Only active sellers' products can be approved.`,
      };
    }
    if (!product.name?.trim()) {
      return { success: false, error: 'Product is missing a name.' };
    }
    if (!(Number(product.base_price) > 0)) {
      return { success: false, error: 'Product must have a price greater than zero.' };
    }
    if (!product.description?.trim() && !product.short_description?.trim()) {
      return { success: false, error: 'Product needs a description before it can be published.' };
    }
    if (!category) {
      return { success: false, error: 'Product must be assigned to a category before publication.' };
    }
    if (!category.is_active) {
      return { success: false, error: `Category "${category.name}" is inactive. Assign an active category first.` };
    }
    const { data: inventory } = await s
      .from('inventory')
      .select('id')
      .eq('product_id', product.id)
      .maybeSingle();
    if (!inventory) {
      return { success: false, error: 'Product has no inventory record. Stock must be set before publication.' };
    }
  }

  // Direct updates are restricted by RLS for session clients, so moderation
  // runs through the service-role client.
  let adminClient;
  try {
    adminClient = getSupabaseAdmin();
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
  const now = new Date().toISOString();
  const { error } = await adminClient
    .from('products')
    .update({
      status,
      // A published product carries no rejection history; a rejected one must.
      rejection_reason: status === 'rejected' ? (reason ?? null) : null,
      updated_at: now,
    })
    .eq('id', productId);
  if (error) return { success: false, error: error.message };

  const actionByStatus = {
    active: 'product_approved',
    rejected: 'product_rejected',
    inactive: 'product_deactivated',
  } as const;

  await s.from('audit_logs').insert({
    actor_id: user.id,
    action: actionByStatus[status],
    entity_type: 'product',
    entity_id: productId,
    old_data: { status: product.status },
    new_data: { status, reason: status === 'rejected' ? reason : null },
  });

  const sellerOwnerId = seller?.owner_id;
  if (sellerOwnerId) {
    const notificationByStatus = {
      active: {
        title: 'Product approved',
        message: `${product.name} is now live in the marketplace.`,
      },
      rejected: {
        title: 'Product rejected',
        message: `${product.name} was rejected. Reason: ${reason}`,
      },
      inactive: {
        title: 'Product deactivated',
        message: `${product.name} has been deactivated by the marketplace and is no longer visible to customers.`,
      },
    } as const;

    await s.from('notifications').insert({
      user_id: sellerOwnerId,
      type: 'product_status',
      data: { product_id: product.id, status },
      ...notificationByStatus[status],
    });
  }

  // Moderation queue + storefront surfaces (listing, detail, category, home).
  revalidatePath('/admin/products');
  revalidatePath('/admin/dashboard');
  revalidatePath('/products');
  revalidatePath(`/products/${product.slug}`);
  revalidatePath('/');
  if (category) revalidatePath('/categories');

  const messages = {
    active: 'Product approved and published successfully',
    rejected: 'Product rejected. The seller has been notified with your reason.',
    inactive: 'Product deactivated and removed from the storefront.',
  } as const;

  return { success: true, message: messages[status] };
}