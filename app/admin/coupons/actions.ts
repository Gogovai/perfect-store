'use server';

import {createClient} from '@/lib/supabase/server';
import {z} from 'zod';
import {revalidatePath} from 'next/cache';

const schema = z.object({
  code: z.string().trim().min(3).max(40),
  description: z.string().max(200).optional(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.coerce.number().positive(),
  maxUses: z.coerce.number().int().positive().optional(),
  validUntil: z.string().optional(),
});

async function admin() {
  const s = await createClient();
  const {data: {user}} = await s.auth.getUser();
  if (!user) return null;
  const {data: p} = await s.from('profiles').select('role').eq('id', user.id).single();
  return p?.role === 'admin' ? s : null;
}

export async function createCoupon(input: unknown) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return {success: false, error: parsed.error.issues[0]?.message};
  const s = await admin();
  if (!s) return {success: false, error: 'Admin access required'};
  const d = parsed.data;
  const {error} = await s.from('coupons').insert({
    code: d.code.toUpperCase(),
    description: d.description || null,
    discount_type: d.discountType,
    discount_value: d.discountValue,
    usage_limit: d.maxUses ?? null,
    used_count: 0,
    starts_at: new Date().toISOString(),
    expires_at: d.validUntil ? new Date(d.validUntil).toISOString() : null,
    is_active: true,
  });
  if (error) return {success: false, error: error.message};
  revalidatePath('/admin/coupons');
  return {success: true};
}

export async function toggleCoupon(id: string, active: boolean) {
  const s = await admin();
  if (!s) return {success: false, error: 'Admin access required'};
  const {error} = await s.from('coupons').update({is_active: active}).eq('id', id);
  if (error) return {success: false, error: error.message};
  revalidatePath('/admin/coupons');
  return {success: true};
}

export async function deleteCoupon(id: string) {
  const s = await admin();
  if (!s) return {success: false, error: 'Admin access required'};
  const {error} = await s.from('coupons').delete().eq('id', id);
  if (error) return {success: false, error: error.message};
  revalidatePath('/admin/coupons');
  return {success: true};
}
