import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdminApi } from '@/lib/supabase/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { SellerStatus } from '@/types/database';

const SELLER_STATUSES: SellerStatus[] = ['pending', 'active', 'suspended', 'rejected'];

export async function PATCH(request: Request) {
  // 1. Authenticate the caller as an admin.
  const session = await requireAdminApi();
  if (session.error) {
    return NextResponse.json(
      { success: false, error: session.error },
      { status: session.status }
    );
  }

  // 2. Parse + validate the payload.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }
  const { id, status } = (body ?? {}) as { id?: unknown; status?: unknown };
  if (typeof id !== 'string' || !id) {
    return NextResponse.json(
      { success: false, error: 'Missing seller id' },
      { status: 400 }
    );
  }
  if (typeof status !== 'string' || !SELLER_STATUSES.includes(status as SellerStatus)) {
    return NextResponse.json(
      { success: false, error: 'Invalid seller status' },
      { status: 400 }
    );
  }

  // 3. Update the record via the service-role client (bypasses RLS, no RPC dependency).
  let adminClient;
  try {
    adminClient = getSupabaseAdmin();
  } catch (e) {
    return NextResponse.json(
      { success: false, error: (e as Error).message },
      { status: 500 }
    );
  }

  const { error } = await adminClient
    .from('sellers')
    .update({ status: status as SellerStatus, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  // 4. Revalidate pages that surface seller status.
  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/sellers');
  revalidatePath('/seller/dashboard');
  revalidatePath('/sellers');

  return NextResponse.json({ success: true, message: `Seller marked ${status}.` });
}