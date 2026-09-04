'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Statuses a seller may set for their own portion of an order. The RPC
// (seller_set_order_status) validates ownership server-side and syncs the
// aggregate order status from all sellers' groups, so one seller can never
// mark a whole multi-vendor order delivered/cancelled/refunded on their own.
const SELLER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
] as const;

export async function sellerSetOrderStatus(orderId: string, status: string) {
  if (!SELLER_STATUSES.includes(status as (typeof SELLER_STATUSES)[number])) {
    return { success: false, error: 'Invalid order status' };
  }

  const s = await createClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: p } = await s
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (p?.role !== 'seller') return { success: false, error: 'Seller access required' };

  const { data: seller } = await s
    .from('sellers')
    .select('id,status')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!seller || seller.status !== 'active') {
    return { success: false, error: 'Seller account is not active' };
  }

  const { error } = await s.rpc('seller_set_order_status', {
    p_order_id: orderId,
    p_status: status,
  });
  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/seller/orders');
  revalidatePath('/account/orders');
  return { success: true };
}