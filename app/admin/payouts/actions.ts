'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const schema = z.object({ payoutId: z.string().uuid(), status: z.enum(['pending', 'processing', 'paid', 'failed']) });

export async function updatePayout(input: unknown) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Invalid payout update' };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { success: false, error: 'Admin access required' };

  const updates: Record<string, string | null> = { status: parsed.data.status };
  if (parsed.data.status === 'paid') updates.paid_at = new Date().toISOString();
  if (parsed.data.status !== 'paid') updates.paid_at = null;
  const { error } = await supabase.from('seller_payouts').update(updates).eq('id', parsed.data.payoutId);
  if (error) return { success: false, error: 'Unable to update payout' };

  revalidatePath('/admin/payouts');
  revalidatePath('/seller/finance');
  return { success: true };
}
