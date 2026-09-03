'use server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

const SELLER_STATUSES = ['pending', 'active', 'suspended', 'rejected'] as const;
const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'refunded',
] as const;
const PRODUCT_STATUSES = [
  'draft',
  'pending_review',
  'active',
  'inactive',
  'rejected',
] as const;

/** Authenticate the caller as an admin using the request session. */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase: null, error: 'Not authenticated' };
  const {
    data: profile,
  } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') {
    return { supabase: null, error: 'Admin access required' };
  }
  return { supabase, error: null };
}

export async function setSellerStatus(
  id: string,
  status: (typeof SELLER_STATUSES)[number]
) {
  if (!SELLER_STATUSES.includes(status)) {
    return { success: false, error: 'Invalid seller status' };
  }
  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) {
    return { success: false, error: authError ?? 'Admin access required' };
  }
  const { error } = await supabase.rpc('admin_set_seller_status', {
    p_seller_id: id,
    p_status: status,
  });
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/dashboard');
  revalidatePath('/seller/dashboard');
  return { success: true };
}

export async function setOrderStatus(
  id: string,
  status: (typeof ORDER_STATUSES)[number]
) {
  if (!ORDER_STATUSES.includes(status)) {
    return { success: false, error: 'Invalid order status' };
  }
  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) {
    return { success: false, error: authError ?? 'Admin access required' };
  }
  const { error } = await supabase.rpc('admin_set_order_status', {
    p_order_id: id,
    p_status: status,
  });
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/dashboard');
  revalidatePath('/account/orders');
  return { success: true };
}

export async function setProductStatus(
  id: string,
  status: (typeof PRODUCT_STATUSES)[number]
) {
  if (!PRODUCT_STATUSES.includes(status)) {
    return { success: false, error: 'Invalid product status' };
  }
  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) {
    return { success: false, error: authError ?? 'Admin access required' };
  }
  // Direct product updates are restricted by RLS for session clients, so
  // moderation runs through the service-role client.
  let adminClient;
  try {
    adminClient = getSupabaseAdmin();
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
  const { error } = await adminClient
    .from('products')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/dashboard');
  revalidatePath('/products');
  return { success: true };
}

export async function setReviewPublished(id: string, published: boolean) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) {
    return { success: false, error: authError ?? 'Admin access required' };
  }
  let adminClient;
  try {
    adminClient = getSupabaseAdmin();
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
  const { error } = await adminClient
    .from('reviews')
    .update({ is_published: published, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/dashboard');
  return { success: true };
}

export async function setCustomerActive(id: string, active: boolean) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) {
    return { success: false, error: authError ?? 'Admin access required' };
  }
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: active, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('role', 'customer');
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/dashboard');
  return { success: true };
}
