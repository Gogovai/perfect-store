'use server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const schema = z.object({
  sellerId: z.string().uuid(),
  status: z.enum(['pending', 'active', 'suspended', 'rejected']),
  reason: z.string().trim().max(500).optional(),
});

export type UpdateSellerStatusResult = {
  success: boolean;
  error?: string;
  message?: string;
};

/** User-facing confirmation for each moderation outcome. */
const MESSAGES = {
  active: 'Seller approved successfully',
  rejected: 'Seller rejected. The applicant has been notified.',
  suspended: 'Seller suspended. Their products are no longer purchasable.',
  pending: 'Seller moved back to pending review.',
} as const;

export async function updateSellerStatus(input: unknown): Promise<UpdateSellerStatusResult> {
  const p = schema.safeParse(input);
  if (!p.success) return { success: false, error: 'Invalid seller update' };

  const { sellerId, status, reason } = p.data;
  if ((status === 'rejected' || status === 'suspended') && !reason) {
    return { success: false, error: 'A reason is required when rejecting or suspending a seller.' };
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

  // The RPC flips the owner's profile role, notifies the seller and writes an
  // audit log — a plain sellers.update would silently skip those.
  const { error } = await s.rpc('admin_set_seller_status', {
    p_seller_id: sellerId,
    p_status: status,
  });
  if (error) return { success: false, error: error.message };

  // Persist the decision reason on the seller row so the applicant (and the
  // seller detail page) can read it; the RPC itself has no reason parameter.
  if (reason) {
    try {
      const adminClient = getSupabaseAdmin();
      await adminClient
        .from('sellers')
        .update({ rejection_reason: reason, updated_at: new Date().toISOString() })
        .eq('id', sellerId);
    } catch {
      // Status change already succeeded; reason is best-effort so the queue
      // never blocks on a missing service-role key.
    }
  }

  revalidatePath('/admin/sellers');
  revalidatePath('/admin/dashboard');
  revalidatePath(`/admin/sellers/${sellerId}`);
  revalidatePath('/seller/dashboard');
  return { success: true, message: MESSAGES[status] };
}