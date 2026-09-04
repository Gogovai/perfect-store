'use server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const schema = z.object({
  sellerId: z.string().uuid(),
  status: z.enum(['pending', 'active', 'suspended', 'rejected']),
});

export async function updateSellerStatus(input: unknown) {
  const p = schema.safeParse(input);
  if (!p.success) return { success: false, error: 'Invalid seller update' };

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

  // Direct updates are restricted by RLS for session clients, so seller
  // moderation runs through the service-role client.
  let adminClient;
  try {
    adminClient = getSupabaseAdmin();
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
  const { error } = await adminClient
    .from('sellers')
    .update({ status: p.data.status, updated_at: new Date().toISOString() })
    .eq('id', p.data.sellerId);
  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/sellers');
  revalidatePath('/seller/dashboard');
  return { success: true };
}