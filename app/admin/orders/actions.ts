'use server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const schema = z.object({ orderId: z.string().uuid(), status: z.enum(['pending','confirmed','processing','shipped','out_for_delivery','delivered','cancelled','refunded']) });
export async function updateOrderStatus(input: unknown) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Invalid order update' };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { success: false, error: 'Admin access required' };
  const { error } = await supabase.rpc('admin_set_order_status', { p_order_id: parsed.data.orderId, p_status: parsed.data.status });
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/orders');
  revalidatePath('/account/orders');
  return { success: true };
}
