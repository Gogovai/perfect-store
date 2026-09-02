'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  storeName: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional(),
  phone: z.string().trim().min(7).max(30),
  email: z.string().trim().email().max(160),
});

export async function submitSellerApplication(input: unknown) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid application' };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Please log in before applying.' };
  const { data, error } = await (supabase as any).rpc('submit_seller_application', {
    p_store_name: parsed.data.storeName,
    p_description: parsed.data.description ?? null,
    p_phone: parsed.data.phone,
    p_email: parsed.data.email,
  });
  if (error) return { success: false, error: error.message || 'Unable to submit application.' };
  return { success: true, sellerId: data?.seller_id as string | undefined };
}

export async function getSellerApplication() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('sellers').select('id,store_name,description,phone,email,status,created_at').eq('owner_id', user.id).maybeSingle();
  return data;
}
