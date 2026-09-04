import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdminApi } from '@/lib/supabase/admin-auth';
import type { SellerStatus } from '@/types/database';

const SELLER_STATUSES: SellerStatus[] = ['pending', 'active', 'suspended', 'rejected'];

export async function PATCH(request: Request) {
  // 1. Authenticate the caller as an admin.
  const session = await requireAdminApi();
  if (session.error || !session.supabase) {
    return NextResponse.json(
      { success: false, error: session.error ?? 'Admin access required' },
      { status: session.status }
    );
  }
  const supabase = session.supabase;

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

  // 3. Update through the admin RPC, which also flips the owner's profile
  //    role (seller/customer), notifies the seller and writes an audit log.
  const { error } = await supabase.rpc('admin_set_seller_status', {
    p_seller_id: id,
    p_status: status as SellerStatus,
  });

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